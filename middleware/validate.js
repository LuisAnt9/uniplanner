const xss = require("xss");

// Sanitiza strings removendo HTML malicioso
function sanitizeStr(val, maxLen = 300) {
  if (val === undefined || val === null) return "";
  return xss(String(val).trim()).slice(0, maxLen);
}

// Sanitiza objeto recursivamente
function sanitizeObj(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  const clean = {};
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string") clean[key] = sanitizeStr(v);
    else if (typeof v === "number") clean[key] = v;
    else if (typeof v === "boolean") clean[key] = v;
    else if (v === null) clean[key] = null;
    else clean[key] = v;
  }
  return clean;
}

// Valida formato de email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// Valida ObjectId do Mongo
function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(String(id || ""));
}

// Valida data — deve ser uma data válida e não muito no passado (>2 anos) nem muito no futuro (>10 anos)
function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 2, 0, 1);
  const maxDate = new Date(now.getFullYear() + 10, 11, 31);
  return d >= minDate && d <= maxDate;
}

// Middleware que sanitiza req.body automaticamente em todas as rotas
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObj(req.body);
  }
  next();
}

// ─── Validadores por recurso ───

function validateTask(body) {
  const errors = [];
  const { title, dueDate, difficulty } = body;

  if (!title || String(title).trim().length < 2)
    errors.push("Título deve ter pelo menos 2 caracteres.");
  if (String(title || "").length > 200)
    errors.push("Título muito longo (máximo 200 caracteres).");
  if (!dueDate || !isValidDate(dueDate))
    errors.push("Data de entrega inválida.");
  if (difficulty !== undefined) {
    const d = Number(difficulty);
    if (!Number.isInteger(d) || d < 1 || d > 5)
      errors.push("Dificuldade deve ser um número entre 1 e 5.");
  }
  if (body.description && String(body.description).length > 1000)
    errors.push("Descrição muito longa (máximo 1000 caracteres).");
  if (body.subject && body.subject !== "" && !isValidObjectId(body.subject))
    errors.push("Matéria inválida.");

  return errors;
}

function validateSubject(body) {
  const errors = [];
  const { name } = body;

  if (!name || String(name).trim().length < 2)
    errors.push("Nome da matéria deve ter pelo menos 2 caracteres.");
  if (String(name || "").length > 100)
    errors.push("Nome muito longo (máximo 100 caracteres).");
  if (body.teacher && String(body.teacher).length > 100)
    errors.push("Nome do professor muito longo (máximo 100 caracteres).");
  if (body.schedule && String(body.schedule).length > 100)
    errors.push("Horário muito longo (máximo 100 caracteres).");
  if (body.color && !/^#[0-9a-fA-F]{6}$/.test(body.color))
    errors.push("Cor inválida.");

  return errors;
}

function validateEvent(body) {
  const errors = [];
  const { title, date, type } = body;

  if (!title || String(title).trim().length < 2)
    errors.push("Título deve ter pelo menos 2 caracteres.");
  if (String(title || "").length > 200)
    errors.push("Título muito longo (máximo 200 caracteres).");
  if (!date || !isValidDate(date))
    errors.push("Data do evento inválida.");
  if (type && !["prova", "trabalho", "reunião", "outro"].includes(type))
    errors.push("Tipo de evento inválido.");
  if (body.time && !/^\d{2}:\d{2}$/.test(body.time))
    errors.push("Horário inválido (use o formato HH:MM).");

  return errors;
}

function validateRegister(body) {
  const errors = [];
  const { name, email, password } = body;

  if (!name || String(name).trim().length < 2)
    errors.push("Nome deve ter pelo menos 2 caracteres.");
  if (String(name || "").length > 100)
    errors.push("Nome muito longo (máximo 100 caracteres).");
  if (!email || !isValidEmail(email))
    errors.push("Email inválido.");
  if (!password || String(password).length < 6)
    errors.push("Senha deve ter pelo menos 6 caracteres.");
  if (String(password || "").length > 128)
    errors.push("Senha muito longa.");

  return errors;
}

module.exports = {
  sanitizeBody, sanitizeStr, sanitizeObj,
  isValidEmail, isValidObjectId, isValidDate,
  validateTask, validateSubject, validateEvent, validateRegister,
};
