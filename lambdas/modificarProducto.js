const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports.modificarProducto = async (event) => {
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const userId = validacion.datos.user_id;
  const { codigo, nombre, descripcion, precio, cantidad, imagen_base64 } = JSON.parse(event.body);

  const tableName = process.env.PRODUCTOS_TABLE;
  const bucketName = process.env.IMAGENES_BUCKET;

  // Verificar existencia y dueño
  const obtenerParams = {
    TableName: tableName,
    Key: { codigo }
  };

  const resultado = await dynamodb.get(obtenerParams).promise();

  if (!resultado.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ msg: 'Producto no encontrado' })
    };
  }

  if (resultado.Item.user_id !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({ msg: 'No tienes permiso para modificar este producto' })
    };
  }

  let updateExpression = 'set nombre = :n, descripcion = :d, precio = :p';
  let expressionAttributeValues = {
    ':n': nombre,
    ':d': descripcion,
    ':p': precio
  };

  // Agregar cantidad si viene incluida
  if (cantidad !== undefined) {
    updateExpression += ', cantidad = :c';
    expressionAttributeValues[':c'] = cantidad;
  }

  // Si se proporciona nueva imagen
  if (imagen_base64) {
    if (resultado.Item.imagen_key) {
      try {
        await s3.deleteObject({
          Bucket: bucketName,
          Key: resultado.Item.imagen_key
        }).promise();
      } catch (err) {
        console.warn('Error al borrar imagen anterior:', err.message);
      }
    }

    const imagen_key = `${codigo}.jpeg`;
    const buffer = Buffer.from(imagen_base64, 'base64');

    await s3.putObject({
      Bucket: bucketName,
      Key: imagen_key,
      Body: buffer,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    }).promise();

    updateExpression += ', imagen_key = :img';
    expressionAttributeValues[':img'] = imagen_key;
  }

  const params = {
    TableName: tableName,
    Key: { codigo },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues
  };

  await dynamodb.update(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto actualizado exitosamente' })
  };
};
