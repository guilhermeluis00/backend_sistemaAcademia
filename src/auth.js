const jwt = require('jsonwebtoken');

// Middleware que valida o token JWT e, se informado, restringe a rota aos cargos permitidos.
// Uso: router.post('/planos', autenticar('DONO', 'SUPER'), criarPlano)
function autenticar(...cargosPermitidos) {
  return (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = { id: decoded.userId, role: decoded.role };
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    }

    if (cargosPermitidos.length && !cargosPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso.' });
    }

    return next();
  };
}

module.exports = { autenticar };
