document.addEventListener("DOMContentLoaded", () => {
    const btnSalvar = document.getElementById("btn-salvar");
    const exercisesList = document.getElementById("exercisesList");
    const urlParams = new URLSearchParams(window.location.search);
    const routineId = urlParams.get("id");

    if (!routineId) {
        alert("ID da rotina não fornecido.");
        window.history.back();
        return;
    }

    let routineData = null;
    let catalogExercises = [];

    function getShowToast() {
        return typeof showToast === "function" ? showToast : () => {};
    }

    async function init() {
        await Promise.all([loadExercises(), fetchRoutine()]);
        preFillForm();
    }

    // Carregar os exercícios do catálogo
    async function loadExercises() {
        try {
            const response = await fetch("/api/exercicios", { credentials: "include" });
            if (!response.ok) throw new Error("Erro ao buscar exercícios.");
            catalogExercises = await response.json();
            renderExercises(catalogExercises);
            renderCategoryFilters(catalogExercises);
            setupFilters();
        } catch (error) {
            console.error("Erro:", error);
            exercisesList.innerHTML = '<div class="empty-exercises" style="color:#ef4444;">Erro ao carregar catálogo.</div>';
        }
    }

    // Buscar os dados da rotina
    async function fetchRoutine() {
        try {
            const response = await fetch(`/api/rotinas/${routineId}`, { credentials: "include" });
            if (!response.ok) throw new Error("Erro ao buscar dados da rotina.");
            routineData = await response.json();
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar dados da rotina.");
            window.history.back();
        }
    }

    function renderExercises(exercises) {
        exercisesList.innerHTML = "";
        exercises.forEach(ex => {
            const container = document.createElement("div");
            container.className = "exercise-container";
            container.dataset.id = ex.id;

            const label = document.createElement("label");
            label.className = "exercise-item";

            label.innerHTML = `
                <input type="checkbox" class="ex-checkbox" value="${ex.id}" />
                ${ex.imageUrl 
                    ? `<img src="${ex.imageUrl}" class="exercise-thumb" alt="${escapeHTML(ex.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                    : ''
                }
                <div class="exercise-thumb-placeholder" style="${ex.imageUrl ? 'display:none;' : 'display:flex;'}">
                    <i class="fa-solid fa-dumbbell"></i>
                </div>
                <div class="exercise-info">
                    <span class="exercise-name">${escapeHTML(ex.name)}</span>
                    <span class="exercise-category">${escapeHTML(ex.type)}</span>
                </div>
            `;

            const detailsDiv = document.createElement("div");
            detailsDiv.className = "exercise-details-inputs";
            detailsDiv.style.display = "none";

            detailsDiv.innerHTML = `
                <div class="form-group" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <span style="font-size: 9px; color: #94a3b8; font-weight: 800;">SÉRIES</span>
                        <input type="number" class="input-series-qty" placeholder="3" value="3" min="1" style="width: 100%; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; text-align: center; color: #0f172a; outline: none;" title="Séries" />
                    </div>
                    <div style="font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #cbd5e1; padding-top: 10px;">X</div>
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <span style="font-size: 9px; color: #94a3b8; font-weight: 800;">REPS</span>
                        <input type="number" class="input-reps-qty" placeholder="15" value="15" min="1" style="width: 100%; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; text-align: center; color: #0f172a; outline: none;" title="Repetições" />
                    </div>
                    <div style="width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; margin-top: 10px;"></div>
                    <div style="flex: 1.2; display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <span style="font-size: 9px; color: #94a3b8; font-weight: 800;">DESCANSO (S)</span>
                        <input type="number" class="input-rest" placeholder="60" value="60" min="0" style="width: 100%; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; text-align: center; color: #0f172a; outline: none;" title="Descanso em segundos" />
                    </div>
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <input type="text" class="input-obs" placeholder="Observação no app" value="${escapeHTML(ex.observation || '')}" style="width: 100%;" />
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                    <textarea class="input-how-to" placeholder="Instruções de execução (Opcional)" style="width: 100%; border-radius: 12px; border: 1px solid #e2e8f0; padding: 10px; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; resize: vertical; min-height: 60px;">${escapeHTML(ex.howToExecute || '')}</textarea>
                </div>
            `;

            label.querySelector(".ex-checkbox").addEventListener("change", (e) => {
                detailsDiv.style.display = e.target.checked ? "block" : "none";
            });

            container.appendChild(label);
            container.appendChild(detailsDiv);
            exercisesList.appendChild(container);
        });
    }

    function preFillForm() {
        if (!routineData) return;
        document.getElementById("nome").value = routineData.name || "";
        document.getElementById("descricao").value = routineData.description || "";

        routineData.exercises.forEach(re => {
            const container = document.querySelector(`.exercise-container[data-id="${re.exerciseId}"]`);
            if (container) {
                const cb = container.querySelector(".ex-checkbox");
                cb.checked = true;
                container.querySelector(".exercise-details-inputs").style.display = "block";

                // Parse series (3x15)
                if (re.series && re.series.includes('x')) {
                    const [s, r] = re.series.split('x');
                    container.querySelector(".input-series-qty").value = s;
                    container.querySelector(".input-reps-qty").value = r;
                }

                container.querySelector(".input-rest").value = re.restTime;
                container.querySelector(".input-obs").value = re.observation || "";
                container.querySelector(".input-how-to").value = re.howToExecute || "";
            }
        });
    }

    function renderCategoryFilters(exercises) {
        const filtersContainer = document.getElementById("categoryFilters");
        const categories = [...new Set(exercises.map(ex => ex.type).filter(Boolean))].sort();
        categories.forEach(cat => {
            const chip = document.createElement("span");
            chip.className = "category-chip";
            chip.dataset.category = cat;
            chip.textContent = cat;
            filtersContainer.appendChild(chip);
        });
    }

    function setupFilters() {
        const searchInput = document.getElementById("searchExercise");
        const chips = document.querySelectorAll(".category-chip");
        let activeCategory = "all";

        function apply() {
            const term = searchInput.value.toLowerCase().trim();
            const containers = document.querySelectorAll(".exercise-container");
            containers.forEach(container => {
                const name = container.querySelector(".exercise-name").textContent.toLowerCase();
                const category = container.querySelector(".exercise-category").textContent;
                const matchesSearch = name.includes(term);
                const matchesCategory = activeCategory === "all" || category === activeCategory;
                container.classList.toggle("hidden", !(matchesSearch && matchesCategory));
            });
        }

        searchInput.addEventListener("input", apply);
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                chips.forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                activeCategory = chip.dataset.category;
                apply();
            });
        });
    }

    const form = document.getElementById("editRoutineForm");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nomeVal = document.getElementById("nome").value.trim();
        const descricaoVal = document.getElementById("descricao").value.trim();
        const selectedExercises = [];
        const containers = document.querySelectorAll(".exercise-container");

        containers.forEach(container => {
            const cb = container.querySelector(".ex-checkbox");
            if (cb && cb.checked) {
                const sQty = container.querySelector(".input-series-qty").value.trim();
                const rQty = container.querySelector(".input-reps-qty").value.trim();
                const series = (sQty && rQty) ? `${sQty}x${rQty}` : "3x15";
                const restTime = parseInt(container.querySelector(".input-rest").value.trim()) || 60;
                const obs = container.querySelector(".input-obs").value.trim();
                const howTo = container.querySelector(".input-how-to").value.trim();

                selectedExercises.push({
                    id: cb.value,
                    series: series,
                    observation: obs || null,
                    restTime: restTime,
                    howToExecute: howTo || null
                });
            }
        });

        if (!nomeVal) {
            showToast("error", "Preencha o nome da rotina.");
            return;
        }
        if (selectedExercises.length === 0) {
            showToast("error", "Selecione pelo menos um exercício.");
            return;
        }

        const rotinaPayload = {
            nome: nomeVal,
            descricao: descricaoVal,
            lista_exercicios_ids: selectedExercises
        };

        const origBtnText = btnSalvar.innerHTML;
        btnSalvar.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...`;
        btnSalvar.style.pointerEvents = "none";

        try {
            const res = await fetch(`/api/rotinas/${routineId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(rotinaPayload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.erro || "Erro na API");

            showToast("success", "Rotina atualizada com sucesso!");
            setTimeout(() => {
                window.location.href = "/admin/rotinas";
            }, 1500);
        } catch (err) {
            console.error(err);
            showToast("error", err.message || "Falha ao salvar a rotina.");
            btnSalvar.innerHTML = origBtnText;
            btnSalvar.style.pointerEvents = "auto";
        }
    });

    init();
});

function back() {
    window.location.href = "/admin/rotinas";
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, f => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[f]));
}
