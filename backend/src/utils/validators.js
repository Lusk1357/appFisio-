const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
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
    thumbnail: z.string().url("A thumbnail deve ser uma URL válida ou caminho correto"),
    duration: z.string().min(1, "Duração é obrigatória").max(50, "Duração muito longa"),
    link: z.string().max(255).optional().or(z.literal(""))
});

const exerciseSchema = z.object({
    name: z.string().min(3, "Nome do exercício deve ter no mínimo 3 caracteres").max(255),
    description: z.string().max(1000).optional(),
    videoUrl: z.string().max(255).optional(),
    instructions: z.string().max(2000).optional() // String formatada em JSON
});

const routineSchema = z.object({
    name: z.string().min(3, "Nome da rotina deve ter no mínimo 3 caracteres e no máximo 100").max(100),
    description: z.string().max(500).optional(),
    exercises: z.array(z.string().uuid("ID de exercício inválido")).optional()
});

const profileUpdateSchema = z.object({
    name: z.string().min(3).max(100).optional(),
    email: z.string().email().optional(),
    telefone: z.string().max(20).optional(),
    password: z.string().min(6).optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    tipSchema,
    exerciseSchema,
    routineSchema,
    profileUpdateSchema
};
