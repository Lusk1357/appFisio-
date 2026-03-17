document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("backBtn").addEventListener("click", () => {
    window.history.back();
  });

  function showToast(type, message) {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icon =
      type === "success"
        ? '<i class="fa-solid fa-circle-check"></i>'
        : '<i class="fa-solid fa-circle-exclamation"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s forwards";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

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

  const form = document.getElementById("changePasswordForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const currentPass = document.getElementById("currentPassword").value.trim();
    const newPass = document.getElementById("newPassword").value.trim();
    const confirmPass = document.getElementById("confirmPassword").value.trim();

    if (!currentPass || !newPass || !confirmPass) {
      showToast("error", "Por favor, preencha todos os campos.");
      return;
    }

    if (newPass !== confirmPass) {
      showToast("error", "A nova senha e a confirmação não coincidem.");
      return;
    }

    if (currentPass === newPass) {
      showToast("error", "A nova senha não pode ser igual à senha atual.");
      return;
    }

    // Chama a API real para alterar a senha
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "SALVANDO...";
    btn.disabled = true;

    fetch('/api/auth/alterar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ senhaAtual: currentPass, novaSenha: newPass })
    })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) {
        showToast("error", data.erro || "Erro ao alterar a senha.");
        return;
      }

      showToast("success", "Senha alterada com sucesso!");
      setTimeout(() => {
        window.location.href = "/pages/auth/login.html";
      }, 2000);
    })
    .catch(err => {
      console.error("Erro ao alterar senha:", err);
      showToast("error", "Erro de conexão com o servidor.");
    })
    .finally(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    });
  });
});
