const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function cadastrarUsuario(req, res) {
  // 1. Adicionamos o 'role' para saber se é DONO ou CLIENTE
  const { name, email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'E-mail, senha e tipo de conta são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailFormatado = email.toLowerCase().trim();

    let novoUsuario;

    // 2. Verifica o tipo e salva na tabela correspondente
    if (role === 'DONO') {
      novoUsuario = await prisma.user.create({
        data: {
          name,
          email: emailFormatado,
          password: hashedPassword,
        },
      });
    } else if (role === 'CLIENTE') {
      novoUsuario = await prisma.clientes.create({
        data: {
          nome: name, // Na tabela Clientes o campo é 'nome'
          email: emailFormatado,
          password: hashedPassword,
        },
      });
    } else {
      return res.status(400).json({ error: 'Tipo de conta inválido.' });
    }

    // Remove a senha por segurança antes de responder
    const { password: _, ...userWithoutPassword } = novoUsuario;

    return res.status(201).json(userWithoutPassword);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar o usuário.' });
  }
}

module.exports = { cadastrarUsuario };