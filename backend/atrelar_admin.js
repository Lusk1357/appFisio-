require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
    try {
        // Encontra o administrador atual (assumindo que existe apenas um admin padrão)
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!admin) {
            console.log('❌ Nenhum administrador encontrado para atualizar.');
            return;
        }

        const emailOriginal = 'admin@clinica.com'; // Voltando para o original conforme pedido
        const emailRecuperacao = 'lucas.simionato@hotmail.com';
        const novoTelefone = '11972000599';

        const user = await prisma.user.update({
            where: { id: admin.id },
            data: { 
                email: emailOriginal,
                recoveryEmail: emailRecuperacao,
                telefone: novoTelefone 
            }
        });

        console.log(`✅ Sucesso! Admin atualizado:`);
        console.log(`   - Nome: ${user.name}`);
        console.log(`   - Login (E-mail): ${user.email}`);
        console.log(`   - Recuperação (E-mail): ${user.recoveryEmail}`);
        console.log(`   - Telefone: ${user.telefone}`);
    } catch (error) {
        console.error('❌ Erro ao atualizar admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
