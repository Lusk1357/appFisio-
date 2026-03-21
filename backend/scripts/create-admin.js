const bcrypt = require('bcryptjs');
const prisma = require('../src/utils/prisma');

async function createAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log("Uso: node create-admin.js \"NOME\" \"EMAIL@exemplo.com\" \"SENHA\"");
        process.exit(1);
    }

    const [name, email, password] = args;

    try {
        // Verifica se usuário já existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.error(`Erro: O e-mail ${email} já está em uso.`);
            process.exit(1);
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Criação no banco
        const adminUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "ADMIN"
            }
        });

        console.log("✅ Administrador criado com sucesso!");
        console.log(`Nome:  ${adminUser.name}`);
        console.log(`Email: ${adminUser.email}`);
        console.log(`Role:  ${adminUser.role}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Erro fatal ao criar administrador:", error);
        process.exit(1);
    }
}

createAdmin();
