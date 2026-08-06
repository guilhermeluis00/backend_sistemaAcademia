require('dotenv').config();
const JWT = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const router = require('./router');
const prisma = require('./lib/prisma');


const app = express();

app.use(cors());
app.use(express.json());
app.use(router);
 



app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});