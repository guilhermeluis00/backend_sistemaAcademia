const express = require('express');
const JWT = require('jsonwebtoken');
const { cadastrarUsuario } = require('./cadastro');
const { loginUsuario } = require('./login');
const { criarPlano } = require('./planos');
const {listarAcademias} = require('./academias');
const prisma = require('./lib/prisma');

const router = express.Router();

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);
router.post('/planos', criarPlano);
router.get('/academias', listarAcademias);

module.exports = router;