const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.buscarProducto = async (event) => {
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const userId = validacion.datos.user_id;
  const codigo = event.pathParameters.codigo;

  const params = {
    TableName: 't_MS2_productos',
    Key: { codigo }
  };

  const data = await dynamodb.get(params).promise();

  if (!data.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ msg: 'Producto no encontrado' })
    };
  }

  if (data.Item.user_id !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({ msg: 'No tienes acceso a este producto' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data.Item)
  };
};
