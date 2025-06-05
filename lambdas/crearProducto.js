const AWS = require('aws-sdk');
const { validarToken } = require('../middleware/validarToken');
const dynamodb = new AWS.DynamoDB.DocumentClient();

module.exports.crearProducto = async (event) => {
  const validacion = validarToken(event.headers);
  if (!validacion.ok) return validacion.respuesta;

  const { codigo, nombre, descripcion, precio } = JSON.parse(event.body);
  const params = {
    TableName: 't_MS2_productos',
    Item: {
      codigo,
      tenant_id: validacion.datos.tenant_id,
      nombre,
      descripcion,
      precio
    }
  };

  await dynamodb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ msg: 'Producto creado' })
  };
};
