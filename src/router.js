const express = require('express');
const JWT = require('jsonwebtoken');
const { cadastrarUsuario } = require('./cadastro');
const { loginUsuario } = require('./login');
const router = express.Router();

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);


// ==========================================
// ROTA: CRIAR PLANO (Blindada contra erros de Token)
// ==========================================
router.post('/planos', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no formato do token.' });
  }

  const token = parts[1];

  try {
    // Tenta usar a chave do .env, se não achar, usa uma chave padrão para não quebrar
    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao_123';
    const decoded = JWT.verify(token, secret);

    // Aceita tanto userId quanto id (evita erro de nomenclatura do login)
    const donoId = decoded.userId || decoded.id;
    // Aceita tanto role quanto cargo
    const userRole = (decoded.role || decoded.cargo || '').toUpperCase();

    if (!donoId) {
      return res.status(400).json({ error: 'Token não contém o ID do usuário.' });
    }

    // Valida se é Dono ou Super
    if (userRole !== 'DONO' && userRole !== 'SUPER') {
      return res.status(403).json({ error: 'Apenas donos de academia podem criar planos.' });
    }

    const { nome, preco, descricao } = req.body;

    if (!nome || !preco) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
    }

    const novoPlano = await prisma.plano.create({
      data: {
        nome,
        preco: parseFloat(preco),
        descricao: descricao || '',
        donoId: donoId
      }
    });

    return res.status(201).json({ message: 'Plano criado com sucesso!', plano: novoPlano });

  } catch (error) {
    console.error("ERRO DETALHADO NO JWT (/planos):", error.message);
    return res.status(401).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
  }
});

module.exports = router;