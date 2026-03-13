function editPerfil() {
    window.location.href = "/pages/perfil/editar_perfil.html"
}

document.addEventListener("DOMContentLoaded", () => {
    // Componentes Injetados
    renderBottomNav('perfil');

    // Carregar os dados reais do perfil
    loadProfile();
});

async function loadProfile() {
    try {
        const res = await fetch('/api/pacientes/me', { credentials: 'include' });

        if (!res.ok) {
            throw new Error("Erro ao carregar o perfil");
        }

        const data = await res.json();

        // Atualizar Nome e Avatar
        document.getElementById("profileName").innerText = data.name.toUpperCase();

        const profileAvatarDiv = document.getElementById("profileAvatar");
        const profile = data.patientProfile || {};
        const apiAvatar = profile.avatar;

        if (apiAvatar) {
            profileAvatarDiv.innerHTML = `<img src="/images/avatars/${apiAvatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" alt="Avatar">`;
            // Remover estilos de placeholder que podem causar conflito visual
            profileAvatarDiv.style.backgroundColor = "transparent";
            profileAvatarDiv.style.display = "block";
        } else {
            profileAvatarDiv.innerText = data.name.charAt(0).toUpperCase();
        }

        // Atualizar papel (role)
        document.getElementById("profileRole").innerText = data.role === "ADMIN" ? "Fisioterapeuta" : "Paciente";

        // Atualizar Estatísticas com fallback
        document.getElementById("profileWeight").innerText = profile.weight || "--";
        document.getElementById("profileHeight").innerText = profile.height || "--";
        document.getElementById("profileAge").innerText = profile.age || "--";

    } catch (error) {
        console.error("Erro no loadProfile:", error);
        document.getElementById("profileName").innerText = "ERRO";
        document.getElementById("profileRole").innerText = "Não foi possível carregar o perfil";
    }
}