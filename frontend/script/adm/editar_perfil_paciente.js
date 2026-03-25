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
	
	setValue("fieldAge", paciente.patientProfile?.age || "");
	setValue("fieldGender", paciente.patientProfile?.gender || "");
	setValue("fieldWeight", paciente.patientProfile?.weight || "");
	setValue("fieldHeight", paciente.patientProfile?.height || "");

	// ── Aplica modo Read-Only por padrão ──────────────────────────
	const formInputs = document.querySelectorAll("#editForm input, #editForm select");
	const gerarBtns = document.querySelectorAll(".btn-gerar-inline");
	formInputs.forEach(input => {
		input.setAttribute("disabled", true);
		const wrapper = input.closest(".input-wrapper");
		if (wrapper) wrapper.classList.add("readonly");
	});
	gerarBtns.forEach(btn => btn.disabled = true);

	// ── Toggle Editar ─────────────────────────────────────────────
	const btnEditName = document.getElementById("btnEditName");
	const appContainer = document.querySelector(".app-wrapper");

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
					input.removeAttribute("disabled");
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
				if (typeof showToast === "function") showToast("error", "Preencha o nome primeiro para gerar o login.");
				return;
			}
			const parts = nomeVal.split(" ");
			const first = parts[0].toLowerCase().replace(/[^a-z]/g, "");
			const last = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, "") : "";
			const num = Math.floor(100 + Math.random() * 900);
			setValue("fieldEmail", `${first}.${last}${num}`);
			if (typeof showToast === "function") showToast("success", "Login gerado!");
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
			if (typeof showToast === "function") showToast("success", "Senha gerada!");
		});
	}

	// ── Botão salvar ──────────────────────────────────────────────
	document.getElementById("editForm").addEventListener("submit", (e) => {
		e.preventDefault();
		salvar();
	});

	// ── Funções ───────────────────────────────────────────────────
	async function salvar() {
		const nomeVal = getValue("fieldNome");
		if (!nomeVal) {
			if (typeof showToast === "function") showToast("error", "O campo Nome é obrigatório.");
			return;
		}

		// Valida telefone: 10 ou 11 dígitos (com DDD)
		const telVal = getValue("fieldTelefone");
		if (telVal) {
			const telSemMascara = telVal.replace(/\D/g, "");
			if (telSemMascara.length < 10 || telSemMascara.length > 11) {
				if (typeof showToast === "function") showToast("error", "Telefone inválido.");
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
				cep: getValue("fieldCep"),
				age: getValue("fieldAge") ? parseInt(getValue("fieldAge")) : undefined,
				gender: getValue("fieldGender") || undefined,
				weight: getValue("fieldWeight") ? parseFloat(getValue("fieldWeight")) : undefined,
				height: getValue("fieldHeight") ? parseInt(getValue("fieldHeight")) : undefined
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
				if (typeof showToast === "function") showToast("error", data.erro || "Erro ao salvar.");
				btnSave.disabled = false;
				btnSave.textContent = "SALVAR";
				return;
			}
			
			// Atualiza sessionStorage com os dados OFICIAIS retornados pelo servidor
			if (data.paciente) {
				sessionStorage.setItem("pacienteSelecionado", JSON.stringify(data.paciente));
				paciente = data.paciente;

				// Atualiza nome no topo imediatamente
				const nameEl = document.getElementById("patientName");
				if (nameEl) nameEl.textContent = data.paciente.name.toUpperCase();
			}

			if (typeof showToast === "function") showToast("success", "Perfil atualizado com sucesso!");

			setTimeout(() => {
				window.location.href = "/pages/adm/perfil_paciente.html";
			}, 1800);
		} catch (error) {
			console.error("Erro:", error);
			if (typeof showToast === "function") showToast("error", "Erro de conexão.");
			btnSave.disabled = false;
			btnSave.textContent = "SALVAR";
		}
	}

	function populateHero(p) {
		const nameEl = document.getElementById("patientName");
		const avatarEl = document.getElementById("avatarDisplay");

		if (nameEl) nameEl.textContent = p.name ? p.name.toUpperCase() : "—";

		if (avatarEl) {
			avatarEl.innerHTML = getAvatarHTML(p.name, p.patientProfile?.avatar, { size: "100%", fontSize: "36px" });
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

	// ── Atalho: Esc para voltar ───────────────────────────────────
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			if (!document.getElementById("pf-modal-root")) {
				history.back();
			}
		}
	});
});
