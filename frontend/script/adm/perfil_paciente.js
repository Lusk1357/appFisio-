/* perfil_paciente.js */

document.addEventListener("DOMContentLoaded", () => {
	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) return;

	let paciente = JSON.parse(raw);

	// Tenta carregar dados completos do servidor para garantir que cards não fiquem vazios
	fetchPatientDetails(paciente.id);

	renderInitialData(paciente);
    loadNotificationHistory(paciente.id);
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
        loadNotificationHistory(paciente.id);

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

// ── Histórico de Notificações ──────────────────────────────────────
async function loadNotificationHistory(patientId) {
    const list = document.getElementById("notificationList");
    if (!list) return;

    try {
        const res = await fetch(`/api/conquistas/admin/patient/${patientId}`, { credentials: "include" });
        if (!res.ok) throw new Error();
        const history = await res.json();

        list.innerHTML = "";
        if (history.length === 0) {
            list.innerHTML = `<p style="color: #64748b; font-size: 14px; text-align: center;">Nenhuma notificação enviada.</p>`;
            return;
        }

        history.forEach(notif => {
            const card = document.createElement("div");
            card.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 8px; position: relative;";
            
            const dateStr = new Date(notif.timestamp).toLocaleString('pt-BR');
            const status = notif.read ? '<span style="color: #10b981; font-size: 12px;"><i class="fa-solid fa-check-double"></i> Lida</span>' : '<span style="color: #f59e0b; font-size: 12px;"><i class="fa-solid fa-clock"></i> Não Lida</span>';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h4 style="margin: 0; font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #1e293b;">${window.escapeHTML(notif.title)}</h4>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="openEditNotifyModal('${notif.id}', '${window.escapeHTML(notif.title).replace(/'/g, "\\'")}', '${window.escapeHTML(notif.description).replace(/'/g, "\\'")}')" style="background: none; border: none; color: #64748b; cursor: pointer; padding: 4px;"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteNotification('${notif.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <p style="margin: 0; color: #475569; font-size: 14px;">${window.escapeHTML(notif.description)}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                    ${status}
                    <span style="font-size: 12px; color: #94a3b8;">${dateStr}</span>
                </div>
            `;
            list.appendChild(card);
        });

    } catch (e) {
        list.innerHTML = `<p style="color: #ef4444; font-size: 14px; text-align: center;">Erro ao carregar histórico.</p>`;
    }
}

// ── Editar Notificação ──────────────────────────────────────
let currentEditNotifyId = null;

function openEditNotifyModal(id, title, msg) {
    currentEditNotifyId = id;
    const modal = document.getElementById("editNotifyModal");
    if (modal) modal.classList.add("active");
    
    document.getElementById("editNotifyTitle").value = title;
    document.getElementById("editNotifyMessage").value = msg;
}

function closeEditNotifyModal() {
    currentEditNotifyId = null;
    const modal = document.getElementById("editNotifyModal");
    if (modal) modal.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
    const editModal = document.getElementById("editNotifyModal");
    if (editModal) {
        editModal.addEventListener("click", (e) => {
            if (e.target === editModal) closeEditNotifyModal();
        });
    }

    const btnConfirmEdit = document.getElementById("btnConfirmEditNotify");
    if (btnConfirmEdit) {
        btnConfirmEdit.addEventListener("click", async () => {
            if (!currentEditNotifyId) return;

            const title = document.getElementById("editNotifyTitle").value.trim();
            const description = document.getElementById("editNotifyMessage").value.trim();

            if (!title || !description) {
                showToast("Preencha o título e a mensagem.", "error");
                return;
            }

            btnConfirmEdit.disabled = true;
            btnConfirmEdit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

            try {
                const res = await fetch(`/api/conquistas/admin/${currentEditNotifyId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, description }),
                    credentials: "include"
                });

                if (!res.ok) throw new Error("Erro ao editar.");

                showToast("Notificação editada e reenviada!", "success");
                closeEditNotifyModal();
                
                const raw = sessionStorage.getItem("pacienteSelecionado");
                if (raw) loadNotificationHistory(JSON.parse(raw).id);
            } catch (e) {
                showToast("Erro ao editar notificação.", "error");
            } finally {
                btnConfirmEdit.disabled = false;
                btnConfirmEdit.innerHTML = `<i class="fa-solid fa-save"></i> Salvar e Reenviar`;
            }
        });
    }
});

// ── Excluir Notificação ──────────────────────────────────────
async function deleteNotification(id) {
    if(!confirm("Tem certeza que deseja apagar essa notificação do histórico do paciente?")) return;

    try {
        const res = await fetch(`/api/conquistas/admin/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (!res.ok) throw new Error();

        showToast("Notificação removida.", "success");
        const raw = sessionStorage.getItem("pacienteSelecionado");
        if (raw) loadNotificationHistory(JSON.parse(raw).id);
    } catch (e) {
        showToast("Erro ao excluir notificação.", "error");
    }
}
