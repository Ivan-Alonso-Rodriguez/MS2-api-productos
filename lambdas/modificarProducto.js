const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.modificarProducto = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, nombre, descripcion, precio } = JSON.parse(event.body);

  const params = {
    TableName: 't_MS2_productos',
    Key: { codigo },
    UpdateExpression: 'set nombre = :n, descripcion = :d, precio = :p',
    ExpressionAttributeValues: {
      ':n': nombre,
      ':d': descripcion,
      ':p': precio
    }
  };

  await dynamodb.update(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto actualizado' })
  };
};
