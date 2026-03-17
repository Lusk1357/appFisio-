const prisma = require('../utils/prisma');

exports.createExercise = async (req, res) => {
    try {
        const { name, observation, type, videoUrl } = req.body;

        if (!name || !type) {
            return res.status(400).json({ erro: "Nome e Categoria são obrigatórios." });
        }

        const newExercise = await prisma.exercise.create({
            data: {
                name,
                observation,
                type,
                videoUrl
            }
        });

        res.status(201).json({
            sucesso: true,
            mensagem: "Exercício cadastrado com sucesso!",
            exercicio: newExercise
        });
    } catch (error) {
        console.error("Erro ao criar exercício:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Listar todos os exercícios (Admins e Pacientes podem ver o catálogo)
exports.getAllExercises = async (req, res) => {
    try {
        const exercises = await prisma.exercise.findMany({
            include: { videos: true }
        });
        res.status(200).json(exercises);
    } catch (error) {
        console.error("Erro ao listar exercícios:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Deletar um exercício (Apenas ADMIN)
exports.deleteExercise = async (req, res) => {

    try {
        const { id } = req.params;

        await prisma.exercise.delete({
            where: { id }
        });

        res.status(200).json({ sucesso: true, mensagem: "Exercício apagado com sucesso." });
    } catch (error) {
        console.error("Erro ao apagar exercício:", error);
        res.status(500).json({ erro: "Erro ao deletar exercício. Talvez ele esteja em uso." });
    }
};

// Atualizar um exercício (Apenas ADMIN)
exports.updateExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, observation, type, videoUrl } = req.body;

        if (!name || !type) {
            return res.status(400).json({ erro: "Nome e Categoria são obrigatórios." });
        }

        const updated = await prisma.exercise.update({
            where: { id },
            data: { name, observation, type, videoUrl }
        });

        res.status(200).json({
            sucesso: true,
            mensagem: "Exercício atualizado com sucesso!",
            exercicio: updated
        });
    } catch (error) {
        console.error("Erro ao atualizar exercício:", error);
        res.status(500).json({ erro: "Erro ao atualizar exercício." });
    }
};
