const prisma = require('../utils/prisma');

// ADMIN cria um novo template de rotina
exports.createRoutine = async (req, res) => {
    try {
        const { nome, descricao, lista_exercicios_ids } = req.body;

        if (!nome || !lista_exercicios_ids || lista_exercicios_ids.length === 0) {
            return res.status(400).json({ erro: "Nome e Pelo menos 1 Exercício são obrigatórios." });
        }

        const routine = await prisma.$transaction(async (tx) => {
            const newRoutine = await tx.routineTemplate.create({
                data: {
                    name: nome,
                    description: descricao || null
                }
            });

            // Associar os exercícios selecionados ao template
            const exercisePromises = lista_exercicios_ids.map(ex => {
                return tx.routineExercise.create({
                    data: {
                        routineId: newRoutine.id,
                        exerciseId: ex.id,
                        series: ex.series || "3x15",
                        observation: ex.observation || null,
                        restTime: ex.restTime !== undefined ? Number(ex.restTime) : 60
                    }
                });
            });

            await Promise.all(exercisePromises);
            return newRoutine;
        });

        res.status(201).json({
            sucesso: true,
            mensagem: "Template de Rotina criado com sucesso!",
            routineId: routine.id
        });
    } catch (error) {
        console.error("Erro ao criar template de rotina:", error);
        res.status(500).json({ erro: "Erro interno no servidor ao criar rotina." });
    }
};

// ADMIN atualiza um template de rotina existente
exports.updateRoutine = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, descricao, lista_exercicios_ids } = req.body;

        if (!nome || !lista_exercicios_ids || lista_exercicios_ids.length === 0) {
            return res.status(400).json({ erro: "Nome e Pelo menos 1 Exercício são obrigatórios." });
        }

        await prisma.$transaction(async (tx) => {
            // 1. Atualizar metadados do template
            await tx.routineTemplate.update({
                where: { id },
                data: {
                    name: nome,
                    description: descricao || null
                }
            });

            // 2. Limpar exercícios antigos
            await tx.routineExercise.deleteMany({
                where: { routineId: id }
            });

            // 3. Re-inserir exercícios novos
            const exercisePromises = lista_exercicios_ids.map(ex => {
                return tx.routineExercise.create({
                    data: {
                        routineId: id,
                        exerciseId: ex.id,
                        series: ex.series || "3x15",
                        observation: ex.observation || null,
                        restTime: ex.restTime !== undefined ? Number(ex.restTime) : 60
                    }
                });
            });

            await Promise.all(exercisePromises);
        });

        res.status(200).json({ sucesso: true, mensagem: "Template de Rotina atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar template de rotina:", error);
        res.status(500).json({ erro: "Erro ao atualizar template de rotina no servidor." });
    }
};

// ADMIN exclui um template de rotina
exports.deleteRoutine = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            // Deletar exercícios associados primeiro (Referential Integrity)
            await tx.routineExercise.deleteMany({
                where: { routineId: id }
            });

            await tx.routineTemplate.delete({
                where: { id }
            });
        });

        res.status(200).json({ sucesso: true, mensagem: "Template de Rotina excluído com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir template de rotina:", error);
        res.status(500).json({ erro: "Erro ao excluir template. Verifique se ele não está sendo referenciado." });
    }
};

// ADMIN (ou paciente dependendo da regra futura) busca todas as rotinas templates
exports.getAllRoutines = async (req, res) => {
    try {
        const routines = await prisma.routineTemplate.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                exercises: {
                    select: {
                        exercise: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(routines);
    } catch (error) {
        console.error("Erro ao buscar rotinas:", error);
        res.status(500).json({ erro: "Falha na base de dados ao listar rotinas." });
    }
};
