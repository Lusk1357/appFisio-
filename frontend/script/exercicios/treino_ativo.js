document.addEventListener("DOMContentLoaded", () => {
  // ── Refs ──────────────────────────────────────────────────────
  const backBtn = document.getElementById("backBtn");
  const muteBtn = document.getElementById("muteBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const nextBtn = document.getElementById("nextBtn");
  const currentTimerDisplay = document.getElementById("currentTimer");
  const exerciseStep = document.getElementById("exerciseStep");
  const exerciseTitle = document.getElementById("exerciseTitle");
  const exerciseSeries = document.getElementById("exerciseSeries");
  const exerciseObservation = document.getElementById("exerciseObservation");
  const exerciseHowTo = document.getElementById("exerciseHowTo");
  const howToSection = document.getElementById("howToSection");
  const howToToggle = document.getElementById("howToToggle");
  const howToBody = document.getElementById("howToBody");
  const howToChevron = document.getElementById("howToChevron");
  const mediaContainer = document.getElementById("mediaContainer");
  const pillsContainer = document.getElementById("progressPillsContainer");

  const restOverlay = document.getElementById("restOverlay");
  const restTimerEl = document.getElementById("restTimer");
  const restNextName = document.getElementById("restNextName");
  const restCircle = document.getElementById("restCircle");
  const btnSkipRest = document.getElementById("btnSkipRest");

  const completionOverlay = document.getElementById("completionOverlay");
  const confettiArea = document.getElementById("confettiArea");
  const statExercicios = document.getElementById("statExercicios");
  const statTempo = document.getElementById("statTempo");
  const completionList = document.getElementById("completionList");
  const btnFinish = document.getElementById("btnFinish");

  // ── Lê exercícios do sessionStorage ───────────────────────────
  const treinoJSON = sessionStorage.getItem("treinoAtivo");
  if (!treinoJSON) {
    window.location.href = "/pages/funcionalidades/treinamento.html";
    return;
  }

  const treino = JSON.parse(treinoJSON);
  console.log("Treino Ativo Carregado (v2.2):", treino);
  const exercises = treino.exercises.filter((e) => !e.completed);

  if (exercises.length === 0) {
    window.location.href = "/pages/funcionalidades/treinamento.html";
    return;
  }

  const totalExercises = exercises.length;
  let currentExercise = 0;
  let currentSet = 1;
  let totalSetsForExercise = 1;

  let secondsElapsed = 0;
  let totalSecondsElapsed = 0;
  let isPaused = false;
  let isMuted = true;
  let timerInterval = null;
  let restInterval = null;
  const circleCircumference = 2 * Math.PI * 52; // r=52

  restCircle.style.strokeDasharray = circleCircumference;
  restCircle.style.strokeDashoffset = 0;

  const startTime = Date.now();

  // ── Fila de Sincronização (Progresso Parcial) ─────────────────
  let exercisesToSync = [];

  function enqueueForSync(ex) {
    ex.completed = true;
    if (ex.prescriptionExerciseId && !exercisesToSync.includes(ex.prescriptionExerciseId)) {
      exercisesToSync.push(ex.prescriptionExerciseId);
    }
    // Atualiza cache local para não perder caso recarregue a página
    const treinoJSONL = sessionStorage.getItem("treinoAtivo");
    if (treinoJSONL) {
      const storedTreino = JSON.parse(treinoJSONL);
      const tEx = storedTreino.exercises.find(e => e.prescriptionExerciseId === ex.prescriptionExerciseId);
      if (tEx) tEx.completed = true;
      sessionStorage.setItem("treinoAtivo", JSON.stringify(storedTreino));
    }
  }

  function syncProgress() {
    if (exercisesToSync.length === 0) return Promise.resolve();
    const idsToSync = [...exercisesToSync];
    return fetch("/api/prescricoes/me/complete", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ prescriptionExerciseIds: idsToSync }),
    }).then(res => {
      if (!res.ok) throw new Error("Falha na sincronização");
      exercisesToSync = exercisesToSync.filter(id => !idsToSync.includes(id));
    }).catch(err => {
      console.error("Erro ao sincronizar progresso parcial:", err);
      throw err;
    });
  }

  // ── Accordion Como Executar ───────────────────────────────────
  let howToOpen = false;
  if (howToToggle) {
    howToToggle.addEventListener("click", () => {
      howToOpen = !howToOpen;
      howToBody.style.display = howToOpen ? "block" : "none";
      if (howToChevron)
        howToChevron.style.transform = howToOpen ? "rotate(180deg)" : "";
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  function formatTime(s) {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  // ── Pills de progresso ─────────────────────────────────────────
  function buildPills() {
    pillsContainer.innerHTML = "";
    exercises.forEach((_, i) => {
      const pill = document.createElement("div");
      pill.className = "progress-pill" + (i === 0 ? " active" : "");
      pill.dataset.index = i;
      pillsContainer.appendChild(pill);
    });
  }

  function updatePills(index) {
    document.querySelectorAll(".progress-pill").forEach((pill, i) => {
      pill.className = "progress-pill";
      if (i < index) pill.classList.add("done");
      else if (i === index) pill.classList.add("active");
    });
  }

  // ── Mídia ─────────────────────────────────────────────────────
  function loadMedia(videoUrl, imageUrl) {
    Array.from(mediaContainer.children).forEach((child) => {
      if (child.id !== "backBtn" && child.id !== "muteBtn") child.remove();
    });

    const fallback =
      imageUrl ||
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    muteBtn.style.display = "none";

    const injetarImagem = (src) => {
      const img = document.createElement("img");
      img.className = "header-img";
      img.style.objectFit = "contain";
      img.style.background = "#f8fafc";
      img.onerror = () => {
        if (img.src !== fallback) img.src = fallback;
      };
      img.src = src || fallback;
      mediaContainer.appendChild(img);
    };

    if (!videoUrl || typeof videoUrl !== "string" || videoUrl.trim() === "") {
      injetarImagem(imageUrl);
      return;
    }

    // Extrator Seguro de YouTube
    const ytMatch = videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    );

    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&rel=0&enablejsapi=1`;
      iframe.className = "header-img";
      iframe.style.cssText = "border:none;width:100%;height:100%;";
      iframe.allow = "autoplay; encrypted-media";
      iframe.allowFullscreen = true;
      mediaContainer.appendChild(iframe);
      isMuted = true;
      muteBtn.style.display = "flex";
      updateMuteIcon();
      return;
    }

    // Se for imagem
    if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(videoUrl)) {
      injetarImagem(videoUrl);
      return;
    }

    // ── Tenta rodar como Vídeo nativo ──
    const video = document.createElement("video");
    // muted é ESSENCIAL para o autoplay funcionar em navegadores modernos
    Object.assign(video, {
      loop: true,
      muted: true,
      playsInline: true,
      controls: false,
    });
    video.className = "header-img";
    video.style.objectFit = "contain";
    video.style.background = "#000";

    video.onerror = () => {
      console.warn("O vídeo falhou ao carregar. Mostrando imagem.");
      video.remove();
      injetarImagem(imageUrl || videoUrl);
    };

    video.src = videoUrl;
    mediaContainer.appendChild(video);

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Autoplay foi bloqueado pelo navegador
        console.warn(
          "Autoplay bloqueado pelo navegador. Exibindo controles.",
          error,
        );
        video.controls = true; // Exibe os controles para o usuário dar play manualmente
      });
    }
  }

  // ── Mudo (YouTube) ───────────────────────────────────────────
  function updateMuteIcon() {
    muteBtn.innerHTML = isMuted
      ? '<i class="fa-solid fa-volume-xmark"></i>'
      : '<i class="fa-solid fa-volume-high"></i>';
  }

  function sendYTCommand(fn) {
    const iframe = mediaContainer.querySelector("iframe");
    if (iframe?.contentWindow)
      iframe.contentWindow.postMessage(
        `{"event":"command","func":"${fn}","args":""}`,
        "*",
      );
  }

  muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    sendYTCommand(isMuted ? "mute" : "unMute");
    updateMuteIcon();
  });

  function loadExercise(index, isNewExercise = true) {
    const ex = exercises[index];

    // Transição suave apenas ao trocar de exercício
    if (isNewExercise) {
      const card = document.querySelector(".detail-card");
      card.classList.add("slide-out");
      setTimeout(() => {
        card.classList.remove("slide-out");
        card.classList.add("slide-in");
        setTimeout(() => card.classList.remove("slide-in"), 300);
      }, 250);

      // Parseia o número de séries do exercício (ex: "3x15" -> 3)
      currentSet = 1;
      totalSetsForExercise = 1;
      if (ex.series) {
        const match = ex.series.match(/^(\d+)x/i); // Busca padrão "Nx..."
        if (match && match[1]) {
          totalSetsForExercise = parseInt(match[1], 10);
        }
      }
    }

    exerciseTitle.innerText = ex.name.toUpperCase();
    exerciseStep.innerText = `Exercício ${index + 1} de ${totalExercises}`;

    if (exerciseSeries) exerciseSeries.innerText = ex.series || "-";
    if (exerciseObservation) {
      if (ex.observation) {
        exerciseObservation.innerText = ex.observation;
        exerciseObservation.style.display = "block";
      } else {
        exerciseObservation.style.display = "none";
      }
    }

    // Como Executar
    if (howToSection && exerciseHowTo) {
      if (ex.howToExecute) {
        exerciseHowTo.innerText = ex.howToExecute;
        howToSection.style.display = "block";
        // Reset accordion to closed on new exercise
        if (isNewExercise) {
          howToOpen = false;
          howToBody.style.display = "none";
          if (howToChevron) howToChevron.style.transform = "";
        }
      } else {
        howToSection.style.display = "none";
      }
    }

    secondsElapsed = 0;
    currentTimerDisplay.innerText = formatTime(0);
    updatePills(index);

    if (isNewExercise) {
      loadMedia(ex.videoUrl, ex.imageUrl);
    }

    updateNextButtonText();
  }

  function updateNextButtonText() {
    if (currentSet < totalSetsForExercise) {
      nextBtn.innerHTML = `<i class="fa-solid fa-check"></i> Série ${currentSet}/${totalSetsForExercise}`;
    } else {
      if (currentExercise >= totalExercises - 1) {
        nextBtn.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> Concluir Treino`;
      } else {
        nextBtn.innerHTML = `<i class="fa-solid fa-person-running"></i> Próximo Exer.`;
      }
    }
  }


  // ── Pausar mídia ──────────────────────────────────────────────
  function pauseMedia() {
    const video = mediaContainer.querySelector("video");
    if (video) video.pause();
    sendYTCommand("pauseVideo");
  }

  function playMedia() {
    const video = mediaContainer.querySelector("video");
    if (video) video.play();
    sendYTCommand("playVideo");
  }

  // ── Timer principal ────────────────────────────────────────────
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!isPaused) {
        secondsElapsed++;
        totalSecondsElapsed++;
        currentTimerDisplay.innerText = formatTime(secondsElapsed);
      }
    }, 1000);
  }

  // ── Tela de descanso (Agora entre Séries) ─────────────────────
  function startRestScreen() {
    clearInterval(timerInterval);
    pauseMedia();

    const currentEx = exercises[currentExercise];
    restNextName.innerText = `Série ${currentSet + 1} de ${currentEx.name}`;

    const restSeconds = currentEx.restTime ? parseInt(currentEx.restTime) : 60;
    let restLeft = restSeconds;

    restTimerEl.innerText = restLeft;
    restCircle.style.strokeDashoffset = 0;

    restOverlay.classList.add("open");

    restInterval = setInterval(() => {
      restLeft--;
      totalSecondsElapsed++;
      restTimerEl.innerText = restLeft;
      const offset = circleCircumference * (1 - restLeft / restSeconds);
      restCircle.style.strokeDashoffset = offset;

      if (restLeft <= 0) {
        finishRest();
      }
    }, 1000);
  }

  function finishRest() {
    clearInterval(restInterval);
    restOverlay.classList.remove("open");

    currentSet++;
    loadExercise(currentExercise, false); // false = não recarregar vídeo, apenas atualizar texto/série

    isPaused = false;
    pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
    document.getElementById("bottomBar").classList.remove("paused-mode");
    playMedia();
    startTimer();
  }

  btnSkipRest.addEventListener("click", () => {
    clearInterval(restInterval);
    finishRest();
  });

  // ── Tela de conclusão ─────────────────────────────────────────
  function showCompletion() {
    clearInterval(timerInterval);
    statExercicios.innerText = totalExercises;
    statTempo.innerText = formatTime(totalSecondsElapsed);

    completionList.innerHTML = exercises
      .map((e) => `<li><i class="fa-solid fa-circle-check"></i> ${e.name}</li>`)
      .join("");

    launchConfetti();
    completionOverlay.style.display = "flex";

    if (exercisesToSync.length > 0) {
      btnFinish.disabled = true;
      btnFinish.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Finalizando no servidor...';

      syncProgress()
        .then(() => {
          btnFinish.disabled = false;
          btnFinish.innerHTML = '<i class="fa-solid fa-house"></i> IR PARA O INÍCIO';
          
          sessionStorage.removeItem("treinoAtivo");
          if (typeof checkMilestones === "function") checkMilestones();
        })
        .catch((err) => {
          console.error("Erro ao marcar conclusão:", err);
          btnFinish.disabled = false;
          btnFinish.innerHTML = '<i class="fa-solid fa-rotate"></i> TENTAR NOVAMENTE';
          if (typeof showToast === "function") {
              showToast("error", "Erro ao salvar no servidor. Verifique conexão e tente novamente.");
          }
        });
    } else {
        sessionStorage.removeItem("treinoAtivo");
        if (typeof checkMilestones === "function") checkMilestones();
    }
  }

  btnFinish.addEventListener("click", () => {
    window.location.href = "/pages/funcionalidades/treinamento.html";
  });


  // ── Confete ───────────────────────────────────────────────────
  function launchConfetti() {
    const colors = [
      "#5b8af5",
      "#a3cd39",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#10b981",
    ];
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        animation-delay: ${Math.random() * 1}s;
        animation-duration: ${1.5 + Math.random() * 1.5}s;
      `;
      confettiArea.appendChild(piece);
    }
  }

  // ── Controles ─────────────────────────────────────────────────
  backBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    clearInterval(restInterval);
    
    // Espera o progresso sincronizar na API para evitar race condition
    const originalHtml = backBtn.innerHTML;
    backBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    backBtn.disabled = true;

    syncProgress()
      .catch(e => console.error("Sincronização falhou na saída:", e))
      .finally(() => {
        window.location.href = "/pages/funcionalidades/treinamento.html";
      });
  });


  pauseBtn.addEventListener("click", () => {
    isPaused = !isPaused;
    if (isPaused) {
      pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Retomar';
      document.getElementById("bottomBar").classList.add("paused-mode");
      pauseMedia();
    } else {
      pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pausar';
      document.getElementById("bottomBar").classList.remove("paused-mode");
      playMedia();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentSet < totalSetsForExercise) {
      // Ainda tem séries desse exercício -> Tela de descanso
      startRestScreen();
    } else {
      // Última série concluída -> Oculta o atual e prepara o próximo
      enqueueForSync(exercises[currentExercise]);

      if (currentExercise >= totalExercises - 1) {
        showCompletion(); // Último exercício do treino
      } else {
        currentExercise++;
        loadExercise(currentExercise, true);
      }
    }
  });

  // ── Init ──────────────────────────────────────────────────────
  buildPills();
  loadExercise(0);
  startTimer();
});
