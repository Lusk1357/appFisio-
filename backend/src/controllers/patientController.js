const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

// Listar todos os usuários que são "PATIENT" (APENAS ADM)
exports.getAllPatients = async (req, res) => {
    try {
        const patients = await prisma.user.findMany({
            where: {
                role: 'PATIENT'
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                patientProfile: {
                    select: {
                        avatar: true
                    }
                }
            }
        });

        res.status(200).json(patients);
    } catch (error) {
        console.error("Erro ao listar pacientes:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Obter detalhes de UM único paciente pelo ID
exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;

        // Se eu for um paciente, eu só posso ler se o ID requisitado for O MEU.
        // Se eu for médico, eu posso ler de qualquer pessoa.
        if (req.user.role === 'PATIENT' && req.user.id !== id) {
            return res.status(403).json({ erro: "Você não tem permissão para ler o perfil de outro paciente." });
        }

        const patient = await prisma.user.findUnique({
            where: { id },
            include: { patientProfile: true }
        });

        if (!patient) return res.status(404).json({ erro: "Paciente não encontrado." });

        const { passwordHash, ...safePatient } = patient;
        res.status(200).json(safePatient);
    } catch (error) {
        console.error("Erro ao buscar paciente:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Atualizar dados de um paciente (APENAS ADM)
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, telefone, estado, cidade, bairro, endereco, cep, notes, weight, height, age, gender, avatar } = req.body;

        // 1. Verifica unicidade de e-mail se estiver sendo alterado
        if (email) {
            const existing = await prisma.user.findFirst({
                where: { email, NOT: { id } }
            });
            if (existing) {
                return res.status(400).json({ erro: "Este e-mail já está sendo usado por outro usuário." });
            }
        }

        // 2. Atualiza o nome/email/senha no User
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        // 3. Atualiza campos extras no PatientProfile (incluindo dados clínicos novos)
        if (telefone !== undefined || estado !== undefined || cidade !== undefined || bairro !== undefined || 
            endereco !== undefined || cep !== undefined || notes !== undefined || 
            weight !== undefined || height !== undefined || age !== undefined || gender !== undefined || avatar !== undefined) {
            
            const parsedWeight = (weight !== undefined && weight !== null && weight !== "") ? parseFloat(weight) : undefined;
            const parsedHeight = (height !== undefined && height !== null && height !== "") ? parseFloat(height) : undefined;
            const parsedAge = (age !== undefined && age !== null && age !== "") ? parseInt(age, 10) : undefined;

            console.log(`[DEBUG] Processando Perfil para id=${id}`, {
                telefone: telefone ? 'PRESENTE' : 'VAZIO',
                endereco: endereco ? 'PRESENTE' : 'VAZIO',
                parsedWeight,
                parsedHeight,
                parsedAge
            });

            // Usando findUnique + create/update em vez de upsert para evitar bugs com extensão de criptografia
            const existingProfile = await prisma.patientProfile.findUnique({ where: { userId: id } });
            
            const profilePayload = { 
                telefone, estado, cidade, bairro, endereco, cep, notes, avatar,
                weight: parsedWeight, height: parsedHeight, age: parsedAge, gender
            };

            if (existingProfile) {
                console.log(`[DEBUG] Perfil existe. Fazendo UPDATE id=${id}`);
                await prisma.patientProfile.update({
                    where: { userId: id },
                    data: profilePayload
                });
            } else {
                console.log(`[DEBUG] Perfil novo. Fazendo CREATE id=${id}`);
                await prisma.patientProfile.create({
                    data: { 
                        userId: id,
                        ...profilePayload
                    }
                });
            }
        }

        // 4. Busca o usuário completo para retornar ao frontend
        const finalPatient = await prisma.user.findUnique({
            where: { id },
            include: { patientProfile: true }
        });
        
        const { passwordHash, ...safe } = finalPatient;
        res.status(200).json({ sucesso: true, paciente: safe });
    } catch (error) {
        console.error("Erro ao atualizar paciente:", error);
        res.status(500).json({ erro: "Erro interno no servidor ao atualizar dados." });
    }
};

// Excluir paciente (APENAS ADM)
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user || user.role !== 'PATIENT') {
            return res.status(404).json({ erro: "Paciente não encontrado." });
        }

        // Apagar as tabelas filhas p/ manter integridade ( Cascade manual onde necessário )
        await prisma.$transaction(async (tx) => {
            // Conquistas
            await tx.achievement.deleteMany({ where: { userId: id } });

            // Prescrições e Exercícios de Prescrição
            const prescriptions = await tx.prescription.findMany({ where: { patientId: id } });
            const prescIds = prescriptions.map(p => p.id);

            if (prescIds.length > 0) {
                await tx.prescriptionExercise.deleteMany({
                    where: { prescriptionId: { in: prescIds } }
                });
                await tx.prescription.deleteMany({
                    where: { patientId: id }
                });
            }

            // Perfil
            await tx.patientProfile.deleteMany({ where: { userId: id } });

            // Usuário
            await tx.user.delete({ where: { id } });
        });

        res.status(200).json({ sucesso: true, mensagem: "Paciente e todos os dados associados excluídos com sucesso." });
    } catch (error) {
        console.error("Erro ao deletar paciente:", error);
        res.status(500).json({ erro: "Erro interno ao processar a exclusão total do registro." });
    }
};

