const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { validarToken } = require('../middleware/validarToken');

module.exports.listarProductos = async (event) => {
  // Intentamos validar el token, pero no lo hacemos obligatorio
  let userId = null;
  const validacion = await validarToken(event.headers);
  if (validacion.ok) {
    userId = validacion.datos.user_id;
  }

  const limit = event.queryStringParameters?.limit
    ? parseInt(event.queryStringParameters.limit)
    : 5;

  const startKey = event.queryStringParameters?.startKey
    ? JSON.parse(decodeURIComponent(event.queryStringParameters.startKey))
    : undefined;

  const soloMios = event.queryStringParameters?.soloMios === 'true';

  const params = {
    TableName: process.env.PRODUCTOS_TABLE,
    Limit: limit
  };

  if (soloMios) {
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ mensaje: 'Token requerido para ver tus productos' })
      };
    }
    params.FilterExpression = 'user_id = :uid';
    params.ExpressionAttributeValues = {
      ':uid': userId
    };
  }

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
