document.addEventListener("DOMContentLoaded", () => {
    // 1. Injetar a barra de navegação inferior (nenhuma aba ativa especificamente, ou 'perfil')
    renderBottomNav('perfil');

    // 2. Lógica para os botões "Em desenvolvimento"
    const btnLanguage = document.getElementById("btnLanguage");
    if (btnLanguage) {
        btnLanguage.addEventListener("click", (e) => {
            e.preventDefault();
            alert("A troca de linguagem estará disponível em atualizações futuras!");
        });
    }

    const btnUpgrade = document.querySelector(".btn-upgrade");
    if (btnUpgrade) {
        btnUpgrade.addEventListener("click", () => {
            alert("O plano Premium com vídeos exclusivos chegará em breve!");
        });
    }

    // 3. Lógica robusta de Logout
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async (e) => {
            e.preventDefault();

            if (confirm("Deseja realmente sair da sua conta?")) {
                try {
                    // Chama a API para limpar o cookie 'authToken'
                    const res = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include' // Essencial para enviar o cookie atual para poder ser apagado
                    });

                    if (res.ok) {
                        // Redireciona para o login/index.html após sucesso
                        window.location.href = "/index.html";
                    } else {
                        alert("Não foi possível realizar o logout pelo servidor. Limpando localmente e saindo...");
                        window.location.href = "/index.html";
                    }
                } catch (error) {
                    console.error("Erro no logout:", error);
                    alert("Erro de conexão. Saindo localmente...");
                    window.location.href = "/index.html";
                }
            }
        });
    }
});
