document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  backBtn.addEventListener("click", () => {
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

  const startBtn = document.getElementById("startBtn");

  startBtn.addEventListener("click", () => {
    const originalText = startBtn.innerHTML;
    startBtn.innerHTML =
      '<i class="fa-solid fa-circle-notch fa-spin"></i> Iniciando...';
    startBtn.style.pointerEvents = "none";

    setTimeout(() => {
      showToast("success", "Sessão iniciada! Prepare-se.");
      window.location.href = "/pages/exercicios/treino_ativo.html"
      startBtn.innerHTML = '<i class="fa-solid fa-check"></i> Em andamento';
      startBtn.style.backgroundColor = "#10b981";
    }, 1500);
  });
});

