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

    const btnGerar = document.getElementById("btn-gerar");

    // Auto-gerar login e senha baseado no nome
    if (btnGerar) {
        btnGerar.addEventListener("click", () => {
            const nameVal = document.getElementById("name").value.trim();
            const telVal = document.getElementById("tel").value.trim();

            if (!nameVal) {
                showToast("error", "Preencha o nome primeiro para gerar o login.");
                return;
            }

            if (!telVal) {
                showToast("error", "Preencha o telefone antes de gerar o login.");
                return;
            }

            const parts = nameVal.split(" ");
            const first = parts[0].toLowerCase();
            const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";

            const randomNum = Math.floor(100 + Math.random() * 900);
            const login = `${first}.${last}${randomNum}`.replace(/[^a-z0-9.]/g, '');
            const pass = `${first}${Math.floor(1000 + Math.random() * 9000)}`;

            document.getElementById("email").value = login;
            document.getElementById("password").value = pass;

            showToast("success", "Login e senha gerados!");
        });
    }

    btnCadastrar.addEventListener("click", async (e) => {
        e.preventDefault();

        const nameVal = document.getElementById("name").value.trim();
        const telVal = document.getElementById("tel").value.trim();
        const emailVal = document.getElementById("email").value.trim();
        const passVal = document.getElementById("password").value.trim();

        if (!nameVal || !emailVal || !passVal || !telVal) {
            showToast("error", "Preencha os campos obrigatórios, incluindo o telefone.");
            return;
        }

        // Validação de número real (Brasil: DDD + 8 ou 9 dígitos -> 10 ou 11 no total)
        const telSomenteNumeros = telVal.replace(/\D/g, "");
        if (telSomenteNumeros.length < 10 || telSomenteNumeros.length > 11) {
            showToast("error", "Telefone inválido. Insira um número real com DDD (ex: 11988887777).");
            return;
        }

        // Desabilita o botão enquanto processa
        btnCadastrar.disabled = true;
        btnCadastrar.textContent = "Cadastrando...";

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    password: passVal,
                    telefone: telVal, // Adicionado telefone aqui
                    role: "PATIENT"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showToast("error", data.erro || "Erro ao cadastrar paciente.");
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = "CADASTRAR";
                return;
            }

            showToast("success", "Paciente cadastrado com sucesso!");

            setTimeout(() => {
                window.location.href = "/pages/adm/pacientes.html";
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
