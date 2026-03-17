const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exercises = await prisma.exercise.findMany();
  console.log("Total recipes:", exercises.length);
  console.log(JSON.stringify(exercises.slice(0, 3), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
