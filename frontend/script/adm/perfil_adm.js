document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formChangePassword");
    const feedback = document.getElementById("passwordFeedback");
    const btn = document.getElementById("btnChangePassword");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        feedback.style.color = "red";
        feedback.textContent = "";

        const senhaAtual = document.getElementById("senhaAtual").value;
        const novaSenha = document.getElementById("novaSenha").value;
        const confirmarSenha = document.getElementById("confirmarSenha").value;

        if (novaSenha !== confirmarSenha) {
            feedback.textContent = "A nova senha e a confirmação não coincidem.";
            return;
        }

        if (novaSenha.length < 6) {
            feedback.textContent = "A nova senha deve ter no mínimo 6 caracteres.";
            return;
        }

        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Atualizando...`;

        try {
            const res = await fetch("/api/auth/alterar-senha", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senhaAtual, novaSenha }),
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok) {
                feedback.style.color = "#10b981"; // Success green
                feedback.textContent = "Senha alterada com sucesso!";
                form.reset();
            } else {
                feedback.style.color = "#ef4444"; // Error red
                feedback.textContent = data.erro || "Erro ao alterar a senha.";
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            feedback.style.color = "#ef4444";
            feedback.textContent = "Erro de conexão com o servidor.";
        } finally {
            btn.disabled = false;
            btn.innerHTML = `ATUALIZAR SENHA`;
        }
    });
});
