const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { validarToken } = require('../middleware/validarToken'); // importas tu middleware

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
