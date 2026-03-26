/* perfil_paciente.js */

document.addEventListener("DOMContentLoaded", () => {
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;

	let paciente = JSON.parse(raw);

	// Tenta carregar dados completos do servidor para garantir que cards não fiquem vazios
	fetchPatientDetails(paciente.id);

	renderInitialData(paciente);
});

async function fetchPatientDetails(id) {
	try {
		const res = await fetch(`/api/pacientes/${id}`, { credentials: "include" });
		if (!res.ok) return;
		
		const fullPatient = await res.json();
		
		// Atualiza sessionStorage para as demais telas (como Edição) terem os dados completos
		sessionStorage.setItem("pacienteSelecionado", JSON.stringify(fullPatient));
		
		// Renderiza novamente com os dados completos
		renderInitialData(fullPatient);
	} catch (err) {
		console.error("Erro ao carregar detalhes do paciente:", err);
	}
}

function renderInitialData(paciente) {
	// Nome e Email
	const nameEl = document.getElementById("patientName");
	if (nameEl) nameEl.textContent = paciente.name || "—";

	const emailEl = document.getElementById("patientEmail");
	if (emailEl) emailEl.textContent = paciente.email || "";

	// Dados Clínicos e Contato (Patient Profile)
	const profile = paciente.patientProfile || {};

	const ageEl = document.getElementById("patientAge");
	if (ageEl) ageEl.textContent = profile.age ? `${profile.age} anos` : "—";

	const weightEl = document.getElementById("patientWeight");
	if (weightEl) weightEl.textContent = profile.weight ? `${profile.weight} kg` : "—";

	const heightEl = document.getElementById("patientHeight");
	if (heightEl) heightEl.textContent = profile.height ? `${profile.height} cm` : "—";

	const phoneEl = document.getElementById("patientPhone");
	if (phoneEl) phoneEl.textContent = profile.telefone || "—";

	// Avatar: se tiver foto usa img, senão mostra iniciais
	const avatarEl = document.getElementById("avatarDisplay");
	if (avatarEl) {
		avatarEl.innerHTML = getAvatarHTML(paciente.name, profile.avatar, { size: "100%", fontSize: "36px" });
	}

	// Observações Clínicas
	const notesEl = document.getElementById("patientNotesInput");
	if (notesEl && profile.notes) {
		notesEl.value = profile.notes;
	}
}

