const prisma = require('./lib/prisma');

// Monta o resumo de uma academia a partir do registro do dono + planos ativos
function resumirAcademia(dono) {
  const precos = dono.planos.map((plano) => plano.preco);

  return {
    id: dono.id,
    name: dono.name,
    email: dono.email,
    created_at: dono.created_at,
    totalPlanos: dono.planos.length,
    menorPreco: precos.length ? Math.min(...precos) : null,
    alunosAtivos: dono._count.matriculas,
    planos: dono.planos,
  };
}

const selecaoAcademia = {
  id: true,
  name: true,
  email: true,
  created_at: true,
  planos: {
    where: { ativo: true },
    orderBy: { preco: 'asc' },
    select: { id: true, nome: true, preco: true, descricao: true, duracaoMeses: true },
  },
  _count: { select: { matriculas: { where: { status: 'ATIVO' } } } },
};

const listarAcademias = async (req, res) => {
  try {
    const busca = String(req.query.busca || '').trim();

    const filtros = {
      is_super_admin: false, // Pega os usuários que são donos de academia
    };

    // Cada palavra digitada precisa aparecer no nome da academia, no e-mail
    // ou no nome de algum plano ativo (ignorando maiúsculas/minúsculas)
    if (busca) {
      filtros.AND = busca.split(/\s+/).map((palavra) => ({
        OR: [
          { name: { contains: palavra, mode: 'insensitive' } },
          { email: { contains: palavra, mode: 'insensitive' } },
          { planos: { some: { ativo: true, nome: { contains: palavra, mode: 'insensitive' } } } },
        ],
      }));
    }

    const donos = await prisma.user.findMany({
      where: filtros,
      select: selecaoAcademia,
      orderBy: { name: 'asc' },
    });

    return res.json(donos.map(resumirAcademia));
  } catch (error) {
    console.error("Erro ao buscar academias:", error);
    return res.status(500).json({ error: 'Erro ao buscar academias no banco.' });
  }
};

const obterAcademia = async (req, res) => {
  try {
    const dono = await prisma.user.findFirst({
      where: { id: req.params.id, is_super_admin: false },
      select: selecaoAcademia,
    });

    if (!dono) {
      return res.status(404).json({ error: 'Academia não encontrada.' });
    }

    return res.json(resumirAcademia(dono));
  } catch (error) {
    console.error("Erro ao buscar academia:", error);
    return res.status(500).json({ error: 'Erro ao buscar a academia no banco.' });
  }
};

module.exports = { listarAcademias, obterAcademia };
