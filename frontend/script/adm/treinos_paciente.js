// treinos_paciente.js — Visualização e Edição Inteligente de Treinos (Admin)

document.addEventListener("DOMContentLoaded", () => {
    const raw = sessionStorage.getItem("pacienteSelecionado");
    let patientId = null;

    if (raw) {
        const paciente = JSON.parse(raw);
        patientId = paciente.id;

        const pageTitle = document.querySelector(".page-title");
        if (pageTitle && paciente.name) {
            const firstName = paciente.name.split(' ')[0].toUpperCase();
            pageTitle.textContent = `TREINOS DE ${firstName}`;
        }
    }

    if (!patientId) {
        if (window.showToast) window.showToast("error", "Nenhum paciente selecionado. Redirecionando...");
        setTimeout(() => window.location.href = "/admin", 2000);
        return;
    }

    // Função utilitária para prevenir XSS
    function escapeHTML(str) {
        if (!str) return "";
        return String(str).replace(/[&<>"']/g, m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[m]));
    }
    window.escapeHTML = escapeHTML;

    // ── Elementos da UI ──────────────────────────────────────────
    const btnPrevMonth = document.getElementById("btnPrevMonth");
    const btnNextMonth = document.getElementById("btnNextMonth");
    const monthLabel = document.getElementById("monthLabel");
    const yearLabel = document.getElementById("yearLabel");
    const daysGrid = document.getElementById("daysGrid");
    const selectedDateLabel = document.getElementById("selectedDateLabel");
    const exercisesList = document.getElementById("exercisesList");

    // ── Estado do calendário ─────────────────────────────────────
    let viewDate = new Date();
    let selectedDate = new Date();

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    let completedDates = [];
    let assignedDates = [];
    let monthlyPrescriptionsCache = [];
    let allExercisesCache = []; // Cache do catálogo de exercícios

    // ── Estado do modal de substituição ──────────────────────────
    let replaceMode = null; // 'delete' ou 'replace'
    let currentOccurrences = [];
    let selectedNewExerciseId = null;
    let currentExerciseId = null;

    // ── Carregamento de Dados ────────────────────────────────────
    async function loadMonthlyPrescriptions() {
        try {
            const ano = viewDate.getFullYear();
            const mes = viewDate.getMonth() + 1;

            const res = await fetch(`/api/prescricoes/admin/${patientId}?month=${mes}&year=${ano}`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar treinos do paciente.");

            monthlyPrescriptionsCache = await res.json();

            completedDates = [];
            assignedDates = [];

            monthlyPrescriptionsCache.forEach(p => {
                const dayStr = p.assignedDay ? p.assignedDay.split("T")[0] : null;
                if (!dayStr || !p.exercises || p.exercises.length === 0) return;

                let todosConcluidos = true;
                p.exercises.forEach(pe => {
                    if (!pe.completed) todosConcluidos = false;
                });

                if (todosConcluidos) {
                    if (!completedDates.includes(dayStr)) completedDates.push(dayStr);
                } else {
                    if (!assignedDates.includes(dayStr)) assignedDates.push(dayStr);
                }
            });
        } catch (error) {
            console.error("Erro ao carregar dados mensais:", error);
            if (window.showToast) window.showToast("error", "Erro ao carregar treinos: " + error.message);
        }
    }

    async function loadAllExercises() {
        const searchInput = document.getElementById("replaceSearchInput");
        if (searchInput) searchInput.placeholder = "Carregando catálogo...";
        
        try {
            const res = await fetch(`/api/exercicios`, { credentials: "include" });
            if (res.ok) {
                allExercisesCache = await res.json();
                if (searchInput) searchInput.placeholder = "Buscar exercício...";
                console.log("Catálogo carregado:", allExercisesCache.length, "exercícios");
            }
        } catch (e) {
            console.error("Erro ao carregar catálogo de exercícios:", e);
            if (searchInput) searchInput.placeholder = "Erro ao carregar catálogo";
        }
    }

    // ── Calendário ───────────────────────────────────────────────
    function renderCalendar() {
        monthLabel.textContent = monthNames[viewDate.getMonth()];
        yearLabel.textContent = viewDate.getFullYear();
        daysGrid.innerHTML = "";

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "day-cell empty";
            daysGrid.appendChild(emptyCell);
        }

        const today = new Date();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

            const cell = document.createElement("div");
            cell.className = "day-cell";
            cell.textContent = d;

            if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                cell.classList.add("today");
            }

            if (completedDates.includes(dateStr)) {
                cell.classList.add("completed");
            } else if (assignedDates.includes(dateStr)) {
                cell.classList.add("has-exercise");
            }

            if (d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
                cell.classList.add("selected");
            }

            cell.addEventListener("click", () => {
                selectedDate = new Date(year, month, d);
                renderCalendar();
                if (completedDates.includes(dateStr) || assignedDates.includes(dateStr)) {
                    renderExercisesForSelectedDate();
                    document.getElementById('dailyExercisesModal').style.display = 'flex';
                } else {
                    window.showToast("error", "Não há treinos cadastrados nesta data.");
                }
            });

            daysGrid.appendChild(cell);
        }
    }

    // ── Lista de Exercícios do Dia ───────────────────────────────
    function renderExercisesForSelectedDate() {
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

        const ano = selectedDate.getFullYear();
        const mes = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const dia = String(selectedDate.getDate()).padStart(2, "0");
        const selectedDateStr = `${ano}-${mes}-${dia}`;

        const dailyPrescriptions = monthlyPrescriptionsCache.filter(p => p.assignedDay.startsWith(selectedDateStr));

        exercisesList.innerHTML = "";

        if (dailyPrescriptions.length === 0) {
            exercisesList.innerHTML = '<p class="empty-msg">Nenhum treino prescrito para este dia.</p>';
            return;
        }

        let temExercicios = false;

        dailyPrescriptions.forEach(presc => {
            const itensDoTreino = presc.exercises || [];
            if (itensDoTreino.length > 0) temExercicios = true;

            itensDoTreino.forEach(associacao => {
                const ex = associacao.exercise;
                const isCompleted = associacao.completed;
                const prescExId = associacao.id; // PrescriptionExercise ID
                const exId = ex.id;

                const seriesReal = associacao.series || "3x15";
                const obsReal = associacao.observation || ex.observation || "";

                const item = document.createElement("div");
                item.className = "exercise-item";
                if (isCompleted) item.classList.add("completed");

                const isForte = ex.type && ex.type.toLowerCase().includes("fortalecimento");
                let mediaHtml = "";

                if (ex.imageUrl) {
                    const finalImg = (ex.imageUrl.startsWith('http') || ex.imageUrl.startsWith('/')) ? ex.imageUrl : '/' + ex.imageUrl;
                    mediaHtml = `<img src="${finalImg}" alt="${ex.name}" class="ex-thumb" onerror="this.src='/images/ex-placeholder.png'; this.classList.add('broken-img');">`;
                } else {
                    mediaHtml = isForte ? '<i class="fa-solid fa-dumbbell"></i>' : '<i class="fa-solid fa-person-walking"></i>';
                }

                const htmlStatus = isCompleted
                    ? '<i class="fa-solid fa-circle-check" style="color: #10b981; font-size: 20px;" title="Concluído"></i>'
                    : '<i class="fa-solid fa-clock" style="color: #94a3b8; font-size: 20px;" title="Pendente"></i>';

                // Botões de ação (apenas para exercícios não concluídos)
                const actionButtons = !isCompleted ? `
                    <div class="exercise-actions">
                        <button class="btn-ex-replace" title="Substituir" data-ex-id="${exId}" data-pe-id="${prescExId}">
                            <i class="fa-solid fa-arrow-right-arrow-left"></i>
                        </button>
                        <button class="btn-ex-delete" title="Excluir" data-ex-id="${exId}" data-pe-id="${prescExId}">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                ` : '';

                item.innerHTML = `
                    <div class="exercise-icon ${ex.imageUrl ? 'has-img' : ''}">
                        ${mediaHtml}
                    </div>
                    <div class="exercise-details">
                        <h4>${window.escapeHTML(ex.name)}</h4>
                        <p><i class="fa-solid fa-list-ol"></i> ${window.escapeHTML(seriesReal)} ${ex.type ? `• ${window.escapeHTML(ex.type)}` : ''}</p>
                    </div>
                    <div class="exercise-status">
                        ${htmlStatus}
                    </div>
                    ${actionButtons}
                `;

                exercisesList.appendChild(item);

                // Clique no card para ver detalhes
                item.querySelector('.exercise-details').addEventListener("click", () => {
                    window.openExerciseDetails({
                        name: ex.name,
                        series: seriesReal,
                        observation: obsReal,
                        instructions: associacao.howToExecute || ex.howToExecute || "Nenhuma instrução específica fornecida.",
                        videoUrl: ex.videoUrl || "",
                        imageUrl: ex.imageUrl || ""
                    });
                });

                // Bind botões de ação
                const replaceBtn = item.querySelector('.btn-ex-replace');
                const deleteBtn = item.querySelector('.btn-ex-delete');

                if (replaceBtn) {
                    replaceBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openSmartModal('replace', exId, ex.name, prescExId);
                    });
                }
                if (deleteBtn) {
                    deleteBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openSmartModal('delete', exId, ex.name, prescExId);
                    });
                }
            });
        });

        if (!temExercicios) {
            exercisesList.innerHTML = '<p class="empty-msg">Este dia não possui exercícios ativos registrados.</p>';
        }
    }

    // ── Modal Inteligente (Substituição / Exclusão) ──────────────
    async function openSmartModal(mode, exerciseId, exerciseName, currentPrescExId) {
        replaceMode = mode;
        currentExerciseId = exerciseId;
        selectedNewExerciseId = null;

        const modal = document.getElementById("replaceModal");
        const title = document.getElementById("replaceModalTitle");
        const subtitle = document.getElementById("replaceModalSubtitle");
        const searchSection = document.getElementById("replaceSearchSection");
        const occList = document.getElementById("occurrencesList");
        const confirmBtn = document.getElementById("btnConfirmAction");
        const searchInput = document.getElementById("replaceSearchInput");
        const searchResults = document.getElementById("replaceSearchResults");

        if (mode === 'replace') {
            title.textContent = 'SUBSTITUIR EXERCÍCIO';
            subtitle.innerHTML = `<strong>"${exerciseName}"</strong> — selecione os dias afetados:`;
            searchSection.style.display = "block";
            confirmBtn.innerHTML = '<i class="fa-solid fa-arrow-right-arrow-left"></i> Substituir';
        } else {
            title.textContent = 'EXCLUIR EXERCÍCIO';
            subtitle.innerHTML = `<strong>"${exerciseName}"</strong> — selecione os dias em que deseja remover:`;
            searchSection.style.display = "none";
            confirmBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i> Excluir';
        }

        confirmBtn.disabled = true;
        searchInput.value = "";
        searchResults.innerHTML = "";
        occList.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:15px;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando dias...</p>';

        modal.classList.add("active");

        if (mode === 'replace') {
            renderSearchResults(""); // Mostra lista inicial ao abrir
        }

        // Busca todas as ocorrências pendentes desse exercício
        try {
            const res = await fetch(`/api/prescricoes/admin/occurrences/${patientId}/${exerciseId}`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar ocorrências");
            currentOccurrences = await res.json();
        } catch (e) {
            console.error("Erro ao buscar ocorrências:", e);
            currentOccurrences = [];
        }

        occList.innerHTML = "";

        if (currentOccurrences.length === 0) {
            occList.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:10px;">Nenhuma ocorrência pendente encontrada.</p>';
            document.getElementById("selectAllRow").style.display = "none";
        } else {
            document.getElementById("selectAllRow").style.display = "flex";
            document.getElementById("selectAllCheckbox").checked = false;

            currentOccurrences.forEach((occ, i) => {
                const dayObj = new Date(occ.assignedDay);
                const dayNum = dayObj.getUTCDate();
                const monthNum = dayObj.getUTCMonth();
                const yearNum = dayObj.getUTCFullYear();
                const dateLabel = `${dayNum} de ${monthNames[monthNum]}, ${yearNum}`;

                const occItem = document.createElement("div");
                occItem.className = "occ-item";

                // Pré-selecionar a ocorrência do dia que o admin clicou
                const isCurrentDay = occ.prescriptionExerciseId === currentPrescExId;

                occItem.innerHTML = `
                    <input type="checkbox" class="occ-checkbox" data-pe-id="${occ.prescriptionExerciseId}" ${isCurrentDay ? 'checked' : ''}>
                    <span class="occ-date">${dateLabel}</span>
                    <span style="color:#94a3b8;font-size:12px;margin-left:auto;">${occ.series}</span>
                `;

                occItem.addEventListener("click", (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        const cb = occItem.querySelector('.occ-checkbox');
                        cb.checked = !cb.checked;
                    }
                    updateConfirmBtn();
                });

                occList.appendChild(occItem);
            });
        }

        updateConfirmBtn();
    }

    // Select All
    const selectAllCb = document.getElementById("selectAllCheckbox");
    if (selectAllCb) {
        selectAllCb.addEventListener("change", () => {
            const allCbs = document.querySelectorAll("#occurrencesList .occ-checkbox");
            allCbs.forEach(cb => cb.checked = selectAllCb.checked);
            updateConfirmBtn();
        });
    }

    function updateConfirmBtn() {
        const confirmBtn = document.getElementById("btnConfirmAction");
        const selectedCbs = document.querySelectorAll("#occurrencesList .occ-checkbox:checked");

        if (replaceMode === 'replace') {
            confirmBtn.disabled = selectedCbs.length === 0 || !selectedNewExerciseId;
        } else {
            confirmBtn.disabled = selectedCbs.length === 0;
        }
    }

    // ── Busca de Exercícios para Substituição ────────────────────
    const replaceSearchInput = document.getElementById("replaceSearchInput");
    const replaceSearchResults = document.getElementById("replaceSearchResults");

    function renderSearchResults(query = "") {
        const q = query.trim().toLowerCase();
        replaceSearchResults.innerHTML = "";

        // Mostra todos os exercícios do catálogo ou filtrados
        const filtered = q === "" 
            ? allExercisesCache
            : allExercisesCache.filter(ex => 
                ex.id !== currentExerciseId && 
                ex.name.toLowerCase().includes(q)
              );

        if (filtered.length === 0) {
            replaceSearchResults.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:10px;">${q === "" ? "Nenhum exercício cadastrado." : "Nenhum exercício encontrado."}</p>`;
            return;
        }

        filtered.forEach(ex => {
            const item = document.createElement("div");
            item.className = "search-result-item";
            if (ex.id === selectedNewExerciseId) item.classList.add("selected");

            const isForte = ex.type && ex.type.toLowerCase().includes("fortalecimento");
            let mediaHtml = "";
            
            if (ex.imageUrl) {
                const finalImg = (ex.imageUrl.startsWith('http') || ex.imageUrl.startsWith('/')) ? ex.imageUrl : '/' + ex.imageUrl;
                mediaHtml = `<img src="${finalImg}" alt="${ex.name}" class="search-ex-thumb" onerror="this.parentElement.innerHTML='<i class=\'fa-solid fa-image\'></i>'">`;
            } else {
                mediaHtml = isForte ? '<i class="fa-solid fa-dumbbell" style="color:#3b82f6;"></i>' : '<i class="fa-solid fa-person-walking" style="color:#22c55e;"></i>';
            }

            item.innerHTML = `
                <div class="search-result-img">
                    ${mediaHtml}
                </div>
                <span>${window.escapeHTML(ex.name)}</span> 
                <span style="color:#94a3b8;font-size:11px;margin-left:auto;">${window.escapeHTML(ex.type || '')}</span>
            `;

            item.addEventListener("click", () => {
                selectedNewExerciseId = ex.id;
                document.querySelectorAll("#replaceSearchResults .search-result-item").forEach(el => el.classList.remove("selected"));
                item.classList.add("selected");
                updateConfirmBtn();
            });

            replaceSearchResults.appendChild(item);
        });
    }

    if (replaceSearchInput) {
        replaceSearchInput.addEventListener("input", (e) => renderSearchResults(e.target.value));
        replaceSearchInput.addEventListener("focus", (e) => renderSearchResults(e.target.value));
    }

    // ── Confirmar Ação ───────────────────────────────────────────
    const confirmBtn = document.getElementById("btnConfirmAction");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            const selectedIds = [];
            document.querySelectorAll("#occurrencesList .occ-checkbox:checked").forEach(cb => {
                selectedIds.push(cb.dataset.peId);
            });

            if (selectedIds.length === 0) return;

            confirmBtn.disabled = true;
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';

            try {
                if (replaceMode === 'delete') {
                    const res = await fetch('/api/prescricoes/admin/bulk-delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ prescriptionExerciseIds: selectedIds })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.erro);
                    window.showToast("success", data.mensagem);
                } else {
                    if (!selectedNewExerciseId) return;
                    const res = await fetch('/api/prescricoes/admin/bulk-replace', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            prescriptionExerciseIds: selectedIds,
                            newExerciseId: selectedNewExerciseId
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.erro);
                    window.showToast("success", data.mensagem);
                }

                // Fecha modais e recarrega
                closeReplaceModal();
                document.getElementById('dailyExercisesModal').style.display = 'none';
                await refreshView();

            } catch (error) {
                console.error("Erro na ação:", error);
                window.showToast("error", error.message || "Erro ao processar ação.");
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalText;
            }
        });
    }

    // ── Fechar Modal de Substituição ─────────────────────────────
    window.closeReplaceModal = () => {
        const modal = document.getElementById("replaceModal");
        modal.classList.remove("active");
        replaceMode = null;
        currentOccurrences = [];
        selectedNewExerciseId = null;
        currentExerciseId = null;
    };

    // Fechar ao clicar no overlay
    const replaceModalOverlay = document.getElementById("replaceModal");
    if (replaceModalOverlay) {
        replaceModalOverlay.addEventListener("click", (e) => {
            if (e.target === replaceModalOverlay) closeReplaceModal();
        });
    }

    // ── Navegação ────────────────────────────────────────────────
    btnPrevMonth.addEventListener("click", async () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        await refreshView();
    });

    btnNextMonth.addEventListener("click", async () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        await refreshView();
    });

    async function refreshView() {
        await loadMonthlyPrescriptions();
        renderCalendar();
    }

    // ── Init ─────────────────────────────────────────────────────
    loadAllExercises();
    refreshView();

    // ── Modal de Detalhes do Exercício ───────────────────────────
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

        media.innerHTML = "";
        if (ex.videoUrl) {
            let embedUrl = ex.videoUrl;
            if (embedUrl.includes("youtube.com/watch?v=")) embedUrl = embedUrl.replace("watch?v=", "embed/");
            else if (embedUrl.includes("youtu.be/")) embedUrl = embedUrl.replace("youtu.be/", "youtube.com/embed/");
            media.innerHTML = `<iframe src="${embedUrl}" allowfullscreen></iframe>`;
        } else if (ex.imageUrl) {
            const finalImg = (ex.imageUrl.startsWith('http') || ex.imageUrl.startsWith('/')) ? ex.imageUrl : '/' + ex.imageUrl;
            media.innerHTML = `<img src="${finalImg}" alt="${ex.name}" onerror="this.src='/images/ex-placeholder.png'">`;
        } else {
            media.innerHTML = `<div style="padding: 20px; color: #94a3b8; text-align: center;"><i class="fa-solid fa-image" style="font-size: 48px; display: block; margin-bottom: 10px;"></i> Sem prévia disponível</div>`;
        }

        modal.classList.add("active");
    };

    function closeExModal() {
        const modal = document.getElementById("exerciseDetailModal");
        if (modal) {
            modal.classList.remove("active");
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
});
