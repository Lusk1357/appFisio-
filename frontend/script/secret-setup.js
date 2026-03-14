function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

document.getElementById('setupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'PROCESSANDO...';

    const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        masterKey: document.getElementById('masterKey').value
    };

    try {
        const response = await fetch('/api/auth/setup-super-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast(result.mensagem, 'success');
            document.getElementById('setupForm').reset();
        } else {
            showToast(result.erro || 'Erro ao criar admin.', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão com o servidor.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'CRIAR ADMIN';
    }
});
