const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const exercises = await prisma.exercise.findMany({
    take: 10,
    orderBy: { id: 'desc' }
  });
  console.log("Found " + exercises.length + " exercises injected successfully.");
  console.log(JSON.stringify(exercises, null, 2));
  await prisma.$disconnect();
}

check().catch(console.error);
