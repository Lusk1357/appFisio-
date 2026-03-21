// ── Sistema de UI Global (Modais e Toasts) ──
(function injectGlobalStyles() {
  if (document.getElementById("pro-fisio-global-styles")) return;
  const style = document.createElement("style");
  style.id = "pro-fisio-global-styles";
  style.textContent = `
    /* Overlay com Glassmorphism */
    .pf-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 24px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pf-modal-overlay.active {
      opacity: 1;
      pointer-events: all;
    }
    
    /* Card do Modal */
    .pf-modal-card {
      background: #ffffff;
      border-radius: 28px;
      padding: 35px 30px;
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.18);
      transform: translateY(30px) scale(0.95);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .pf-modal-overlay.active .pf-modal-card {
      transform: translateY(0) scale(1);
    }

    /* Ícone */
    .pf-modal-icon-wrap {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 5px;
    }
    .pf-modal-icon-danger { background: #fee2e2; color: #ef4444; }
    .pf-modal-icon-warning { background: #fef3c7; color: #f59e0b; }
    .pf-modal-icon-info { background: #e0f2fe; color: #0ea5e9; }
    .pf-modal-icon-success { background: #dcfce7; color: #22c55e; }

    /* Texto */
    .pf-modal-title {
      font-family: "Bebas Neue", sans-serif;
      font-size: 32px;
      letter-spacing: 1px;
      color: #0f172a;
      text-align: center;
      margin: 0;
      line-height: 1;
    }
    .pf-modal-body {
      font-family: "DM Sans", sans-serif;
      font-size: 16px;
      color: #475569;
      text-align: center;
      line-height: 1.6;
      margin: 0;
    }

    /* Botões */
    .pf-modal-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 10px;
    }
    .pf-modal-btn {
      flex: 1;
      height: 54px;
      border: none;
      border-radius: 16px;
      font-family: "DM Sans", sans-serif;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pf-modal-btn:active { transform: scale(0.96); }
    .pf-modal-btn-cancel {
      background: #f1f5f9;
      color: #64748b;
    }
    .pf-modal-btn-cancel:hover { background: #e2e8f0; }
    .pf-modal-btn-confirm {
      background: #2563eb;
      color: #fff;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .pf-modal-btn-confirm:hover {
      filter: brightness(1.1);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    .pf-modal-btn-danger {
      background: #ef4444;
      color: #fff;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    /* Toasts */
    .pf-toast-container {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      border-radius: 100px;
      background: #0f172a;
      color: #fff;
      font-family: "DM Sans", sans-serif;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;
      white-space: nowrap;
    }
    .pf-toast-container.active {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    .pf-toast-success i { color: #22c55e; }
    .pf-toast-error i { color: #ef4444; }
    .pf-toast-warning i { color: #f59e0b; }
  `;
  document.head.appendChild(style);
})();

/**
 * Exibe um modal customizado de confirmação ou alerta.
 * @param {Object} options { title, message, type, confirmText, cancelText, confirmColor, onConfirm }
 */
