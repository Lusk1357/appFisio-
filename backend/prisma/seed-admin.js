const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const name = "Administrador";
  const email = "admin@clinica.com";
  const password = "1234567";
  const role = "ADMIN";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, name },
    create: {
      email,
      name,
      passwordHash,
      role,
    },
  });

  console.log(`Usuário Admin criado/atualizado: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
