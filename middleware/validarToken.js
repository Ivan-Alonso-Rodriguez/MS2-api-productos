const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.validarToken = async (headers) => {
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
