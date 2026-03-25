// backend/src/middlewares/validateRequest.js

const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Parses the body and strips properties not defined in the Zod schema
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            // Se for um erro do Zod, formate e detalhe
            const issues = error.issues || error.errors;
            if (issues && Array.isArray(issues)) {
                const devMsg = issues.map(e => e.message).join(" | ");
                return res.status(400).json({ erro: devMsg });
            }
            // Fallback para qualquer outro erro de validação
            // Se error.message contiver JSON do Zod, tenta extrair ou limpa
            let cleanMsg = error.message || "Dados inválidos fornecidos.";
            if (cleanMsg.startsWith("[") && cleanMsg.endsWith("]")) {
                try {
                    const parsed = JSON.parse(cleanMsg);
                    if (Array.isArray(parsed)) {
                        cleanMsg = parsed.map(p => p.message).join(" | ");
                    }
                } catch (e) { /* ignore */ }
            }
            return res.status(400).json({ erro: cleanMsg });
        }
    };
};

module.exports = { validateRequest };
