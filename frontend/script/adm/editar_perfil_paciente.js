/* editar_perfil_paciente.js */

document.addEventListener("DOMContentLoaded", () => {
	// ── Lê paciente do sessionStorage ─────────────────────────────
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) {
		history.back();
		return;
	}

	let paciente = JSON.parse(raw);

	// ── Preenche avatar e nome no topo ─────────────────────────────
	populateHero(paciente);

	// ── Preenche campos do formulário ─────────────────────────────
	setValue("fieldNome", paciente.name || "");
	setValue("fieldTelefone", paciente.patientProfile?.telefone || "");
	setValue("fieldEmail", paciente.email || "");
	setValue("fieldCep", paciente.patientProfile?.cep || "");
	setValue("fieldEstado", paciente.patientProfile?.estado || "");
	setValue("fieldCidade", paciente.patientProfile?.cidade || "");
	setValue("fieldBairro", paciente.patientProfile?.bairro || "");
	setValue("fieldEndereco", paciente.patientProfile?.endereco || "");

	// ── Aplica modo Read-Only por padrão ──────────────────────────
	const formInputs = document.querySelectorAll("#editForm input");
	const gerarBtns = document.querySelectorAll(".btn-gerar-inline");
	formInputs.forEach(input => {
		input.setAttribute("readonly", true);
		const wrapper = input.closest(".input-wrapper");
		if (wrapper) wrapper.classList.add("readonly");
	});
	gerarBtns.forEach(btn => btn.disabled = true);

	// ── Toggle Editar ─────────────────────────────────────────────
	const btnEditName = document.getElementById("btnEditName");
	const appContainer = document.querySelector(".app-container");

	if (btnEditName) {
		btnEditName.addEventListener("click", () => {
			const isEditing = appContainer.classList.contains("editing");

			if (isEditing) {
				// Cancela edição
				window.location.reload();
			} else {
				// Inicia edição
				appContainer.classList.add("editing");

				// Atualiza ícone para X
				btnEditName.innerHTML = '<i class="fa-solid fa-xmark"></i>';
				btnEditName.title = "Cancelar edição";

				// Libera campos e botões
				formInputs.forEach(input => {
					input.removeAttribute("readonly");
					const wrapper = input.closest(".input-wrapper");
					if (wrapper) wrapper.classList.remove("readonly");
				});
				gerarBtns.forEach(btn => btn.disabled = false);
			}
		});
	}

	// ── Máscara e Busca CEP (ViaCEP) ──────────────────────────────
	const cepInput = document.getElementById("fieldCep");
	if (cepInput) {
		cepInput.addEventListener("input", async () => {
			let v = cepInput.value.replace(/\D/g, "").slice(0, 8);
			if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5);
			cepInput.value = v;

			// Busca ViaCEP quando estiver completo (9 caracteres com o traço)
			if (v.length === 9) {
				try {
					const response = await fetch(`https://viacep.com.br/ws/${v.replace("-", "")}/json/`);
					const data = await response.json();
					if (!data.erro) {
						setValue("fieldEstado", data.uf || "");
						setValue("fieldCidade", data.localidade || "");
						setValue("fieldBairro", data.bairro || "");
						setValue("fieldEndereco", data.logradouro || "");
						// Foca no endereço para o adm completar com número/complemento
						const endInput = document.getElementById("fieldEndereco");
						if (endInput) endInput.focus();
					}
				} catch (err) {
					console.error("Erro ao buscar CEP:", err);
				}
			}
		});
	}

	// ── Máscara Telefone ──────────────────────────────────────────
	const telInput = document.getElementById("fieldTelefone");
	if (telInput) {
		telInput.addEventListener("input", () => {
			let v = telInput.value.replace(/\D/g, "").slice(0, 11);
			if (v.length > 6)
				v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
			else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
			telInput.value = v;
		});
	}

	// ── Toggle visibilidade da Senha ───────────────────────────────
	const toggleSenha = document.getElementById("toggleSenha");
	const senhaInput = document.getElementById("fieldSenha");
	if (toggleSenha && senhaInput) {
		toggleSenha.addEventListener("click", () => {
			const isPassword = senhaInput.type === "password";
			senhaInput.type = isPassword ? "text" : "password";
			toggleSenha.classList.toggle("fa-eye-slash", !isPassword);
			toggleSenha.classList.toggle("fa-eye", isPassword);
		});
	}

	// ── Gerar Login ───────────────────────────────────────────────
	const btnGerarLogin = document.getElementById("btnGerarLogin");
	if (btnGerarLogin) {
		btnGerarLogin.addEventListener("click", () => {
			const nomeVal = getValue("fieldNome");
			if (!nomeVal) {
				showToast("error", "Preencha o nome primeiro para gerar o login.");
				return;
			}
			const parts = nomeVal.split(" ");
			const first = parts[0].toLowerCase().replace(/[^a-z]/g, "");
			const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, "") : "";
			const num = Math.floor(100 + Math.random() * 900);
			setValue("fieldEmail", `${first}.${last}${num}`);
			showToast("success", "Login gerado!");
		});
	}

	// ── Gerar Senha ───────────────────────────────────────────────
	const btnGerarSenha = document.getElementById("btnGerarSenha");
	if (btnGerarSenha) {
		btnGerarSenha.addEventListener("click", () => {
			const nomeVal = getValue("fieldNome");
			const first = nomeVal ? nomeVal.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "") : "paciente";
			const pass = `${first}${Math.floor(1000 + Math.random() * 9000)}`;
			const senhaEl = document.getElementById("fieldSenha");
			if (senhaEl) {
				senhaEl.type = "text";
				senhaEl.value = pass;
				const toggleEl = document.getElementById("toggleSenha");
				if (toggleEl) {
					toggleEl.classList.remove("fa-eye-slash");
					toggleEl.classList.add("fa-eye");
				}
			}
			showToast("success", "Senha gerada!");
		});
	}

	// ── Botão salvar ──────────────────────────────────────────────
	document.getElementById("btnSave").addEventListener("click", salvar);

	// ── Funções ───────────────────────────────────────────────────
	async function salvar() {
		const nomeVal = getValue("fieldNome");
		if (!nomeVal) {
			showToast("error", "O campo Nome é obrigatório.");
			return;
		}

		// Valida telefone: 10 ou 11 dígitos (com DDD)
		const telVal = getValue("fieldTelefone");
		if (telVal) {
			const telSemMascara = telVal.replace(/\D/g, "");
			if (telSemMascara.length < 10 || telSemMascara.length > 11) {
				showToast("error", "Telefone inválido. Insira DDD + número (ex: 11988887777).");
				return;
			}
		}

		const btnSave = document.getElementById("btnSave");
		btnSave.disabled = true;
		btnSave.textContent = "Salvando...";

		try {
			const payload = {
				name: nomeVal,
				email: getValue("fieldEmail"),
				telefone: getValue("fieldTelefone"),
				estado: getValue("fieldEstado"),
				cidade: getValue("fieldCidade"),
				bairro: getValue("fieldBairro"),
				endereco: getValue("fieldEndereco"),
				cep: getValue("fieldCep")
			};

			const pass = getValue("fieldSenha");
			if (pass) {
				payload.password = pass;
			}

			const response = await fetch(`/api/pacientes/${paciente.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload)
			});

			const data = await response.json();

			if (!response.ok) {
				showToast("error", data.erro || "Erro ao salvar.");
				btnSave.disabled = false;
				btnSave.textContent = "SALVAR";
				return;
			}

			// Atualiza sessionStorage para a tela de perfil refletir as mudanças sem apagar dados anteriores
			const atualizado = {
				...paciente,
				name: nomeVal,
				email: payload.email,
				patientProfile: {
					...(paciente.patientProfile || {}),
					telefone: payload.telefone,
					estado: payload.estado,
					cidade: payload.cidade,
					bairro: payload.bairro,
					endereco: payload.endereco,
					cep: payload.cep
				}
			};
			sessionStorage.setItem("pacienteSelecionado", JSON.stringify(atualizado));
			paciente = atualizado;

			// Atualiza nome no topo imediatamente
			const nameEl = document.getElementById("patientName");
			if (nameEl) nameEl.textContent = atualizado.name.toUpperCase();

			showToast("success", "Perfil atualizado com sucesso!");

			setTimeout(() => history.back(), 1800);
		} catch (error) {
			console.error("Erro:", error);
			showToast("error", "Erro de conexão com o servidor.");
			btnSave.disabled = false;
			btnSave.textContent = "SALVAR";
		}
	}

	function populateHero(p) {
		const nameEl = document.getElementById("patientName");
		const avatarEl = document.getElementById("avatarDisplay");

		if (nameEl) nameEl.textContent = p.name ? p.name.toUpperCase() : "—";

		if (avatarEl) {
			const avatarFile = p.patientProfile?.avatar;
			if (avatarFile) {
				avatarEl.innerHTML = `<img src="/images/avatars/${avatarFile}" alt="${p.name}" />`;
			} else {
				const initials = (p.name || "")
					.split(" ")
					.filter(Boolean)
					.slice(0, 2)
					.map((w) => w[0].toUpperCase())
					.join("");
				avatarEl.innerHTML = `<span style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:#7aa3ec;letter-spacing:2px">${initials || "?"}</span>`;
			}
		}
	}

	function getValue(id) {
		const el = document.getElementById(id);
		return el ? el.value.trim() : "";
	}

	function setValue(id, val) {
		const el = document.getElementById(id);
		if (el) el.value = val;
	}
});

// ── Toast (mesmo padrão do projeto) ───────────────────────────────
function showToast(type, message) {
	let container = document.getElementById("toast-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "toast-container";
		document.body.appendChild(container);
	}
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	const icon =
		type === "success"
			? '<i class="fa-solid fa-circle-check"></i>'
			: '<i class="fa-solid fa-circle-exclamation"></i>';
	toast.innerHTML = `${icon} <span>${message}</span>`;
	container.appendChild(toast);
	setTimeout(() => {
		toast.style.animation = "fadeOut 0.3s forwards";
		setTimeout(() => toast.remove(), 300);
	}, 3500);
}
