// Email desativado — sistema usa Push Notifications e reset via painel admin
async function sendEmail({ to, subject, html }) {
  console.log(`📧 Email desativado — seria enviado para: ${to} | Assunto: ${subject}`);
}

function taskAlertHtml() { return ""; }
function weeklySummaryHtml() { return ""; }

module.exports = { sendEmail, taskAlertHtml, weeklySummaryHtml };
