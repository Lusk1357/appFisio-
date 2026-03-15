document.addEventListener("DOMContentLoaded", () => {
    const notificationsContainer = document.getElementById("notificationsContainer");
    const emptyMsg = document.getElementById("emptyNotifications");

    const btnMarkReadAll = document.getElementById("btnMarkReadAll");
    const btnClearAll = document.getElementById("btnClearAll");

    async function loadNotifications() {
        try {
            const res = await fetch("/api/conquistas/me", { credentials: "include" });
            if (res.ok) {
                const conquistasData = await res.json();
                renderNotifications(conquistasData);
            } else {
                if (emptyMsg) emptyMsg.style.display = "block";
            }
        } catch (e) {
            console.error("Erro ao buscar conquistas da API:", e);
            if (emptyMsg) emptyMsg.style.display = "block";
        }
    }

    async function markAllAsRead() {
        try {
            const res = await fetch("/api/conquistas/read-all", { 
                method: "PUT",
                credentials: "include" 
            });
            if (res.ok) {
                loadNotifications();
            }
        } catch (e) {
            console.error("Erro ao marcar lidas:", e);
        }
    }

    async function clearAll() {
        if (!confirm("Deseja apagar todas as notificações?")) return;
        try {
            const res = await fetch("/api/conquistas/clear-all", { 
                method: "DELETE",
                credentials: "include" 
            });
            if (res.ok) {
                loadNotifications();
            }
        } catch (e) {
            console.error("Erro ao limpar notificações:", e);
        }
    }

    async function deleteItem(id) {
        try {
            const res = await fetch(`/api/conquistas/${id}`, { 
                method: "DELETE",
                credentials: "include" 
            });
            if (res.ok) {
                loadNotifications();
            }
        } catch (e) {
            console.error("Erro ao deletar item:", e);
        }
    }

    function renderNotifications(conquistasData) {
        if (!conquistasData || conquistasData.length === 0) {
            if (emptyMsg) {
                emptyMsg.style.display = "block";
                emptyMsg.textContent = "Nenhuma notificação encontrada.";
            }
            notificationsContainer.innerHTML = "";
            return;
        }

        if (emptyMsg) emptyMsg.style.display = "none";
        notificationsContainer.innerHTML = "";

        // Mostra os mais recentes primeiro
        conquistasData.forEach(item => {
            const hasAlertClass = item.alert ? 'alert' : '';
            const unreadClass = item.read === false ? 'unread' : '';
            const iconClass = item.icon || 'fa-info-circle';
            const title = capitalizeName(item.title || 'Conquista!');
            const desc = item.description || '';

            // Formatando o tempo aproximado
            let timeStr = "Recentemente";
            if (item.timestamp) {
                const diffMinutos = Math.floor((Date.now() - new Date(item.timestamp)) / 60000);
                if (diffMinutos < 60) {
                    timeStr = diffMinutos <= 0 ? "Agora mesmo" : `${diffMinutos} min atrás`;
                } else {
                    const diffHoras = Math.floor(diffMinutos / 60);
                    if (diffHoras < 24) {
                        timeStr = `${diffHoras} horas atrás`;
                    } else {
                        const diffDias = Math.floor(diffHoras / 24);
                        timeStr = `${diffDias} dias atrás`;
                    }
                }
            }

            const html = `
                <div class="notification-item ${unreadClass}">
                    <div class="icon-wrapper ${hasAlertClass}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="notification-text">
                        <h4>${title}</h4>
                        <p>${desc}</p>
                        <span class="time">${timeStr}</span>
                    </div>
                    <button class="btn-delete-item" onclick="event.stopPropagation(); window.deleteNotification('${item.id}')" title="Excluir">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;

            notificationsContainer.insertAdjacentHTML('beforeend', html);
        });
    }

    // Expondo para o escopo global para o onclick funcional
    window.deleteNotification = (id) => deleteItem(id);

    if (btnMarkReadAll) btnMarkReadAll.onclick = markAllAsRead;
    if (btnClearAll) btnClearAll.onclick = clearAll;

    loadNotifications();
});