window.showCustomModal = function(options) {
  const { 
    title = "Confirmação", 
    message = "", 
    type = "info", // info, success, warning, danger
    confirmText = "OK", 
    cancelText = "Cancelar",
    confirmColor = "#2563eb",
    showCancel = true,
    onConfirm = null 
  } = options;

  // Limpa modais existentes
  const existing = document.getElementById("pf-modal-root");
  if (existing) existing.remove();

  const iconMap = {
    info: { icon: "fa-circle-info", class: "pf-modal-icon-info" },
    success: { icon: "fa-circle-check", class: "pf-modal-icon-success" },
    warning: { icon: "fa-triangle-exclamation", class: "pf-modal-icon-warning" },
    danger: { icon: "fa-trash-can", class: "pf-modal-icon-danger" }
  };
  const iconData = iconMap[type] || iconMap.info;

  const modalHTML = `
    <div id="pf-modal-root" class="pf-modal-overlay">
      <div class="pf-modal-card">
        <div class="pf-modal-icon-wrap ${iconData.class}">
          <i class="fa-solid ${iconData.icon}"></i>
        </div>
        <h3 class="pf-modal-title">${title}</h3>
        <p class="pf-modal-body">${message}</p>
        <div class="pf-modal-actions">
          ${showCancel ? `<button class="pf-modal-btn pf-modal-btn-cancel" id="pf-btn-cancel">${cancelText}</button>` : ""}
          <button class="pf-modal-btn pf-modal-btn-confirm" id="pf-btn-confirm" style="background: ${confirmColor}">${confirmText}</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  const overlay = document.getElementById("pf-modal-root");
  const btnConfirm = document.getElementById("pf-btn-confirm");
  const btnCancel = document.getElementById("pf-btn-cancel");

  // Anima entrada
  setTimeout(() => overlay.classList.add("active"), 10);

  const closeModal = () => {
    overlay.classList.remove("active");
    setTimeout(() => overlay.remove(), 300);
  };

  btnConfirm.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  if (btnCancel) {
    btnCancel.onclick = closeModal;
  }

  // Fecha ao clicar fora do card
  overlay.onclick = (e) => {
    if (e.target === overlay && showCancel) closeModal();
  };

  // Suporte à tecla ESC para fechar modal
  const escListener = (e) => {
    if (e.key === "Escape" && showCancel) {
      closeModal();
      document.removeEventListener("keydown", escListener);
    }
  };
  document.addEventListener("keydown", escListener);
};

/**
 * Versão simplificada para confirmação tipo "Deseja apagar?"
 */
window.showCustomConfirm = function(title, message, onConfirm, type = "danger") {
  window.showCustomModal({
    title,
    message,
    type,
    confirmText: "Sim, Confirmar",
    confirmColor: type === "danger" ? "#ef4444" : "#2563eb",
    onConfirm
  });
};

/**
 * Toast global de feedback rápido
 */
window.showToast = function(type, message) {
  const existing = document.getElementById("pf-toast-root");
  if (existing) existing.remove();

  const iconMap = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    warning: "fa-triangle-exclamation"
  };

  const toastHTML = `
    <div id="pf-toast-root" class="pf-toast-container pf-toast-${type}">
      <i class="fa-solid ${iconMap[type] || "fa-info-circle"}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", toastHTML);
  const toast = document.getElementById("pf-toast-root");
  
  setTimeout(() => toast.classList.add("active"), 10);
  
  setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
};

/**
 * Sanitiza strings para prevenir ataques XSS ao injetar via innerHTML.
 * Converte caracteres perigosos em entidades HTML.
 * @param {string} str 
 * @returns {string}
 */
window.escapeHTML = function(str) {
  if (!str) return "";
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
};

// frontend/script/components.js

/**
 * Renderiza a Bottom Navigation para as telas do Paciente.
 * Injeta o HTML no final do elemento '.app-container'.
 * 
 * @param {string} currentPage - 'home', 'treinamento', ou 'progresso'
 */
function renderBottomNav(currentPage) {
  const appContainer = document.querySelector('.app-container');
  if (!appContainer) {
    console.warn("components.js: Elemento .app-container não encontrado para injetar a Bottom Nav.");
    return;
  }

  // Define qual item está ativo baseando-se no parâmetro
  const isHome = currentPage === 'home' ? 'active' : '';
  const isTreinamento = currentPage === 'treinamento' ? 'active' : '';
  const isProgresso = (currentPage === 'progresso' || currentPage === 'perfil') ? 'active' : '';

  // Utilizado caminho relativo assumindo que as telas estão em /pages/funcionalidades/ ou /pages/perfil/
  const basePath = "/pages";

  const navHTML = `
    <!-- Bottom Navigation Component (Injetado via JS) -->
    <div class="bottom-nav">
      <a href="${basePath}/funcionalidades/home.html" class="nav-item ${isHome}">
        <i class="fa-solid fa-house"></i>
        <span>Home</span>
      </a>
      <a href="${basePath}/funcionalidades/treinamento.html" class="nav-item ${isTreinamento}">
        <i class="fa-solid fa-dumbbell"></i>
        <span>Exercícios</span>
      </a>
      <a href="${basePath}/funcionalidades/progresso.html" class="nav-item ${isProgresso}">
        <i class="fa-solid fa-chart-line"></i>
        <span>Progresso</span>
      </a>
    </div>
    `;

  appContainer.insertAdjacentHTML('beforeend', navHTML);
}

