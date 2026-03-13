document.addEventListener("DOMContentLoaded", () => {
    const notificationsContainer = document.getElementById("notificationsContainer");
    const emptyMsg = document.getElementById("emptyNotifications");

    // Recupere as conquistas (ou crie um array vazio se não houver)
    const conquistasJSON = localStorage.getItem("proFisioAchievements");
    let conquistasData = [];

    // Formato esperado de cada conquista salva:
    // {
    //    title: "Primeiro Passo!",
    //    description: "Você completou seu primeiro treino...",
    //    icon: "fa-medal",
    //    timestamp: 167888888888, // Opcional
    //    alert: true // Opcional, para deixar ícone colorido
    // }

    if (conquistasJSON) {
        try {
            conquistasData = JSON.parse(conquistasJSON);
        } catch (e) {
            console.error("Erro ao ler conquistas do LocalStorage:", e);
        }
    }

    if (conquistasData.length === 0) {
        // Mostra estado vazio
        if (emptyMsg) emptyMsg.style.display = "block";
    } else {
        // Esconde o vazio
        if (emptyMsg) emptyMsg.style.display = "none";

        // Inverte a ordem para mostrar os mais recentes primeiro
        const conquistasOrder = [...conquistasData].reverse();

        // Renderiza cada conquista ganha no layout limpo
        conquistasOrder.forEach(item => {
            const hasAlertClass = item.alert ? 'alert' : '';
            const iconClass = item.icon || 'fa-info-circle';
            const title = item.title || 'Conquista!';
            const desc = item.description || '';

            // Formatando o tempo aproximado
            let timeStr = "Recentemente";
            if (item.timestamp) {
                const diffMinutos = Math.floor((Date.now() - item.timestamp) / 60000);
                if (diffMinutos < 60) {
                    timeStr = diffMinutos === 0 ? "Agora mesmo" : `${diffMinutos} min atrás`;
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
                <div class="notification-item">
                    <div class="icon-wrapper ${hasAlertClass}">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="notification-text">
                        <h4>${title}</h4>
                        <p>${desc}</p>
                        <span class="time">${timeStr}</span>
                    </div>
                </div>
            `;

            notificationsContainer.insertAdjacentHTML('beforeend', html);
        });
    }
});
