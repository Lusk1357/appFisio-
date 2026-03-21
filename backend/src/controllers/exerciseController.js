const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

// Listar imagens locais disponíveis em /public/images/exercises/
exports.listLocalImages = async (req, res) => {
    try {
        const imagesDir = path.join(__dirname, '../../../frontend/public/images/exercises');
        if (!fs.existsSync(imagesDir)) {
            return res.status(200).json([]);
        }
        const files = fs.readdirSync(imagesDir)
            .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
            .map(f => ({
                name: f,
                path: `/public/images/exercises/${f}`
            }));
        res.status(200).json(files);
    } catch (error) {
        console.error("Erro ao listar imagens:", error);
        res.status(500).json({ erro: "Erro ao listar imagens locais." });
    }
};

exports.createExercise = async (req, res) => {
    try {
        const { name, observation, type, videoUrl, bodyCategory, equipments, imageUrl, howToExecute } = req.body;

        if (!name || !type) {
            return res.status(400).json({ erro: "Nome e Categoria são obrigatórios." });
        }

        // Verifica unicidade do nome
        const existing = await prisma.exercise.findUnique({ where: { name } });
        if (existing) {
            return res.status(400).json({ erro: "Já existe um exercício com este nome no catálogo." });
        }

        const newExercise = await prisma.exercise.create({
            data: {
                name,
                observation: observation || null,
                type,
                howToExecute: howToExecute || null,
                bodyCategory: bodyCategory || null,
                videoUrl: videoUrl || null,
                equipments: equipments || null,
                imageUrl: imageUrl || null
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

        const exercise = await prisma.exercise.findUnique({ where: { id } });
        if (!exercise) return res.status(404).json({ erro: "Exercício não encontrado." });

        const imageUrl = exercise.imageUrl;

        await prisma.exercise.delete({
            where: { id }
        });

        // Limpeza de arquivo físico se for local
        if (imageUrl && imageUrl.startsWith('/public/images/exercises/')) {
            try {
                const fileName = imageUrl.split('/').pop();
                const filePath = path.join(__dirname, '../../../frontend/public/images/exercises', fileName);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("Erro ao remover mídia órfã:", err);
            }
        }

        res.status(200).json({ sucesso: true, mensagem: "Exercício e mídia excluídos com sucesso." });
    } catch (error) {
        console.error("Erro ao apagar exercício:", error);
        res.status(500).json({ erro: "Erro ao deletar exercício. Talvez ele esteja em uso em treinos ativos." });
    }
};

// Atualizar um exercício (Apenas ADMIN)
exports.updateExercise = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, observation, type, videoUrl, bodyCategory, equipments, imageUrl, howToExecute } = req.body;

        if (!name || !type) {
            return res.status(400).json({ erro: "Nome e Categoria são obrigatórios." });
        }

        // Verifica unicidade se o nome mudou
        if (name) {
            const existing = await prisma.exercise.findFirst({
                where: { name, NOT: { id } }
            });
            if (existing) {
                return res.status(400).json({ erro: "Já existe outro exercício com este nome." });
            }
        }

        const updated = await prisma.exercise.update({
            where: { id },
            data: {
                name,
                observation: observation || null,
                type,
                howToExecute: howToExecute || null,
                bodyCategory: bodyCategory || null,
                videoUrl: videoUrl || null,
                equipments: equipments || null,
                imageUrl: imageUrl || null
            }
        });

        res.status(200).json({
            sucesso: true,
            mensagem: "Exercício atualizado com sucesso!",
            exercicio: updated
        });
    } catch (error) {
        console.error("Erro ao atualizar exercício:", error);
        res.status(500).json({ erro: "Erro ao atualizar exercício no servidor." });
    }
};
