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
async function checkMilestones() {
  try {
    const res = await fetch("/api/prescricoes/me/stats", { credentials: "include" });
    if (!res.ok) return;
    const stats = await res.json();

    // Definição das regras de conquistas
    const rules = [
      { id: "primeiroTreino", cond: stats.exerciciosConcluidos > 0, name: "Primeiro Treino", desc: "Inicie sua jornada no app", bg: "#dcfce7", color: "#16a34a" },
      { id: "focoSemanal", cond: stats.diasTreinados >= 3, name: "Foco Total", desc: "3 dias de atividades", bg: "#dbeafe", color: "#2563eb" },
      { id: "dezExercicios", cond: stats.exerciciosConcluidos >= 10, name: "Iniciante Forte", desc: "10 exercícios concluídos", bg: "#fef9c3", color: "#ca8a04" },
      { id: "guerreiro", cond: stats.diasTreinados >= 20, name: "Guerreiro da Fisio", desc: "20 dias de treino", bg: "#f3e8ff", color: "#9333ea" },
      { id: "cinquentaExercicios", cond: stats.exerciciosConcluidos >= 50, name: "Atleta Dedicado", desc: "50 exercícios concluídos", bg: "#ffedd5", color: "#ea580c" },
      { id: "cinquentaDias", cond: stats.diasTreinados >= 50, name: "Constância de Ferro", desc: "50 dias de treino", bg: "#e0e7ff", color: "#4f46e5" },
      { id: "cemExercicios", cond: stats.exerciciosConcluidos >= 100, name: "Mestre do Movimento", desc: "100 exercícios concluídos", bg: "#fef3c7", color: "#d97706" },
      { id: "cemDias", cond: stats.diasTreinados >= 100, name: "Resiliência Pura", desc: "100 dias ininterruptos de empenho", bg: "#ecfeff", color: "#0891b2", icon: "fa-gem" },
      
      // NOVAS CONQUISTAS
      { id: "tempoSaude", cond: stats.tempoTotalMinutos >= 60, name: "Tempo é Saúde", desc: "Completou 1 hora total de exercícios", bg: "#ccfbf1", color: "#0d9488", icon: "fa-hourglass-half" },
      { id: "superDedicado", cond: stats.tempoTotalMinutos >= 300, name: "Super Dedicado", desc: "Completou 5 horas totais de fisioterapia", bg: "#fae8ff", color: "#c026d3", icon: "fa-award" },
      { id: "perseveranca", cond: stats.diasComTreinoCompleto >= 5, name: "Perseverança", desc: "Concluiu 5 treinos diários 100%", bg: "#fef3c7", color: "#d97706", icon: "fa-check-double" },
      { id: "mestreSemana", cond: stats.mesAtualDiasConcluidos >= 7, name: "Mestre da Semana", desc: "Completou 7 dias no mês atual", bg: "#dcfce7", color: "#15803d", icon: "fa-calendar-check" }
    ];

    for (const rule of rules) {
      if (rule.cond) {
        // addAchievement já lida com a verificação de duplicados e exibição do popup
        await addAchievement(rule.name, rule.desc, rule.icon || "fa-medal");
      }
    }
    
    return stats; // Retorna os stats para quem chamou (ex: progresso.js)
  } catch (e) {
    console.error("Erro ao verificar marcos:", e);
  }
}
