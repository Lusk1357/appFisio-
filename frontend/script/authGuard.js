/**
 * authGuard.js - Proteção de rotas no Frontend
 */

async function verificarAcesso(roleEsperado) {
    try {
        // 1. Verifica no servidor se a sessão é válida (O cookie JWT será enviado automaticamente)
        const response = await fetch("/api/pacientes/me", { credentials: "include" });
        
        if (!response.ok) {
            console.warn("Sessão inválida ou expirada. Redirecionando para login...");
            window.location.href = "/pages/auth/login.html";
            return;
        }

        const user = await response.json();

        // 2. Verifica se o papel do usuário coincide com o esperado (ADMIN ou PATIENT)
        // Se roleEsperado for nulo, apenas a autenticação é necessária.
        if (roleEsperado && user.role !== roleEsperado) {
            console.error(`Acesso negado. Esperado: ${roleEsperado}, Atual: ${user.role}`);
            
            // Redireciona para a home correta baseado no papel real dele, ou login
            if (user.role === "ADMIN") {
                window.location.href = "/pages/adm/home_adm.html";
            } else {
                window.location.href = "/pages/funcionalidades/home.html";
            }
            return;
        }

        // Caso tudo esteja certo, o fluxo segue normalmente.
        console.log(`✅ Acesso autorizado para ${user.name} (${user.role})`);
        
        // Opcional: Atualiza o localStorage para garantir que os dados visuais estejam sincronizados
        localStorage.setItem("userProFisio", JSON.stringify({
            id: user.id,
            nome: user.name,
            tipo: user.role === "ADMIN" ? "adm" : "paciente"
        }));

    } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        window.location.href = "/pages/auth/login.html";
    }
}