// Obter dados do próprio perfil (PATIENT)
exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id; // Vem do token JWT

        const patient = await prisma.user.findUnique({
            where: { id: userId },
            include: { patientProfile: true }
        });

        if (!patient) return res.status(404).json({ erro: "Usuário não encontrado." });

        const { passwordHash, ...safePatient } = patient;
        res.status(200).json(safePatient);
    } catch (error) {
        console.error("Erro ao buscar meu perfil:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};

// Atualizar o próprio perfil (PATIENT)
exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.id; // Vem do token JWT
        const { name, weight, height, age, gender, telefone, estado, cidade, bairro, cep, avatar } = req.body;

        // Atualiza o nome do User
        const updateData = {};
        if (name) updateData.name = name;

        let updatedUser;
        // Só atualiza na tabela User se tiver nome
        if (Object.keys(updateData).length > 0) {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
        }

        // Atualiza campos físicos e endereço no PatientProfile
        let updatedProfile;
        if (weight !== undefined || height !== undefined || age !== undefined || gender !== undefined ||
            telefone !== undefined || estado !== undefined || cidade !== undefined ||
            bairro !== undefined || cep !== undefined || avatar !== undefined) {

            // Garantir que os numéricos sejam convertidos corretamentes se vierem como string
            const parsedWeight = (weight !== undefined && weight !== null && weight !== "") ? parseFloat(weight) : undefined;
            const parsedHeight = (height !== undefined && height !== null && height !== "") ? parseFloat(height) : undefined;
            const parsedAge = (age !== undefined && age !== null && age !== "") ? parseInt(age, 10) : undefined;

            console.log(`[DEBUG] updateMe userId=${userId}`, { parsedWeight, parsedHeight, parsedAge });

            const existingProfile = await prisma.patientProfile.findUnique({ where: { userId: userId } });
            const profilePayload = {
                weight: parsedWeight,
                height: parsedHeight,
                age: parsedAge,
                gender,
                telefone, estado, cidade, bairro, cep, avatar
            };

            if (existingProfile) {
                updatedProfile = await prisma.patientProfile.update({
                    where: { userId: userId },
                    data: profilePayload
                });
            } else {
                updatedProfile = await prisma.patientProfile.create({
                    data: {
                        userId: userId,
                        ...profilePayload
                    }
                });
            }
        }

        // Busca o usuário completo para retornar ao frontend
        const finalUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { patientProfile: true }
        });
        
        const { passwordHash, ...safe } = finalUser;
        res.status(200).json({ sucesso: true, paciente: safe, mensagem: "Perfil atualizado com sucesso!" });
    } catch (error) {
        console.error("Erro ao atualizar meu perfil:", error);
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
};
