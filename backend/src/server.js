const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Carrega variáveis de ambiente de um caminho absoluto para evitar problemas de diretório
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const patientRoutes = require('./routes/patients');
const prescriptionRoutes = require('./routes/prescriptions');
const tipRoutes = require('./routes/tips');

const app = express();

console.log(`[Config] Master Key carregada: ${process.env.MASTER_KEY ? 'Sim (mascarada: ' + process.env.MASTER_KEY.substring(0, 3) + '...)' : 'Não carregada'}`);

app.use(express.json());
app.use(cookieParser());

// Configuração do CORS para permitir requisições do frontend e aceitar Cookies
app.use(cors({
    origin: function (origin, callback) {
        // origin: true reflete a origem real que está pedindo (necessário se usar credentials: true)
        callback(null, true);
    },
    credentials: true,
}));

// Servindo rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/exercicios', exerciseRoutes);
app.use('/api/pacientes', patientRoutes);
app.use('/api/prescricoes', prescriptionRoutes);
app.use('/api/rotinas', require('./routes/routines')); // Nova rota para os templates de Rotinas
app.use('/api/tips', tipRoutes);

// SERVINDO O FRONTEND: Resolve o problema do "file://"
// Agora o frontend e a API rodam debaixo do mesmo teto (http://localhost:3000)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'Pro Fisio API is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Pro Fisio Backend server listening on port ${PORT}`);
});
