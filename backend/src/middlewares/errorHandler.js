// backend/src/middlewares/errorHandler.js

function errorHandler(err, req, res, next) {
    console.error("[Global Error Handler]", err.stack);
    
    // Status predefinido ou 500 para falhas inesperadas
    const statusCode = err.statusCode || 500;
    
    // Esconder detalhes do banco (Prisma) em produção
    if (process.env.NODE_ENV === "production" && statusCode === 500) {
        return res.status(500).json({ erro: "Ocorreu um erro interno no servidor." });
    }
    
    res.status(statusCode).json({
        erro: err.message || "Erro interno do servidor",
        detalhes: process.env.NODE_ENV === "development" ? err : undefined
    });
}

module.exports = errorHandler;
