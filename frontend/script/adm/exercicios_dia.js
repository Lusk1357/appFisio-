/* exercicios_dia.js */

document.addEventListener("DOMContentLoaded", () => {
	const STORAGE_KEY = "pacientesProFisio";

	// ── Catálogo de exercícios e rotinas do BD ────────────────────
	let CATALOGO = [];
	let ROTINAS = [];
	let isInitialLoading = true; // Flag para evitar modal vazio antes da API responder

	async function loadCatalogo() {
		try {
			// Usando pfFetch (global definido em components.js) com TTL de 5 min
			const res = await pfFetch("/api/exercicios", { credentials: "include" }, 300000);
			const data = await res.json();
			CATALOGO = data; 
		} catch (e) {
			console.error("Erro ao puxar exercícios da API", e);
		}
	}

	async function loadRotinas() {
		try {
			// Usando pfFetch com TTL de 5 min
			const res = await pfFetch("/api/rotinas", { credentials: "include" }, 300000);
			const data = await res.json();
			ROTINAS = data;
		} catch (e) {
			console.error("Erro ao puxar rotinas da API", e);
		}
	}

	async function initData() {
		isInitialLoading = true;
		await Promise.all([loadCatalogo(), loadRotinas()]);
		isInitialLoading = false;
		
		renderExercises();
        renderPopupFilters();
        setupPopupFilters();

		// Se o modal estiver aberto (mostrando o "Carregando..."), atualiza ele agora que os dados chegaram
		const modal = document.getElementById("overlayExercises");
		if (modal && modal.classList.contains("open")) {
			openPickList(activeExerciseIndex);
		}
	}
	initData();

    // ── Lógica de Filtros do Popup ────────────────────────────────
    function renderPopupFilters() {
        const filtersContainer = document.getElementById("popupCategoryFilters");
        if (!filtersContainer) return;
        
        filtersContainer.innerHTML = '<span class="popup-category-chip active" data-category="all">Todos</span>';
        const categories = [...new Set(CATALOGO.map(ex => ex.type).filter(Boolean))].sort();
        
        categories.forEach(cat => {
            const chip = document.createElement("span");
            chip.className = "popup-category-chip";
            chip.dataset.category = cat;
            chip.textContent = cat;
            filtersContainer.appendChild(chip);
        });
    }

    function setupPopupFilters() {
        const searchInput = document.getElementById("popupSearchExercise");
        const filtersContainer = document.getElementById("popupCategoryFilters");
        if (!searchInput || !filtersContainer) return;

        searchInput.addEventListener("input", applyPopupFilters);

        filtersContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("popup-category-chip")) {
                const chips = filtersContainer.querySelectorAll(".popup-category-chip");
                chips.forEach(c => c.classList.remove("active"));
                e.target.classList.add("active");
                applyPopupFilters();
            }
        });
    }

    function applyPopupFilters() {
        const searchInput = document.getElementById("popupSearchExercise");
        const activeChip = document.querySelector(".popup-category-chip.active");
        if (!searchInput || !activeChip) return;

        const term = searchInput.value.toLowerCase().trim();
        const activeCategory = activeChip.dataset.category;
        const items = document.querySelectorAll("#exercisePickList li");

        items.forEach(li => {
            if (li.style.pointerEvents === "none") return;
            
            const isRoutine = li.innerHTML.includes("🌟");
            const text = li.textContent.replace("🌟 Rotina:", "").trim();

            if (isRoutine) {
                const matchesSearch = li.textContent.toLowerCase().includes(term);
                const matchesCategory = activeCategory === "all"; 
                if (matchesSearch && matchesCategory) li.classList.remove("hidden");
                else li.classList.add("hidden");
            } else {
                const exObj = CATALOGO.find(ex => ex.name === li.textContent);
                const matchesSearch = li.textContent.toLowerCase().includes(term);
                const matchesCategory = activeCategory === "all" || (exObj && exObj.type === activeCategory);
                if (matchesSearch && matchesCategory) li.classList.remove("hidden");
                else li.classList.add("hidden");
            }
        });

        // Ocultar labels vazios
        const labels = document.querySelectorAll("#exercisePickList li[style*='pointer-events: none']");
        labels.forEach(label => {
            let next = label.nextElementSibling;
            let hasVisible = false;
            while (next && next.style.pointerEvents !== "none") {
                if (!next.classList.contains("hidden")) {
                    hasVisible = true;
                    break;
                }
                next = next.nextElementSibling;
            }
            if (hasVisible) label.classList.remove("hidden");
            else label.classList.add("hidden");
        });

        // Mensagem de "Nenhum resultado para o filtro"
        let noResultsMsg = document.getElementById("noFilterResults");
        const anyVisible = Array.from(items).some(li => li.style.pointerEvents !== "none" && !li.classList.contains("hidden"));
        
        if (!anyVisible && CATALOGO.length > 0) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement("p");
                noResultsMsg.id = "noFilterResults";
                noResultsMsg.style = "padding: 20px; text-align: center; color: #64748b; font-size: 14px;";
                noResultsMsg.textContent = "Nenhum exercício encontrado com esse filtro.";
                document.getElementById("exercisePickList").appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = "block";
        } else if (noResultsMsg) {
            noResultsMsg.style.display = "none";
        }
    }

	// ── Lê contexto ───────────────────────────────────────────────
	const rawPac = sessionStorage.getItem("pacienteSelecionado");
	const rawCtx = sessionStorage.getItem("exerciciosDiaContexto");
	if (!rawPac || !rawCtx) {
		history.back();
		return;
	}

	const paciente = JSON.parse(rawPac);
	const ctx = JSON.parse(rawCtx); // { ano, mes, dias[] }

	// ── Nomes dos dias e meses ────────────────────────────────────
	const DIAS_SEMANA = [
		"Domingo",
		"Segunda",
		"Terça",
		"Quarta",
		"Quinta",
		"Sexta",
		"Sábado",
	];
	const MESES = [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	];

	// ── Estado ────────────────────────────────────────────────────
	let currentDayIndex = 0; // índice dentro de ctx.dias[]

	// exerciciosPorDia: { [dia]: [{id, name}, ...] }
	const exerciciosPorDia = {};
	ctx.dias.forEach((d) => {
		exerciciosPorDia[d] = [];
	});

	// Buscando treinos do banco para pré-preencher
	async function loadExistingPrescriptions() {
		try {
			const res = await fetch(`/api/prescricoes/admin/${paciente.id}?month=${ctx.mes + 1}&year=${ctx.ano}`, {
				credentials: "include"
			});
			if (res.ok) {
				const treinos = await res.json();

				treinos.forEach(treino => {
					const assignedDate = new Date(treino.assignedDay);
					// Usamos getUTCDate() para evitar que o fuso horário local altere o dia (ex: 22 virar 21)
					const dia = assignedDate.getUTCDate();

					// Se o administrador abriu esse dia no calendário, carregamos os ex.
					if (ctx.dias.includes(dia)) {
						treino.exercises.forEach(pe => {
							const exObj = {
								id: pe.exercise.id,
								name: pe.exercise.name,
								type: pe.exercise.type,
								series: pe.series,
								observation: pe.observation,
								restTime: pe.restTime
							};

							// Evita duplicatas caso a API retorne algo estranho (embora não devesse)
							const jaTem = exerciciosPorDia[dia].some(e => e.id === exObj.id);
							if (!jaTem) {
								exerciciosPorDia[dia].push(exObj);
							}
						});
					}
				});

				// Re-renderiza após carregar os dados
				renderExercises();
				updateSaveBtn();
			}
		} catch (error) {
			console.error("Erro ao puxar prescrições antigas", error);
		}
	}
	// Acionamos a busca
	loadExistingPrescriptions();

	// Variáveis de estado dos popups
	let activeExerciseIndex = null; // índice do exercício sendo operado
	let pendingSwapName = null; // nome do novo exercício a confirmar troca
	let pendingAddPayload = null; // o que estamos adicionando (rotina ou exercício)

	// ── Hero ─────────────────────────────────────────────────────
	const nameEl = document.getElementById("patientName");
	const avatarEl = document.getElementById("avatarDisplay");

	if (nameEl)
		nameEl.textContent = paciente.name ? paciente.name.toUpperCase() : "—";
	if (avatarEl) {
		if (paciente.patientProfile?.avatar) {
			avatarEl.innerHTML = `<img src="/images/avatars/${paciente.patientProfile.avatar}" alt="${paciente.name}" />`;
		} else {
			const initials = (paciente.name || "")
				.split(" ")
				.filter(Boolean)
				.slice(0, 2)
				.map((w) => w[0].toUpperCase())
				.join("");
			avatarEl.innerHTML = `<span style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:#7aa3ec;letter-spacing:2px">${initials || "?"}</span>`;
		}
	}

	// ── Label mês/ano ─────────────────────────────────────────────
	document.getElementById("monthYearLabel").textContent =
		`${MESES[ctx.mes]} ${ctx.ano}`;

	// ── Navegação de dias ─────────────────────────────────────────
	renderDayNav();
	renderExercises();

	document.getElementById("btnPrevDay").addEventListener("click", () => {
		if (currentDayIndex > 0) {
			currentDayIndex--;
			renderDayNav();
			renderExercises();
		}
	});

	document.getElementById("btnNextDay").addEventListener("click", () => {
		if (currentDayIndex < ctx.dias.length - 1) {
			currentDayIndex++;
			renderDayNav();
			renderExercises();
		}
	});

	function renderDayNav() {
		const d = ctx.dias[currentDayIndex];
		const dateObj = new Date(ctx.ano, ctx.mes, d);
		const diaSemana = DIAS_SEMANA[dateObj.getDay()];

		// Monta label com TODOS os dias: "Segunda 01, Terça 02, ..."
		const allDaysLabel = ctx.dias
			.map((day) => {
				const obj = new Date(ctx.ano, ctx.mes, day);
				return `${DIAS_SEMANA[obj.getDay()]} ${String(day).padStart(2, "0")}`;
			})
			.join(", ");

		document.getElementById("dayLabel").textContent =
			`${diaSemana} ${String(d).padStart(2, "0")}`;

		// Esconde setas quando não há mais dias naquela direção
		document.getElementById("btnPrevDay").style.visibility =
			currentDayIndex === 0 ? "hidden" : "visible";
		document.getElementById("btnNextDay").style.visibility =
			currentDayIndex === ctx.dias.length - 1 ? "hidden" : "visible";
	}

	// ── Render lista de exercícios ────────────────────────────────
	function renderExercises() {
		const dia = ctx.dias[currentDayIndex];
		const list = exerciciosPorDia[dia];
		const container = document.getElementById("exercisesList");
		container.innerHTML = "";

		list.forEach((exObj, idx) => {
			container.appendChild(createExerciseBlock(exObj, idx));
		});

		// Botão "+" sempre ao final
		const addBtn = document.createElement("button");
		addBtn.className = "add-exercise-btn";
		addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
		addBtn.addEventListener("click", () => openPickList(null));
		container.appendChild(addBtn);

		updateSaveBtn();
	}

	function createExerciseBlock(exObj, idx) {
		const block = document.createElement("div");
		block.className = "exercise-block";

		block.innerHTML = `
      <div class="exercise-bg"></div>
      <div class="exercise-overlay">
        <span class="exercise-name">${exObj.name}</span>
      </div>
    `;

		block.addEventListener("click", () => openOptions(idx));
		return block;
	}

	// ── SAVE ─────────────────────────────────────────────────────
	document.getElementById("btnSave").addEventListener("click", salvar);

	function updateSaveBtn() {
		// O botão de salvar deve estar sempre habilitado para permitir limpar dias
		document.getElementById("btnSave").disabled = false;
	}

	async function salvar() {
		const promessas = [];
		ctx.dias.forEach((d) => {
			const exerciciosDoDia = exerciciosPorDia[d];
			
            // Formata ISO date do dia correspondente
            const dataAtribuida = new Date(ctx.ano, ctx.mes, d);
            const arrayIds = exerciciosDoDia.map(ex => {
                return {
                    id: ex.id,
                    series: ex.series,
                    observation: ex.observation,
                    restTime: ex.restTime
                };
            });

            const req = fetch("/api/prescricoes/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    patientId: paciente.id,
                    assignedDay: new Date(Date.UTC(ctx.ano, ctx.mes, d)).toISOString(),
                    exercises: arrayIds
                })
            });
            promessas.push(req);
		});

		try {
			document.getElementById("btnSave").disabled = true;
			document.getElementById("btnSave").textContent = "Salvando...";
			await Promise.all(promessas);
			showToast("success", "Prescrição salva com sucesso! 🚀");
			setTimeout(() => {
				window.location.href = "/pages/adm/perfil_paciente.html";
			}, 1800);
		} catch (e) {
			console.error(e);
			showToast("error", "Erro ao salvar na API. Tente novamente.");
			updateSaveBtn();
			document.getElementById("btnSave").textContent = "SALVAR";
		}
	}

	function openPickList(swappingIndex) {
		activeExerciseIndex = swappingIndex; // null = adicionar, número = trocar
		pendingSwapName = null;

		const ul = document.getElementById("exercisePickList");
		ul.innerHTML = "";

        // Resetar campos de filtro ao abrir
        const searchInput = document.getElementById("popupSearchExercise");
        if (searchInput) searchInput.value = "";
        const chips = document.querySelectorAll(".popup-category-chip");
        chips.forEach(c => c.classList.remove("active"));
        if (chips[0]) chips[0].classList.add("active");

		// Mostra ou esconde o "Aplicar a todos" (se tiver múltiplos dias no contexto)
		const applyAllContainer = document.getElementById("applyAllContainer");
		if (ctx.dias.length > 1 && swappingIndex === null) {
			applyAllContainer.style.display = "flex";
		} else {
			applyAllContainer.style.display = "none";
		}

		const diaInfo = ctx.dias[currentDayIndex];
		const list = exerciciosPorDia[diaInfo];

		if (isInitialLoading) {
			ul.innerHTML = "<p style='padding: 20px; text-align:center; color: #5b8af5'><i class='fa-solid fa-circle-notch fa-spin'></i> Carregando catálogo...</p>";
			// Se ainda está carregando, não renderiza o resto ainda
			openOverlay("overlayExercises");
			return;
		}

		if (CATALOGO.length === 0) {
			ul.innerHTML = "<p style='padding: 20px; text-align:center'>Nenhum exercício encontrado. Cadastre no Painel Administrativo.</p>";
		}

		// Carrega rotinas criadas (se não estiver no modo "Trocar")
		if (swappingIndex === null) {
			if (ROTINAS.length > 0) {
				const labelR = document.createElement("li");
				labelR.textContent = "─ ROTINAS SALVAS ─";
				labelR.style.background = "transparent";
				labelR.style.textAlign = "center";
				labelR.style.pointerEvents = "none";
				ul.appendChild(labelR);

				ROTINAS.forEach(rotina => {
					const li = document.createElement("li");
					li.innerHTML = `🌟 <strong>Rotina:</strong> ${rotina.name}`;
					li.style.background = "#eef2ff"; 
					li.addEventListener("click", () => {
						const chkApplyAll = document.getElementById("chkApplyAll");
						const applyToAll = chkApplyAll && chkApplyAll.checked;

						// Mapeia e injeta exercícios do template
						const exObjs = rotina.exercises.map(re => {
							return {
								id: re.exercise.id,
								name: re.exercise.name,
								type: re.exercise.type,
								series: re.series || "3x15",
								observation: re.observation || re.exercise.observation || null,
								restTime: re.restTime || 60
							};
						});

						const targetDays = applyToAll ? ctx.dias : [diaInfo];
						targetDays.forEach(d => {
							const diaList = exerciciosPorDia[d];
							exObjs.forEach(exObj => {
								if (!diaList.some(i => i.id === exObj.id)) {
									diaList.push(exObj);
								}
							});
						});

						closeOverlay("overlayExercises");
						renderExercises();
						showToast("success", `Rotina "${rotina.name}" aplicada! ✨`);
					});
					ul.appendChild(li);
				});

				const labelE = document.createElement("li");
				labelE.textContent = "─ EXERCÍCIOS INDIVIDUAIS ─";
				labelE.style.background = "transparent";
				labelE.style.textAlign = "center";
				labelE.style.pointerEvents = "none";
				labelE.style.marginTop = "10px";
				ul.appendChild(labelE);
			}
		}

		CATALOGO.forEach((exObj) => {
			const jaFoiAdd = list.some(item => item.id === exObj.id);
			if (jaFoiAdd) return;

			const li = document.createElement("li");
			li.innerHTML = escapeHTML(exObj.name);
			li.addEventListener("click", () => {
				const isSwap = (swappingIndex !== null);
				
				if (isSwap) {
					// MODO TROCA: Carrega o modal de opções com o NOVO exercício, mas com os valores do ANTIGO
					const oldEx = list[swappingIndex];
					pendingAddPayload = { isRoutine: false, exObj: exObj, isSwap: true, oldId: oldEx.id };
					
					document.getElementById("addOptionsTitle").textContent = "Trocar Exercício";
					document.getElementById("btnConfirmAddOptions").textContent = "CONFIRMAR TROCA";
					
					const parts = (oldEx.series || "3x15").toLowerCase().split('x');
					document.getElementById("addSeriesQty").value = parts[0] || "3";
					document.getElementById("addRepsQty").value = parts[1] || "15";
					document.getElementById("addRestTime").value = oldEx.restTime || "60";
					document.getElementById("addObservation").value = oldEx.observation || "";
					
					// Assegura visibilidade do checkbox no modal de opções finais
					const applyAllOptionsContainer = document.getElementById("applyAllOptionsContainer");
					if (ctx.dias.length > 1) {
						applyAllOptionsContainer.style.display = "flex";
					} else {
						applyAllOptionsContainer.style.display = "none";
					}
					
					closeOverlay("overlayExercises");
					openOverlay("overlayAddOptions");
				} else {
					// MODO ADIÇÃO NORMAL
					pendingAddPayload = { isRoutine: false, exObj: exObj, isNewAdd: true };
					document.getElementById("addOptionsTitle").textContent = "Detalhes do Exercício";
					document.getElementById("btnConfirmAddOptions").textContent = "CONFIRMAR INCLUSÃO";
					
					document.getElementById("addSeriesQty").value = "3";
					document.getElementById("addRepsQty").value = "15";
					document.getElementById("addRestTime").value = "60";
					document.getElementById("addObservation").value = exObj.observation || "";
					
					// Assegura visibilidade do checkbox no modal de opções finais
					const applyAllOptionsContainer = document.getElementById("applyAllOptionsContainer");
					if (ctx.dias.length > 1) {
						applyAllOptionsContainer.style.display = "flex";
					} else {
						applyAllOptionsContainer.style.display = "none";
					}
					
					closeOverlay("overlayExercises");
					openOverlay("overlayAddOptions");
				}
			});
			ul.appendChild(li);
		});

		openOverlay("overlayExercises");
	}

	document.getElementById("btnCloseExercises").addEventListener("click", () => {
		closeOverlay("overlayExercises");
	});

	// ── Pop-up: opções ────────────────────────────────────────────
	function openOptions(idx) {
		activeExerciseIndex = idx;
		const dia = ctx.dias[currentDayIndex];
		const exObj = exerciciosPorDia[dia][idx];
		document.getElementById("optionsTitle").textContent = exObj.name;
		openOverlay("overlayOptions");
	}

	document.getElementById("btnCloseOptions").addEventListener("click", () => {
		closeOverlay("overlayOptions");
	});

	// APAGAR
	document.getElementById("optDelete").addEventListener("click", () => {
		const dia = ctx.dias[currentDayIndex];
		const exObj = exerciciosPorDia[dia][activeExerciseIndex];
		document.getElementById("deleteExName").textContent = exObj.name;
		
		// Mostra checkbox se houver múltiplos dias
		const applyAllDeleteContainer = document.getElementById("applyAllDeleteContainer");
		if (ctx.dias.length > 1) {
			applyAllDeleteContainer.style.display = "flex";
		} else {
			applyAllDeleteContainer.style.display = "none";
		}

		closeOverlay("overlayOptions");
		openOverlay("overlayConfirmDelete");
	});

	document.getElementById("btnDeleteNo").addEventListener("click", () => {
		closeOverlay("overlayConfirmDelete");
		openOverlay("overlayOptions"); // reabre as opções
	});

	document.getElementById("btnDeleteYes").addEventListener("click", () => {
		const currentDia = ctx.dias[currentDayIndex];
		const diaList = exerciciosPorDia[currentDia];

		if (activeExerciseIndex === null || activeExerciseIndex >= diaList.length) {
			closeOverlay("overlayConfirmDelete");
			return;
		}

		// Pega ID do exercício para remover em outros dias se solicitado
		const exIdToDelete = diaList[activeExerciseIndex].id;
		const chkApplyAllDelete = document.getElementById("chkApplyAllDelete");
		const applyToAll = chkApplyAllDelete && chkApplyAllDelete.checked;
		const targetDays = applyToAll ? ctx.dias : [currentDia];

		const blocks = document.querySelectorAll(".exercise-block");
		const target = blocks[activeExerciseIndex];
		
		const performActualDelete = () => {
			targetDays.forEach(d => {
				const list = exerciciosPorDia[d];
				const idx = list.findIndex(item => item.id === exIdToDelete);
				if (idx !== -1) {
					list.splice(idx, 1);
				}
			});
			
			let msg = "Exercício removido.";
			if (applyToAll && ctx.dias.length > 1) {
				msg = `Excluído em ${ctx.dias.length} dias! 🗑️`;
			}
			showToast("success", msg);

			activeExerciseIndex = null;
			renderExercises();
			closeOverlay("overlayConfirmDelete");
		};

		if (target) {
			target.classList.add("removing");
			let finished = false;
			const onAnimEnd = () => {
				if (finished) return;
				finished = true;
				performActualDelete();
			};
			target.addEventListener("animationend", onAnimEnd, { once: true });
			setTimeout(onAnimEnd, 350);
		} else {
			performActualDelete();
		}
	});

	// TROCAR
	document.getElementById("optSwap").addEventListener("click", () => {
		closeOverlay("overlayOptions");
		openPickList(activeExerciseIndex);
	});

	// EDITAR DETALHES (Séries, etc)
	document.getElementById("optEdit").addEventListener("click", () => {
		const dia = ctx.dias[currentDayIndex];
		const exObj = exerciciosPorDia[dia][activeExerciseIndex];
		
		pendingAddPayload = { isRoutine: false, exObj: exObj, isEdit: true };
		document.getElementById("addOptionsTitle").textContent = "Editar Detalhes";
		document.getElementById("btnConfirmAddOptions").textContent = "SALVAR ALTERAÇÕES";
		
		const seriesValue = exObj.series || "3x15";
		const parts = seriesValue.toLowerCase().split('x');
		document.getElementById("addSeriesQty").value = parts[0] || "3";
		document.getElementById("addRepsQty").value = parts[1] || "15";
		document.getElementById("addRestTime").value = exObj.restTime || "60";
		document.getElementById("addObservation").value = exObj.observation || "";

		closeOverlay("overlayOptions");
		
		// Mostra o container de aplicar a todos no modal de edição
		const applyAllOptionsContainer = document.getElementById("applyAllOptionsContainer");
		if (ctx.dias.length > 1) {
			applyAllOptionsContainer.style.display = "flex";
		} else {
			applyAllOptionsContainer.style.display = "none";
		}

		openOverlay("overlayAddOptions");
	});

	// (Removidos btnSwapNo/btnSwapYes pois o modal foi deletado)


	// CONFIRMAR ADIÇÃO OU EDIÇÃO (SÉRIES E OBS)
	document.getElementById("btnConfirmAddOptions").addEventListener("click", () => {
		const isEdit = pendingAddPayload && pendingAddPayload.isEdit;
		const isSwap = pendingAddPayload && pendingAddPayload.isSwap;
		const sQty = document.getElementById("addSeriesQty").value.trim();
		const rQty = document.getElementById("addRepsQty").value.trim();
		const series = (sQty && rQty) ? `${sQty}x${rQty}` : "3x15";
		const restTime = parseInt(document.getElementById("addRestTime").value.trim()) || 60;
		const obs = document.getElementById("addObservation").value.trim();

		const currentDia = ctx.dias[currentDayIndex];
		const exObj = pendingAddPayload.exObj;

		// Pega o estado do checkbox (pode ser o da lista ou o do modal de opções)
		const chk1 = document.getElementById("chkApplyAll");
		const chk2 = document.getElementById("chkApplyAllOptions");
		const applyToAll = (chk1 && chk1.checked) || (chk2 && chk2.checked);
		
		const targetDays = applyToAll ? ctx.dias : [currentDia];

		if (isEdit || isSwap) {
			// MODO EDIÇÃO ou TROCA
			targetDays.forEach(d => {
				const diaList = exerciciosPorDia[d];
				if (isEdit) {
					// Edição: procura pelo ID original em todos os dias selecionados
					const targetIdx = diaList.findIndex(item => item.id === exObj.id);
					if (targetIdx !== -1) {
						diaList[targetIdx] = { ...exObj, series, observation: obs, restTime: restTime };
					}
				} else {
					// Troca: procura o exercício ANTIGO (está sendo trocado) nos outros dias tbm
					const oldExId = (d === currentDia) ? diaList[activeExerciseIndex]?.id : pendingAddPayload.oldId;
					const targetIdx = diaList.findIndex(item => item.id === oldExId);
					if (targetIdx !== -1) {
						diaList[targetIdx] = { ...exObj, series, observation: obs, restTime: restTime };
					}
				}
			});

			let msg = isSwap ? "Exercício trocado!" : "Detalhes atualizados!";
			if (applyToAll && ctx.dias.length > 1) {
				msg = isSwap ? `Troca realizada em ${ctx.dias.length} dias! ✨` : `Dados atualizados em ${ctx.dias.length} dias! ✨`;
			}
			showToast("success", msg);
		} else {
			// MODO ADIÇÃO NORMAL
			targetDays.forEach(d => {
				const diaList = exerciciosPorDia[d];
				if (!diaList.some(item => item.id === exObj.id)) {
					diaList.push({ ...exObj, series, observation: obs, restTime: restTime });
				}
			});

			let msg = "Exercício adicionado!";
			if (applyToAll && ctx.dias.length > 1) {
				msg = `Inserido em ${ctx.dias.length} dias com sucesso! ✨`;
			}
			showToast("success", msg);
		}

		closeOverlay("overlayAddOptions");
		renderExercises();
	});

	document.getElementById("btnCloseAddOptions").addEventListener("click", () => {
		closeOverlay("overlayAddOptions");
		openOverlay("overlayExercises"); // volta para a lista
	});

	// ── Fechar overlay clicando fora ──────────────────────────────
	["overlayExercises", "overlayOptions", "overlayAddOptions"].forEach((id) => {
		document.getElementById(id).addEventListener("click", (e) => {
			if (e.target.id === id) {
				if (id === "overlayAddOptions") {
					closeOverlay(id);
					openOverlay("overlayExercises");
				} else {
					closeOverlay(id);
				}
			}
		});
	});

	// ── Helpers ───────────────────────────────────────────────────
	function openOverlay(id) {
		document.getElementById(id).classList.add("open");
		// Pop-ups de confirmação ficam centralizados
		if (id === "overlayConfirmDelete" || id === "overlayConfirmSwap") {
			document.getElementById(id).classList.add("center");
		}
	}

	function closeOverlay(id) {
		document.getElementById(id).classList.remove("open");
	}

    function dayKey(ano, mes, dia) {
		return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
	}

	// ── Atalho: Esc para fechar overlays ou voltar ───────────────
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			const activeOverlay = document.querySelector(".overlay.open");
			if (activeOverlay) {
				const id = activeOverlay.id;
				if (id === "overlayAddOptions") {
					closeOverlay(id);
					openOverlay("overlayExercises");
				} else {
					closeOverlay(id);
				}
			} else if (!document.getElementById("pf-modal-root")) {
				history.back();
			}
		}
	});
});

// ── Toast ─────────────────────────────────────────────────────────
function showToast(type, message) {
	let container = document.getElementById("toast-container");
	if (!container) {
		container = document.createElement("div");
		container.id = "toast-container";
		document.body.appendChild(container);
	}
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	const icon =
		type === "success"
			? '<i class="fa-solid fa-circle-check"></i>'
			: '<i class="fa-solid fa-circle-exclamation"></i>';
	toast.innerHTML = `${icon} <span>${message}</span>`;
	container.appendChild(toast);
	setTimeout(() => {
		toast.style.animation = "fadeOut 0.3s forwards";
		setTimeout(() => toast.remove(), 300);
	}, 3500);
}
