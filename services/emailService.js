const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY não configurada — email não enviado.");
    return;
  }
  try {
    await resend.emails.send({
      from: "UniPlanner <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    console.log(`📧 Email enviado para ${to}: ${subject}`);
  } catch (err) {
    console.error("❌ Erro ao enviar email:", err.message);
  }
}

function taskAlertHtml(tasks) {
  const rows = tasks.map((t) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a">${t.title}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#f87171">
        ${new Date(t.dueDate).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #2a2a3a;color:#fbbf24">${"★".repeat(t.difficulty)}</td>
    </tr>`).join("");

  return `
    <div style="font-family:sans-serif;background:#0d1117;color:#e8edf5;padding:32px;border-radius:16px;max-width:560px;margin:auto">
      <h2 style="color:#6b9bff;margin-bottom:8px">🔔 Tarefas Vencendo em Breve</h2>
      <p style="color:#7b8ab0;margin-bottom:24px">Você tem ${tasks.length} tarefa(s) com prazo nas próximas 24 horas.</p>
      <table style="width:100%;border-collapse:collapse;background:#161b27;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#1e2538">
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#7b8ab0;text-transform:uppercase">Tarefa</th>
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#7b8ab0;text-transform:uppercase">Prazo</th>
            <th style="padding:12px 14px;text-align:left;font-size:12px;color:#7b8ab0;text-transform:uppercase">Dificuldade</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#7b8ab0;font-size:12px;margin-top:24px">UniPlanner — seu organizador universitário 🎓</p>
    </div>`;
}

function weeklySummaryHtml({ pending, done, upcoming, userName }) {
  const pendingRows = pending.slice(0, 10).map((t) => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #2a2a3a">${t.title}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #2a2a3a;color:#f87171">
        ${new Date(t.dueDate).toLocaleDateString("pt-BR", { day:"2-digit", month:"short" })}
      </td>
    </tr>`).join("");

  const upcomingRows = upcoming.slice(0, 5).map((e) => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #2a2a3a">${e.title}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #2a2a3a;color:#6b9bff">
        ${new Date(e.date).toLocaleDateString("pt-BR", { day:"2-digit", month:"short" })}
      </td>
    </tr>`).join("");

  return `
    <div style="font-family:sans-serif;background:#0d1117;color:#e8edf5;padding:32px;border-radius:16px;max-width:560px;margin:auto">
      <h2 style="color:#6b9bff;margin-bottom:4px">📋 Resumo Semanal</h2>
      <p style="color:#7b8ab0;margin-bottom:28px">Olá, ${userName || "Estudante"}! Semana de ${new Date().toLocaleDateString("pt-BR", { day:"2-digit", month:"long" })}</p>
      <div style="display:flex;gap:16px;margin-bottom:28px">
        <div style="flex:1;background:#161b27;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#f87171">${pending.length}</div>
          <div style="font-size:12px;color:#7b8ab0;margin-top:4px">Pendentes</div>
        </div>
        <div style="flex:1;background:#161b27;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#3ecf8e">${done.length}</div>
          <div style="font-size:12px;color:#7b8ab0;margin-top:4px">Concluídas</div>
        </div>
        <div style="flex:1;background:#161b27;border-radius:12px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#6b9bff">${upcoming.length}</div>
          <div style="font-size:12px;color:#7b8ab0;margin-top:4px">Eventos</div>
        </div>
      </div>
      ${pending.length ? `
      <h3 style="color:#e8edf5;margin-bottom:12px">⏳ Tarefas Pendentes</h3>
      <table style="width:100%;border-collapse:collapse;background:#161b27;border-radius:12px;overflow:hidden;margin-bottom:24px">
        <tbody>${pendingRows}</tbody>
      </table>` : ""}
      ${upcoming.length ? `
      <h3 style="color:#e8edf5;margin-bottom:12px">📅 Próximos Eventos</h3>
      <table style="width:100%;border-collapse:collapse;background:#161b27;border-radius:12px;overflow:hidden;margin-bottom:24px">
        <tbody>${upcomingRows}</tbody>
      </table>` : ""}
      <p style="color:#7b8ab0;font-size:12px;margin-top:8px">UniPlanner — seu organizador universitário 🎓</p>
    </div>`;
}

function passwordResetHtml({ userName, resetLink }) {
  return `
    <div style="font-family:sans-serif;background:#0d1117;color:#e8edf5;padding:32px;border-radius:16px;max-width:560px;margin:auto">
      <h2 style="color:#6b9bff;margin-bottom:8px">🔐 Recuperação de Senha</h2>
      <p style="color:#7b8ab0;margin-bottom:24px">Olá, ${userName || "Estudante"}! Recebemos uma solicitação para redefinir sua senha.</p>
      <p style="color:#7b8ab0;margin-bottom:24px">Clique no botão abaixo para criar uma nova senha:</p>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${resetLink}" style="display:inline-block;background:#4a7cf7;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">Redefinir Senha</a>
      </div>
      <p style="color:#7b8ab0;font-size:12px;margin-top:24px">Se você não solicitou esta recuperação, ignore este email. Seu link expirará em 1 hora.</p>
      <p style="color:#7b8ab0;font-size:12px;margin-top:8px">UniPlanner — seu organizador universitário 🎓</p>
    </div>`;
}

module.exports = { sendEmail, taskAlertHtml, weeklySummaryHtml, passwordResetHtml };
