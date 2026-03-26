(function () {
    let allRoutines = [];
    let currentSort = "az";
    let deleteTargetId = null;

    // ── Elementos ──────────────────────────────────────────────
    const list = document.getElementById("routinesList");
    const emptyState = document.getElementById("emptyState");
    const searchInput = document.getElementById("searchInput");
    const filterPills = document.querySelectorAll("#filterPills .pill");

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

        const icon = type === "success"
            ? '<i class="fa-solid fa-circle-check"></i>'
            : '<i class="fa-solid fa-circle-exclamation"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "fadeOut 0.3s forwards";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ── Fetch rotinas ─────────────────────────────────────────
    async function fetchRoutines() {
        try {
            const res = await fetch("/api/rotinas", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Falha ao carregar rotinas.");
            allRoutines = await res.json();
            renderList();
        } catch (error) {
            console.error(error);
            list.innerHTML = '<p class="empty-msg">Erro ao carregar rotinas.</p>';
        }
    }

    // ── Ordenação ─────────────────────────────────────────────
    function sortRoutines(arr, mode) {
        const sorted = [...arr];
        switch (mode) {
            case "az":
                sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
                break;
            case "za":
                sorted.sort((a, b) => (b.name || "").localeCompare(a.name || "", "pt-BR"));
                break;
            case "recent":
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }
        return sorted;
    }

    // ── Render ────────────────────────────────────────────────
    function renderList() {
        const query = (searchInput.value || "").trim().toLowerCase();
        let filtered = allRoutines;

        if (query) {
            filtered = filtered.filter(rot =>
                (rot.name || "").toLowerCase().includes(query) ||
                (rot.description || "").toLowerCase().includes(query)
            );
        }

        const sorted = sortRoutines(filtered, currentSort);

        list.innerHTML = "";

        if (sorted.length === 0) {
            emptyState.style.display = "flex";
            return;
        }

        emptyState.style.display = "none";

        sorted.forEach((rot, index) => {
            const card = document.createElement("div");
            card.className = "exercise-card routine-card"; // Reuso de classes de exercício
            card.style.animationDelay = `${index * 0.04}s`;

            const exercisesCount = rot.exercises ? rot.exercises.length : 0;
            const exercisesNames = rot.exercises 
                ? rot.exercises.slice(0, 3).map(re => re.exercise.name).join(", ") + (exercisesCount > 3 ? "..." : "")
                : "";

            card.innerHTML = `
                <div class="card-left">
                    <div class="card-icon-circle" style="background:#eff6ff;color:#3b82f6;">
                        <i class="fa-solid fa-notes-medical"></i>
                    </div>
                    <div class="card-info">
                        <h3 class="card-name">${escapeHTML(rot.name)}</h3>
                        <span class="card-type">${exercisesCount} exercício(s)</span>
                        <span class="card-obs" title="${escapeHTML(exercisesNames)}">
                            <i class="fa-solid fa-list-ul"></i> ${escapeHTML(exercisesNames)}
                        </span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-edit" title="Editar" data-id="${rot.id}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Excluir" data-id="${rot.id}" data-name="${escapeHTML(rot.name)}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            list.appendChild(card);
        });

        // Bind action buttons
        list.querySelectorAll(".btn-edit").forEach(btn => {
            btn.addEventListener("click", () => {
                window.location.href = `/admin/rotinas/editar?id=${btn.dataset.id}`;
            });
        });

        list.querySelectorAll(".btn-delete").forEach(btn => {
            btn.addEventListener("click", () => openDeleteModal(btn.dataset.id, btn.dataset.name));
        });
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, function (m) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[m];
        });
    }

    // ── Modal de exclusão ─────────────────────────────────────
    function openDeleteModal(id, name) {
        deleteTargetId = id;
        deleteMsg.textContent = `Tem certeza que deseja excluir a rotina "${name}"? Esta ação não pode ser desfeita.`;
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
            const res = await fetch(`/api/rotinas/${deleteTargetId}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                showToast("error", data.erro || "Erro ao excluir rotina.");
                return;
            }

            showToast("success", "Rotina excluída com sucesso!");
            closeDelete();
            await fetchRoutines();
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
    fetchRoutines();
})();
