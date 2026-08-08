const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Importa o jsonwebtoken
const prisma = require('./lib/prisma');

async function loginUsuario(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const emailFormatado = email.toLowerCase().trim();

    // 1. Tenta procurar primeiro na tabela de Donos (User)
    let user = await prisma.user.findUnique({
      where: { email: emailFormatado },
    });
    
    let role = 'DONO';

    if (user) {
      //  Checa direto na coluna do banco de dados se a conta é Super Admin
      if (user.is_super_admin) {
        role = 'SUPER';
      }
    } else {
      // 2. Se não achar nos Donos, procura na tabela de Clientes
      user = await prisma.clientes.findUnique({
        where: { email: emailFormatado },
      });
      role = 'CLIENTE';
    }

    // 3. Se não achou em nenhuma das duas tabelas, o e-mail não existe
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 4. Compara a senha informada com a senha criptografada do banco
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 5. GERANDO O TOKEN JWT (Guardamos o ID e o role no payload)
    const token = jwt.sign(
      { userId: user.id, role: role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '365d' } // Tempo de expiração do token 
    );

    // 6. Retorna o token, o papel (role) e os dados do usuário para o front-end
    return res.json({
      message: 'Login realizado com sucesso!',
      token, 
      role, // Informa ao front se é SUPER, DONO ou CLIENTE
      user: {
        id: user.id,
        name: user.name || user.nome, // Pega 'name' (User) ou 'nome' (Clientes)
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno ao tentar fazer login.' });
  }
}

module.exports = { loginUsuario };