const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config(); // Garante que a URL do .env seja lida

// 1. Cria a conexão direta usando a biblioteca nativa do Postgres
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Passa a conexão para o adaptador do Prisma
const adapter = new PrismaPg(pool);

// 3. Inicializa o Prisma usando o adaptador
const prisma = new PrismaClient({ adapter });

module.exports = prisma;