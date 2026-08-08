const prisma = require('./lib/prisma');

const listarAcademias = async (req, res) => {
  try {
    const { busca } = req.query; // Termo digitado na busca (opcional)

    const filtros = {
      is_super_admin: false, // Pega os usuários que são donos de academia
    };

    // Se o usuário digitou algo, filtra pelo nome (ignorando maiúsculas/minúsculas)
    if (busca) {
      filtros.name = {
        contains: busca,
        mode: 'insensitive'
      };
    }

    const academias = await prisma.user.findMany({
      where: filtros,
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return res.json(academias);
  } catch (error) {
    console.error("Erro ao buscar academias:", error);
    return res.status(500).json({ error: 'Erro ao buscar academias no banco.' });
  }
};

module.exports = { listarAcademias };