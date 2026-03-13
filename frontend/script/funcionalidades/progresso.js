// progresso.js

document.addEventListener("DOMContentLoaded", async () => {
  const loggedUserJSON = localStorage.getItem("userProFisio");
  if (!loggedUserJSON) {
    window.location.replace("/pages/auth/login.html");
    return;
  }

  const loggedUser = JSON.parse(loggedUserJSON);

  // Header Info
  const progressoNome = document.getElementById("progressoNome");
  progressoNome.textContent = `Olá, ${loggedUser.nome.split(" ")[0]}!`;

  // ── Busca dados reais de progresso da API ─────────────────────
  let stats = {
    totalExercicios: 0,
    exerciciosConcluidos: 0,
    diasTreinados: 0,
    diasComTreinoCompleto: 0,
    tempoTotalMinutos: 0,
    totalPrescricoes: 0,
    mesAtualTotal: 0,
    mesAtualConcluidos: 0,
    mesAtualDiasAtribuidos: 0,
    mesAtualDiasConcluidos: 0
  };

  try {
    const response = await fetch("/api/prescricoes/me/stats", {
      credentials: "include"
    });
    if (response.ok) {
      stats = await response.json();
    }
  } catch (e) {
    console.error("Erro ao buscar progresso:", e);
  }

  // ── Set UI Stats ──────────────────────────────────────────────
  const statTotalDias = document.getElementById("statTotalDias");
  const statTotalExercicios = document.getElementById("statTotalExercicios");

  animateValue(statTotalDias, 0, stats.diasTreinados, 1000);
  animateValue(statTotalExercicios, 0, stats.exerciciosConcluidos, 1200);

  // ── Gráfico de Dedicação Circular ─────────────────────────────
  const ringCircle = document.querySelector(".ring-circle");
  const ringPercentual = document.getElementById("ringPercentual");

  // Meta: 100% = todos os treinos (dias com exercícios) do mês atual concluídos
  let perc = 0;
  if (stats.mesAtualDiasAtribuidos > 0) {
    perc = Math.min(100, Math.round((stats.mesAtualDiasConcluidos / stats.mesAtualDiasAtribuidos) * 100));
  }

  // Define um mínimo visual de 3% apenas se a pessoa já completou algo mas a % for muito baixa
  if (perc === 0 && stats.mesAtualDiasConcluidos > 0) perc = 3;

  ringPercentual.textContent = `${perc}%`;
  setTimeout(() => {
    // Adiciona uma transição para animar do zero até o valor real
    ringCircle.style.background = `conic-gradient(#5b8af5 ${perc}%, #f1f5f9 0)`;
  }, 100);

  // ── Sistema de Conquistas ─────────────────────────────────────
  // Puxa histórico de conquistas já exibidas do storage (para não dar popup toda hora)
  let unlockedAchievements = JSON.parse(localStorage.getItem("unlockedAchievements") || "[]");
  let newlyUnlocked = null; // Guarda a primeira nova conquista pra dar foco nela

  function checkAndUnlock(dataId, condition, name, desc, iconBg, iconColor) {
    const el = document.querySelector(`.achievement-item[data-id="${dataId}"]`);
    if (el && condition) {
      el.classList.remove("locked");
      el.querySelector(".ach-icon").style.background = iconBg;
      el.querySelector(".ach-icon").style.color = iconColor;

      if (!unlockedAchievements.includes(dataId)) {
        unlockedAchievements.push(dataId);
        if (!newlyUnlocked) newlyUnlocked = { id: dataId, name, desc }; // Salva pra exibir no popup
      }
    }
  }

  // Define as regras das conquistas
  checkAndUnlock("primeiroTreino", stats.exerciciosConcluidos > 0, "Primeiro Treino", "Inicie sua jornada no app", "#dcfce7", "#16a34a");
  checkAndUnlock("focoSemanal", stats.diasTreinados >= 3, "Foco Total", "3 dias de atividades", "#dbeafe", "#2563eb");
  checkAndUnlock("dezExercicios", stats.exerciciosConcluidos >= 10, "Iniciante Forte", "10 exercícios concluídos", "#fef9c3", "#ca8a04");
  checkAndUnlock("guerreiro", stats.diasTreinados >= 20, "Guerreiro da Fisio", "20 dias de treino", "#f3e8ff", "#9333ea");

  // Novas Conquistas
  checkAndUnlock("cinquentaExercicios", stats.exerciciosConcluidos >= 50, "Atleta Dedicado", "50 exercícios concluídos", "#ffedd5", "#ea580c");
  checkAndUnlock("cinquentaDias", stats.diasTreinados >= 50, "Constância de Ferro", "50 dias de treino", "#e0e7ff", "#4f46e5");
  checkAndUnlock("cemExercicios", stats.exerciciosConcluidos >= 100, "Mestre do Movimento", "100 exercícios concluídos", "#fef3c7", "#d97706");
  checkAndUnlock("cemDias", stats.diasTreinados >= 100, "Resiliência Pura", "100 dias ininterruptos de empenho", "#ecfeff", "#0891b2");

  // Salva de volta no storage local
  localStorage.setItem("unlockedAchievements", JSON.stringify(unlockedAchievements));

  // Gerencia o Popup de "Nova Conquista" após o treino
  if (sessionStorage.getItem("justFinishedWorkout") === "true") {
    sessionStorage.removeItem("justFinishedWorkout"); // Limpa o flag

    if (newlyUnlocked) {
      // Mostra o popup
      const popup = document.getElementById("achievementPopup");
      const pName = document.getElementById("popupAchName");
      const pDesc = document.getElementById("popupAchDesc");
      const pProg = document.getElementById("popupProgress");

      pName.innerText = newlyUnlocked.name;
      pDesc.innerText = newlyUnlocked.desc;
      popup.style.display = "flex";

      // Anima barra de progresso do popup (20s)
      setTimeout(() => {
        pProg.style.width = "0%";
      }, 100);

      // Esconde automaticamente depois de 20 segundos
      setTimeout(() => {
        popup.style.animation = "slideUp 0.5s ease forwards";
        setTimeout(() => popup.style.display = "none", 500);
      }, 20000);

      // Permite fechar clicando
      popup.addEventListener("click", () => {
        popup.style.animation = "slideUp 0.5s ease forwards";
        setTimeout(() => popup.style.display = "none", 500);
      });
    }
  }

  // ── Função Animação UI ────────────────────────────────────────
  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // Componentes Injetados
  renderBottomNav('progresso');
});
