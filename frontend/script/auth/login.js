document.addEventListener("DOMContentLoaded", () => {
  const btnLogin = document.querySelector(".btn-login");
  const form = document.querySelector("form");

  // Toggle password visibility
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  togglePassword.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePassword.classList.toggle("fa-eye-slash", !isPassword);
    togglePassword.classList.toggle("fa-eye", isPassword);
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    if (!emailVal || !passwordVal) {
      showToast("error", "Por favor, preencha seu e-mail e senha.");
      return;
    }

    try {
      // 1. Enviamos o email e senha real pro nosso servidor rodando na porta 3000
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passwordVal })
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Login efetuado com sucesso!");

        // 2. Aqui a API já embutiu o Token JWT invisível no Cookie do navegador!
        // Salvamos no LocalStorage apenas o mínimo visual necessário (Nome e Papel).
        localStorage.setItem("userProFisio", JSON.stringify({
          id: data.usuario.id,
          nome: data.usuario.name,
          tipo: data.usuario.role === "ADMIN" ? "adm" : "paciente"
        }));

        setTimeout(() => {
          if (data.usuario.role === "ADMIN") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/paciente/home";
          }
        }, 1500);
      } else {
        // Ex: "Senha Incorreta" ou "Usuario nao encontrado" gerado pelo Backend
        showToast("error", data.erro || "Falha ao fazer login.");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      showToast("error", "Não foi possível conectar ao servidor Backend.");
    }
  });
});

function back() {
  window.history.back();
}
