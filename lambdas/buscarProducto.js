const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.buscarProducto = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const codigo = event.pathParameters.codigo;

  const params = {
    TableName: 't_MS2_productos',
    Key: { codigo }
  };

  const data = await dynamodb.get(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(data.Item)
  };
};
