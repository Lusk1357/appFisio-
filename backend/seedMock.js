const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
    try {
        const hash = await bcrypt.hash('123456', 10);

        // Use upsert to prevent errors if running multiple times
        const user = await prisma.user.upsert({
            where: { email: 'teste@paciente.com' },
            update: { passwordHash: hash },
            create: {
                name: 'Lucas do Teste',
                email: 'teste@paciente.com',
                passwordHash: hash,
                role: 'PATIENT'
            }
        });

        console.log('Mock user injected successfully!');
    } catch (e) {
        console.error('Seed Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
