const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_PRO_FISIO_KEY_123";
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined in the production environment. Using a fallback key is unsafe.');
}

function verificarToken(req, res, next) {
    // 1. O token viaja em segurança invisível dentro do cookie
    const token = req.cookies.authToken;

    // 2. Sem token = Sem acesso as rotas protegidas
    if (!token) {
        return res.status(401).json({ erro: "Acesso Negado. Autenticação Necessária." });
    }

    try {
        // 3. O Prisma confere a chave primária
        const payload = jwt.verify(token, JWT_SECRET);

        // 4. Salva o usuário no request para os próximos controladores saberem quem é
        req.user = payload;
        next(); // Permissão concedida! Entra na Rota.
    } catch (e) {
        return res.status(401).json({ erro: "Sessão Expirada ou Token Inválido." });
    }
}

// Helper para rotas apenas de Admin
function checkAdmin(req, res, next) {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        return res.status(403).json({ erro: "Área Restrita Apenas para Médicos." });
    }
}

module.exports = { verificarToken, checkAdmin };
