const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@clinica.com';

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('123456', 10);
        const admin = await prisma.user.create({
            data: {
                name: 'Dra. Silva (Admin)',
                email: adminEmail,
                passwordHash,
                role: 'ADMIN' // Usa o Enum definido no schema
            }
        });
        console.log("Admin account created successfully:", admin.id);
    } else {
        console.log("Admin account already exists:", existingAdmin.id);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
