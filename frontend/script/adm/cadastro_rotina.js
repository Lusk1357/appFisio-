document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.getElementById("btn-cadastrar");
    const exercisesList = document.getElementById("exercisesList");

    function getShowToast() {
        return typeof showToast === "function" ? showToast : () => {};
    }

    // Carregar os exercícios da API
    async function loadExercises() {
        exercisesList.innerHTML = '<div class="empty-exercises">Carregando exercícios...</div>';

        try {
            const response = await fetch("/api/exercicios", {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Erro ao buscar exercícios.");

            const exerciciosObj = await response.json();
            exercisesList.innerHTML = "";

            if (exerciciosObj.length === 0) {
                exercisesList.innerHTML = '<div class="empty-exercises">Nenhum exercício cadastrado ainda.<br><a href="/admin/exercicios/novo" style="color:#5b8af5;">Cadastrar um agora</a></div>';
                return;
            }

            exerciciosObj.forEach(ex => {
                const container = document.createElement("div");
                container.className = "exercise-container";

                const label = document.createElement("label");
                label.className = "exercise-item";

                const finalImg = ex.imageUrl 
                    ? ((ex.imageUrl.startsWith('http') || ex.imageUrl.startsWith('/')) ? ex.imageUrl : '/' + ex.imageUrl) 
                    : null;

                label.innerHTML = `
                    <input type="checkbox" class="ex-checkbox" value="${ex.id}" />
                    ${finalImg 
                        ? `<img src="${finalImg}" class="exercise-thumb" alt="${escapeHTML(ex.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
                        : ''
                    }
                    <div class="exercise-thumb-placeholder" style="${finalImg ? 'display:none;' : 'display:flex;'}">
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
                        <input type="text" class="input-obs" placeholder="Observação no app (Ex: 30s de intervalo)" value="${escapeHTML(ex.observation || '')}" style="width: 100%;" />
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

            // Extrair categorias únicas e renderizar chips
            renderCategoryFilters(exerciciosObj);

            // Setup listeners de busca e filtro
            setupFilters();

        } catch (error) {
            console.error("Erro:", error);
            exercisesList.innerHTML = '<div class="empty-exercises" style="color:#ef4444;">Erro ao carregar exercícios.</div>';
        }
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

                if (matchesSearch && matchesCategory) {
                    container.classList.remove("hidden");
                } else {
                    container.classList.add("hidden");
                }
            });

            // Mensagem de "Nenhum resultado"
            let noResultsMsg = document.getElementById("noFilterResults");
            const anyVisible = Array.from(containers).some(c => !c.classList.contains("hidden"));
            
            if (!anyVisible) {
                if (!noResultsMsg) {
                    noResultsMsg = document.createElement("div");
                    noResultsMsg.id = "noFilterResults";
                    noResultsMsg.className = "empty-exercises";
                    noResultsMsg.textContent = "Nenhum exercício encontrado com esse filtro.";
                    exercisesList.appendChild(noResultsMsg);
                }
                noResultsMsg.style.display = "block";
            } else if (noResultsMsg) {
                noResultsMsg.style.display = "none";
            }
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

    loadExercises();

    const form = document.querySelector("form");
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nomeVal = document.getElementById("nome").value.trim();
        const descricaoVal = document.getElementById("descricao").value.trim();

        // Coletar exercícios selecionados e seus detalhes
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

        // Enviar os dados para o Backend
        const rotinaPayload = {
            nome: nomeVal,
            descricao: descricaoVal,
            lista_exercicios_ids: selectedExercises
        };

        const origBtnText = btnCadastrar.innerHTML;
        btnCadastrar.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...`;
        btnCadastrar.style.pointerEvents = "none";

        fetch("/api/rotinas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include", // Garante envio dos cookies de autenticação
            body: JSON.stringify(rotinaPayload)
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.erro || "Erro na API");

                showToast("success", "Rotina criada com sucesso!");

                setTimeout(() => {
                    window.location.href = "/admin/rotinas";
                }, 1500);
            })
            .catch(err => {
                console.error("Erro ao salvar:", err);
                showToast("error", err.message || "Falha ao salvar a rotina no servidor.");
                btnCadastrar.innerHTML = origBtnText;
                btnCadastrar.style.pointerEvents = "auto";
            });
    });
});

function back() {
    window.location.href = "/admin/rotinas";
}
