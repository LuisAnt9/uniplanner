// Mensagens amigáveis para erros conhecidos do Mongoose/MongoDB
function friendlyMongoError(err) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "campo";
    const msgs = { email: "Este email já está cadastrado. Tente fazer login." };
    return msgs[field] || `Valor duplicado no campo "${field}".`;
  }
  if (err.name === "ValidationError") {
    const msgs = Object.values(err.errors).map(e => e.message);
    return msgs.join(" ");
  }
  if (err.name === "CastError" && err.kind === "ObjectId")
    return "ID inválido.";
  if (err.name === "DocumentNotFoundError")
    return "Registro não encontrado.";
  return null;
}

// Handler global de erros Express (4 parâmetros)
function globalErrorHandler(err, req, res, next) {
  console.error("❌ Erro:", err.message, err.stack?.split("\n")[1]);

  // Erros de validação do Mongoose
  const friendly = friendlyMongoError(err);
  if (friendly) return res.status(400).json({ success: false, error: friendly });

  // Erro de JWT
  if (err.name === "JsonWebTokenError")
    return res.status(401).json({ success: false, error: "Sessão inválida. Faça login novamente." });
  if (err.name === "TokenExpiredError")
    return res.status(401).json({ success: false, error: "Sessão expirada. Faça login novamente." });

  // Payload muito grande
  if (err.type === "entity.too.large")
    return res.status(413).json({ success: false, error: "Dados enviados são muito grandes." });

  // JSON malformado
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ success: false, error: "Dados inválidos enviados ao servidor." });

  // Timeout de banco
  if (err.name === "MongooseError" || err.message?.includes("ETIMEDOUT"))
    return res.status(503).json({ success: false, error: "Serviço temporariamente indisponível. Tente em alguns segundos." });

  // Erro genérico — nunca expõe detalhes internos
  res.status(500).json({ success: false, error: "Algo deu errado. Tente novamente em instantes." });
}

module.exports = { globalErrorHandler, friendlyMongoError };
