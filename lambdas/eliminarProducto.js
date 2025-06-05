const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.eliminarProducto = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo } = JSON.parse(event.body);

  const params = {
    TableName: 't_MS2_productos',
    Key: { codigo }
  };

  await dynamodb.delete(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto eliminado' })
  };
};
