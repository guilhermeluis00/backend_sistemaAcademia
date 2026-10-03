const prisma = require('./lib/prisma');

const FORMAS_PAGAMENTO = ['PIX', 'CARTAO', 'BOLETO'];

// ATIVO no banco, mas com a validade vencida, é exibido como EXPIRADO
function situacaoDa(matricula) {
  if (matricula.status === 'ATIVO' && matricula.validade && matricula.validade < new Date()) {
    return 'EXPIRADO';
  }
  return matricula.status;
}

// Filtro de matrícula que ainda está valendo
function filtroVigente() {
  return { status: 'ATIVO', OR: [{ validade: null }, { validade: { gt: new Date() } }] };
}

// Compra de um plano pelo cliente logado.
// O pagamento é simulado no front-end: nenhum dado de cartão chega aqui.
const criarMatricula = async (req, res) => {
  const { planoId, formaPagamento } = req.body;

  if (!planoId) {
    return res.status(400).json({ error: 'Informe o plano que deseja assinar.' });
  }
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) {
    return res.status(400).json({ error: 'Forma de pagamento inválida.' });
  }

  try {
    const plano = await prisma.plano.findUnique({ where: { id: String(planoId) } });
    if (!plano || !plano.ativo) {
      return res.status(404).json({ error: 'Este plano não está mais disponível.' });
    }

    const jaMatriculado = await prisma.matricula.findFirst({
      where: { clienteId: req.usuario.id, donoId: plano.donoId, ...filtroVigente() },
    });
    if (jaMatriculado) {
      return res.status(409).json({ error: 'Você já possui uma matrícula ativa nesta academia.' });
    }

    const validade = new Date();
    validade.setMonth(validade.getMonth() + plano.duracaoMeses);

    const matricula = await prisma.matricula.create({
      data: {
        clienteId: req.usuario.id,
        donoId: plano.donoId,
        planoId: plano.id,
        valor: plano.preco,
        formaPagamento,
        validade,
      },
      include: {
        plano: { select: { nome: true, duracaoMeses: true } },
        dono: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      message: 'Matrícula realizada com sucesso!',
      matricula: { ...matricula, situacao: situacaoDa(matricula) },
    });
  } catch (error) {
    console.error("Erro ao criar matrícula:", error);
    return res.status(500).json({ error: 'Erro ao registrar a matrícula no banco.' });
  }
};

const listarMinhasMatriculas = async (req, res) => {
  try {
    const matriculas = await prisma.matricula.findMany({
      where: { clienteId: req.usuario.id },
      orderBy: { data: 'desc' },
      include: {
        plano: { select: { nome: true, duracaoMeses: true } },
        dono: { select: { id: true, name: true } },
      },
    });

    return res.json(matriculas.map((m) => ({ ...m, situacao: situacaoDa(m) })));
  } catch (error) {
    console.error("Erro ao listar matrículas:", error);
    return res.status(500).json({ error: 'Erro ao buscar suas matrículas no banco.' });
  }
};

const cancelarMatricula = async (req, res) => {
  try {
    const matricula = await prisma.matricula.findFirst({
      where: { id: req.params.id, clienteId: req.usuario.id },
    });
    if (!matricula) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }
    if (matricula.status === 'CANCELADO') {
      return res.status(409).json({ error: 'Esta matrícula já está cancelada.' });
    }

    await prisma.matricula.update({ where: { id: matricula.id }, data: { status: 'CANCELADO' } });
    return res.json({ message: 'Matrícula cancelada.' });
  } catch (error) {
    console.error("Erro ao cancelar matrícula:", error);
    return res.status(500).json({ error: 'Erro ao cancelar a matrícula no banco.' });
  }
};

// Alunos (matrículas) da academia do dono logado
const listarAlunos = async (req, res) => {
  try {
    const matriculas = await prisma.matricula.findMany({
      where: { donoId: req.usuario.id },
      orderBy: { data: 'desc' },
      include: {
        cliente: { select: { nome: true, email: true } },
        plano: { select: { nome: true } },
      },
    });

    return res.json(matriculas.map((m) => ({ ...m, situacao: situacaoDa(m) })));
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    return res.status(500).json({ error: 'Erro ao buscar os alunos no banco.' });
  }
};

module.exports = { criarMatricula, listarMinhasMatriculas, cancelarMatricula, listarAlunos };
