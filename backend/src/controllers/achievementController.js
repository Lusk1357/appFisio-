const prisma = require('../utils/prisma');

// Lista conquistas do usuário logado
exports.getMyAchievements = async (req, res) => {
    try {
        const achievements = await prisma.achievement.findMany({
            where: { 
                userId: req.user.id,
                icon: { not: 'DELETED' } // Oculta as apagadas logichemente
            },
            orderBy: { timestamp: 'desc' }
        });
        res.status(200).json(achievements);
    } catch (error) {
        console.error("Erro ao buscar conquistas:", error);
        res.status(500).json({ erro: "Erro ao buscar conquistas." });
    }
};

// Adiciona uma nova conquista (chamado pelo front ao atingir meta)
exports.addAchievement = async (req, res) => {
    try {
        const { title, description, icon, alert } = req.body;
        
        // Verifica se já possui essa conquista ativa (não deletada)
        const existing = await prisma.achievement.findFirst({
            where: {
                userId: req.user.id,
                title: title,
                icon: { not: 'DELETED' }
            }
        });

        if (existing) {
            return res.status(200).json({ mensagem: "Conquista já registrada.", alreadyHad: true });
        }

        const newAch = await prisma.achievement.create({
            data: {
                userId: req.user.id,
                title,
                description,
                icon: icon || 'fa-medal',
                alert: alert || false,
                read: false
            }
        });

        res.status(201).json(newAch);
    } catch (error) {
        console.error("Erro ao salvar conquista:", error);
        res.status(500).json({ erro: "Erro ao salvar conquista." });
    }
};

// Marca todas as conquistas do usuário como lidas
exports.markAllAsRead = async (req, res) => {
    try {
        await prisma.achievement.updateMany({
            where: { userId: req.user.id },
            data: { read: true }
        });
        res.status(200).json({ sucesso: true });
    } catch (error) {
        console.error("Erro ao marcar lidas:", error);
        res.status(500).json({ erro: "Erro ao atualizar notificações." });
    }
};

// Exclui uma conquista específica
exports.deleteAchievement = async (req, res) => {
    try {
        const { id } = req.params;
        const ach = await prisma.achievement.findFirst({
            where: { id, userId: req.user.id }
        });

        if (!ach) {
            return res.status(404).json({ erro: "Notificação não encontrada." });
        }

        // Exclusão Lógica: Marca a conquista como deletada para não ser recriada
        await prisma.achievement.update({ 
            where: { id },
            data: { icon: 'DELETED' }
        });
        res.status(200).json({ sucesso: true });
    } catch (error) {
        console.error("Erro ao excluir conquista:", error);
        res.status(500).json({ erro: "Erro ao excluir notificação." });
    }
};

// Exclui TODAS as conquistas do usuário
exports.deleteAllAchievements = async (req, res) => {
    try {
        // Exclusão Lógica: Marca todas as conquistas atuais como deletadas
        await prisma.achievement.updateMany({
            where: { userId: req.user.id },
            data: { icon: 'DELETED' }
        });
        res.status(200).json({ sucesso: true });
    } catch (error) {
        console.error("Erro ao limpar notificações:", error);
        res.status(500).json({ erro: "Erro ao limpar notificações." });
    }
};
