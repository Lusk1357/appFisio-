const prisma = require('../src/utils/prisma'); 

async function run() {
    console.log("Iniciando varredura e Criptografia do Banco de Dados...");
    
    // Busca todos os perfis diretamente usando o Prisma (que fará decrypt automático caso seja encriptado, 
    // ou retornará nulo-falso/original se for texto plano)
    const profiles = await prisma.patientProfile.findMany();
    
    let updated = 0;
    for (const p of profiles) {
        // Ao atualizar a linha com as MESMAS informações lidas, o Prisma Extension
        // vai forçar a escrita em disco com a nova camada de criptografia.
        await prisma.patientProfile.update({
            where: { id: p.id },
            data: {
                telefone: p.telefone,
                estado: p.estado,
                cidade: p.cidade,
                bairro: p.bairro,
                endereco: p.endereco,
                cep: p.cep,
                notes: p.notes
            }
        });
        updated++;
    }
    
    console.log(`Migração concluída com sucesso! ${updated} perfis foram criptografados e blindados.`);
}

run()
  .catch(e => {
    console.error("Erro fatal na migração:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Tenta fechar de modo seguro se a documentação do Prisma V5+ Extensão permitir.
    // Senão, forçamos saída final.
    process.exit(0);
  });
