/* ==============================
   gerenciar_exercicios.js
   ============================== */

(function () {
    let allExercicios = [];
    let currentSort = "az";
    let currentCategory = "all";
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
    const editDuration = document.getElementById("editDuration");
    const editComoExecutar = document.getElementById("editComoExecutar");
    const editEquipamentos = document.getElementById("editEquipamentos");
    const editObservacao = document.getElementById("editObservacao");
    const editImageUrl = document.getElementById("editImageUrl");
    const editImgTag = document.getElementById("editImgTag");
    const editImagePreview = document.getElementById("editImagePreview");
    const editVideoLink = document.getElementById("editVideoLink");
    const btnSaveEdit = document.getElementById("btnSaveEdit");

    // Dual-mode imagem no modal de edição
    const editBtnModoLocal = document.getElementById("editBtnModoLocal");
    const editBtnModoUrl = document.getElementById("editBtnModoUrl");
    const editImagemLocalWrapper = document.getElementById("editImagemLocalWrapper");
    const editImagemUrlWrapper = document.getElementById("editImagemUrlWrapper");
    const editImagemLocalSelect = document.getElementById("editImagemLocalSelect");
    let editImageMode = "local";

    // Modal de exclusão
    const deleteModal = document.getElementById("deleteModal");
    const deleteMsg = document.getElementById("deleteMsg");
    const cancelDelete = document.getElementById("cancelDelete");
    const confirmDelete = document.getElementById("confirmDelete");

    // ── Carregar imagens locais ────────────────────────────────
    let localImages = [];
    async function loadLocalImages() {
        try {
            const res = await fetch("/api/exercicios/imagens", { method: "GET", credentials: "include" });
            if (!res.ok) throw new Error();
            localImages = await res.json();
            populateLocalSelect();
        } catch (e) {
            console.error("Erro ao carregar imagens:", e);
        }
    }

    function populateLocalSelect(currentVal) {
        if (!editImagemLocalSelect) return;
        editImagemLocalSelect.innerHTML = '<option value="" disabled selected>Selecione uma imagem...</option>';
        if (localImages.length === 0) {
            editImagemLocalSelect.innerHTML += '<option value="" disabled>Nenhuma imagem disponível</option>';
        } else {
            localImages.forEach(img => {
                const opt = document.createElement("option");
                opt.value = img.path;
                opt.textContent = img.name;
                if (currentVal && img.path === currentVal) opt.selected = true;
                editImagemLocalSelect.appendChild(opt);
            });
        }
    }

    // ── Toggle de modo de imagem (edição) ─────────────────────
    function setEditImageMode(mode) {
        editImageMode = mode;
        if (mode === "local") {
            editBtnModoLocal.classList.add("active");
            editBtnModoUrl.classList.remove("active");
            editImagemLocalWrapper.style.display = "";
            editImagemUrlWrapper.style.display = "none";
        } else {
            editBtnModoUrl.classList.add("active");
            editBtnModoLocal.classList.remove("active");
            editImagemLocalWrapper.style.display = "none";
            editImagemUrlWrapper.style.display = "";
        }
        updateEditPreview();
    }

    if (editBtnModoLocal) editBtnModoLocal.addEventListener("click", () => setEditImageMode("local"));
    if (editBtnModoUrl) editBtnModoUrl.addEventListener("click", () => setEditImageMode("url"));

    function getEditImageUrl() {
        if (editImageMode === "local") {
            return editImagemLocalSelect ? editImagemLocalSelect.value : "";
        } else {
            return editImageUrl ? editImageUrl.value.trim() : "";
        }
    }

    function updateEditPreview() {
        const val = getEditImageUrl();
        if (val && editImgTag) {
            editImgTag.src = val.startsWith('http') || val.startsWith('/') ? val : '/' + val;
            editImagePreview.style.display = "block";
        } else if (editImagePreview) {
            editImagePreview.style.display = "none";
        }
    }

    if (editImagemLocalSelect) editImagemLocalSelect.addEventListener("change", updateEditPreview);
    if (editImageUrl) editImageUrl.addEventListener("input", updateEditPreview);

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
            renderCategoryFilters();
            renderList();
        } catch (error) {
            console.error(error);
            list.innerHTML = '<p class="empty-msg">Erro ao carregar exercícios.</p>';
        }
    }

    // ── Filtros de Categoria ──────────────────────────────────
    function renderCategoryFilters() {
        const container = document.getElementById("categoryFilters");
        if (!container) return;

        container.innerHTML = '<span class="category-chip active" data-category="all">Todos</span>';

        const categories = [...new Set(allExercicios.map(ex => ex.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

        categories.forEach(cat => {
            const chip = document.createElement("span");
            chip.className = "category-chip";
            chip.dataset.category = cat;
            chip.textContent = cat;
            container.appendChild(chip);
        });

        setupCategoryFilters();
    }

    function setupCategoryFilters() {
        const chips = document.querySelectorAll("#categoryFilters .category-chip");
        chips.forEach(chip => {
            chip.addEventListener("click", () => {
                chips.forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                currentCategory = chip.dataset.category;
                renderList();
            });
        });
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

        if (currentCategory !== "all") {
            filtered = filtered.filter(ex => (ex.type || "") === currentCategory);
        }

        if (query) {
            filtered = filtered.filter(ex =>
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

            // Imagem ou ícone padrão
            const imageBlock = ex.imageUrl
                ? `<img src="${ex.imageUrl.startsWith('/') ? ex.imageUrl : '/' + ex.imageUrl}" alt="${ex.name}" style="width:52px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;flex-shrink:0;" onerror="this.style.display='none'">`
                : `<div class="card-icon-circle" style="background:#3b82f615;color:#3b82f6;flex-shrink:0;"><i class="fa-solid fa-person-walking"></i></div>`;

            card.innerHTML = `
                <div class="card-left">
                    ${imageBlock}
                    <div class="card-info">
                        <h3 class="card-name">${escapeHTML(ex.name)}</h3>
                        <span class="card-type">${escapeHTML(ex.type || "Sem categoria")}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-edit" title="Editar" data-id="${ex.id}">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-action btn-delete" title="Excluir" data-id="${ex.id}" data-name="${escapeHTML(ex.name)}">
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
        if (editDuration) editDuration.value = ex.duration || 0;
        if (editComoExecutar) editComoExecutar.value = ex.howToExecute || "";
        editObservacao.value = ex.observation || "";
        editVideoLink.value = ex.videoUrl || "";
        editEquipamentos.value = ex.equipments || "";

        // Detectar se imagem é local ou URL e configurar modo correto
        const imgUrl = ex.imageUrl || "";
        const isLocal = imgUrl.startsWith('/public/images/exercises/');
        if (isLocal) {
            populateLocalSelect(imgUrl);
            if (editImageUrl) editImageUrl.value = "";
            setEditImageMode("local");
        } else {
            populateLocalSelect();
            if (editImageUrl) editImageUrl.value = imgUrl;
            setEditImageMode("url");
        }
        updateEditPreview();

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
        const duration = editDuration ? (editDuration.value.trim() || 0) : 0;
        const howToExecute = editComoExecutar ? (editComoExecutar.value.trim() || null) : null;
        const observation = editObservacao.value.trim() || null;
        const videoUrl = editVideoLink.value.trim() || null;
        const equipments = editEquipamentos ? (editEquipamentos.value.trim() || null) : null;
        const imageUrl = getEditImageUrl() || null;

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
                body: JSON.stringify({ name, type, duration, howToExecute, observation, videoUrl, equipments, imageUrl })
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
    loadLocalImages();
})();
