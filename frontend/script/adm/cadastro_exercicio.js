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

    let currentMode = "local"; // "local" or "url"

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
            setTimeout(() => { toast.remove(); }, 300);
        }, 4000);
    }

    // ── Carregar imagens locais ────────────────────────────────
    async function loadLocalImages() {
        try {
            const res = await fetch("/api/exercicios/imagens", {
                method: "GET",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Falha ao carregar imagens.");
            const images = await res.json();
            imagemLocalSelect.innerHTML = '<option value="" disabled selected>Selecione uma imagem...</option>';
            if (images.length === 0) {
                imagemLocalSelect.innerHTML += '<option value="" disabled>Nenhuma imagem disponível</option>';
            } else {
                images.forEach(img => {
                    const opt = document.createElement("option");
                    opt.value = img.path;
                    opt.textContent = img.name;
                    imagemLocalSelect.appendChild(opt);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar imagens:", error);
            imagemLocalSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar imagens</option>';
        }
    }

    // ── Toggle de modo de imagem ──────────────────────────────
    btnModoLocal.addEventListener("click", () => {
        currentMode = "local";
        btnModoLocal.classList.add("active");
        btnModoUrl.classList.remove("active");
        imagemLocalWrapper.style.display = "";
        imagemUrlWrapper.style.display = "none";
        updatePreview();
    });

    btnModoUrl.addEventListener("click", () => {
        currentMode = "url";
        btnModoUrl.classList.add("active");
        btnModoLocal.classList.remove("active");
        imagemLocalWrapper.style.display = "none";
        imagemUrlWrapper.style.display = "";
        updatePreview();
    });

    // ── Preview de imagem ────────────────────────────────────
    function updatePreview() {
        const val = getImageUrl();
        if (val) {
            imgPreviewTag.src = val;
            imagePreview.style.display = "block";
        } else {
            imagePreview.style.display = "none";
        }
    }

    function getImageUrl() {
        if (currentMode === "local") {
            return imagemLocalSelect.value || "";
        } else {
            return (imageUrlInput?.value || "").trim();
        }
    }

    imagemLocalSelect.addEventListener("change", updatePreview);
    if (imageUrlInput) {
        imageUrlInput.addEventListener("input", updatePreview);
    }

    // ── Cadastrar exercício ──────────────────────────────────
    const form = document.querySelector("form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nomeVal = document.getElementById("nome").value.trim();
        const categoriaVal = document.getElementById("categoria").value.trim();
        const comoExecutarVal = document.getElementById("comoExecutar")?.value.trim() || "";
        const equipamentosVal = document.getElementById("equipamentos")?.value.trim() || "";
        const observacaoVal = document.getElementById("observacao").value.trim();
        const imageUrlVal = getImageUrl();
        const videoLinkVal = document.getElementById("videoLink").value.trim();

        if (!nomeVal || !categoriaVal) {
            showToast("error", "Preencha o nome e a categoria do exercício.");
            return;
        }

        btnCadastrar.disabled = true;
        btnCadastrar.textContent = "Cadastrando...";

        try {
            const response = await fetch("/api/exercicios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: nomeVal,
                    type: categoriaVal,
                    howToExecute: comoExecutarVal || null,
                    equipments: equipamentosVal || null,
                    observation: observacaoVal || null,
                    imageUrl: imageUrlVal || null,
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
                window.location.href = "/pages/adm/home_adm.html";
            }, 1500);
        } catch (error) {
            console.error("Erro:", error);
            showToast("error", "Erro de conexão com o servidor.");
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

    // ── Init ──────────────────────────────────────────────────
    loadLocalImages();
});

function back() {
    window.history.back();
}
