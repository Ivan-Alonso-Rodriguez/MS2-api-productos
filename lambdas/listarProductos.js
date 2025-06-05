const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.listarProductos = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const params = {
    TableName: 't_MS2_productos',
    FilterExpression: 'tenant_id = :tid',
    ExpressionAttributeValues: { ':tid': validacion.datos.tenant_id }
  };

  const data = await dynamodb.scan(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(data.Items)
  };
};
