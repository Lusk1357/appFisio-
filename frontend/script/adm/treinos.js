/* treinos.js */

document.addEventListener("DOMContentLoaded", () => {
	// ── Lê contexto ───────────────────────────────────────────────
	const rawPac = sessionStorage.getItem("pacienteSelecionado");
	const rawCtx = sessionStorage.getItem("treinoContexto"); // Opcional no histórico global
	const rawExe = sessionStorage.getItem("exerciciosDiaContexto");

	if (!rawPac) {
		history.back();
		return;
	}

	const paciente = JSON.parse(rawPac);
	const ctx = rawCtx ? JSON.parse(rawCtx) : { nomeExercicio: "Histórico Geral" };
	const exeCtx = rawExe ? JSON.parse(rawExe) : null;

	// ── Descobre o nome do exercício selecionado ──────────────────
	let nomeExercicio = ctx.nomeExercicio || "Histórico Geral";

	// ── Preenche hero ─────────────────────────────────────────────
	const titleEl = document.getElementById("exerciseTitle");
	if (titleEl) titleEl.textContent = nomeExercicio;

	const subEl = document.getElementById("patientSubtitle");
	if (subEl) subEl.textContent = paciente.name || "—";

	// Configurar avatar
	const avatarEl = document.getElementById("avatarDisplay");
	if (avatarEl) {
		const avatarFile = paciente.patientProfile?.avatar;
		if (avatarFile) {
			avatarEl.innerHTML = `<img src="/images/avatars/${avatarFile}" alt="${paciente.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block;" />`;
		} else {
			const initials = (paciente.name || "")
				.split(" ")
				.filter(Boolean)
				.slice(0, 2)
				.map((w) => w[0].toUpperCase())
				.join("");
			avatarEl.innerHTML = `<span style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:#7aa3ec;letter-spacing:2px">${initials || "?"}</span>`;
		}
	}

	// ── Busca treinos no banco de dados (DINÂMICO) ────────────────
    fetch('/api/exercises')
        .then(res => res.json())
        .then(exercises => {
            const exercise = exercises.find(ex => ex.name === nomeExercicio);
            const treinos = exercise ? exercise.videos : [];

            const grid = document.getElementById("treinosGrid");
            const emptyState = document.getElementById("emptyState");

            if (treinos.length === 0) {
                emptyState.style.display = "flex";
                return;
            }

            emptyState.style.display = "none";

            treinos.forEach((treino, idx) => {
                const card = createTreinoCard(treino, idx);
                grid.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Erro ao buscar treinos:", err);
            const emptyState = document.getElementById("emptyState");
            if (emptyState) emptyState.style.display = "flex";
        });

	// ── Criação do card ───────────────────────────────────────────
	function createTreinoCard(treino, idx) {
		const card = document.createElement("div");
		card.className = "treino-card";

		card.innerHTML = `
      <div class="treino-bg"></div>
      <div class="treino-overlay">
        <span class="treino-name">${treino.name}</span>
      </div>
    `;

		card.addEventListener("click", () => openVideo(treino));
		return card;
	}

	// ── Pop-up de vídeo ───────────────────────────────────────────
	const overlay = document.getElementById("overlayVideo");
	const videoFrame = document.getElementById("videoFrame");
	const videoTitle = document.getElementById("videoTitle");
	const btnClose = document.getElementById("btnCloseVideo");

	function openVideo(treino) {
		// Adiciona ?autoplay=1&rel=0 para iniciar automaticamente sem vídeos relacionados
		const src = treino.videoUrl + "?autoplay=1&rel=0&modestbranding=1";
		videoFrame.src = src;
		videoTitle.textContent = `${nomeExercicio} — ${treino.name}`;
		overlay.classList.add("open");
	}

	function closeVideo() {
		// Remove o src para parar o vídeo imediatamente
		videoFrame.src = "";
		overlay.classList.remove("open");
	}

	btnClose.addEventListener("click", closeVideo);

	// Fecha clicando fora do popup
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) closeVideo();
	});

	// Fecha com tecla Escape
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeVideo();
	});
});
