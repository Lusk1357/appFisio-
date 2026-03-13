const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const items = await prisma.prescription.findMany({
        orderBy: { assignedDay: 'desc' },
        take: 10
    });
    console.dir(items, { depth: null });
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
