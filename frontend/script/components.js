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
 * Adiciona uma conquista (notificação) ao histórico do paciente no LocalStorage.
 * Se a conquista já existir (pelo título), ela não será duplicada a menos que force=true.
 */
function addAchievement(title, description, icon = "fa-medal", alert = false, force = false) {
  const STORAGE_KEY = "proFisioAchievements";
  let achievements = [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) achievements = JSON.parse(data);
  } catch (e) { console.error("Erro lendo achievements", e); }

  // Evitar duplicações pelo título (ex: não ganhar "Primeiro Passo" duas vezes)
  if (!force) {
    const alreadyHas = achievements.find(a => a.title === title);
    if (alreadyHas) return false; // Já possui
  }

  achievements.push({
    title,
    description,
    icon,
    alert,
    timestamp: Date.now()
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(achievements));
  return true;
}
