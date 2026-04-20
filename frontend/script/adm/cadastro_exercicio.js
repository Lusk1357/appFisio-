document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.getElementById("btn-cadastrar");
    const btnModoLocal = document.getElementById("btnModoLocal");
    const btnModoUrl = document.getElementById("btnModoUrl");
    const imagemLocalWrapper = document.getElementById("imagemLocalWrapper");
    const imagemUrlWrapper = document.getElementById("imagemUrlWrapper");
    const imagemLocalSelect = document.getElementById("imagemLocalSelect");
    const imageUrlInput = document.getElementById("imageUrl");
    const imagePreview = document.getElementById("imagePreview");
    const imgPreviewTag = document.getElementById("imgPreviewTag");

    let currentMode = "upload"; // "upload" or "url"
    let uploadedImageUrl = ""; // To store the uploaded URL temporarily for preview if needed

    // Lógica do Dropdown Customizado (Categoria)
    const categorySelectContainer = document.getElementById("categorySelectContainer");
    const categoryTrigger = document.getElementById("categoryTrigger");
    const categoryDropdown = document.getElementById("categoryDropdown");
    const selectedCategoryText = document.getElementById("selectedCategoryText");
    const categoriaHiddenInput = document.getElementById("categoria");
    const selectOptions = document.querySelectorAll(".select-option");

    if (categoryTrigger && categorySelectContainer) {
        categoryTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            categorySelectContainer.classList.toggle("open");
        });

        selectOptions.forEach(option => {
            option.addEventListener("click", () => {
                const value = option.getAttribute("data-value");
                selectedCategoryText.textContent = value;
                selectedCategoryText.classList.remove("placeholder");
                categoriaHiddenInput.value = value;
                categorySelectContainer.classList.remove("open");

                // Highlight selected
                selectOptions.forEach(opt => opt.classList.remove("selected"));
                option.classList.add("selected");
            });
        });

        // Fechar ao clicar fora
        document.addEventListener("click", (e) => {
            if (!categorySelectContainer.contains(e.target)) {
                categorySelectContainer.classList.remove("open");
            }
        });
    }

    const btnModoUpload = document.getElementById("btnModoUpload");
    const imagemUploadWrapper = document.getElementById("imagemUploadWrapper");
    const imageUploadInput = document.getElementById("imageUploadInput");

    btnModoUpload.addEventListener("click", () => {
        currentMode = "upload";
        btnModoUpload.classList.add("active");
        btnModoUrl.classList.remove("active");
        imagemUploadWrapper.style.display = "";
        imagemUrlWrapper.style.display = "none";
        updatePreview();
    });

    btnModoUrl.addEventListener("click", () => {
        currentMode = "url";
        btnModoUrl.classList.add("active");
        btnModoUpload.classList.remove("active");
        imagemUploadWrapper.style.display = "none";
        imagemUrlWrapper.style.display = "";
        updatePreview();
    });

    function updatePreview() {
        if (currentMode === "url") {
            const val = imageUrlInput?.value.trim();
            if (val) {
                imgPreviewTag.src = val;
                imagePreview.style.display = "block";
            } else {
                imagePreview.style.display = "none";
            }
        } else {
            const fileNameDisplay = document.getElementById("fileNameDisplay");
            if (imageUploadInput.files && imageUploadInput.files[0]) {
                const file = imageUploadInput.files[0];
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = file.name;
                    fileNameDisplay.style.display = "block";
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    imgPreviewTag.src = e.target.result;
                    imagePreview.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                if (fileNameDisplay) fileNameDisplay.style.display = "none";
                imagePreview.style.display = "none";
            }
        }
    }

    if (imageUrlInput) imageUrlInput.addEventListener("input", updatePreview);
    if (imageUploadInput) {
        imageUploadInput.addEventListener("change", updatePreview);
        
        // Drag and drop styles
        imagemUploadWrapper.addEventListener("dragover", (e) => {
            e.preventDefault();
            imagemUploadWrapper.classList.add("dragover");
        });
        imagemUploadWrapper.addEventListener("dragleave", () => {
            imagemUploadWrapper.classList.remove("dragover");
        });
        imagemUploadWrapper.addEventListener("drop", (e) => {
            e.preventDefault();
            imagemUploadWrapper.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                imageUploadInput.files = e.dataTransfer.files;
                updatePreview();
            }
        });
    }

    // Cadastrar exercício
    const form = document.querySelector("form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nomeVal = document.getElementById("nome").value.trim();
        const categoriaVal = document.getElementById("categoria").value.trim();
        const durationVal = document.getElementById("duration").value.trim();
        const comoExecutarVal = document.getElementById("comoExecutar")?.value.trim() || "";
        const equipamentosVal = document.getElementById("equipamentos")?.value.trim() || "";
        const observacaoVal = document.getElementById("observacao").value.trim();
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = "Validando...";

        try {
            let finalImageUrl = "";

            if (currentMode === "upload") {
                if (imageUploadInput.files && imageUploadInput.files[0]) {
                    btnCadastrar.textContent = "Enviando arquivo...";
                    const formData = new FormData();
                    formData.append("image", imageUploadInput.files[0]);

                    const uploadRes = await fetch("/api/exercicios/upload", {
                        method: "POST",
                        body: formData,
                        credentials: "include"
                    });

                    if (!uploadRes.ok) throw new Error("Erro ao subir a imagem para o servidor.");
                    const uploadData = await uploadRes.json();
                    finalImageUrl = uploadData.url;
                }
            } else {
                finalImageUrl = (imageUrlInput?.value || "").trim();
            }

            btnCadastrar.textContent = "Salvando Exercício...";

            if (!nomeVal || !categoriaVal) {
                showToast("error", "Preencha o nome e a categoria do exercício.");
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = "CADASTRAR EXERCÍCIO";
                return;
            }

            const videoLinkVal = document.getElementById("videoLink")?.value.trim() || "";

            const response = await fetch("/api/exercicios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: nomeVal,
                    type: categoriaVal,
                    duration: durationVal || 0,
                    howToExecute: comoExecutarVal || null,
                    equipments: equipamentosVal || null,
                    observation: observacaoVal || null,
                    imageUrl: finalImageUrl || null,
                    videoUrl: videoLinkVal || null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast("error", data.erro || "Erro ao cadastrar exercício.");
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = "CADASTRAR EXERCÍCIO";
                return;
            }

            showToast("success", "Exercício cadastrado com sucesso!");

            setTimeout(() => {
                window.location.href = "/admin";
            }, 1500);
        } catch (error) {
            console.error("Erro:", error);
            showToast("error", error.message || "Erro de conexão com o servidor.");
            btnCadastrar.disabled = false;
            btnCadastrar.textContent = "CADASTRAR EXERCÍCIO";
        }
    });

    // ── Atalho: Voltar com ESC ─────────────────────────────────
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            // Só volta se não houver modal personalizado aberto
            if (!document.getElementById("pf-modal-root")) {
                history.back();
            }
        }
    });

    // Init 
    // loadLocalImages removido, iniciando limpo
});

function back() {
    window.history.back();
}
