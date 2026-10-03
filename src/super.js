const prisma = require('./lib/prisma');

// Lista as contas de donos de academia e administradores
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        is_super_admin: true,
        created_at: true,
        _count: { select: { planos: true, matriculas: true } },
      },
    });

    return res.json(
      usuarios.map(({ _count, ...usuario }) => ({
        ...usuario,
        totalPlanos: _count.planos,
        totalMatriculas: _count.matriculas,
      }))
    );
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ error: 'Erro ao buscar os usuários no banco.' });
  }
};

const excluirUsuario = async (req, res) => {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { matriculas: true } } },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }
    if (usuario.is_super_admin) {
      return res.status(403).json({ error: 'Contas de administrador não podem ser excluídas por aqui.' });
    }
    if (usuario._count.matriculas > 0) {
      return res.status(409).json({ error: 'Esta academia possui alunos matriculados e não pode ser excluída.' });
    }

    // Sem matrículas: remove os planos da academia junto com a conta
    await prisma.$transaction([
      prisma.plano.deleteMany({ where: { donoId: usuario.id } }),
      prisma.user.delete({ where: { id: usuario.id } }),
    ]);

    return res.json({ message: 'Conta excluída com sucesso.' });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return res.status(500).json({ error: 'Erro ao excluir o usuário no banco.' });
  }
};

module.exports = { listarUsuarios, excluirUsuario };
