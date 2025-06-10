const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Lógica manual de validación sin jsonwebtoken, usando solo DynamoDB
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

module.exports.listarProductos = async (event) => {
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const limit = event.queryStringParameters?.limit
    ? parseInt(event.queryStringParameters.limit)
    : 5;

  const startKey = event.queryStringParameters?.startKey
    ? JSON.parse(decodeURIComponent(event.queryStringParameters.startKey))
    : undefined;

  const params = {
    TableName: 't_MS2_productos',
    FilterExpression: 'tenant_id = :tid',
    ExpressionAttributeValues: { ':tid': validacion.datos.tenant_id },
    Limit: limit
  };

  if (startKey) {
    params.ExclusiveStartKey = startKey;
  }

  const data = await dynamodb.scan(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: data.Items,
      nextPageToken: data.LastEvaluatedKey
        ? encodeURIComponent(JSON.stringify(data.LastEvaluatedKey))
        : null
    })
  };
};
