const { PrismaClient } = require('@prisma/client');
const { fieldEncryptionExtension } = require('prisma-field-encryption');

// Instancia o Prisma e já acopla a extensão de Criptografia de Campos
// Isso interceptará transparentemente todas as requisições de leitura e escrita
const client = new PrismaClient();
const prisma = client.$extends(fieldEncryptionExtension({
    // A chave de criptografia deverá estar definida na env PRISMA_FIELD_ENCRYPTION_KEY
    // Para dev, fallback no padrão correto (k1.aesgcm256...)
    encryptionKey: process.env.PRISMA_FIELD_ENCRYPTION_KEY || 'k1.aesgcm256.hdJtjM5T-YZkl5VUJdDAuFckBAtewkzsP6ihwW6urSo='
}));

module.exports = prisma;
