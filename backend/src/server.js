const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

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
const errorHandler = require('./middlewares/errorHandler');

const prisma = require('./utils/prisma');

const app = express();

// Trust the Vercel reverse proxy (needed for express-rate-limit to get the real IP)
app.set('trust proxy', 1);

console.log(`[Config] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Config] DATABASE_URL detectada: ${process.env.DATABASE_URL ? 'Sim' : 'Não'}`);
console.log(`[Config] Master Key detectada: ${process.env.MASTER_KEY ? 'Sim' : 'Não'}`);

app.use(express.json());
app.use(cookieParser());
app.use(compression());

// Configuração do CORS mais restrita (EXECUTADA PRIMEIRO)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'https://app-fisio-six.vercel.app' // Vercel Production Domain
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite origens mapeadas ou ausência de origem (comum em same-origin no Vercel)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Acesso bloqueado pela política de CORS (Origem não listada).Origin recebido: ' + origin));
        }
    },
    credentials: true,
}));

// Header Security Config (Helmet)
// We allow local and specific external resources needed by the app
app.use(helmet({
    contentSecurityPolicy: false, // Disabling CSP temporarily to avoid breaking existing inline scripts/styles (needs careful tuning later)
    crossOriginEmbedderPolicy: false
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { erro: "Muitas requisições criadas a partir deste IP, por favor tente novamente após 15 minutos" }
});
app.use('/api', globalLimiter);

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
    res.json({ status: 'PRO FISIO SIMIONATO API is running!' });
});

// Middleware Global de Tratamento de Erros (sempre no final)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`PRO FISIO SIMIONATO Backend server listening on port ${PORT}`);
    });
}

module.exports = app;
