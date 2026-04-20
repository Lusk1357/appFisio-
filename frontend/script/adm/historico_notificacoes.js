/* historico_notificacoes.js */

document.addEventListener("DOMContentLoaded", () => {
    const raw = sessionStorage.getItem("pacienteSelecionado");
    if (!raw) {
        history.back();
        return;
    }
    const paciente = JSON.parse(raw);
    loadNotificationHistory(paciente.id);
});

// Toast de notificação — substitui alert()
let _toastTimer = null;
function showToast(msg, type = "success") {
    const toast = document.getElementById("appToast");
    const icon = document.getElementById("appToastIcon");
    const msgEl = document.getElementById("appToastMsg");
    if (!toast) return;

    toast.className = `app-toast toast-${type}`;
    icon.className = type === "success"
        ? "fa-solid fa-circle-check"
        : "fa-solid fa-circle-xmark";
    msgEl.textContent = msg;

    requestAnimationFrame(() => toast.classList.add("show"));

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
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
            list.innerHTML = `<p style="color: #64748b; font-size: 14px; text-align: center;">Nenhuma notificação enviada para este paciente.</p>`;
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

// ── Atalho: Esc para fechar modal ───────────────────────
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape") {
		const editModal = document.getElementById("editNotifyModal");
        
		if (editModal && editModal.classList.contains("active")) {
			closeEditNotifyModal();
        } else if (!document.getElementById("pf-modal-root")) {
			history.back();
		}
	}
});
