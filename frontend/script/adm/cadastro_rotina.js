document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.getElementById("btn-cadastrar");
    const exercisesList = document.getElementById("exercisesList");

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
                exercisesList.innerHTML = '<div class="empty-exercises">Nenhum exercício cadastrado ainda.<br><a href="/pages/adm/cadastro_exercicio.html" style="color:#5b8af5;">Cadastrar um agora</a></div>';
                return;
            }

            exerciciosObj.forEach(ex => {
                const container = document.createElement("div");
                container.className = "exercise-container";

                const label = document.createElement("label");
                label.className = "exercise-item";

                label.innerHTML = `
                    <input type="checkbox" class="ex-checkbox" value="${ex.id}" />
                    <div class="exercise-info">
                        <span class="exercise-name">${ex.name}</span>
                        <span class="exercise-category">${ex.type}</span>
                    </div>
                `;

                const detailsDiv = document.createElement("div");
                detailsDiv.className = "exercise-details-inputs";
                detailsDiv.style.display = "none";

                detailsDiv.innerHTML = `
                    <div class="form-group" style="margin-bottom: 8px; display: flex; gap: 8px;">
                        <input type="text" class="input-series" placeholder="Séries (ex: 3x15)" value="3x15" style="flex: 1;" />
                        <input type="number" class="input-rest" placeholder="Descanso (s)" value="60" style="flex: 1;" />
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <input type="text" class="input-obs" placeholder="Observação específica (opcional)" value="${ex.observation || ''}" style="width: 100%;" />
                    </div>
                `;

                label.querySelector(".ex-checkbox").addEventListener("change", (e) => {
                    detailsDiv.style.display = e.target.checked ? "block" : "none";
                });

                container.appendChild(label);
                container.appendChild(detailsDiv);
                exercisesList.appendChild(container);
            });
        } catch (error) {
            console.error("Erro:", error);
            exercisesList.innerHTML = '<div class="empty-exercises" style="color:#ef4444;">Erro ao carregar exercícios.</div>';
        }
    }

    loadExercises();

    btnCadastrar.addEventListener("click", (e) => {
        e.preventDefault();

        const nomeVal = document.getElementById("nome").value.trim();
        const descricaoVal = document.getElementById("descricao").value.trim();

        // Coletar exercícios selecionados e seus detalhes
        const selectedExercises = [];
        const containers = document.querySelectorAll(".exercise-container");

        containers.forEach(container => {
            const cb = container.querySelector(".ex-checkbox");
            if (cb && cb.checked) {
                const series = container.querySelector(".input-series").value.trim() || "3x15";
                const restTime = parseInt(container.querySelector(".input-rest").value.trim()) || 60;
                const obs = container.querySelector(".input-obs").value.trim();
                selectedExercises.push({
                    id: cb.value,
                    series: series,
                    observation: obs || null,
                    restTime: restTime
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
                    window.location.href = "/pages/adm/home_adm.html";
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
    window.history.back();
}
