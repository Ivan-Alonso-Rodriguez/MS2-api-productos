const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.modificarProducto = async (event) => {
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const userId = validacion.datos.user_id;

  const { codigo, nombre, descripcion, precio } = JSON.parse(event.body);

  // Verificamos que el producto exista y sea del usuario
  const obtenerParams = {
    TableName: 't_MS2_productos',
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

  // Si el producto es del usuario, se permite modificar
  const params = {
    TableName: 't_MS2_productos',
    Key: { codigo },
    UpdateExpression: 'set nombre = :n, descripcion = :d, precio = :p',
    ExpressionAttributeValues: {
      ':n': nombre,
      ':d': descripcion,
      ':p': precio
    }
  };

  await dynamodb.update(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto actualizado exitosamente' })
  };
};
