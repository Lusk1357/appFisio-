/* calendario.js */

document.addEventListener("DOMContentLoaded", () => {
	const STORAGE_KEY = "pacientesProFisio";

	const raw = sessionStorage.getItem("pacienteSelecionado");
	if (!raw) {
		history.back();
		return;
	}

	const paciente = JSON.parse(raw);

	// ── Hero ──────────────────────────────────────────────────────
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
			avatarEl.innerHTML = `<span style="font-family:'Bebas Neue',sans-serif;font-size:32px;color:#7aa3ec;letter-spacing:2px">${initials || "?"}</span>`;
		}
	}

	// ── Estado ────────────────────────────────────────────────────
	const today = new Date();
	let viewYear = today.getFullYear();
	let viewMonth = today.getMonth();
	let selectedDays = new Set();

	const btnSave = document.getElementById("btnSave");
	btnSave.disabled = true;

	renderCalendar();

	document.getElementById("btnPrevMonth").addEventListener("click", () => {
		viewMonth--;
		if (viewMonth < 0) {
			viewMonth = 11;
			viewYear--;
		}
		// selectedDays.clear(); // Mantém a seleção ao trocar de mês
		updateSaveBtn();
		renderCalendar();
	});

	document.getElementById("btnNextMonth").addEventListener("click", () => {
		viewMonth++;
		if (viewMonth > 11) {
			viewMonth = 0;
			viewYear++;
		}
		// selectedDays.clear(); // Mantém a seleção ao trocar de mês
		updateSaveBtn();
		renderCalendar();
	});

	btnSave.addEventListener("click", () => {
		if (selectedDays.size === 0) return;

		// Passa todas as datas selecionadas (ISO strings YYYY-MM-DD)
		const diasOrdenados = Array.from(selectedDays).sort();
		sessionStorage.setItem(
			"exerciciosDiaContexto",
			JSON.stringify({
				dates: diasOrdenados, // Novo formato: lista de datas completas
			}),
		);

		window.location.href = "/admin/exercicios-hoje";
	});

	// ── Render calendário ─────────────────────────────────────────
	async function renderCalendar() {
		const monthNames = [
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
		document.getElementById("monthLabel").textContent = monthNames[viewMonth];
		document.getElementById("yearLabel").textContent = viewYear;

		const grid = document.getElementById("daysGrid");
		grid.innerHTML = '<div style="grid-column: span 7; text-align: center; padding: 20px;">Carregando...</div>';

		// Puxa as prescrições do mes atual e ano atual do banco
		const persisted = new Set();
		try {
			const res = await fetch(`/api/prescricoes/admin/${paciente.id}?month=${viewMonth + 1}&year=${viewYear}`, {
				credentials: "include"
			});
			if (res.ok) {
				const treinosMes = await res.json();
				treinosMes.forEach(treino => {
					const d = new Date(treino.assignedDay);
					// Usamos getUTCDate() para evitar que o fuso horário local altere o dia (drift)
					persisted.add(d.getUTCDate());
				});
			}
		} catch (e) {
			console.error("Erro ao puxar treinos deste paciente", e);
		}

		grid.innerHTML = "";

		const firstDay = new Date(viewYear, viewMonth, 1).getDay();
		const offset = firstDay === 0 ? 6 : firstDay - 1;
		const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

		for (let i = 0; i < offset; i++) {
			const empty = document.createElement("div");
			empty.className = "day-cell empty";
			grid.appendChild(empty);
		}

		for (let d = 1; d <= daysInMonth; d++) {
			const cell = document.createElement("div");
			cell.className = "day-cell";
			cell.textContent = d;

			const isToday =
				d === today.getDate() &&
				viewMonth === today.getMonth() &&
				viewYear === today.getFullYear();

			const dateString = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

			if (isToday) cell.classList.add("today");
			if (persisted.has(d)) cell.classList.add("has-exercise");
			if (selectedDays.has(dateString)) cell.classList.add("selected");

			cell.addEventListener("click", () => {
				if (selectedDays.has(dateString)) {
					selectedDays.delete(dateString);
					cell.classList.remove("selected");
				} else {
					selectedDays.add(dateString);
					cell.classList.add("selected");
				}
				updateSaveBtn();
			});

			grid.appendChild(cell);
		}
	}

	function updateSaveBtn() {
		btnSave.disabled = selectedDays.size === 0;
	}

	function monthKey(y, m) {
		return `${y}-${String(m + 1).padStart(2, "0")}`;
	}

	// ── Atalho: Esc para voltar ───────────────────────────────────
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			if (!document.getElementById("pf-modal-root")) {
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
