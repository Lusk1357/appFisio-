document.addEventListener("DOMContentLoaded", () => {
  const photoUploadBtn = document.getElementById("photoUploadBtn");
  const profilePreview = document.getElementById("profilePreview");
  const avatarModal = document.getElementById("avatarModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const avatarGrid = document.getElementById("avatarGrid");

  let selectedAvatarName = null;

  const AVATARS = [
    "avatar_adult_man_office_1773066742453.png",
    "avatar_adult_woman_office_1773066758406.png",
    "avatar_asian_senior_man_1773067069617.png",
    "avatar_asian_young_woman.png",
    "avatar_black_athlete_woman_1773067054085.png",
    "avatar_black_young_man.png",
    "avatar_black_young_woman.png",
    "avatar_black_senior_man.png",
    "avatar_black_senior_woman.png",
    "avatar_friendly_physio_man_1773066806568.png",
    "avatar_friendly_physio_woman_1773066823324.png",
    "avatar_latino_adult_man_1773067086383.png",
    "avatar_middle_eastern_woman_1773067103263.png",
    "avatar_pardo_adult_man.png",
    "avatar_runner_man_1773066772901.png",
    "avatar_senior_man_1773066675956.png",
    "avatar_senior_woman_1773066694358.png",
    "avatar_white_senior_athlete_woman.png",
    "avatar_yoga_woman_1773066791237.png",
    "avatar_young_athlete_man_1773066708395.png",
    "avatar_young_athlete_woman_1773066725391.png"
  ];

  // Renderiza grid do modal
  AVATARS.forEach(avatarFilename => {
    const img = document.createElement("img");
    img.src = `/images/avatars/${avatarFilename}`;
    img.className = "avatar-option";
    img.addEventListener("click", () => {
      // Remove class selected dos outros
      document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
      img.classList.add('selected');

      // Atualiza preview principal
      profilePreview.src = `/images/avatars/${avatarFilename}`;
      profilePreview.style.display = "block";
      selectedAvatarName = avatarFilename;

      setTimeout(() => {
        avatarModal.style.display = "none";
        avatarModal.classList.remove("open");
      }, 300);
    });
    avatarGrid.appendChild(img);
  });

  photoUploadBtn.addEventListener("click", () => {
    avatarModal.style.display = "flex";
    setTimeout(() => avatarModal.classList.add("open"), 10);
  });

  closeModalBtn.addEventListener("click", () => {
    avatarModal.classList.remove("open");
    setTimeout(() => avatarModal.style.display = "none", 300);
  });

  const unitToggles = document.querySelectorAll(".unit-toggle");

  unitToggles.forEach((toggle) => {
    const btns = toggle.querySelectorAll(".unit-btn");

    btns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        btns.forEach((b) => b.classList.remove("active"));

        e.target.classList.add("active");
      });
    });
  });

  const genderSelect = document.getElementById("genderSelect");
  const genderIcon = document.getElementById("genderIcon");

  genderSelect.addEventListener("change", (e) => {
    const value = e.target.value;

    genderIcon.className = "fa-solid icon-left";

    if (value === "male") {
      genderIcon.classList.add("fa-mars");
    } else if (value === "female") {
      genderIcon.classList.add("fa-venus");
    } else {
      genderIcon.classList.add("fa-genderless");
    }
  });

  const form = document.getElementById("editProfileForm");
  const saveBtn = document.getElementById("saveBtn");

  // Carregar dados reais ao abrir a tela
  async function loadProfileForm() {
    try {
      const res = await fetch("/api/pacientes/me", { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await res.json();

      document.getElementById("inputName").value = data.name || "";
      document.getElementById("inputEmail").value = data.email || "";

      const p = data.patientProfile || {};
      document.getElementById("inputPhone").value = p.telefone || "";
      document.getElementById("inputWeight").value = p.weight || "";
      document.getElementById("inputHeight").value = p.height || "";
      document.getElementById("inputAge").value = p.age || "";

      // Setar genero base
      if (p.gender) {
        genderSelect.value = p.gender;
        genderSelect.dispatchEvent(new Event("change"));
      }

      // Setar avatar
      if (p.avatar) {
        selectedAvatarName = p.avatar;
        profilePreview.src = `/images/avatars/${p.avatar}`;
        profilePreview.style.display = "block";
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao carregar seus dados.");
    }
  }

  loadProfileForm();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> SALVANDO...';
    saveBtn.style.backgroundColor = "#1c75a6";

    // Montando objeto para servidor
    const payload = {
      name: document.getElementById("inputName").value,
      telefone: document.getElementById("inputPhone").value,
      weight: document.getElementById("inputWeight").value,
      height: document.getElementById("inputHeight").value,
      age: document.getElementById("inputAge").value,
      gender: document.getElementById("genderSelect").value,
      avatar: selectedAvatarName
    };

    try {
      const res = await fetch("/api/pacientes/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Erro na atualização");

      // Atualizar LocalStorage para sincronizar Home/Menu Lateral
      const loggedUserJSON = localStorage.getItem("userProFisio");
      if (loggedUserJSON) {
        const user = JSON.parse(loggedUserJSON);
        user.nome = payload.name;
        localStorage.setItem("userProFisio", JSON.stringify(user));
      }

      saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> SALVO!';
      saveBtn.style.backgroundColor = "#10b981";

      setTimeout(() => {
        window.location.href = "/pages/perfil/perfil.html";
      }, 1500);

    } catch (err) {
      console.error(err);
      saveBtn.innerHTML = "ERRO";
      saveBtn.style.backgroundColor = "red";
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.style.backgroundColor = "";
      }, 2000);
      alert("Falha ao atualizar perfil.");
    }
  });

  // Componentes Injetados
  renderBottomNav('perfil');
});
