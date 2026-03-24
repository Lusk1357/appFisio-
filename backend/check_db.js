const prisma = require('./src/utils/prisma');
(async () => {
    try {
        const result = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'PrescriptionExercise' 
            AND column_name = 'howToExecute'
        `;
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
})();
