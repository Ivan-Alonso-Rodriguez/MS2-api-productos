const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Validación de token sin jsonwebtoken
const validarToken = async (headers) => {
  const token = headers['x-auth-token'];
  if (!token) {
    return {
      ok: false,
      respuesta: {
        statusCode: 401,
        body: JSON.stringify({ mensaje: 'Token no proporcionado' })
      }
    };
  }

  const res = await dynamodb.get({
    TableName: 't_MS1_tokens_acceso',
    Key: { token }
  }).promise();

  if (!res.Item) {
    return {
      ok: false,
      respuesta: {
        statusCode: 403,
        body: JSON.stringify({ mensaje: 'Token no existe' })
      }
    };
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  if (now > res.Item.expires) {
    return {
      ok: false,
      respuesta: {
        statusCode: 403,
        body: JSON.stringify({ mensaje: 'Token expirado' })
      }
    };
  }

  return {
    ok: true,
    datos: res.Item
  };
};

// Crear producto
module.exports.crearProducto = async (event) => {
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, nombre, descripcion, precio, imagen_base64 } = JSON.parse(event.body);

  let imagen_url = null;
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

  const producto = {
    codigo,
    tenant_id: validacion.datos.tenant_id,
    user_id: validacion.datos.user_id, // importante si luego quieres filtrar
    nombre,
    descripcion,
    precio,
    ...(imagen_url && { imagen_url })
  };

  const paramsDynamo = {
    TableName: 't_MS2_productos',
    Item: producto
  };

  await dynamodb.put(paramsDynamo).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      mensaje: 'Producto creado correctamente',
      producto
    })
  };
};
