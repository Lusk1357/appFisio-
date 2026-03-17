/* home_adm.js */

// Proteção de rota
verificarAcesso("ADMIN");

document.addEventListener("DOMContentLoaded", () => {
	// Puxar dados do usuário e atualizar interface
	fetchUserData();

	// Buscar estatísticas (simulado pro dashboard)
	fetchDashboardStats();
});

// Reseta os botões caso o usuário volte na página (Back/Forward Cache)
window.addEventListener("pageshow", (event) => {
	if (event.persisted) {
		resetAllButtons();
	}
});

function resetAllButtons() {
	const actionCards = document.querySelectorAll(".action-card");
	actionCards.forEach(btn => {
		btn.style.pointerEvents = "auto";
		btn.style.opacity = "1";
		const label = btn.querySelector(".card-label");
		if (label) {
			// Remove the spinner HTML if it exists, keeping just the text
			label.innerHTML = label.textContent.replace(/<i.*><\/i>/, "").trim();
		}
	});

	const logoutBtn = document.querySelector(".btn-logout");
	if (logoutBtn) {
		logoutBtn.style.pointerEvents = "auto";
		logoutBtn.style.opacity = "1";
		logoutBtn.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Sair do Sistema`;
	}
}

async function fetchUserData() {
	try {
		// Tenta ler os dados salvos no localStorage pelo login.js
		const savedUser = localStorage.getItem("userProFisio");
		let user = { name: "Administrador", role: "Gestão" }; // Fallback

		if (savedUser) {
			const parsed = JSON.parse(savedUser);
			if (parsed.nome) {
				user.name = parsed.nome;
				user.role = parsed.tipo === "adm" ? "Administrador" : "Paciente";
			}
		}

		document.querySelector(".hero-user-name").textContent = user.name;
		document.querySelector(".hero-user-role").textContent = user.role;

		// Atualizar o avatar com a inicial do nome usando o componente padronizado
		const avatarContainer = document.querySelector(".hero-avatar");
		if (avatarContainer) {
			avatarContainer.innerHTML = getAvatarHTML(user.name, null, { size: "44px", fontSize: "20px" });
		}

	} catch (err) {
		console.error("Erro ao carregar dados do usuário:", err);
	}
}

async function fetchDashboardStats() {
	try {
		// Puxar os dados da API usando Promises separadas com catch individual 
		// para que uma falha não quebre as outras contagens.
		const fetchCount = async (url) => {
			try {
				const res = await fetch(url, { credentials: "include" });
				if (!res.ok) throw new Error(`Status ${res.status}`);
				const data = await res.json();
				return Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
			} catch (e) {
				console.warn(`Falha ao puxar ${url}:`, e);
				return 0; // Se falhar, mostra 0 ao invés de quebrar a tela
			}
		};

		const [totalPacientes, totalRotinas, totalExercicios] = await Promise.all([
			fetchCount("/api/pacientes"),
			fetchCount("/api/rotinas"),
			fetchCount("/api/exercicios")
		]);

		const statsContainer = document.getElementById("dashboard-stats");
		if (statsContainer) {
			document.getElementById("stat-pacientes").textContent = totalPacientes;
			document.getElementById("stat-rotinas").textContent = totalRotinas;
			document.getElementById("stat-exercicios").textContent = totalExercicios;
		}
	} catch (err) {
		console.error("Erro geral no dashboard stats:", err);
	}
}

function setLoading(btnId) {
	const btn = document.getElementById(btnId);
	if (!btn) return;

	btn.style.pointerEvents = "none";
	btn.style.opacity = "0.7";

	// Verifica se é o botão "Sair" ou um card
	if (btn.classList.contains("btn-logout")) {
		btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saindo...`;
	} else {
		const label = btn.querySelector(".card-label");
		if (label) {
			const text = label.textContent;
			label.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="margin-right:8px;"></i>${text}`;
		}
	}
}

function goTo(page, event) {
	// Descobrir qual botão chamou a função caso o ID não tenha sido passado diretamente
	let btnId = null;
	if (event && event.currentTarget) {
		btnId = event.currentTarget.id;
	} else if (event && typeof event === 'string') {
		btnId = event; // fallback pra caso passe o ID no segundo arg
	}

	if (btnId) setLoading(btnId);

	const rotas = {
		"cadastro_paciente": "/pages/adm/cadastro_paciente.html",
		"pacientes": "/pages/adm/pacientes.html",
		"cadastro_exercicio": "/pages/adm/cadastro_exercicio.html",
		"gerenciar_exercicios": "/pages/adm/gerenciar_exercicios.html",
		"cadastro_rotina": "/pages/adm/cadastro_rotina.html",
		"dicas": "/pages/adm/dicas.html"
	};

	const destination = rotas[page] || page;

	// Pequeno delay para a UI respirar e mostrar o Loading
	setTimeout(() => {
		window.location.href = destination;
	}, 400);
}

function handleLogout() {
	setLoading("btn-logout");

	fetch("/api/auth/logout", { method: "POST", credentials: "include" })
		.then(() => {
			sessionStorage.clear();
			window.location.href = "/pages/auth/login.html";
		})
		.catch((err) => {
			console.error("Erro ao deslogar:", err);
			sessionStorage.clear();
			window.location.href = "/pages/auth/login.html";
		});
}
