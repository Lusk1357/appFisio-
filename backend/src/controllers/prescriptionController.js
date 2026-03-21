const prisma = require('../utils/prisma');

// ADM Atribui uma nova sessão de treinos a um paciente
exports.createPrescription = async (req, res) => {
    try {
        const { patientId, assignedDay, exercises } = req.body;
        // exercises é uma array de objetos {id, series, observation, restTime} ou IDs
        
        if (!patientId || !assignedDay || !exercises) {
            return res.status(400).json({ erro: "Paciente, Data e exercícios (mesmo que vazio) são obrigatórios." });
        }

        // Normaliza para UTC 00:00:00 para evitar drift de timezone entre Admin -> DB -> Patient
        const [ano, mes, dia] = assignedDay.split('T')[0].split('-');
        const targetDate = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0));
        
        const startDate = new Date(targetDate);
        const endDate = new Date(targetDate);
        endDate.setUTCHours(23, 59, 59, 999);

        // 1. & 2. TRANSACIONAL: Limpa e Cria em uma única operação atômica (evita Race Condition)
        await prisma.$transaction(async (tx) => {
            // Remove prescrições existentes para este paciente neste dia exato
            const existing = await tx.prescription.findMany({
                where: {
                    patientId: patientId,
                    assignedDay: { gte: startDate, lte: endDate }
                },
                select: { id: true }
            });

            const ids = existing.map(p => p.id);
            if (ids.length > 0) {
                await tx.prescriptionExercise.deleteMany({
                    where: { prescriptionId: { in: ids } }
                });
                await tx.prescription.deleteMany({
                    where: { id: { in: ids } }
                });
            }

            // Se houver exercícios, cria a nova prescrição
            if (exercises.length > 0) {
                const prescription = await tx.prescription.create({
                    data: {
                        patientId: patientId,
                        adminId: req.user.id,
                        assignedDay: targetDate
                    }
                });

                const exercisePromises = exercises.map(ex => {
                    return tx.prescriptionExercise.create({
                        data: {
                            prescriptionId: prescription.id,
                            exerciseId: ex.id || ex,
                            series: ex.series || "3x15",
                            observation: ex.observation || null,
                            restTime: ex.restTime !== undefined ? Number(ex.restTime) : 60
                        }
                    });
                });

                await Promise.all(exercisePromises);
            }
        });

        res.status(201).json({
            sucesso: true,
            mensagem: exercises.length > 0 ? "Prescrição atualizada com sucesso!" : "Dia limpo com sucesso!",
        });
    } catch (error) {
        console.error("Erro ao prescrever:", error);
        res.status(500).json({ erro: "Erro interno ao processar prescrição." });
    }
};

// ADMIN busca TODAS as prescrições de todos os pacientes (Para Dashboard)
exports.getAllPrescriptions = async (req, res) => {
    try {
        const prescriptions = await prisma.prescription.findMany({
            include: {
                patient: {
                    select: { name: true }
                }
            }
        });
        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Erro ao buscar todas as rotinas:", error);
        res.status(500).json({ erro: "Falha na base de dados." });
    }
};

// PACIENTE vê SEUS treinos de uma data específica
exports.getMyPrescriptions = async (req, res) => {
    try {
        const { date } = req.query; // ex: ?date=2023-11-20
        let dateFilter = {};

        if (date) {
            // Separa YYYY-MM-DD para evitar bug de parse UTC vs Local
            const [ano, mes, dia] = date.split('-');
            const startDate = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0));
            const endDate = new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));

            dateFilter = {
                assignedDay: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        // Traz as prescrições, junto com os itens dela, e os detalhes do exercicio em si (nome, duration)!!
        const prescriptions = await prisma.prescription.findMany({
            where: {
                patientId: req.user.id,
                ...dateFilter
            },
            include: {
                exercises: {
                    include: {
                        exercise: true
                    }
                }
            }
        });

        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Erro ao buscar treinos diários:", error);
        res.status(500).json({ erro: "Falha na base de dados." });
    }
};

