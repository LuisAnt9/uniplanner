// Limite de 5 tentativas de login por IP em 15 minutos
const attempts = new Map();

function loginLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxAttempts = 5;

  if (!attempts.has(ip)) {
    attempts.set(ip, { count: 0, resetAt: now + windowMs });
  }

  const record = attempts.get(ip);

  // Reseta se a janela expirou
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  if (record.count >= maxAttempts) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
    return res.status(429).json({
      success: false,
      error: `Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`,
    });
  }

  // Intercepta a resposta para contar só tentativas falhas
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && !data.success && res.statusCode === 401) {
      record.count++;
    } else if (data && data.success) {
      // Login bem-sucedido: reseta o contador
      record.count = 0;
    }
    return originalJson(data);
  };

  next();
}

module.exports = { loginLimiter };
