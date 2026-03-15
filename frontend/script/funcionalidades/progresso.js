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
  const capitalized = capitalizeName(loggedUser.nome.split(" ")[0]);
  progressoNome.textContent = `Olá, ${capitalized}!`;

  // ── Busca dados reais de progresso e Verifica Conquistas ──────
  const stats = await checkMilestones();
  if (!stats) return;

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

  // ── Atualiza a UI das Conquistas (Locked/Unlocked) ────────────
  async function updateAchievementsUI(stats) {
    const rules = [
      { id: "primeiroTreino", cond: stats.exerciciosConcluidos > 0, bg: "#dcfce7", color: "#16a34a" },
      { id: "focoSemanal", cond: stats.diasTreinados >= 3, bg: "#dbeafe", color: "#2563eb" },
      { id: "dezExercicios", cond: stats.exerciciosConcluidos >= 10, bg: "#fef9c3", color: "#ca8a04" },
      { id: "guerreiro", cond: stats.diasTreinados >= 20, bg: "#f3e8ff", color: "#9333ea" },
      { id: "cinquentaExercicios", cond: stats.exerciciosConcluidos >= 50, bg: "#ffedd5", color: "#ea580c" },
      { id: "cinquentaDias", cond: stats.diasTreinados >= 50, bg: "#e0e7ff", color: "#4f46e5" },
      { id: "cemExercicios", cond: stats.exerciciosConcluidos >= 100, bg: "#fef3c7", color: "#d97706" },
      { id: "cemDias", cond: stats.diasTreinados >= 100, bg: "#ecfeff", color: "#0891b2" },
      { id: "tempoSaude", cond: stats.tempoTotalMinutos >= 60, bg: "#ccfbf1", color: "#0d9488" },
      { id: "superDedicado", cond: stats.tempoTotalMinutos >= 300, bg: "#fae8ff", color: "#c026d3" },
      { id: "perseveranca", cond: stats.diasComTreinoCompleto >= 5, bg: "#fef3c7", color: "#d97706" },
      { id: "mestreSemana", cond: stats.mesAtualDiasConcluidos >= 7, bg: "#dcfce7", color: "#15803d" }
    ];

    rules.forEach(rule => {
      const el = document.querySelector(`.achievement-item[data-id="${rule.id}"]`);
      if (el && rule.cond) {
        el.classList.remove("locked");
        const iconEl = el.querySelector(".ach-icon");
        if (iconEl) {
          iconEl.style.background = rule.bg;
          iconEl.style.color = rule.color;
        }
      }
    });
  }

  await updateAchievementsUI(stats);

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
