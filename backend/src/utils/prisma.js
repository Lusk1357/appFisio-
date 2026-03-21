const { PrismaClient } = require('@prisma/client');
const { fieldEncryptionExtension } = require('prisma-field-encryption');

// Instancia o Prisma e já acopla a extensão de Criptografia de Campos
// Isso interceptará transparentemente todas as requisições de leitura e escrita
const client = new PrismaClient();
const prisma = client.$extends(fieldEncryptionExtension({
    // A chave de criptografia deverá estar definida na env PRISMA_FIELD_ENCRYPTION_KEY
    // Para dev, fallback
    encryptionKey: process.env.PRISMA_FIELD_ENCRYPTION_KEY || 'k7b1rA99gYzO3oU2kXpL8Qj4nWtE5sD0vM1fC6hN8XU='
}));

module.exports = prisma;