/**
 * Retorna as iniciais de um nome (até 2 letras).
 * @param {string} name 
 * @returns {string}
 */
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Formata um nome para Capitalize Case (primeira letra de cada palavra em maiúscula).
 * @param {string} name 
 * @returns {string}
 */
function capitalizeName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Gera o HTML para o avatar (imagem ou iniciais).
 * @param {string} name - Nome do usuário
 * @param {string|null} avatarUrl - Nome do arquivo da imagem ou null
 * @param {object} options - Opções de estilo { size, fontSize, border, bgColor }
 * @returns {string} HTML string
 */
function getAvatarHTML(name, avatarUrl, options = {}) {
  const size = options.size || "44px";
  const fontSize = options.fontSize || "16px";
  const border = options.border || "none";
  const bgColor = options.bgColor || "#5b8af5";

  if (avatarUrl) {
    return `<img src="/images/avatars/${avatarUrl}" 
      style="width: ${size}; height: ${size}; border-radius: 50%; object-fit: cover; border: ${border}; display: block;" 
      alt="Avatar de ${name}"
      onerror="this.parentElement.innerHTML='${getInitials(name)}'; this.parentElement.style.background='${bgColor}';">`;
  } else {
    const initials = getInitials(name);
    return `
      <div style="width: ${size}; height: ${size}; border-radius: 50%; background: ${bgColor}; 
        display: flex; align-items: center; justify-content: center; border: ${border};
        color: #fff; font-family: 'Bebas Neue', sans-serif; font-size: ${fontSize}; letter-spacing: 1px;">
        ${initials}
      </div>
    `;
  }
}

/**
 * Adiciona uma conquista (notificação) ao histórico do paciente no LocalStorage.
 * Se a conquista já existir (pelo título), ela não será duplicada a menos que force=true.
 */
/**
 * Adiciona uma conquista (notificação) ao banco de dados via API.
 * Se for uma conquista nova (não regisrada anteriormente), exibe o popup.
 */
async function addAchievement(title, description, icon = "fa-medal", alert = false) {
  try {
    const response = await fetch("/api/conquistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title, description, icon, alert })
    });
    
    if (!response.ok) return null;
    const data = await response.json();

    // Se a API confirmou que foi criada agora (não existia), mostra o popup visual
    if (data && !data.alreadyHad) {
      showAchievementPopup(title, description, icon);
    }

    return data;
  } catch (e) {
    console.error("Erro salvando conquista na API", e);
    return null;
  }
}

/**
 * Cria e exibe o popup de conquista em qualquer tela que tenha components.js
 */
function showAchievementPopup(name, desc, icon = "fa-medal") {
  // Remove popup anterior se existir
  const old = document.getElementById("globalAchievementPopup");
  if (old) old.remove();

  const popup = document.createElement("div");
  popup.id = "globalAchievementPopup";
  popup.className = "achievement-popup";
  // Estilo inline para garantir que funcione em qualquer página sem depender de CSS externo específico
  popup.style.cssText = `
    position: fixed;
    top: -150px;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: white;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
    z-index: 9999;
    width: 90%;
    max-width: 400px;
    transition: top 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
  `;

  popup.innerHTML = `
    <i class="fa-solid ${icon}" style="font-size: 32px; color: #fbbf24; margin-bottom: 8px;"></i>
    <h3 style="font-family: 'Bebas Neue', sans-serif; font-size: 24px; margin: 0; letter-spacing: 1px; color: #fff;">CONQUISTA!</h3>
    <p style="font-size: 16px; font-weight: bold; margin: 8px 0 4px; color: #fff;">${name}</p>
    <p style="font-size: 13px; opacity: 0.9; margin: 0; color: #fff;">${desc}</p>
    <div style="width: 100%; background: rgba(255,255,255,0.2); height: 3px; border-radius: 2px; margin-top: 15px; overflow: hidden;">
      <div id="popupProgressLine" style="width: 100%; height: 100%; background: #fbbf24; transition: width 5s linear;"></div>
    </div>
  `;

  document.body.appendChild(popup);

  // Anima entrada
  setTimeout(() => {
    popup.style.top = "20px";
    const bar = document.getElementById("popupProgressLine");
    if (bar) setTimeout(() => bar.style.width = "0%", 100);
  }, 100);

  // Fecha ao clicar
  popup.onclick = () => {
    popup.style.top = "-150px";
    setTimeout(() => popup.remove(), 600);
  };

  // Auto-fecha após 5s
  setTimeout(() => {
    if (popup.parentElement) {
      popup.style.top = "-150px";
      setTimeout(() => popup.remove(), 600);
    }
  }, 5000);
}

