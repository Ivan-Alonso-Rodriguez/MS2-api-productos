const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const { validarToken } = require('../middleware/validarToken'); // Mismo validador de token

module.exports.crearProducto = async (event) => {
  // Validar el token de forma obligatoria
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, nombre, descripcion, precio, imagen_base64 } = JSON.parse(event.body);

  let imagen_url = null;

  // Subir imagen si se incluye
  if (imagen_base64) {
    const buffer = Buffer.from(imagen_base64, 'base64');
    const s3Params = {
      Bucket: 'ms2-productos-imgs',
      Key: `${codigo}.jpg`,
      Body: buffer,
      ContentEncoding: 'base64',
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };
    await s3.putObject(s3Params).promise();
    imagen_url = `https://ms2-productos-imgs.s3.amazonaws.com/${codigo}.jpg`;
  }

  // Construir item del producto
  const producto = {
    codigo,
    tenant_id: validacion.datos.tenant_id,
    user_id: validacion.datos.user_id,
    nombre,
    descripcion,
    precio,
    ...(imagen_url && { imagen_url })
  };

  // Guardar en DynamoDB
  await dynamodb.put({
    TableName: 't_MS2_productos',
    Item: producto
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      mensaje: 'Producto creado correctamente',
      producto
    })
  };
};
