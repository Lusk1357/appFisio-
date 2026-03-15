/* ==============================
   pacientes.js
   ============================== */

(function () {
	const PAGE_SIZE = 6;

	let currentSort = "az";
	let visibleCount = PAGE_SIZE;
	let selectedId = null; // ID do paciente atualmente selecionado

	// ── Elementos ──────────────────────────────────────────────────
	const grid = document.getElementById("patientsGrid");
	const emptyState = document.getElementById("emptyState");
	const loadMoreWrapper = document.getElementById("loadMoreWrapper");
	const btnLoadMore = document.getElementById("btnLoadMore");
	const btnNextSteps = document.querySelector(".btn-next-steps");
	const filterPills = document.querySelectorAll("#filterPills .pill");

	// NEXT STEPS começa desabilitado
	if (btnNextSteps) {
		btnNextSteps.disabled = true;
		btnNextSteps.addEventListener("click", () => {
			if (!selectedId) return;
			window.location.href = "/pages/adm/perfil_paciente.html";
		});
	}

	// ── Leitura da API ─────────────────────────────────────────────
	async function getPacientes() {
		try {
			const res = await fetch("/api/pacientes", {
				method: "GET",
				credentials: "include" // Importante: envia o JWT para acessar rota protegida do Admin
			});
			if (!res.ok) throw new Error("Network response falhou");
			const data = await res.json();
			return data;
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	// ── Ordenação ──────────────────────────────────────────────────
	function sortPacientes(list, mode) {
		const sorted = [...list];
		switch (mode) {
			case "az":
				sorted.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"));
				break;
			case "za":
				sorted.sort((a, b) => (b.name || "").localeCompare(a.name || "", "pt-BR"));
				break;
			case "recent":
				sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
				break;
			case "oldest":
				sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
				break;
		}
		return sorted;
	}

	// getInitials removido, usamos o do components.js

	// ── Render ─────────────────────────────────────────────────────
	async function render() {
		grid.innerHTML = '<p class="empty-msg">Carregando lista...</p>';
		const all = await getPacientes();
		const sorted = sortPacientes(all, currentSort);
		const slice = sorted.slice(0, visibleCount);

		grid.innerHTML = "";

		if (sorted.length === 0) {
			emptyState.style.display = "flex";
			loadMoreWrapper.style.display = "none";
			return;
		}

		emptyState.style.display = "none";
		slice.forEach((p) => grid.appendChild(createCard(p)));

		if (sorted.length > visibleCount) {
			loadMoreWrapper.style.display = "flex";
			btnLoadMore.textContent = `VER MAIS (${sorted.length - visibleCount})`;
		} else {
			loadMoreWrapper.style.display = "none";
		}
	}

	// ── Seleção de paciente ────────────────────────────────────────
	function selectCard(paciente, card) {
		// Clicou no já selecionado → deseleciona
		if (selectedId === paciente.id) {
			selectedId = null;
			card.classList.remove("active-card");
			sessionStorage.removeItem("pacienteSelecionado");
			if (btnNextSteps) btnNextSteps.disabled = true;
			return;
		}

		// Remove seleção anterior
		document
			.querySelectorAll(".patient-card.active-card")
			.forEach((c) => c.classList.remove("active-card"));

		// Aplica nova seleção
		selectedId = paciente.id;
		card.classList.add("active-card");
		sessionStorage.setItem("pacienteSelecionado", JSON.stringify(paciente));
		if (btnNextSteps) btnNextSteps.disabled = false;
	}

	// ── Criação do card ────────────────────────────────────────────
	function createCard(paciente) {
		const card = document.createElement("div");
		card.className = "patient-card";

		// Wrapper clicável para o card (avatar + nome)
		const clickableArea = document.createElement("div");
		clickableArea.className = "clickable-area";
		clickableArea.setAttribute("role", "button");
		clickableArea.setAttribute("tabindex", "0");
		clickableArea.style.display = "flex";
		clickableArea.style.flexDirection = "column";
		clickableArea.style.alignItems = "center";
		clickableArea.style.width = "100%";
		clickableArea.style.gap = "10px";

		const avatar = document.createElement("div");
		avatar.className = "patient-avatar-placeholder";

		const capitalizedName = capitalizeName(paciente.name);
		avatar.innerHTML = getAvatarHTML(capitalizedName, paciente.patientProfile?.avatar, { size: "100%", fontSize: "28px" });

		clickableArea.appendChild(avatar);

		const nameEl = document.createElement("span");
		nameEl.className = "patient-name";
		nameEl.textContent = capitalizeName(paciente.name);
		clickableArea.appendChild(nameEl);

		card.appendChild(clickableArea);

		clickableArea.addEventListener("click", () => selectCard(paciente, card));
		clickableArea.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") selectCard(paciente, card);
		});

		return card;
	}

	// ── Filtros ────────────────────────────────────────────────────
	filterPills.forEach((pill) => {
		pill.addEventListener("click", () => {
			filterPills.forEach((p) => p.classList.remove("active"));
			pill.classList.add("active");
			currentSort = pill.dataset.sort;
			visibleCount = PAGE_SIZE;
			render();
		});
	});

	// ── Ver mais ───────────────────────────────────────────────────
	btnLoadMore.addEventListener("click", () => {
		visibleCount += PAGE_SIZE;
		render();
	});

	// ── Init ───────────────────────────────────────────────────────
	render();
})();