/**
 * Verifica marcos de progresso e atribui conquistas automaticamente.
 * Pode ser chamado de qualquer página (Home, Treino, Progresso).
 */
// Regras globais de conquistas para uso em todo o app (popups e tela de progresso)
window.ACHIEVEMENT_RULES = [
  { id: "primeiroTreino", cond: stats => stats.exerciciosConcluidos > 0, name: "Primeiro Treino", desc: "Inicie sua jornada no app", bg: "#dcfce7", color: "#16a34a", icon: "fa-medal" },
  { id: "focoSemanal", cond: stats => stats.diasTreinados >= 3, name: "Foco Total", desc: "3 dias de atividades", bg: "#dbeafe", color: "#2563eb", icon: "fa-medal" },
  { id: "dezExercicios", cond: stats => stats.exerciciosConcluidos >= 10, name: "Iniciante Forte", desc: "10 exercícios concluídos", bg: "#fef9c3", color: "#ca8a04", icon: "fa-medal" },
  { id: "guerreiro", cond: stats => stats.diasTreinados >= 20, name: "Guerreiro da Fisio", desc: "20 dias de treino", bg: "#f3e8ff", color: "#9333ea", icon: "fa-medal" },
  { id: "cinquentaExercicios", cond: stats => stats.exerciciosConcluidos >= 50, name: "Atleta Dedicado", desc: "50 exercícios concluídos", bg: "#ffedd5", color: "#ea580c", icon: "fa-medal" },
  { id: "cinquentaDias", cond: stats => stats.diasTreinados >= 50, name: "Constância de Ferro", desc: "50 dias de treino", bg: "#e0e7ff", color: "#4f46e5", icon: "fa-medal" },
  { id: "cemExercicios", cond: stats => stats.exerciciosConcluidos >= 100, name: "Mestre do Movimento", desc: "100 exercícios concluídos", bg: "#fef3c7", color: "#d97706", icon: "fa-medal" },
  { id: "cemDias", cond: stats => stats.diasTreinados >= 100, name: "Resiliência Pura", desc: "100 dias ininterruptos de empenho", bg: "#ecfeff", color: "#0891b2", icon: "fa-gem" },
  { id: "tempoSaude", cond: stats => stats.tempoTotalMinutos >= 60, name: "Tempo é Saúde", desc: "Completou 1 hora total de exercícios", bg: "#ccfbf1", color: "#0d9488", icon: "fa-hourglass-half" },
  { id: "superDedicado", cond: stats => stats.tempoTotalMinutos >= 300, name: "Super Dedicado", desc: "Completou 5 horas totais de fisioterapia", bg: "#fae8ff", color: "#c026d3", icon: "fa-award" },
  { id: "perseveranca", cond: stats => stats.diasComTreinoCompleto >= 5, name: "Perseverança", desc: "Concluiu 5 treinos diários 100%", bg: "#fef3c7", color: "#d97706", icon: "fa-check-double" },
  { id: "mestreSemana", cond: stats => stats.mesAtualDiasConcluidos >= 7, name: "Mestre da Semana", desc: "Completou 7 dias no mês atual", bg: "#dcfce7", color: "#15803d", icon: "fa-calendar-check" }
];

async function checkMilestones() {
  try {
    const res = await fetch("/api/prescricoes/me/stats", { credentials: "include" });
    if (!res.ok) return;
    const stats = await res.json();

    for (const rule of window.ACHIEVEMENT_RULES) {
      if (rule.cond(stats)) {
        await addAchievement(rule.name, rule.desc, rule.icon);
      }
    }
    
    return stats; // Retorna os stats para quem chamou (ex: progresso.js)
  } catch (e) {
    console.error("Erro ao verificar marcos:", e);
  }
}
