const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CATALOGO_INICIAL = [
    { name: "Agachamento Livre", duration: 15, type: "Fortalecimento", videoUrl: "https://www.youtube.com/watch?v=1" },
    { name: "Flexão de Joelho", duration: 10, type: "Alongamento", videoUrl: "https://www.youtube.com/watch?v=2" },
    { name: "Extensão de Quadril", duration: 12, type: "Fortalecimento", videoUrl: "https://www.youtube.com/watch?v=3" },
    { name: "Ponte Glútea", duration: 20, type: "Estabilização", videoUrl: "https://www.youtube.com/watch?v=4" },
    { name: "Abdução de Quadril", duration: 10, type: "Fortalecimento", videoUrl: "https://www.youtube.com/watch?v=5" },
    { name: "Rotação de Ombro", duration: 8, type: "Mobilidade", videoUrl: "https://www.youtube.com/watch?v=6" },
    { name: "Flexão Plantar", duration: 15, type: "Fortalecimento", videoUrl: "https://www.youtube.com/watch?v=7" },
    { name: "Elevação Lateral", duration: 12, type: "Fortalecimento", videoUrl: "https://www.youtube.com/watch?v=8" },
    { name: "Prancha Abdominal", duration: 60, type: "Core", videoUrl: "https://www.youtube.com/watch?v=9" },
    { name: "Alongamento Isquiotibial", duration: 20, type: "Alongamento", videoUrl: "https://www.youtube.com/watch?v=10" }
];

async function main() {
    console.log("Semeando exercícios...");
    for (const ex of CATALOGO_INICIAL) {
        const existe = await prisma.exercise.findFirst({ where: { name: ex.name } });
        if (!existe) {
            await prisma.exercise.create({ data: ex });
            console.log(`- Inserido: ${ex.name}`);
        } else {
            console.log(`- Já existe: ${ex.name}`);
        }
    }
    console.log("Finalizado!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
