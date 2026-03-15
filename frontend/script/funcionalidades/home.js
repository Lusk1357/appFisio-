document.addEventListener("DOMContentLoaded", () => {
  const menuTrigger = document.getElementById("menuTrigger");
  const sideMenu = document.getElementById("sideMenu");
  const menuOverlay = document.getElementById("menuOverlay");
  const closeMenuBtn = document.getElementById("closeMenuBtn");

  if (!menuTrigger || !sideMenu || !menuOverlay || !closeMenuBtn) {
    console.error(
      "Erro: Elementos do menu não encontrados. Verifique os IDs no HTML.",
    );
  }

  const loggedUserJSON = localStorage.getItem("userProFisio");
  if (!loggedUserJSON) {
    window.location.replace("/pages/auth/login.html");
    return;
  }

  const loggedUser = JSON.parse(loggedUserJSON);

  // Puxa as informações de exibir
  const sideMenuName = document.getElementById("sideMenuName");
  const greetingName = document.getElementById("greetingName");
  const sideMenuAvatar = document.getElementById("sideMenuAvatar");
  const headerAvatarContainer = document.getElementById("headerAvatarContainer");

  const firstName = loggedUser.nome.split(" ")[0];
  if (sideMenuName) sideMenuName.textContent = firstName;
  if (greetingName) greetingName.textContent = firstName + "!";

  // Avatar Logic
  const storedAvatar = localStorage.getItem("proFisioAvatar");
  
  // Preencher Avatares
  if (sideMenuAvatar) {
    sideMenuAvatar.innerHTML = getAvatarHTML(loggedUser.nome, storedAvatar, { size: "70px", fontSize: "28px" });
    sideMenuAvatar.style.margin = "0 auto 10px auto";
    sideMenuAvatar.style.display = "flex";
    sideMenuAvatar.style.justifyContent = "center";
  }

  if (headerAvatarContainer) {
    headerAvatarContainer.innerHTML = getAvatarHTML(loggedUser.nome, storedAvatar, { size: "44px", fontSize: "16px", border: "2px solid #fff" });
  }

  // ── Inicialização do Dashboard ────────────────────────────────────
  async function initDashboard() {
    try {
      // Busca estatísticas
      const statsRes = await fetch("/api/prescricoes/me/stats", { credentials: "include" });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        const msDiasSeguidos = document.getElementById("msDiasSeguidos");
        const msTotalTreinos = document.getElementById("msTotalTreinos");
        const homeMiniStats = document.getElementById("homeMiniStats");

        if (msDiasSeguidos && msTotalTreinos) {
          msDiasSeguidos.innerText = stats.diasTreinados || 0;
          msTotalTreinos.innerText = stats.diasComTreinoCompleto || 0;
          if (homeMiniStats) homeMiniStats.style.display = "flex";
        }
      }

      // Busca treino de hoje
      const now = new Date();
      const ano = now.getFullYear();
      const mes = String(now.getMonth() + 1).padStart(2, "0");
      const dia = String(now.getDate()).padStart(2, "0");
      const dateStr = `${ano}-${mes}-${dia}`;

      const prescRes = await fetch(`/api/prescricoes/me?date=${dateStr}`, { credentials: "include" });
      const heroTitle = document.getElementById("heroTitle");
      const heroSubtitle = document.getElementById("heroSubtitle");
      const btnStartWorkout = document.getElementById("btnStartWorkout");

      if (prescRes.ok && heroTitle && btnStartWorkout) {
        const prescricoes = await prescRes.json();
        let pendentes = [];
        let totalAtribuidos = 0;

        prescricoes.forEach(presc => {
          if (presc.exercises && presc.exercises.length > 0) {
            presc.exercises.forEach(associacao => {
              totalAtribuidos++;
              if (!associacao.completed) {
                const ex = associacao.exercise;
                pendentes.push({
                  prescriptionExerciseId: associacao.id,
                  id: ex.id,
                  name: ex.name,
                  series: associacao.series || "3x15",
                  observation: associacao.observation || ex.observation || "",
                  restTime: associacao.restTime || 60,
                  type: ex.type || "",
                  videoUrl: ex.videoUrl || "",
                  completed: false
                });
              }
            });
          }
        });

        if (totalAtribuidos === 0) {
          heroTitle.innerHTML = "DIA LIVRE!<br/>BOM DESCANSO";
          heroSubtitle.innerText = "Você não tem exercícios agendados para hoje.";
          btnStartWorkout.style.display = "inline-block";
          btnStartWorkout.innerText = "Ver meu progresso";
          btnStartWorkout.onclick = () => window.location.href = "/pages/funcionalidades/progresso.html";
        } else if (pendentes.length > 0) {
          heroTitle.innerHTML = "RECUPERAÇÃO<br/>COMEÇA AQUI";
          heroSubtitle.innerText = `Você tem ${pendentes.length} exercícios pendentes hoje.`;
          btnStartWorkout.style.display = "inline-block";
          btnStartWorkout.innerText = "Começar Treino";
          btnStartWorkout.onclick = () => {
            sessionStorage.setItem("treinoAtivo", JSON.stringify({
              date: dateStr,
              exercises: pendentes
            }));
            window.location.href = "/pages/exercicios/treino_ativo.html";
          };
        } else {
          heroTitle.innerHTML = "TREINO DE HOJE<br/>CONCLUÍDO!";
          heroSubtitle.innerText = "Excelente trabalho. Volte amanhã!";
          btnStartWorkout.style.display = "inline-block";
          btnStartWorkout.innerText = "Ver meu progresso";
          btnStartWorkout.onclick = () => window.location.href = "/pages/funcionalidades/progresso.html";
        }
      }
    } catch (e) {
      console.error("Erro ao montar dashboard:", e);
      const heroTitle = document.getElementById("heroTitle");
      if (heroTitle) heroTitle.innerHTML = "ERRO AO BUSCAR<br>SEU TREINO";
    }
  }

  // Despara o carregamento
  initDashboard();

  // ── Logout ────────────────────────────────────────────────────────

  // ── Carregar Conteúdo Complementar (Vídeos Populares) ───────────
  const complementaryContentList = document.getElementById("complementaryContentList");
  if (complementaryContentList) {
    async function carregarDicas() {
      try {
        const res = await fetch("/api/tips", { credentials: "include" });
        if (!res.ok) throw new Error("Erro ao buscar dicas");

        const dicasBD = await res.json();
        complementaryContentList.innerHTML = "";

        if (dicasBD.length === 0) {
          complementaryContentList.innerHTML = `<p style="text-align:center; color:#6b7280; width:100%; font-size:14px; margin-top:20px;">Nenhuma dica disponível no momento.</p>`;
          return;
        }

        dicasBD.forEach((dica, index) => {
          const card = document.createElement("div");
          card.className = "card";

          card.innerHTML = `
            ${index === 0 ? '<i class="fa-solid fa-star heart-icon" style="color: #fbbf24"></i>' : ''}
            ${index === 1 ? '<i class="fa-solid fa-fire heart-icon" style="color: #ef4444"></i>' : ''}
            <img src="${dica.thumbnail}" alt="${dica.title}" onerror="this.src='https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'" class="card-img"/>
            <div class="card-info">
              <h3 class="card-title">${dica.title}</h3>
              <div class="card-meta">
                <span>Dica de Físio</span>
                <span>|</span>
                <span><i class="fa-regular fa-clock"></i> ${dica.duration}</span>
              </div>
            </div>
          `;

          card.addEventListener("click", () => {
            if (dica.link) {
              window.open(dica.link, '_blank');
            } else {
              alert("Link não disponível para este conteúdo.");
            }
          });

          complementaryContentList.appendChild(card);
        });
      } catch (e) {
        console.error("Erro ao carregar videos:", e);
        complementaryContentList.innerHTML = `<p style="text-align:center; color:#ef4444; width:100%;">Erro ao carregar as dicas.</p>`;
      }
    }

    carregarDicas();
  }

  let timeoutId;

  function openMenu() {
    clearTimeout(timeoutId);
    sideMenu.classList.add("active");
    menuOverlay.classList.add("active");
  }

  function closeMenuDelay() {
    timeoutId = setTimeout(() => {
      sideMenu.classList.remove("active");
      menuOverlay.classList.remove("active");
    }, 400);
  }

  function forceCloseMenu() {
    clearTimeout(timeoutId);
    sideMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
  }

  menuTrigger.addEventListener("mouseenter", openMenu);
  sideMenu.addEventListener("mouseenter", openMenu);

  menuTrigger.addEventListener("mouseleave", closeMenuDelay);
  sideMenu.addEventListener("mouseleave", closeMenuDelay);

  menuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    openMenu();
  });

  closeMenuBtn.addEventListener("click", forceCloseMenu);
  menuOverlay.addEventListener("click", forceCloseMenu);

  // ── Logout ────────────────────────────────────────────────────────
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } catch (err) { /* ignora */ }
      localStorage.removeItem("userProFisio");
      window.location.replace("/pages/auth/login.html");
    });
  }

  // Componentes Injetados
  renderBottomNav('home');
});
