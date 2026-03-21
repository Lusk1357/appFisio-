document.addEventListener("DOMContentLoaded", () => {

    const tipsGrid = document.getElementById("tipsGrid");
    const btnOpenModal = document.getElementById("btnOpenModal");
    const btnCancelModal = document.getElementById("btnCancelModal");
    const tipModal = document.getElementById("tipModal");
    const tipForm = document.getElementById("tipForm");

    // Fetch e Renderização
    async function loadTips() {
        try {
            const res = await fetch("/api/tips", { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar dicas");

            const tips = await res.json();
            tipsGrid.innerHTML = "";

            if (tips.length === 0) {
                tipsGrid.innerHTML = "<p style='color:#6b7280; grid-column: 1/-1'>Nenhuma dica cadastrada ainda.</p>";
                return;
            }

            tips.forEach(tip => {
                const card = document.createElement("div");
                card.className = "tip-card";
                card.innerHTML = `
          <img src="${tip.thumbnail}" alt="${escapeHTML(tip.title)}" onerror="this.src='https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'" />
          <div class="tip-info">
            <h3 class="tip-title">${escapeHTML(tip.title)}</h3>
            <p class="tip-meta"><i class="fa-regular fa-clock"></i> ${tip.duration}</p>
          <div class="card-actions">
            <button class="btn-edit" data-id="${tip.id}"><i class="fa-solid fa-pen"></i> Editar</button>
            <button class="btn-delete" data-id="${tip.id}"><i class="fa-solid fa-trash"></i> Excluir</button>
          </div>
        </div>
      `;
                tipsGrid.appendChild(card);
            });

            // Bind deletes
            document.querySelectorAll(".btn-delete").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = e.target.closest("button").dataset.id;
                    if (typeof showCustomConfirm === "function") {
                        showCustomConfirm("Excluir Dica", "Deseja realmente apagar este vídeo/dica?", () => {
                            deleteTip(id);
                        });
                    } else if (confirm("Deseja realmente excluir esta dica?")) {
                        deleteTip(id);
                    }
                });
            });

            // Bind edits
            document.querySelectorAll(".btn-edit").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const id = e.target.closest("button").dataset.id;
                    const tip = tips.find(t => t.id === id);
                    if (tip) openEditModal(tip);
                });
            });

        } catch (e) {
            console.error(e);
            tipsGrid.innerHTML = "<p style='color:red'>Erro ao carregar dicas.</p>";
        }
    }

    // Deletar Dica
    async function deleteTip(id) {
        try {
            const res = await fetch(`/api/tips/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                loadTips();
            } else {
                alert("Erro ao deletar.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão ao deletar.");
        }
    }

    // Criar ou Editar Dica
    tipForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = document.getElementById("tipId").value;
        const data = {
            title: document.getElementById("tipTitle").value,
            duration: document.getElementById("tipDuration").value,
            thumbnail: document.getElementById("tipThumb").value,
            link: document.getElementById("tipLink").value
        };

        const url = id ? `/api/tips/${id}` : "/api/tips";
        const method = id ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data)
            });

            if (res.ok) {
                tipModal.classList.remove("active");
                tipForm.reset();
                document.getElementById("tipId").value = "";
                loadTips();
            } else {
                alert("Erro ao salvar dica.");
            }
        } catch (err) {
            console.error(err);
            alert("Erro de conexão.");
        }
    });

    // Função auxiliar para popular o Edit Modal
    function openEditModal(tip) {
        document.getElementById("tipId").value = tip.id;
        document.getElementById("tipTitle").value = tip.title;
        document.getElementById("tipDuration").value = tip.duration;
        document.getElementById("tipThumb").value = tip.thumbnail;
        document.getElementById("tipLink").value = tip.link || "";
        document.querySelector("#tipModal h2").innerText = "Editar Dica/Vídeo";
        tipModal.classList.add("active");
    }

    // Modals
    btnOpenModal.addEventListener("click", () => {
        tipForm.reset();
        document.getElementById("tipId").value = "";
        document.querySelector("#tipModal h2").innerText = "Nova Dica/Vídeo";
        tipModal.classList.add("active");
    });

    btnCancelModal.addEventListener("click", () => {
        tipModal.classList.remove("active");
        tipForm.reset();
        document.getElementById("tipId").value = "";
    });

    // ── Atalho: Esc para fechar modal ou voltar ─────────────────
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (tipModal.classList.contains("active")) {
                tipModal.classList.remove("active");
                tipForm.reset();
                document.getElementById("tipId").value = "";
            } else if (!document.getElementById("pf-modal-root")) {
                history.back();
            }
        }
    });

    // Init
    loadTips();
});
