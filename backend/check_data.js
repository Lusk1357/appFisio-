const prisma = require('./src/utils/prisma');
(async () => {
    try {
        const result = await prisma.prescriptionExercise.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            select: {
                id: true,
                howToExecute: true,
                exercise: { select: { name: true } }
            }
        });
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
})();
