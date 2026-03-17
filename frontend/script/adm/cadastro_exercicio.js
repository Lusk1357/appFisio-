document.addEventListener("DOMContentLoaded", () => {
    const btnCadastrar = document.getElementById("btn-cadastrar");

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

    btnCadastrar.addEventListener("click", async (e) => {
        e.preventDefault();

        const nomeVal = document.getElementById("nome").value.trim();
        const categoriaVal = document.getElementById("categoria").value.trim();
        const equipamentosVal = document.getElementById("equipamentos")?.value.trim() || "";
        const observacaoVal = document.getElementById("observacao").value.trim();
        const imageUrlVal = document.getElementById("imageUrl")?.value.trim() || "";
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
                btnCadastrar.textContent = "CADASTRAR";
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
            btnCadastrar.textContent = "CADASTRAR";
        }
    });
});

function back() {
    window.history.back();
}


function back() {
    window.history.back();
}
