// treinamento.js

document.addEventListener("DOMContentLoaded", () => {
    const loggedUserJSON = localStorage.getItem("userProFisio");
    if (!loggedUserJSON) {
        window.location.replace("/login");
        return;
    }

    const loggedUser = JSON.parse(loggedUserJSON);

    // Elementos da UI
    const btnPrevMonth = document.getElementById("btnPrevMonth");
    const btnNextMonth = document.getElementById("btnNextMonth");
    const currentMonthYear = document.getElementById("currentMonthYear");
    const weekSlider = document.getElementById("weekSlider");
    const selectedDateLabel = document.getElementById("selectedDateLabel");
    const exercisesList = document.getElementById("exercisesList");

    // Estado do calendário
    let viewDate = new Date();
    let selectedDate = new Date();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Cache dos exercícios do dia selecionado (para enviar ao treino ativo)
    let exerciciosDoDia = [];

    async function renderCalendar() {
        currentMonthYear.textContent = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
        weekSlider.innerHTML = "";

        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);

            const pill = document.createElement("div");
            pill.className = "day-pill";

            if (
                d === selectedDate.getDate() &&
                viewDate.getMonth() === selectedDate.getMonth() &&
                viewDate.getFullYear() === selectedDate.getFullYear()
            ) {
                pill.classList.add("active");
                setTimeout(() => pill.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }), 100);
            }

            pill.innerHTML = `
				<span>${dayNames[cellDate.getDay()]}</span>
				<span>${d}</span>
			`;

            pill.addEventListener("click", () => {
                selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
                renderCalendar();
                renderExercisesForSelectedDate();
            });

            weekSlider.appendChild(pill);
        }
    }

    async function renderExercisesForSelectedDate() {
        const today = new Date();
        if (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        ) {
            selectedDateLabel.textContent = "Hoje";
        } else {
            selectedDateLabel.textContent = `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`;
        }

        exercisesList.innerHTML = '<p class="empty-msg">Carregando treinos... <i class="fa-solid fa-spinner fa-spin"></i></p>';
        exerciciosDoDia = [];

        // Limpa a área do botão/conclusão
        const btnArea = document.getElementById("startTrainingArea");
        if (btnArea) btnArea.innerHTML = "";

        try {
            const ano = selectedDate.getFullYear();
            const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const dia = String(selectedDate.getDate()).padStart(2, "0");
            const dateStr = `${ano}-${mes}-${dia}`;

            const response = await fetch(`/api/prescricoes/me?date=${dateStr}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Falha ao buscar treinos.");
            }

            const prescricoes = await response.json();
            exercisesList.innerHTML = "";

            if (!prescricoes || prescricoes.length === 0) {
                exercisesList.innerHTML = '<p class="empty-msg">Nenhum treino prescrito para este dia. Descanse! ✨</p>';
                return;
            }

            let temExercicios = false;
            let todosCompletos = true;

            prescricoes.forEach(presc => {
                const itensDoTreino = presc.exercises || [];

                if (itensDoTreino.length > 0) temExercicios = true;

                itensDoTreino.forEach(associacao => {
                    const ex = associacao.exercise;
                    const isCompleted = associacao.completed;

                    // A série e observação específica vêm da associação (prescrição)
                    const seriesReal = associacao.series || "3x15";
                    const obsReal = associacao.observation || ex.observation || "";

                    if (!isCompleted) todosCompletos = false;

                    // Salva no cache para o treino ativo
                    exerciciosDoDia.push({
                        prescriptionExerciseId: associacao.id,
                        id: ex.id,
                        name: ex.name,
                        series: seriesReal,
                        observation: obsReal,
                        howToExecute: associacao.howToExecute || ex.howToExecute,
                        restTime: associacao.restTime || ex.restTime || 60,
                        type: ex.type || "",
                        videoUrl: ex.videoUrl || "",
                        imageUrl: ex.imageUrl || "",
                        completed: isCompleted
                    });

                    const item = document.createElement("div");
                    item.className = "exercise-item";
                    if (isCompleted) item.classList.add("completed");

                    const isForte = ex.type && ex.type.toLowerCase().includes("fortalecimento");
                    const iconType = isForte ? '<i class="fa-solid fa-dumbbell"></i>' : '<i class="fa-solid fa-person-walking"></i>';

                    const htmlStatus = isCompleted
                        ? '<i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 20px;"></i>'
                        : '<i class="fa-solid fa-chevron-right"></i>';

                    item.innerHTML = `
                        <div class="exercise-icon">
                            ${iconType}
                        </div>
                        <div class="exercise-details">
                            <h4>${window.escapeHTML(ex.name)}</h4>
                            <p><i class="fa-solid fa-list-ol"></i> ${window.escapeHTML(seriesReal)} ${ex.type ? `• ${window.escapeHTML(ex.type)}` : ''}</p>
                        </div>
                        <div class="exercise-status">
                            ${htmlStatus}
                        </div>
                    `;

                    exercisesList.appendChild(item);

                    // Trigger para ver detalhes
                    item.addEventListener("click", () => {
                        window.openExerciseDetails({
                            name: ex.name,
                            series: seriesReal,
                            observation: obsReal,
                            instructions: associacao.howToExecute || ex.howToExecute || "Nenhuma instrução específica fornecida.",
                            videoUrl: ex.videoUrl || "",
                            imageUrl: ex.imageUrl || ""
                        });
                    });
                });
            });

            if (!temExercicios) {
                exercisesList.innerHTML = '<p class="empty-msg">Sua rotina hoje está vazia.</p>';
                return;
            }

            // Adiciona o botão "Iniciar Treinamento" abaixo da lista
            const naoCompletos = exerciciosDoDia.filter(e => !e.completed);
            if (naoCompletos.length > 0) {
                const btnArea = document.getElementById("startTrainingArea");
                if (btnArea) {
                    const btn = document.createElement("button");
                    btn.id = "btnIniciarTreino";
                    btn.className = "btn-start-training";
                    btn.innerHTML = '<i class="fa-solid fa-play"></i> INICIAR TREINAMENTO';
                    btn.addEventListener("click", () => {
                        // Passa a rotina inteira para o Active Training não perder o contexto das estatísticas
                        sessionStorage.setItem("treinoAtivo", JSON.stringify({
                            date: dateStr,
                            exercises: exerciciosDoDia
                        }));
                        window.location.href = "/paciente/treino/ativo";
                    });
                    btnArea.innerHTML = "";
                    btnArea.appendChild(btn);
                }

            } else {
                // Todos completos — mostra mensagem de parabéns
                const btnArea = document.getElementById("startTrainingArea");
                if (btnArea) {
                    btnArea.innerHTML = '<p class="completed-msg"><i class="fa-solid fa-medal" style="color: #f59e0b;"></i> Treino do dia concluído! </p>';
                }
            }

        } catch (error) {
            console.error(error);
            exercisesList.innerHTML = '<p class="empty-msg" style="color:#ef4444;">Erro de conexão com o servidor.</p>';
        }
    }

    // Listeners navegação
    btnPrevMonth.addEventListener("click", () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        renderCalendar();
        renderExercisesForSelectedDate();
    });

    btnNextMonth.addEventListener("click", () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        renderCalendar();
        renderExercisesForSelectedDate();
    });

    // Init principal
    renderCalendar();
    renderExercisesForSelectedDate();

    // ── Modal de Detalhes ─────────────────────────────────────────────
    window.openExerciseDetails = (ex) => {
        const modal = document.getElementById("exerciseDetailModal");
        const title = document.getElementById("exModalTitle");
        const series = document.getElementById("exModalSeries");
        const media = document.getElementById("exModalMedia");
        const instructions = document.getElementById("exModalInstructions");
        const obsContainer = document.getElementById("exModalObsContainer");
        const obsText = document.getElementById("exModalObservation");

        if (!modal) return;

        title.textContent = ex.name;
        series.textContent = ex.series;
        instructions.textContent = ex.instructions || "Nenhuma instrução específica.";

        if (ex.observation && ex.observation.trim() !== "") {
            obsContainer.style.display = "block";
            obsText.textContent = ex.observation;
        } else {
            obsContainer.style.display = "none";
        }

        // Tratar Mídia (Prioridade vídeo)
        media.innerHTML = "";
        if (ex.videoUrl) {
            let embedUrl = ex.videoUrl;
            if (embedUrl.includes("youtube.com/watch?v=")) {
                embedUrl = embedUrl.replace("watch?v=", "embed/");
            } else if (embedUrl.includes("youtu.be/")) {
                embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
            }
            media.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
        } else if (ex.imageUrl) {
            media.innerHTML = `<img src="${ex.imageUrl}" alt="${ex.name}" onerror="this.src='/images/ex-placeholder.png'">`;
        } else {
            media.innerHTML = `<div style="padding: 20px; color: #94a3b8; text-align: center;"><i class="fa-solid fa-image" style="font-size: 48px; display: block; margin-bottom: 10px;"></i> Sem prévia disponível</div>`;
        }

        modal.classList.add("active");
    };

    function closeExModal() {
        const modal = document.getElementById("exerciseDetailModal");
        if (modal) {
            modal.classList.remove("active");
            // Limpa o iframe para parar o vídeo
            setTimeout(() => {
                const media = document.getElementById("exModalMedia");
                if (media) media.innerHTML = "";
            }, 300);
        }
    }

    const closeBtn = document.getElementById("closeExModal");
    const exitBtn = document.getElementById("btnExitExModal");
    const overlay = document.getElementById("exerciseDetailModal");

    if (closeBtn) closeBtn.onclick = closeExModal;
    if (exitBtn) exitBtn.onclick = closeExModal;
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target === overlay) closeExModal();
        };
    }

    // Componentes Injetados
    renderBottomNav('treinamento');
});
