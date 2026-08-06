    require('dotenv/config');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function criarSuperUsuario() {
  try {
    const email = "super@sistema.com"; // Coloque o SEU e-mail aqui
    const password = "senha_super_secreta"; // Coloque a SUA senha aqui

    const hashedPassword = await bcrypt.hash(password, 10);

    const superUser = await prisma.user.upsert({
      where: { email: email },
      update: {},
      create: {
        name: "Super Admin",
        email: email,
        password: hashedPassword,
        is_super_admin: true // <-- Isso é o que te dá o poder total
      }
    });

    console.log("🚀 Super Usuário criado com sucesso!");
    console.log(superUser);
  } catch (error) {
    console.error("Erro ao criar super usuário:", error);
  } finally {
    await prisma.$disconnect();
  }
}

criarSuperUsuario();