const prisma = require('../utils/prisma');

// ADMIN cria um novo template de rotina
exports.createRoutine = async (req, res) => {
    try {
        const { nome, descricao, lista_exercicios_ids } = req.body;

        if (!nome || !lista_exercicios_ids || lista_exercicios_ids.length === 0) {
            return res.status(400).json({ erro: "Nome e Pelo menos 1 Exercício são obrigatórios." });
        }

        const result = await prisma.$transaction(async (tx) => {
            const routine = await tx.routineTemplate.create({
                data: {
                    name: nome,
                    description: descricao || null
                }
            });

            // Associar os exercícios selecionados ao template
            const exercisePromises = lista_exercicios_ids.map(ex => {
                return tx.routineExercise.create({
                    data: {
                        routineId: routine.id,
                        exerciseId: ex.id,
                        series: ex.series || "3x15",
                        observation: ex.observation || null,
                        restTime: ex.restTime !== undefined ? Number(ex.restTime) : 60
                    }
                });
            });

            await Promise.all(exercisePromises);
            return routine;
        });

        res.status(201).json({
            sucesso: true,
            mensagem: "Template de Rotina criado com sucesso!",
            routineId: routine.id
        });
    } catch (error) {
        console.error("Erro ao criar template de rotina:", error);
        res.status(500).json({ erro: "Erro interno." });
    }
};

// ADMIN (ou paciente dependendo da regra futura) busca todas as rotinas templates
exports.getAllRoutines = async (req, res) => {
    try {
        const routines = await prisma.routineTemplate.findMany({
            include: {
                exercises: {
                    include: {
                        exercise: true
                    }
                }
            }
        });
        res.status(200).json(routines);
    } catch (error) {
        console.error("Erro ao buscar rotinas:", error);
        res.status(500).json({ erro: "Falha na base de dados." });
    }
};
