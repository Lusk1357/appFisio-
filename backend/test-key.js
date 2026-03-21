process.env.PRISMA_FIELD_ENCRYPTION_KEY = 'k1.aesgcm256.k7b1rA99gYzO3oU2kXpL8Qj4nWtE5sD0vM1fC6hN8XU=';
const { fieldEncryptionExtension } = require('prisma-field-encryption');
try {
  fieldEncryptionExtension();
  console.log('CHAVE VALIDA!');
} catch(e) {
  console.log('ERRO:', e.message);
}