// ADMIN vê treinos de UM paciente específico
exports.getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { date, month, year } = req.query;

        let dateFilter = {};

        if (date) {
            // Separa YYYY-MM-DD para evitar bug de parse UTC vs Local
            const [ano, mes, dia] = date.split('-');
            const startDate = new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0));
            const endDate = new Date(Date.UTC(ano, mes - 1, dia, 23, 59, 59, 999));

            dateFilter = {
                assignedDay: {
                    gte: startDate,
                    lte: endDate
                }
            };
        } else if (month && year) {
            // Filtrar pelo mês todo
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            endDate.setHours(23, 59, 59, 999);

            dateFilter = {
                assignedDay: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        // Traz as prescrições
        const prescriptions = await prisma.prescription.findMany({
            where: {
                patientId: patientId,
                ...dateFilter
            },
            include: {
                exercises: {
                    include: {
                        exercise: true
                    }
                }
            }
        });

        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Erro ao buscar treinos do paciente:", error);
        res.status(500).json({ erro: "Falha na base de dados." });
    }
};

// PACIENTE marca exercícios como concluídos
exports.completeExercises = async (req, res) => {
    try {
        const { prescriptionExerciseIds } = req.body;
        // Array de IDs de PrescriptionExercise a marcar como completed

        if (!prescriptionExerciseIds || prescriptionExerciseIds.length === 0) {
            return res.status(400).json({ erro: "Lista de exercícios obrigatória." });
        }

        // Verifica que TODOS os IDs pertencem ao paciente logado
        const items = await prisma.prescriptionExercise.findMany({
            where: { id: { in: prescriptionExerciseIds } },
            include: { prescription: true }
        });

        const allBelongToUser = items.every(item => item.prescription.patientId === req.user.id);
        if (!allBelongToUser) {
            return res.status(403).json({ erro: "Acesso negado: exercícios não pertencem a você." });
        }

        // Marca como completed
        await prisma.prescriptionExercise.updateMany({
            where: { id: { in: prescriptionExerciseIds } },
            data: { completed: true }
        });

        res.status(200).json({ sucesso: true, mensagem: "Exercícios marcados como concluídos!" });
    } catch (error) {
        console.error("Erro ao completar exercícios:", error);
        res.status(500).json({ erro: "Erro interno." });
    }
};

// PACIENTE busca as estatísticas de progresso
exports.getMyStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Busca TODAS as prescrições do paciente com seus exercícios
        const prescriptions = await prisma.prescription.findMany({
            where: { patientId: userId },
            include: {
                exercises: {
                    include: { exercise: true }
                }
            }
        });

        let totalExercicios = 0;
        let exerciciosConcluidos = 0;
        let tempoTotalMinutos = 0;
        const diasTreinados = new Set();
        const diasComTreinoCompleto = new Set();

        let mesAtualTotal = 0;
        let mesAtualConcluidos = 0;
        let mesAtualDiasAtribuidos = new Set();
        let mesAtualDiasConcluidos = new Set();

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        prescriptions.forEach(p => {
            const pDate = new Date(p.assignedDay);
            const isThisMonth = pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;

            const dayStr = pDate.toDateString();
            let todosConcluidos = true;
            let temExercicio = false;

            p.exercises.forEach(pe => {
                totalExercicios++;
                if (isThisMonth) mesAtualTotal++;

                if (pe.completed) {
                    exerciciosConcluidos++;
                    if (isThisMonth) mesAtualConcluidos++;
                    tempoTotalMinutos += pe.exercise.duration || 0;
                    diasTreinados.add(dayStr);
                } else {
                    todosConcluidos = false;
                }
                temExercicio = true;
            });

            if (temExercicio) {
                if (isThisMonth) mesAtualDiasAtribuidos.add(dayStr);

                if (todosConcluidos) {
                    diasComTreinoCompleto.add(dayStr);
                    if (isThisMonth) mesAtualDiasConcluidos.add(dayStr);
                }
            }
        });

        res.status(200).json({
            totalExercicios,
            exerciciosConcluidos,
            mesAtualTotal,
            mesAtualConcluidos,
            mesAtualDiasAtribuidos: mesAtualDiasAtribuidos.size,
            mesAtualDiasConcluidos: mesAtualDiasConcluidos.size,
            diasTreinados: diasTreinados.size,
            diasComTreinoCompleto: diasComTreinoCompleto.size,
            tempoTotalMinutos,
            totalPrescricoes: prescriptions.length
        });
    } catch (error) {
        console.error("Erro ao buscar stats:", error);
        res.status(500).json({ erro: "Falha ao buscar estatísticas." });
    }
};
