const prisma = require("../utils/prisma");

exports.getTips = async (req, res) => {
    try {
        const tips = await prisma.tip.findMany({
            select: {
                id: true,
                title: true,
                thumbnail: true,
                duration: true,
                link: true,
                createdAt: true
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(tips);
    } catch (error) {
        console.error("Erro ao buscar dicas:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
};

exports.createTip = async (req, res) => {
    try {
        const { title, thumbnail, duration, link } = req.body;

        // Apenas admin pode criar
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas ADMIN." });
        }

        const tip = await prisma.tip.create({
            data: {
                title,
                thumbnail,
                duration,
                link: link || ""
            }
        });

        res.status(201).json(tip);
    } catch (error) {
        console.error("Erro ao criar dica:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
};

exports.deleteTip = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas ADMIN." });
        }

        await prisma.tip.delete({
            where: { id }
        });

        res.json({ message: "Dica removida com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar dica:", error);
        res.status(500).json({ error: "Erro ao deletar dica ou não encontrada." });
    }
};

exports.updateTip = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, thumbnail, duration, link } = req.body;

        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado. Apenas ADMIN." });
        }

        const tip = await prisma.tip.update({
            where: { id },
            data: {
                title,
                thumbnail,
                duration,
                link: link || ""
            }
        });

        res.json(tip);
    } catch (error) {
        console.error("Erro ao atualizar dica:", error);
        res.status(500).json({ error: "Erro interno no servidor ao atualizar." });
    }
};
