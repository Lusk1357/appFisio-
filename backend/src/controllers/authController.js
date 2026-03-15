const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
console.log("[Auth] Prisma Client inicializado");
const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_PRO_FISIO_KEY_123";

// Registro -> Hashing de Senha Segura
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, telefone } = req.body;

        // Verifica se usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ erro: "Este login já está cadastrado." });
        }

        // Verifica se o telefone já existe
        if (telefone) {
            const existingPhone = await prisma.patientProfile.findFirst({ where: { telefone } });
            if (existingPhone) {
                return res.status(400).json({ erro: "Este telefone já está cadastrado para outro paciente." });
            }
        }

        // Criptografia mágica do Bcrypt - torna a senha irreversível
        const passwordHash = await bcrypt.hash(password, 10);

        // Salva com segurança usando o Prisma
        const newUser = await prisma.user.create({
            data: {
                name,
                email, // Usado como Login internamente
                passwordHash,
                role: role || "PATIENT" // Padrão é paciente, a não ser que explícito
            }
        });

        // Opcional: criar perfil de paciente se for paciente
        if (newUser.role === "PATIENT") {
            await prisma.patientProfile.create({
                data: {
                    userId: newUser.id,
                    telefone: telefone || null
                }
            });
        }

        res.status(201).json({
            sucesso: true,
            mensagem: "Conta criada com sucesso!",
            usuario: { id: newUser.id, name: newUser.name, role: newUser.role }
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Login -> Emissão Mágica de "Crachá" (Token JWT)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. O paciente está no banco de dados?
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ erro: "Email não encontrado." });
        }

        // 2. O paciente enviou a senha correta? (Compara a String com a Criptografia da Base)
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ erro: "Senha incorreta." });
        }

        // 3. Paciente autêntico! Geramos o Token.
        const tokenPayload = {
            id: user.id,
            name: user.name,
            role: user.role
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        // 4. Injeta dentro de um Cookie 'HttpOnly' que o navegador guarda sozinho sem JavaScript acessar (Super Seguro)
        res.cookie("authToken", token, {
            httpOnly: true, // Continua não sendo acessível pro JS (Blindado)
            secure: process.env.NODE_ENV === "production",
            // Removemos os hacks de 'sameSite: none' e deixamos o padrão (Lax),
            // pois agora o HTML e a API vêm originados da mesmissima casa "localhost:3000".
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
        });

        res.status(200).json({
            sucesso: true,
            mensagem: "Login efetuado! Crachá gerado e salvo.",
            usuario: tokenPayload
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Logout -> Expulsar do Servidor (Apagar o Crachá)
exports.logout = (req, res) => {
    res.clearCookie("authToken");
    res.status(200).json({ sucesso: true, mensagem: "Deslogado com sucesso." });
};

// ── Recuperação de Senha (Self-Service) ──

// Passo 1: Verificar se os dados (Login + Celular) batem
exports.verifyRecoveryData = async (req, res) => {
    try {
        const { email, telefone } = req.body;

        if (!email || !telefone) {
            return res.status(400).json({ erro: "E-mail e telefone são obrigatórios." });
        }

        // 1. Busca o usuário
        const user = await prisma.user.findUnique({
            where: { email },
            include: { patientProfile: true }
        });

        if (!user || user.role !== 'PATIENT' || !user.patientProfile) {
            return res.status(404).json({ erro: "Dados incorretos ou não encontrados." });
        }

        // 2. Limpa tudo que não for número do telefone do banco e do que foi enviado
        const phoneDb = (user.patientProfile.telefone || "").replace(/\D/g, '');
        const phoneInput = telefone.replace(/\D/g, '');

        if (!phoneDb || phoneDb !== phoneInput) {
            return res.status(401).json({ erro: "Dados incorretos. Verifique o telefone informado." });
        }

        // 3. Sucesso! Gera um Token Temporário de 15 minutos especializado para "Reset"
        const tokenPayload = {
            id: user.id,
            purpose: "password_reset"
        };
        const recoveryToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });

        res.status(200).json({
            sucesso: true,
            mensagem: "Dados confirmados.",
            recoveryToken
        });
    } catch (error) {
        console.error("verifyRecoveryData Error:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Passo 2: Redefinir a senha com o Token gerado no passo 1
exports.resetPasswordDirect = async (req, res) => {
    try {
        const { recoveryToken, novaSenha } = req.body;

        if (!recoveryToken || !novaSenha) {
            return res.status(400).json({ erro: "Token e nova senha são obrigatórios." });
        }

        // 1. Validar e abrir o Token Temporário
        let payload;
        try {
            payload = jwt.verify(recoveryToken, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ erro: "A sessão de recuperação expirou ou é inválida. Tente novamente." });
        }

        // Garante que é um token de reset, e não um token de login normal sendo roubado
        if (payload.purpose !== "password_reset") {
            return res.status(403).json({ erro: "Token com propósito inválido." });
        }

        // 2. Encriptar a nova senha
        const passwordHash = await bcrypt.hash(novaSenha, 10);

        // 3. Salvar no banco
        await prisma.user.update({
            where: { id: payload.id },
            data: { passwordHash }
        });

        // 4. Se ele estivesse logado em outro dispositivo, por segurança vamos limpar o cookie dele na hora (ainda que o outro dispositivo já tenha um JWT normal rodando, pro usuário logar de novo)
        res.clearCookie("authToken");

        res.status(200).json({
            sucesso: true,
            mensagem: "Senha atualizada com sucesso!"
        });
    } catch (error) {
        console.error("resetPasswordDirect Error:", error);
        res.status(500).json({ erro: "Erro interno ao redefinir a senha." });
    }
};
// ── Setup de Administrador Seguro (Protegido por Master Key) ──
exports.setupSuperAdmin = async (req, res) => {
    try {
        const { name, email, password, masterKey } = req.body;
        const SECRET_MASTER_KEY = process.env.MASTER_KEY || "CHAVE_MESTRA_PADRAO_SEGURA";

        console.log(`Tentativa de setup admin para: ${email}`);
        // Log para depuração (remover em produção se necessário)
        // console.log(`Chave recebida: "${masterKey}"`);
        // console.log(`Chave esperada: "${SECRET_MASTER_KEY}"`);

        // 1. Validação da Chave Mestra
        if (!masterKey || masterKey.trim() !== SECRET_MASTER_KEY.trim()) {
            console.warn(`Acesso negado: Chave Mestra incorreta.`);
            console.warn(`Recebida: "${masterKey ? masterKey.substring(0, 3) + '...' : 'null'}" | Esperada: "${SECRET_MASTER_KEY.substring(0, 3)}..."`);
            return res.status(403).json({ erro: "Chave Mestra inválida ou não fornecida." });
        }

        // 2. Validação básica de campos
        if (!name || !email || !password) {
            return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
        }

        // 3. Verifica se usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ erro: "Este e-mail já está sendo usado." });
        }

        // 4. Criação do Admin
        const passwordHash = await bcrypt.hash(password, 10);
        const adminUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "ADMIN"
            }
        });

        res.status(201).json({
            sucesso: true,
            mensagem: `Administrador ${adminUser.name} criado com sucesso!`,
            usuario: { id: adminUser.id, email: adminUser.email, role: adminUser.role }
        });
    } catch (error) {
        console.error("SetupSuperAdmin Error:", error);
        // Retornar o erro real (mas seguro) para ajudar no debug
        res.status(500).json({ 
            erro: "Erro interno no servidor ao configurar administrador.",
            detalhes: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
};
