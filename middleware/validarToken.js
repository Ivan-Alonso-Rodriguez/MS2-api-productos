const jwt = require('jsonwebtoken');

function validarToken(headers) {
  const auth = headers.Authorization || headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return { ok: false, respuesta: { statusCode: 401, body: JSON.stringify({ error: 'Token no enviado' }) } };
  }

  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_de_prueba');
    return { ok: true, datos: decoded };
  } catch (err) {
    return { ok: false, respuesta: { statusCode: 401, body: JSON.stringify({ error: 'Token inválido' }) } };
  }
}

module.exports = { validarToken };
