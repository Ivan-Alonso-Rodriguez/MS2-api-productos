const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.buscarProducto = async (event) => {
  // Intentamos validar el token pero no es obligatorio
  let userId = null;
  const validacion = await validarToken(event.headers);
  if (validacion.ok) {
    userId = validacion.datos.user_id;
  }

  const codigo = event.pathParameters.codigo;

  const params = {
    TableName: 't_MS2_productos',
    Key: { codigo }
  };

  const data = await dynamodb.get(params).promise();

  if (!data.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ mensaje: 'Producto no encontrado' })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data.Item)
  };
};
