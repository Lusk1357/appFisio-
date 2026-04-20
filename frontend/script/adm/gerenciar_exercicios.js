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

    const editBtnModoUpload = document.getElementById("editBtnModoUpload");
    const editBtnModoUrl = document.getElementById("editBtnModoUrl");
    const editImagemUploadWrapper = document.getElementById("editImagemUploadWrapper");
    const editImagemUrlWrapper = document.getElementById("editImagemUrlWrapper");
    const editImageUploadInput = document.getElementById("editImageUploadInput");
    
    let editImageMode = "upload";

    // Modal de exclusão
    const deleteModal = document.getElementById("deleteModal");
    const deleteMsg = document.getElementById("deleteMsg");
    const cancelDelete = document.getElementById("cancelDelete");
    const confirmDelete = document.getElementById("confirmDelete");

    // ── Toggle de modo de imagem (edição) ─────────────────────
    function setEditImageMode(mode) {
        editImageMode = mode;
        if (mode === "upload") {
            if (editBtnModoUpload) editBtnModoUpload.classList.add("active");
            if (editBtnModoUrl) editBtnModoUrl.classList.remove("active");
            if (editImagemUploadWrapper) editImagemUploadWrapper.style.display = "";
            if (editImagemUrlWrapper) editImagemUrlWrapper.style.display = "none";
        } else {
            if (editBtnModoUrl) editBtnModoUrl.classList.add("active");
            if (editBtnModoUpload) editBtnModoUpload.classList.remove("active");
            if (editImagemUploadWrapper) editImagemUploadWrapper.style.display = "none";
            if (editImagemUrlWrapper) editImagemUrlWrapper.style.display = "";
        }
        updateEditPreview();
    }

    if (editBtnModoUpload) editBtnModoUpload.addEventListener("click", () => setEditImageMode("upload"));
    if (editBtnModoUrl) editBtnModoUrl.addEventListener("click", () => setEditImageMode("url"));

    function getEditImageUrl() {
        if (editImageMode === "upload") {
            // Se for upload, retornar nada (será uma URL nova ou mantida no backend se não vier)
            return null;
        } else {
            return editImageUrl ? editImageUrl.value.trim() : "";
        }
    }

    function updateEditPreview() {
        if (editImageMode === "url") {
            const val = getEditImageUrl();
            if (val && editImgTag) {
                editImgTag.src = val.startsWith('http') || val.startsWith('/') ? val : '/' + val;
                editImagePreview.style.display = "block";
            } else if (editImagePreview) {
                editImagePreview.style.display = "none";
            }
        } else {
            if (editImageUploadInput && editImageUploadInput.files && editImageUploadInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    editImgTag.src = e.target.result;
                    editImagePreview.style.display = "block";
                };
                reader.readAsDataURL(editImageUploadInput.files[0]);
            } else {
                // Ao abrir o modal e ser upload, mostrar a imagem atual do banco se houver,
                // que é guardada no editImageUrl (a gente pode reaproveitar essa variável pro estado)
                if (editImageUrl && editImageUrl.value) {
                    editImgTag.src = editImageUrl.value.startsWith('http') || editImageUrl.value.startsWith('/') ? editImageUrl.value : '/' + editImageUrl.value;
                    editImagePreview.style.display = "block";
                } else if (editImagePreview) {
                    editImagePreview.style.display = "none";
                }
            }
        }
    }

    if (editImageUploadInput) editImageUploadInput.addEventListener("change", updateEditPreview);
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
            case "recent":
                sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

            const imgPath = (ex.imageUrl && (ex.imageUrl.startsWith('http') || ex.imageUrl.startsWith('/'))) 
                ? ex.imageUrl 
                : (ex.imageUrl ? '/' + ex.imageUrl : null);

            const fallbackHtml = `<div class="card-icon-circle" style="background:#3b82f615;color:#3b82f6;flex-shrink:0;"><i class="fa-solid fa-person-walking"></i></div>`;
            const imageBlock = imgPath
                ? `<img src="${imgPath}" alt="${ex.name}" style="width:52px;height:64px;object-fit:cover;border-radius:10px;border:1px solid #e2e8f0;flex-shrink:0;" onerror="this.outerHTML='${fallbackHtml.replace(/"/g, '&quot;')}';">`
                : fallbackHtml;

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

        // Configurar a imagem inicial
        const imgUrl = ex.imageUrl || "";
        if (editImageUrl) editImageUrl.value = imgUrl; // Guarda a url atual

        // Se for upload ou externo, por padrão vamos deixar URL ou Upload
        // Como não sabemos a origem, mas tem imagem, e não é local...
        if (imgUrl.trim() !== '') {
            setEditImageMode("url");
        } else {
            setEditImageMode("upload");
            if (editImageUploadInput) editImageUploadInput.value = ""; // limpa o file input
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
        let finalImageUrl = editImageUrl.value; // Pega o que estava original se nada mudar
        
        if (editImageMode === "upload") {
            if (editImageUploadInput && editImageUploadInput.files && editImageUploadInput.files[0]) {
                btnSaveEdit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando arquivo...';
                try {
                    const formData = new FormData();
                    formData.append("image", editImageUploadInput.files[0]);

                    const uploadRes = await fetch("/api/exercicios/upload", {
                        method: "POST",
                        body: formData,
                        credentials: "include"
                    });

                    if (!uploadRes.ok) throw new Error("Erro ao subir a imagem para o servidor.");
                    const uploadData = await uploadRes.json();
                    finalImageUrl = uploadData.url;
                } catch(error) {
                    showToast("error", error.message);
                    btnSaveEdit.disabled = false;
                    btnSaveEdit.innerHTML = '<i class="fa-solid fa-check"></i> SALVAR ALTERAÇÕES';
                    return;
                }
            } 
            // Se estiver em modo upload mas não mandou arquivo, vai manter a url velha (finalImageUrl que puxou lá do editUrlValue) 
        } else {
            finalImageUrl = editImageUrl.value.trim();
        }

        btnSaveEdit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando Exercício...';

        try {
            const res = await fetch(`/api/exercicios/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name, type, duration, howToExecute, observation, videoUrl, equipments, imageUrl: finalImageUrl || null })
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
