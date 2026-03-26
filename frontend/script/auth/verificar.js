document.addEventListener("DOMContentLoaded", () => {
    const btnEnter = document.querySelector('.btn-reform_password');
    const backBtn = document.querySelector('.back-btn');
    const resendLink = document.querySelector('.resend-link');
    const inputs = document.querySelectorAll('.code-input');
    const emailDisplay = document.getElementById('userEmailDisplay');

    const urlParams = new URLSearchParams(window.location.search);
    const context = urlParams.get('context');

    if (context === 'reset') {
        const resetEmail = sessionStorage.getItem('resetEmail');
        if (resetEmail && emailDisplay) {
            emailDisplay.textContent = resetEmail;
        }
    } else {
        const storedUser = localStorage.getItem('userProFisio');
        if (storedUser && emailDisplay) {
            const userData = JSON.parse(storedUser);
            emailDisplay.textContent = userData.email;
        }
    }

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length > 0 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });

    function showToast(type, message) {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success'
            ? '<i class="fa-solid fa-circle-check"></i>'
            : '<i class="fa-solid fa-circle-exclamation"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    btnEnter.addEventListener('click', (e) => {
        e.preventDefault();

        let code = '';
        inputs.forEach(input => {
            code += input.value;
        });

        if (code.length < 4) {
            showToast('error', 'Por favor, insira o código de 4 dígitos.');
            return;
        }

        showToast('success', 'Conta verificada com sucesso!');

        setTimeout(() => {
            if (context === 'reset') {
                window.location.href = "/nova-senha";
            } else {
                window.location.href = "/paciente/home";
            }
        }, 2000);
    });

    resendLink.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('success', 'Novo código enviado para o seu e-mail!');
    });

    backBtn.addEventListener('click', () => {
        window.history.back();
    });
});