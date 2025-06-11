const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const { validarToken } = require('../middleware/validarToken');

module.exports.crearProducto = async (event) => {
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, nombre, descripcion, precio, imagen_base64 } = JSON.parse(event.body);

  let imagen_key = null;

  // Subir imagen si se incluye
  if (imagen_base64) {
    const buffer = Buffer.from(imagen_base64, 'base64');
    imagen_key = `${codigo}.jpg`;

    const s3Params = {
      Bucket: 'ms2-productos-imgs',
      Key: imagen_key,
      Body: buffer,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg'
    };

    await s3.putObject(s3Params).promise();
  }

  // Construir item del producto
  const producto = {
    codigo,
    tenant_id: validacion.datos.tenant_id,
    user_id: validacion.datos.user_id,
    nombre,
    descripcion,
    precio,
    ...(imagen_key && { imagen_key }) // Guardamos solo el nombre del archivo
  };

  await dynamodb.put({
    TableName: 't_MS2_productos',
    Item: producto
  }).promise();

  // Generar URL firmada si hay imagen
  let imagen_url = null;
  if (imagen_key) {
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: 'ms2-productos-imgs',
      Key: imagen_key,
      Expires: 60 * 5 // válido por 5 minutos
    });
    imagen_url = signedUrl;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      mensaje: 'Producto creado correctamente',
      producto: {
        ...producto,
        ...(imagen_url && { imagen_url }) // Incluimos URL firmada al cliente
      }
    })
  };
};
