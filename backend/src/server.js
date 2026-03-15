const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Carrega variáveis de ambiente SOMENTE em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const authRoutes = require('./routes/auth');
const exerciseRoutes = require('./routes/exercises');
const patientRoutes = require('./routes/patients');
const prescriptionRoutes = require('./routes/prescriptions');
const tipRoutes = require('./routes/tips');
const achievementRoutes = require('./routes/achievementRoutes');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();

console.log(`[Config] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Config] DATABASE_URL detectada: ${process.env.DATABASE_URL ? 'Sim' : 'Não'}`);
console.log(`[Config] Master Key detectada: ${process.env.MASTER_KEY ? 'Sim' : 'Não'}`);

app.use(express.json());
app.use(cookieParser());

// Endpoint de Diagnóstico do Banco
app.get('/api/db-check', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'Conectado ao Banco com sucesso!', database: 'PostgreSQL/Neon' });
    } catch (error) {
        console.error('Erro de conexão ao banco:', error);
        res.status(500).json({ 
            erro: 'Falha ao conectar no banco de dados.', 
            detalhes: error.message 
        });
    }
});

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
app.use('/api/conquistas', achievementRoutes);

// SERVINDO O FRONTEND: Resolve o problema do "file://"
// Agora o frontend e a API rodam debaixo do mesmo teto (http://localhost:3000)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'Pro Fisio API is running!' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Pro Fisio Backend server listening on port ${PORT}`);
    });
}

module.exports = app;
