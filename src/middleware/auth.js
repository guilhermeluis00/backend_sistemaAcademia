const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const VALIDADE_TOKEN = '365d';

function gerarToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: VALIDADE_TOKEN });
}

// Busca no banco a conta dona do token (Clientes para alunos, User para donos e supers).
// Retorna null se a conta não existe mais ou se o cargo do token não confere.
async function buscarConta(id, role) {
  if (role === 'CLIENTE') {
    const cliente = await prisma.clientes.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true },
    });
    return cliente && { id: cliente.id, name: cliente.nome, email: cliente.email };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, is_super_admin: true },
  });
  if (!user || (role === 'SUPER') !== user.is_super_admin) {
    return null;
  }
  return { id: user.id, name: user.name, email: user.email };
}

// Middleware que valida o token JWT, confirma que a conta ainda existe e,
// se informado, restringe a rota aos cargos permitidos.
// Uso: router.post('/planos', autenticar('DONO', 'SUPER'), criarPlano)
function autenticar(...cargosPermitidos) {
  return async (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
    }

    try {
      const conta = await buscarConta(decoded.userId, decoded.role);
      if (!conta) {
        return res.status(401).json({ error: 'Sessão encerrada. Faça login novamente.' });
      }
      req.usuario = { ...conta, role: decoded.role };
    } catch (error) {
      console.error("Erro ao validar a sessão:", error);
      return res.status(500).json({ error: 'Erro ao validar a sessão.' });
    }

    if (cargosPermitidos.length && !cargosPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({ error: 'Você não tem permissão para acessar este recurso.' });
    }

    return next();
  };
}

// GET /sessao — o front chama ao abrir qualquer página para manter o usuário conectado.
// Devolve os dados da conta e um token renovado, então quem usa o sistema nunca é deslogado.
function sessaoAtual(req, res) {
  const { id, name, email, role } = req.usuario;

  return res.json({
    token: gerarToken(id, role),
    role,
    user: { id, name, email },
  });
}

module.exports = { autenticar, sessaoAtual, gerarToken };
