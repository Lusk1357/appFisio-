document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("backBtn").addEventListener("click", () => {
      window.history.back();
    });
  
    // showToast é provido globalmente pelo components.js

  
    const toggleIcons = document.querySelectorAll(".toggle-password");
    toggleIcons.forEach((icon) => {
      icon.addEventListener("click", function () {
        const targetId = this.getAttribute("data-target");
        const inputElement = document.getElementById(targetId);
  
        if (inputElement.type === "password") {
          inputElement.type = "text";
          this.classList.remove("fa-eye-slash");
          this.classList.add("fa-eye");
        } else {
          inputElement.type = "password";
          this.classList.remove("fa-eye");
          this.classList.add("fa-eye-slash");
        }
      });
    });
  
    const form = document.getElementById("newPasswordForm");
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const newPass = document.getElementById("newPassword").value.trim();
      const confirmPass = document.getElementById("confirmPassword").value.trim();
  
      if (!newPass || !confirmPass) {
        showToast("error", "Por favor, preencha todos os campos.");
        return;
      }
  
      if (newPass !== confirmPass) {
        showToast("error", "A nova senha e a confirmação não coincidem.");
        return;
      }
  
      const recoveryToken = sessionStorage.getItem('recoveryToken');
    if (!recoveryToken) {
      showToast("error", "Sessão expirada. Volte para a tela de recuperar senha.");
      setTimeout(() => {
         window.location.href = "/pages/auth/esqueci_a_senha.html";
      }, 2000);
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "SALVANDO...";
    btn.disabled = true;

    fetch('/api/auth/nova-senha-recuperacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryToken: recoveryToken, novaSenha: newPass })
    })
    .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
    .then(({ status, ok, data }) => {
        if (!ok) {
            showToast("error", data.erro || "Erro ao redefinir a senha.");
            return;
        }

        showToast("success", "Sua senha foi redefinida com sucesso!");
        
        // Limpar os dados temporários de recuperação
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('recoveryToken');
    
        setTimeout(() => {
          window.location.href = "/pages/auth/login.html";
        }, 1500);
    })
    .catch(err => {
        console.error("Erro no reset de senha:", err);
        showToast("error", "Erro de conexão com o servidor.");
    })
    .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
    });
  });
});
