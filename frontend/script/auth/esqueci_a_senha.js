document.addEventListener("DOMContentLoaded", () => {
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

  const btnReform = document.getElementById("btnRecoverParams");
  const telInput = document.getElementById("telefone");

  // Máscara de telefone
  if (telInput) {
    telInput.addEventListener("input", () => {
      let v = telInput.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6)
        v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
      else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
      telInput.value = v;
    });
  }

  if (btnReform) {
    btnReform.addEventListener("click", (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email");
      const emailVal = emailInput.value.trim();
      const telVal = telInput.value.trim();

      if (!emailVal) {
        showToast("error", "Por favor, insira o seu login/e-mail.");
        return;
      }

      if (telVal.replace(/\D/g, "").length < 10) {
        showToast("error", "Por favor, insira um telefone válido com DDD.");
        return;
      }

      // Realiza a chamada real para a API
      const btn = e.target;
      const originalText = btn.textContent;
      btn.textContent = "VERIFICANDO...";
      btn.disabled = true;

      fetch('/api/auth/verificar-recuperacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, telefone: telVal })
      })
      .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, data })))
      .then(({ status, ok, data }) => {
        if (!ok) {
          showToast("error", data.erro || "Verifique os dados informados e tente novamente.");
          return;
        }

        // Sucesso
        sessionStorage.setItem('resetEmail', emailVal);
        sessionStorage.setItem('recoveryToken', data.recoveryToken); // Token de 15 minutos real
        
        showToast("success", "Dados confirmados! Redirecionando...");
        setTimeout(() => {
          window.location.href = "/pages/auth/nova_senha.html";
        }, 1500);
      })
      .catch(err => {
        console.error("Erro na verificação:", err);
        showToast("error", "Erro de conexão com o servidor.");
      })
      .finally(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      });
    });
  }
});

function back() {
  window.history.back();
}