// Salvar anotações do paciente
async function savePatientNotes() {
	const textarea = document.getElementById("patientNotesInput");
	const btn = document.getElementById("btnSaveNotes");
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;

	const paciente = JSON.parse(raw);
	const notes = textarea.value;

	btn.disabled = true;
	btn.textContent = "Salvando...";

	try {
		const res = await fetch(`/api/pacientes/${paciente.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ notes }),
			credentials: "include"
		});

		if (!res.ok) throw new Error("Erro ao salvar anotações");

		// Sucesso: Atualiza o botão e o sessionStorage
		btn.textContent = "Salvo!";
		btn.style.background = "#059669";

		if (!paciente.patientProfile) paciente.patientProfile = {};
		paciente.patientProfile.notes = notes;
		sessionStorage.setItem("pacienteSelecionado", JSON.stringify(paciente));

		setTimeout(() => {
			btn.disabled = false;
			btn.textContent = "Salvar";
			btn.style.background = ""; // volta pro original
		}, 2000);

	} catch (error) {
		console.error(error);
		btn.textContent = "Erro";
		btn.style.background = "#ef4444";
		setTimeout(() => {
			btn.disabled = false;
			btn.textContent = "Salvar";
			btn.style.background = "";
		}, 2000);
	}
}

// Navegação — passa o id do paciente na URL para manter contexto
function goTo(page) {
	const raw = sessionStorage.getItem("pacienteSelecionado");
	const id = raw ? JSON.parse(raw).id : "";

	// Força a URL a usar o caminho absoluto caso seja passada uma URL suja pelas funções antigas
	const cleanPage = page.replace("/pages/adm/", "/pages/adm/");
	const separator = cleanPage.includes("?") ? "&" : "?";

	window.location.href = `${cleanPage}${id ? separator + "id=" + id : ""}`;
}

// Toast de notificação — substitui alert()
let _toastTimer = null;
function showToast(msg, type = "success") {
	const toast = document.getElementById("appToast");
	const icon = document.getElementById("appToastIcon");
	const msgEl = document.getElementById("appToastMsg");
	if (!toast) return;

	// Classe de cor
	toast.className = `app-toast toast-${type}`;
	icon.className = type === "success"
		? "fa-solid fa-circle-check"
		: "fa-solid fa-circle-xmark";
	msgEl.textContent = msg;

	// Anima entrada
	requestAnimationFrame(() => toast.classList.add("show"));

	// Auto-oculta após 3s
	clearTimeout(_toastTimer);
	_toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

// Excluir Paciente — abre o modal customizado
function deletePatient() {
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;
	const paciente = JSON.parse(raw);

	// Preenche o nome no modal e exibe
	const nameEl = document.getElementById("modalPatientName");
	if (nameEl) nameEl.textContent = paciente.name;

	const modal = document.getElementById("deleteModal");
	if (modal) modal.classList.add("active");
}

function closeDeleteModal() {
	const modal = document.getElementById("deleteModal");
	if (modal) modal.classList.remove("active");
}

function openNotifyModal() {
	const modal = document.getElementById("notifyModal");
	if (modal) modal.classList.add("active");
	
	const titleInp = document.getElementById("notifyTitle");
	if (titleInp) titleInp.focus();
}

function closeNotifyModal() {
	const modal = document.getElementById("notifyModal");
	if (modal) modal.classList.remove("active");
	
	// Limpa campos
	const t = document.getElementById("notifyTitle");
	const m = document.getElementById("notifyMessage");
	if (t) t.value = "";
	if (m) m.value = "";
}

async function confirmNotify() {
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;
	const paciente = JSON.parse(raw);

	const title = document.getElementById("notifyTitle").value.trim();
	const description = document.getElementById("notifyMessage").value.trim();
	const btn = document.getElementById("btnConfirmNotify");

	if (!title || !description) {
		showToast("Preencha o título e a mensagem.", "error");
		return;
	}

	if (btn) {
		btn.disabled = true;
		btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;
	}

	try {
		const res = await fetch(`/api/conquistas/admin/${paciente.id}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ title, description, icon: "fa-comment-medical" }),
			credentials: "include"
		});

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.erro || "Erro ao enviar notificação");
		}

		showToast("Notificação enviada com sucesso!", "success");
		closeNotifyModal();

	} catch (error) {
		console.error(error);
		showToast(error.message, "error");
	} finally {
		if (btn) {
			btn.disabled = false;
			btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar`;
		}
	}
}

// Fecha ao clicar fora do card
document.addEventListener("DOMContentLoaded", () => {
    // Listener para o modal de exclusão (já existente)
	const dModal = document.getElementById("deleteModal");
	if (dModal) {
		dModal.addEventListener("click", (e) => {
			if (e.target === dModal) closeDeleteModal();
		});
	}
    
    // Listener para o modal de notificação
    const nModal = document.getElementById("notifyModal");
    if (nModal) {
        nModal.addEventListener("click", (e) => {
            if (e.target === nModal) closeNotifyModal();
        });
    }
});

// ── Atalho: Esc para fechar modal ou voltar ───────────────────────
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		const deleteModal = document.getElementById("deleteModal");
		const notifyModal = document.getElementById("notifyModal");
        
		if (deleteModal && deleteModal.classList.contains("active")) {
			closeDeleteModal();
		} else if (notifyModal && notifyModal.classList.contains("active")) {
            closeNotifyModal();
        } else if (!document.getElementById("pf-modal-root")) {
			history.back();
		}
	}
});

async function confirmDelete() {
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;
	const paciente = JSON.parse(raw);

	const btn = document.getElementById("btnConfirmDelete");
	if (btn) {
		btn.disabled = true;
		btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Excluindo...`;
	}

	try {
		const res = await fetch(`/api/pacientes/${paciente.id}`, {
			method: "DELETE",
			credentials: "include"
		});

		const data = await res.json();

		if (!res.ok) {
			closeDeleteModal();
			showToast(data.erro || "Erro ao excluir o paciente.", "error");
			// Restore button
			if (btn) {
				btn.disabled = false;
				btn.innerHTML = `<i class="fa-solid fa-trash"></i> Excluir`;
			}
			return;
		}

		closeDeleteModal();
		showToast("Paciente excluído com sucesso.", "success");
		sessionStorage.removeItem("pacienteSelecionado");

		// Aguarda o toast aparecer antes de redirecionar
		setTimeout(() => {
			window.location.href = "/admin/pacientes";
		}, 1400);

	} catch (error) {
		console.error("Erro na exclusão:", error);
		closeDeleteModal();
		showToast("Erro de conexão com o servidor.", "error");
		if (btn) {
			btn.disabled = false;
			btn.innerHTML = `<i class="fa-solid fa-trash"></i> Excluir`;
		}
	}
}
