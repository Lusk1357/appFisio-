const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().min(3, "O login/e-mail deve ter pelo menos 3 caracteres"),
    password: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres"),
    telefone: z.string().optional(),
    role: z.enum(["PATIENT", "ADMIN"]).optional()
});

const loginSchema = z.object({
    email: z.string().min(1, "E-mail ou Login é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória")
});

const tipSchema = z.object({
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(255, "Título muito longo"),
    thumbnail: z.string().max(500, "Caminho da imagem muito longo"),
    duration: z.string().min(1, "Duração é obrigatória").max(50, "Duração muito longa"),
    link: z.string().max(255).optional().or(z.literal(""))
});

const exerciseSchema = z.object({
    name: z.string().min(3, "Nome do exercício deve ter no mínimo 3 caracteres").max(255),
    type: z.string().min(1, "Categoria é obrigatória").max(100),
    duration: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 0).pipe(z.number().min(0).max(1440)),
    observation: z.string().max(5000).optional().nullable(),
    howToExecute: z.string().max(5000).optional().nullable(),
    videoUrl: z.string().max(500).optional().nullable(),
    bodyCategory: z.string().max(255).optional().nullable(),
    equipments: z.string().max(255).optional().nullable(),
    imageUrl: z.string().max(500).optional().nullable()
});

const routineSchema = z.object({
    nome: z.string().min(3, "Nome da rotina deve ter no mínimo 3 caracteres e no máximo 100").max(100),
    descricao: z.string().max(500).optional(),
    lista_exercicios_ids: z.array(z.object({
        id: z.string().uuid("ID de exercício inválido"),
        series: z.string().regex(/^(\d+\s*[xX*]\s*\d+|[\d+]+|[a-zA-Záàâãéèêíïóôõöúçñ\s.-]{2,})$/, "Formato de série inválido").max(50).optional(),
        observation: z.string().max(500).optional().nullable(),
        restTime: z.union([z.string(), z.number()]).optional().transform(v => Number(v) || 60)
    })).optional().default([])
});

const profileUpdateSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    email: z.string().min(3).optional(),
    telefone: z.string().max(20).optional(),
    password: z.string().min(6).optional(),
    estado: z.string().max(2).optional(),
    cidade: z.string().max(100).optional(),
    bairro: z.string().max(100).optional(),
    endereco: z.string().max(255).optional(),
    cep: z.string().max(10).optional(),
    notes: z.string().max(5000).optional(),
    weight: z.preprocess(v => v === null ? undefined : v, z.union([z.string(), z.number()]).optional()),
    height: z.preprocess(v => v === null ? undefined : v, z.union([z.string(), z.number()]).optional()),
    age: z.preprocess(v => v === null ? undefined : v, z.union([z.string(), z.number()]).optional().transform(v => v ? Number(v) : undefined).pipe(z.number().min(0).max(120).optional())),
    gender: z.preprocess(v => v === null ? undefined : v, z.string().max(20).optional()),
    avatar: z.preprocess(v => v === null ? undefined : v, z.string().max(255).optional())
});

const prescriptionSchema = z.object({
    patientId: z.string().uuid("ID do paciente inválido"),
    assignedDay: z.any(), // Pode ser data ISO ou String YYYY-MM-DD dependendo do frontend
    exercises: z.array(
        z.union([
            z.string().uuid("ID de exercício inválido"),
            z.object({
                id: z.string().uuid("ID do exercício inválido").optional(),
                series: z.string().regex(/^(\d+\s*[xX*]\s*\d+|[\d+]+|[a-zA-Záàâãéèêíïóôõöúçñ\s.-]{2,})$/, "Formato de série inválido").max(50).optional(),
                observation: z.string().max(500).optional().nullable(),
                restTime: z.union([z.string(), z.number()]).optional()
            })
        ])
    ).optional().default([])
});

const recoveryVerifySchema = z.object({
    email: z.string().min(1, "O login/e-mail é obrigatório"),
    telefone: z.string().min(10, "Telefone inválido").max(20)
});

const passwordResetSchema = z.object({
    recoveryToken: z.string().min(10, "Token de recuperação inválido"),
    novaSenha: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres")
});

module.exports = {
    registerSchema,
    loginSchema,
    tipSchema,
    exerciseSchema,
    routineSchema,
    profileUpdateSchema,
    prescriptionSchema,
    recoveryVerifySchema,
    passwordResetSchema
};
