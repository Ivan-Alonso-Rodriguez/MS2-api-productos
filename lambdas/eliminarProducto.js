const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.eliminarProducto = async (event) => {
  // Validamos el token
  const validacion = await validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const userId = validacion.datos.user_id;

  const { codigo } = JSON.parse(event.body);

  // Primero obtenemos el producto
  const obtenerParams = {
    TableName: process.env.PRODUCTOS_TABLE,
    Key: { codigo }
  };

  const resultado = await dynamodb.get(obtenerParams).promise();

  if (!resultado.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ msg: 'Producto no encontrado' })
    };
  }

  // Verificamos si el producto pertenece al usuario
  if (resultado.Item.user_id !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({ msg: 'No tienes permiso para eliminar este producto' })
    };
  }

  // Eliminamos el producto
  const eliminarParams = {
    TableName: process.env.PRODUCTOS_TABLE,
    Key: { codigo }
  };

  await dynamodb.delete(eliminarParams).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto eliminado exitosamente' })
  };
};
