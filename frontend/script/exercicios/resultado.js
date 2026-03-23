document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backBtn");
  const saveBtn = document.getElementById("saveBtn");
  const dateDisplay = document.getElementById("completionDate");
  const stepDisplay = document.getElementById("workoutStep");
  const statTempo = document.getElementById("statTempo");
  const statExercicios = document.getElementById("statExercicios");
  const statCalorias = document.getElementById("statCalorias");

  // ── Lê dados do resultado do sessionStorage ────────────────────
  const resultJSON = sessionStorage.getItem("treinoResultado");

  if (resultJSON) {
    const result = JSON.parse(resultJSON);

    // Data de conclusão
    const today = new Date();
    const formattedDate = today.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (dateDisplay) dateDisplay.innerText = `Feito em ${formattedDate}`;

    // Passo
    if (stepDisplay) stepDisplay.innerText = `Exercício ${result.totalExercicios}/${result.totalExercicios}`;

    // Stats reais
    const mins = Math.floor(result.tempoTotalSegundos / 60);
    const secs = result.tempoTotalSegundos % 60;
    if (statTempo) statTempo.innerText = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} min`;
    if (statExercicios) statExercicios.innerText = `${result.totalExercicios} feitos`;

    // Calorias (estimadas a 5 kcal/minuto)
    const caloriasCalculadas = Math.round((result.tempoTotalSegundos / 60) * 5);
    if (statCalorias) statCalorias.innerText = `${caloriasCalculadas} kcal`;
  } else {
    // Fallback
    const today = new Date();
    const formattedDate = today.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    if (dateDisplay) dateDisplay.innerText = `Feito em ${formattedDate}`;
  }

  // ── Confete Automático ─────────────────────────────────────────
  const completionCard = document.querySelector(".completion-card");
  if (completionCard) {
    const confettiArea = document.createElement("div");
    confettiArea.className = "confetti-area";
    confettiArea.id = "confettiArea";
    completionCard.insertBefore(confettiArea, completionCard.firstChild);

    const colors = [
      "#5b8af5", "#a3cd39", "#f59e0b",
      "#ef4444", "#8b5cf6", "#10b981",
    ];
    for (let i = 0; i < 80; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti-piece";
        piece.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        animation-delay: ${Math.random() * 1}s;
        animation-duration: ${1.5 + Math.random() * 1.5}s;
        `;
        confettiArea.appendChild(piece);
    }
  }

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
        : '<i class="fa-solid fa-info-circle"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s forwards";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  backBtn.addEventListener("click", () => {
    window.location.href = "/pages/funcionalidades/treinamento.html";
  });

  saveBtn.addEventListener("click", () => {
    saveBtn.style.pointerEvents = "none";
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    setTimeout(() => {
      showToast("success", "Treino salvo no seu histórico!");
      saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Salvo !';
      saveBtn.style.backgroundColor = "#10b981";

      // Limpa dados temporários
      sessionStorage.removeItem("treinoAtivo");
      sessionStorage.removeItem("treinoResultado");

      // Sinaliza que um treino acabou de ser salvo para acionar a notificação no hub (progresso ou aba principal)
      sessionStorage.setItem("justFinishedWorkout", "true");

      setTimeout(() => {
        window.location.href = "/pages/funcionalidades/progresso.html"; // Redireciona para o progresso para ver conquistas
      }, 2000);
    }, 1000);
  });
});
