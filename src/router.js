const express = require('express');
const { cadastrarUsuario } = require('./cadastro');
const { loginUsuario } = require('./login');
const router = express.Router();

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;