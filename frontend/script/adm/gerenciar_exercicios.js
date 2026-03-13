/* ==============================
   gerenciar_exercicios.js
   ============================== */

(function () {
    let allExercicios = [];
    let currentSort = "az";
    let deleteTargetId = null;

    // ── Elementos ──────────────────────────────────────────────
    const list = document.getElementById("exercisesList");
    const emptyState = document.getElementById("emptyState");
    const searchInput = document.getElementById("searchInput");
    const filterPills = document.querySelectorAll("#filterPills .pill");

    // Modal de edição
    const editModal = document.getElementById("editModal");
    const closeEditModal = document.getElementById("closeEditModal");
    const editForm = document.getElementById("editForm");
    const editId = document.getElementById("editId");
    const editNome = document.getElementById("editNome");
    const editCategoria = document.getElementById("editCategoria");
    const editObservacao = document.getElementById("editObservacao");
    const editVideoLink = document.getElementById("editVideoLink");
    const btnSaveEdit = document.getElementById("btnSaveEdit");

    // Modal de exclusão
    const deleteModal = document.getElementById("deleteModal");
    const deleteMsg = document.getElementById("deleteMsg");
    const cancelDelete = document.getElementById("cancelDelete");
    const confirmDelete = document.getElementById("confirmDelete");

    // ── Toast ──────────────────────────────────────────────────
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
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ── Fetch exercícios ──────────────────────────────────────
    async function fetchExercicios() {
        try {
            const res = await fetch("/api/exercicios", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Falha ao carregar exercícios.");
            allExercicios = await res.json();
            renderList();
        } catch (error) {
            console.error(error);
            list.innerHTML = '<p class="empty-msg">Erro ao carregar exercícios.</p>';
        }
    }

    // ── Ordenação ─────────────────────────────────────────────
    function sortExercicios(arr, mode) {
        const sorted = [...arr];
        switch (mode) {
            case "az":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
                break;
            case "za":
                sorted.sort((a, b) => (b.name || "").localeCompare(a.name || "", "pt-BR"));
                break;
            case "type":
                sorted.sort((a, b) => (a.type || "").localeCompare(b.type || "", "pt-BR"));
                break;
        }
        return sorted;
    }

    // ── Render ────────────────────────────────────────────────
    function renderList() {
        const query = (searchInput.value || "").trim().toLowerCase();
        let filtered = allExercicios;

        if (query) {
            filtered = allExercicios.filter(ex =>
                (ex.name || "").toLowerCase().includes(query) ||
                (ex.type || "").toLowerCase().includes(query)
            );
        }

        const sorted = sortExercicios(filtered, currentSort);

        list.innerHTML = "";

        if (sorted.length === 0) {
            emptyState.style.display = "flex";
            return;
        }

        emptyState.style.display = "none";

        sorted.forEach((ex, index) => {
            const card = document.createElement("div");
            card.className = "exercise-card";
            card.style.animationDelay = `${index * 0.04}s`;

            const isForte = ex.type && ex.type.toLowerCase().includes("fortalecimento");
            const typeIcon = isForte
                ? '<i class="fa-solid fa-dumbbell"></i>'
                : '<i class="fa-solid fa-person-walking"></i>';

            const typeColor = isForte ? "#3b82f6" : "#10b981";

            card.innerHTML = `
                <div class="card-left">
                    <div class="card-icon-circle" style="background: ${typeColor}15; color: ${typeColor};">
                        ${typeIcon}
                    </div>
                    <div class="card-info">
                        <h3 class="card-name">${ex.name}</h3>
                        <span class="card-type">${ex.type || "Sem categoria"}</span>
                        ${ex.observation ? `<span class="card-obs"><i class="fa-solid fa-comment-dots"></i> ${ex.observation}</span>` : ""}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-edit" title="Editar" data-id="${ex.id}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Excluir" data-id="${ex.id}" data-name="${ex.name}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            list.appendChild(card);
        });

        // Bind action buttons
        list.querySelectorAll(".btn-edit").forEach(btn => {
            btn.addEventListener("click", () => openEditModal(btn.dataset.id));
        });

        list.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", () => openDeleteModal(btn.dataset.id, btn.dataset.name));
        });
    }

    // ── Modal de edição ───────────────────────────────────────
    function openEditModal(id) {
        const ex = allExercicios.find(e => e.id === id);
        if (!ex) return;

        editId.value = ex.id;
        editNome.value = ex.name || "";
        editCategoria.value = ex.type || "";
        editObservacao.value = ex.observation || "";
        editVideoLink.value = ex.videoUrl || "";

        editModal.classList.add("active");
    }

    function closeEdit() {
        editModal.classList.remove("active");
    }

    closeEditModal.addEventListener("click", closeEdit);
    editModal.addEventListener("click", (e) => {
        if (e.target === editModal) closeEdit();
    });

    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = editId.value;
        const name = editNome.value.trim();
        const type = editCategoria.value.trim();
        const observation = editObservacao.value.trim() || null;
        const videoUrl = editVideoLink.value.trim() || null;

        if (!name || !type) {
            showToast("error", "Nome e categoria são obrigatórios.");
            return;
        }

        btnSaveEdit.disabled = true;
        btnSaveEdit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';

        try {
            const res = await fetch(`/api/exercicios/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name, type, observation, videoUrl })
            });

            const data = await res.json();

            if (!res.ok) {
                showToast("error", data.erro || "Erro ao atualizar.");
                return;
            }

            showToast("success", "Exercício atualizado com sucesso!");
            closeEdit();
            await fetchExercicios();
        } catch (error) {
            console.error(error);
            showToast("error", "Erro de conexão com o servidor.");
        } finally {
            btnSaveEdit.disabled = false;
            btnSaveEdit.innerHTML = '<i class="fa-solid fa-check"></i> SALVAR ALTERAÇÕES';
        }
    });

    // ── Modal de exclusão ─────────────────────────────────────
    function openDeleteModal(id, name) {
        deleteTargetId = id;
        deleteMsg.textContent = `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`;
        deleteModal.classList.add("active");
    }

    function closeDelete() {
        deleteModal.classList.remove("active");
        deleteTargetId = null;
    }

    cancelDelete.addEventListener("click", closeDelete);
    deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeDelete();
    });

    confirmDelete.addEventListener("click", async () => {
        if (!deleteTargetId) return;

        confirmDelete.disabled = true;
        confirmDelete.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Excluindo...';

        try {
            const res = await fetch(`/api/exercicios/${deleteTargetId}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                showToast("error", data.erro || "Erro ao excluir exercício.");
                return;
            }

            showToast("success", "Exercício excluído com sucesso!");
            closeDelete();
            await fetchExercicios();
        } catch (error) {
            console.error(error);
            showToast("error", "Erro de conexão com o servidor.");
        } finally {
            confirmDelete.disabled = false;
            confirmDelete.innerHTML = '<i class="fa-solid fa-trash-can"></i> Excluir';
        }
    });

    // ── Busca ─────────────────────────────────────────────────
    searchInput.addEventListener("input", () => renderList());

    // ── Filtros ───────────────────────────────────────────────
    filterPills.forEach(pill => {
        pill.addEventListener("click", () => {
            filterPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            currentSort = pill.dataset.sort;
            renderList();
        });
    });

    // ── Init ──────────────────────────────────────────────────
    fetchExercicios();
})();
