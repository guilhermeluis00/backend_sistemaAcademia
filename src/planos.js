const { PrismaPg } = require('@prisma/adapter-pg');
const JWT = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = require('./lib/prisma');

const criarPlano = async (req, res) => {
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
    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao_123';
    const decoded = JWT.verify(token, secret);

    const donoId = decoded.userId || decoded.id;
    const userRole = (decoded.role || decoded.cargo || '').toUpperCase();

    if (!donoId) {
      return res.status(400).json({ error: 'Token não contém o ID do usuário.' });
    }

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
};

module.exports = { criarPlano };