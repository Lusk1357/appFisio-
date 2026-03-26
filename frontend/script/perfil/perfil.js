function editPerfil() {
    window.location.href = "/perfil/editar"
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

        profileAvatarDiv.innerHTML = getAvatarHTML(data.name, apiAvatar, { size: "100%", fontSize: "40px" });
        profileAvatarDiv.style.background = "none"; // Reset default background if using initials or image
        profileAvatarDiv.style.display = "flex";
        profileAvatarDiv.style.alignItems = "center";
        profileAvatarDiv.style.justifyContent = "center";

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