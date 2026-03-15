/* perfil_paciente.js */

document.addEventListener("DOMContentLoaded", () => {
	// Lê o paciente salvo ao clicar na grade
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;

	const paciente = JSON.parse(raw);

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
	if (notesEl && paciente.patientProfile && paciente.patientProfile.notes) {
		notesEl.value = paciente.patientProfile.notes;
	}
});

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

// Fecha ao clicar fora do card
document.addEventListener("DOMContentLoaded", () => {
	const modal = document.getElementById("deleteModal");
	if (modal) {
		modal.addEventListener("click", (e) => {
			if (e.target === modal) closeDeleteModal();
		});
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
			window.location.href = "/pages/adm/pacientes.html";
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
