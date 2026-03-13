document.addEventListener("DOMContentLoaded", () => {
  const btnRegister = document.querySelector(".btn-login");

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

  btnRegister.addEventListener("click", async () => {
    const nameInput = document.getElementById("name");
    const telInput = document.getElementById("tel");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const nameVal = nameInput ? nameInput.value.trim() : "";
    const telVal = telInput.value.trim();
    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    let camposVazios = [];

    if (!nameVal) camposVazios.push("Nome Completo");
    if (!telVal) camposVazios.push("Telefone");
    if (!emailVal) camposVazios.push("E-mail");
    if (!passwordVal) camposVazios.push("Senha");

    if (camposVazios.length > 0) {
      showToast("error", `Por favor, preencha: ${camposVazios.join(", ")}`);
      return;
    }

    btnRegister.disabled = true;
    btnRegister.textContent = "Cadastrando...";

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          password: passwordVal,
          role: "PATIENT"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", data.erro || "Erro ao cadastrar.");
        btnRegister.disabled = false;
        btnRegister.textContent = "CADASTRAR";
        return;
      }

      showToast("success", "Cadastro realizado com sucesso! Redirecionando...");

      setTimeout(() => {
        window.location.href = "/pages/auth/login.html";
      }, 2000);
    } catch (error) {
      console.error("Erro:", error);
      showToast("error", "Erro de conexão com o servidor.");
      btnRegister.disabled = false;
      btnRegister.textContent = "CADASTRAR";
    }
  });
});

function back() {
  window.history.back();
}

function login() {
  window.location.href = "/pages/auth/login.html";
}
