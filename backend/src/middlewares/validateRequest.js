// backend/src/middlewares/validateRequest.js

const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // Parses the body and strips properties not defined in the Zod schema
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            // Se for um erro do Zod, formate e devolva 400
            if (error.errors) {
                const devMsg = error.errors.map(e => e.message).join(", ");
                return res.status(400).json({ erro: "Dados inválidos: " + devMsg });
            }
            return res.status(400).json({ erro: "Dados inválidos fornecidos." });
        }
    };
};

module.exports = { validateRequest };
