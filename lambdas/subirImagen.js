const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const s3 = new AWS.S3();

module.exports.subirImagen = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, imagen_base64 } = JSON.parse(event.body);
  const buffer = Buffer.from(imagen_base64, 'base64');

  const params = {
    Bucket: 'ms2-productos-imgs',
    Key: `${codigo}.jpg`,
    Body: buffer,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  await s3.putObject(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      msg: 'Imagen subida',
      url: `https://ms2-productos-imgs.s3.amazonaws.com/${codigo}.jpg`
    })
  };
};
