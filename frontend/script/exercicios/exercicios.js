document.addEventListener("DOMContentLoaded", () => {
  const monthText = document.getElementById("monthText");
  const yearText = document.getElementById("yearText");
  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");
  const daysCarousel = document.getElementById("daysCarousel");
  const exercisesList = document.getElementById("exercisesList");
  const selectedDateLabel = document.getElementById("selectedDateLabel");
  const startTrainingArea = document.getElementById("startTrainingArea");

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  // Data Atual (Hoje)
  let currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  let activeDay = currentDate.getDate();

  // Cache dos exercícios do dia selecionado (para enviar ao treino ativo)
  let exerciciosDoDia = [];

  async function renderExercisesForSelectedDate(year, month, day) {
    const today = new Date();
    selectedDateLabel.innerText = "Carregando...";

    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      selectedDateLabel.innerText = "Hoje";
    } else {
      selectedDateLabel.innerText = `${day} de ${monthNames[month]}`;
    }

    exercisesList.innerHTML = '<p class="empty-msg" style="text-align: center; color: #64748b; margin-top: 20px;">Carregando treinos... <i class="fa-solid fa-spinner fa-spin"></i></p>';
    exerciciosDoDia = [];
    if (startTrainingArea) startTrainingArea.innerHTML = "";

    try {
      const mesStr = String(month + 1).padStart(2, "0");
      const diaStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${mesStr}-${diaStr}`;

      const response = await fetch(`/api/prescricoes/me?date=${dateStr}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });

      if (!response.ok) throw new Error("Falha ao buscar treinos.");

      const prescricoes = await response.json();
      exercisesList.innerHTML = "";

      if (!prescricoes || prescricoes.length === 0) {
        exercisesList.innerHTML = '<p class="empty-msg" style="text-align: center; color: #64748b; margin-top: 20px;">Nenhum treino prescrito para este dia. Descanse! ✨</p>';
        return;
      }

      let temExercicios = false;

      prescricoes.forEach(presc => {
        const itensDoTreino = presc.exercises || [];
        if (itensDoTreino.length > 0) temExercicios = true;

        itensDoTreino.forEach(associacao => {
          const ex = associacao.exercise;
          const isCompleted = associacao.completed;

          exerciciosDoDia.push({
            prescriptionExerciseId: associacao.id,
            id: ex.id,
            name: ex.name,
            series: ex.series,
            observation: ex.observation,
            type: ex.type,
            videoUrl: ex.videoUrl || "",
            completed: isCompleted
          });

          const item = document.createElement("div");
          // Reaproveitamos estilos do card principal para a listagem
          item.style.backgroundColor = isCompleted ? "#f8fafc" : "#fff";
          item.style.borderRadius = "16px";
          item.style.padding = "20px";
          item.style.marginBottom = "15px";
          item.style.display = "flex";
          item.style.alignItems = "center";
          item.style.boxShadow = "var(--shadow-sm)";
          item.style.opacity = isCompleted ? "0.6" : "1";
          item.style.transition = "transform 0.2s ease";

          const isForte = ex.type && ex.type.toLowerCase().includes("fortalecimento");
          const iconType = isForte ? '<i class="fa-solid fa-dumbbell"></i>' : '<i class="fa-solid fa-person-walking"></i>';

          const statusIcon = isCompleted
            ? '<i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 20px;"></i>'
            : '<i class="fa-solid fa-chevron-right" style="color: #cbd5e1;"></i>';

          item.innerHTML = `
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 15px;">
                        ${iconType}
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; font-size: 16px; color: var(--text-dark);">${ex.name}</h4>
                        <p style="margin: 0; font-size: 13px; color: var(--text-light);"><i class="fa-solid fa-list-ol"></i> ${ex.series} ${ex.type ? `• ${ex.type}` : ''}</p>
                    </div>
                    <div>
                        ${statusIcon}
                    </div>
                `;

          exercisesList.appendChild(item);
        });
      });

      if (!temExercicios) {
        exercisesList.innerHTML = '<p class="empty-msg" style="text-align: center; color: #64748b; margin-top: 20px;">Sua rotina hoje está vazia.</p>';
        return;
      }

      const naoCompletos = exerciciosDoDia.filter(e => !e.completed);
      if (naoCompletos.length > 0) {
        if (startTrainingArea) {
          const btn = document.createElement("button");
          btn.style.width = "100%";
          btn.style.padding = "16px";
          btn.style.backgroundColor = "var(--primary)";
          btn.style.color = "#fff";
          btn.style.border = "none";
          btn.style.borderRadius = "25px";
          btn.style.fontSize = "16px";
          btn.style.fontWeight = "bold";
          btn.style.cursor = "pointer";
          btn.innerHTML = '<i class="fa-solid fa-play"></i> INICIAR TREINAMENTO';
          btn.addEventListener("click", () => {
            sessionStorage.setItem("treinoAtivo", JSON.stringify({
              date: dateStr,
              exercises: naoCompletos
            }));
            window.location.href = "/pages/exercicios/detalhes_exercicios.html";
          });
          startTrainingArea.appendChild(btn);
        }
      } else {
        if (startTrainingArea) {
          startTrainingArea.innerHTML = '<p style="text-align: center; color: #10b981; font-weight: bold; background: #dcfce7; padding: 15px; border-radius: 12px;"><i class="fa-solid fa-medal" style="color: #f59e0b;"></i> Treino do dia concluído! 🎉</p>';
        }
      }

    } catch (error) {
      console.error(error);
      exercisesList.innerHTML = '<p class="empty-msg" style="text-align: center; color: #ef4444; margin-top: 20px;">Erro de conexão com o banco de dados.</p>';
    }
  }

  function renderCalendar(month, year) {
    monthText.style.opacity = "0";
    yearText.style.opacity = "0";

    setTimeout(() => {
      monthText.innerText = monthNames[month];
      yearText.innerText = year;
      monthText.style.opacity = "1";
      yearText.style.opacity = "1";
    }, 150);

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    daysCarousel.innerHTML = "";

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dayNameStr = dayNames[dateObj.getDay()];

      const dayCard = document.createElement("div");
      dayCard.className = "day-card";
      if (i === activeDay) {
        dayCard.classList.add("active");
      }

      dayCard.innerHTML = `
                <span class="day-name">${dayNameStr}</span>
                <span class="day-number">${i}</span>
            `;

      dayCard.addEventListener("click", () => {
        document.querySelectorAll(".day-card").forEach((c) => {
          c.classList.remove("active");
          c.style.transform = "translateY(0)";
        });

        dayCard.classList.add("active");
        dayCard.style.transform = "translateY(-5px) scale(1.05)";
        activeDay = i;
        renderExercisesForSelectedDate(year, month, i);
      });

      daysCarousel.appendChild(dayCard);

      setTimeout(() => {
        dayCard.style.opacity = "1";
        if (dayCard.classList.contains("active")) {
          dayCard.style.transform = "translateY(-5px) scale(1.05)";

          dayCard.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        } else {
          dayCard.style.transform = "translateY(0)";
        }
      }, 30 * i);
    }
  }

  prevMonthBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    activeDay = 1;
    renderCalendar(currentMonth, currentYear);
  });

  nextMonthBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    activeDay = 1;
    renderCalendar(currentMonth, currentYear);
  });

  renderCalendar(currentMonth, currentYear);
  renderExercisesForSelectedDate(currentYear, currentMonth, activeDay);
  let isDown = false;
  let startX;
  let scrollLeft;

  daysCarousel.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - daysCarousel.offsetLeft;
    scrollLeft = daysCarousel.scrollLeft;
    daysCarousel.style.scrollBehavior = "auto";
  });

  daysCarousel.addEventListener("mouseleave", () => {
    isDown = false;
    daysCarousel.style.scrollBehavior = "smooth";
  });

  daysCarousel.addEventListener("mouseup", () => {
    isDown = false;
    daysCarousel.style.scrollBehavior = "smooth";
  });

  daysCarousel.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - daysCarousel.offsetLeft;
    const walk = (x - startX) * 2;
    daysCarousel.scrollLeft = scrollLeft - walk;
  });
});