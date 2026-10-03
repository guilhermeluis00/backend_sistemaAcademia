const express = require('express');
const { autenticar, sessaoAtual } = require('./middleware/auth');
const { cadastrarUsuario } = require('./cadastro');
const { loginUsuario } = require('./login');
const { criarPlano, listarMeusPlanos, atualizarPlano, excluirPlano } = require('./planos');
const { listarAcademias, obterAcademia } = require('./academias');
const { criarMatricula, listarMinhasMatriculas, cancelarMatricula, listarAlunos } = require('./matriculas');
const { listarUsuarios, excluirUsuario } = require('./super');

const router = express.Router();

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);
router.get('/sessao', autenticar(), sessaoAtual);

// Vitrine pública de academias e seus planos
router.get('/academias', listarAcademias);
router.get('/academias/:id', obterAcademia);

// Gestão de planos (dono da academia)
router.get('/planos/meus', autenticar('DONO', 'SUPER'), listarMeusPlanos);
router.post('/planos', autenticar('DONO', 'SUPER'), criarPlano);
router.put('/planos/:id', autenticar('DONO', 'SUPER'), atualizarPlano);
router.delete('/planos/:id', autenticar('DONO', 'SUPER'), excluirPlano);

// Compra de planos (cliente) e alunos da academia (dono)
router.get('/matriculas/minhas', autenticar('CLIENTE'), listarMinhasMatriculas);
router.post('/matriculas', autenticar('CLIENTE'), criarMatricula);
router.patch('/matriculas/:id/cancelar', autenticar('CLIENTE'), cancelarMatricula);
router.get('/matriculas/alunos', autenticar('DONO', 'SUPER'), listarAlunos);

// Super administrador
router.get('/super/users', autenticar('SUPER'), listarUsuarios);
router.delete('/super/users/:id', autenticar('SUPER'), excluirUsuario);

module.exports = router;
