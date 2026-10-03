const prisma = require('./lib/prisma');

// Valida e normaliza os dados de um plano vindos do formulário
function validarPlano(body) {
  const nome = String(body.nome || '').trim();
  const preco = Number(String(body.preco ?? '').replace(',', '.'));
  const duracaoMeses = body.duracaoMeses === undefined ? 1 : Number(body.duracaoMeses);

  if (!nome) {
    return { erro: 'O nome do plano é obrigatório.' };
  }
  if (!Number.isFinite(preco) || preco <= 0) {
    return { erro: 'Informe um preço maior que zero.' };
  }
  if (!Number.isInteger(duracaoMeses) || duracaoMeses < 1 || duracaoMeses > 36) {
    return { erro: 'A duração deve ser entre 1 e 36 meses.' };
  }

  return {
    dados: {
      nome,
      preco: Math.round(preco * 100) / 100,
      duracaoMeses,
      descricao: String(body.descricao || '').trim(),
    },
  };
}

const criarPlano = async (req, res) => {
  const { erro, dados } = validarPlano(req.body);
  if (erro) {
    return res.status(400).json({ error: erro });
  }

  try {
    const novoPlano = await prisma.plano.create({
      data: { ...dados, donoId: req.usuario.id },
    });

    return res.status(201).json({ message: 'Plano criado com sucesso!', plano: novoPlano });
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    return res.status(500).json({ error: 'Erro ao salvar o plano no banco.' });
  }
};

// Planos do dono logado, com a quantidade de alunos ativos em cada um
const listarMeusPlanos = async (req, res) => {
  try {
    const planos = await prisma.plano.findMany({
      where: { donoId: req.usuario.id },
      orderBy: [{ ativo: 'desc' }, { criadoEm: 'desc' }],
      include: { _count: { select: { matriculas: { where: { status: 'ATIVO' } } } } },
    });

    return res.json(
      planos.map(({ _count, ...plano }) => ({ ...plano, alunosAtivos: _count.matriculas }))
    );
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    return res.status(500).json({ error: 'Erro ao buscar os planos no banco.' });
  }
};

const atualizarPlano = async (req, res) => {
  try {
    const plano = await prisma.plano.findFirst({
      where: { id: req.params.id, donoId: req.usuario.id },
    });
    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    // Permite só ativar/desativar sem reenviar o formulário inteiro
    const apenasStatus = typeof req.body.ativo === 'boolean' && req.body.nome === undefined;
    let dados = {};

    if (!apenasStatus) {
      const validacao = validarPlano(req.body);
      if (validacao.erro) {
        return res.status(400).json({ error: validacao.erro });
      }
      dados = validacao.dados;
    }
    if (typeof req.body.ativo === 'boolean') {
      dados.ativo = req.body.ativo;
    }

    const atualizado = await prisma.plano.update({ where: { id: plano.id }, data: dados });
    return res.json({ message: 'Plano atualizado com sucesso!', plano: atualizado });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    return res.status(500).json({ error: 'Erro ao atualizar o plano no banco.' });
  }
};

const excluirPlano = async (req, res) => {
  try {
    const plano = await prisma.plano.findFirst({
      where: { id: req.params.id, donoId: req.usuario.id },
      include: { _count: { select: { matriculas: true } } },
    });
    if (!plano) {
      return res.status(404).json({ error: 'Plano não encontrado.' });
    }

    // Plano que já teve matrícula não pode sumir do histórico dos alunos: apenas desativa
    if (plano._count.matriculas > 0) {
      await prisma.plano.update({ where: { id: plano.id }, data: { ativo: false } });
      return res.json({
        desativado: true,
        message: 'Este plano já possui matrículas, então foi desativado em vez de excluído.',
      });
    }

    await prisma.plano.delete({ where: { id: plano.id } });
    return res.json({ desativado: false, message: 'Plano excluído com sucesso!' });
  } catch (error) {
    console.error("Erro ao excluir plano:", error);
    return res.status(500).json({ error: 'Erro ao excluir o plano no banco.' });
  }
};

module.exports = { criarPlano, listarMeusPlanos, atualizarPlano, excluirPlano };
