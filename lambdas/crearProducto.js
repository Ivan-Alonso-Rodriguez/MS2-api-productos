const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports.crearProducto = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, nombre, descripcion, precio, imagen_base64 } = JSON.parse(event.body);

  let imagen_url = null;
  if (imagen_base64) {
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
    imagen_url = `https://ms2-productos-imgs.s3.amazonaws.com/${codigo}.jpg`;
  }

  const paramsDynamo = {
    TableName: 't_MS2_productos',
    Item: {
      codigo,
      tenant_id: validacion.datos.tenant_id,
      nombre,
      descripcion,
      precio,
      ...(imagen_url && { imagen_url })
    }
  };

  await dynamodb.put(paramsDynamo).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto creado', imagen_url })
  };
};
