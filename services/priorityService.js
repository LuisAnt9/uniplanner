function calculatePriority(task) {
  const now = new Date();
  const diff = new Date(task.dueDate) - now;
  const days = diff / (1000 * 60 * 60 * 24);

  let urgencyScore = 0;
  if (days < 0) urgencyScore = 6;        // vencida
  else if (days < 1) urgencyScore = 5;   // menos de 1 dia
  else if (days < 3) urgencyScore = 3;   // menos de 3 dias
  else if (days < 7) urgencyScore = 2;   // menos de 7 dias
  else urgencyScore = 1;

  const score = urgencyScore + task.difficulty;

  let label = "baixa";
  if (score >= 9) label = "crítica";
  else if (score >= 7) label = "alta";
  else if (score >= 5) label = "média";

  return { score, label };
}

module.exports = { calculatePriority };
