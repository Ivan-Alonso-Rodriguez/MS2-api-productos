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
    TableName: process.env.PRODUCTOS_TABLE,
    Key: { codigo }
  };

  try {
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
  } catch (err) {
    console.error("Error al buscar producto:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ mensaje: 'Error al buscar el producto', detalle: err.message })
    };
  }
};
