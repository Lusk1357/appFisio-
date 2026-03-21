// Teste de consistência de Data UTC
const testDate = (year, month, day) => {
    // Simula o que o Frontend faz agora
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    console.log(`Frontend (UTC Construction): ${utcDate.toISOString()}`);

    // Simula o que o Backend faz agora ao receber o ISO
    const receivedISO = utcDate.toISOString();
    const [y, m, d] = receivedISO.split('T')[0].split('-');
    const backendDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    console.log(`Backend (Parsing & Re-UTC):  ${backendDate.toISOString()}`);

    const startDate = new Date(backendDate);
    const endDate = new Date(backendDate);
    endDate.setUTCHours(23, 59, 59, 999);

    console.log(`Range de Busca: [${startDate.toISOString()}] até [${endDate.toISOString()}]`);
    
    const success = (receivedISO === startDate.toISOString());
    console.log(`Sucesso: ${success ? "SIM" : "NÃO"}`);
    return success;
};

console.log("--- TESTE 1: Dia comum ---");
testDate(2023, 11, 20);

console.log("\n--- TESTE 2: Virada de mês ---");
testDate(2023, 12, 31);

console.log("\n--- TESTE 3: Ano bissexto ---");
testDate(2024, 2, 29);
