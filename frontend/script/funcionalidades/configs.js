document.addEventListener("DOMContentLoaded", () => {
    // 1. Injetar a barra de navegação inferior (nenhuma aba ativa especificamente, ou 'perfil')
    renderBottomNav('perfil');

    // 2. Lógica para os botões "Em desenvolvimento"
    const btnLanguage = document.getElementById("btnLanguage");
    if (btnLanguage) {
        btnLanguage.addEventListener("click", (e) => {
            e.preventDefault();
            if (window.showCustomModal) {
                window.showCustomModal({
                    title: "EM BREVE",
                    message: "A troca de linguagem estará disponível em atualizações futuras!",
                    type: "info",
                    showCancel: false
                });
            } else {
                alert("A troca de linguagem estará disponível em atualizações futuras!");
            }
        });
    }

    const btnUpgrade = document.querySelector(".btn-upgrade");
    if (btnUpgrade) {
        btnUpgrade.addEventListener("click", () => {
            if (window.showCustomModal) {
                window.showCustomModal({
                    title: "PLANOS PREMIUM",
                    message: "O plano Premium com vídeos exclusivos chegará em breve!",
                    type: "success",
                    confirmText: "Entendido",
                    showCancel: false
                });
            } else {
                alert("O plano Premium com vídeos exclusivos chegará em breve!");
            }
        });
    }

    // 3. Lógica robusta de Logout
    const btnLogout = document.getElementById("btnLogout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async (e) => {
            e.preventDefault();

            if (window.showCustomConfirm) {
                window.showCustomConfirm(
                    "Sair da Conta",
                    "Deseja realmente sair da sua conta?",
                    execLogout,
                    "warning"
                );
            } else {
                if (confirm("Deseja realmente sair da sua conta?")) {
                    execLogout();
                }
            }
        });
    }

    async function execLogout() {
        try {
            // Chama a API para limpar o cookie 'authToken'
            const res = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (res.ok) {
                window.location.href = "/index.html";
            } else {
                window.location.href = "/index.html";
            }
        } catch (error) {
            console.error("Erro no logout:", error);
            window.location.href = "/index.html";
        }
    }
});
