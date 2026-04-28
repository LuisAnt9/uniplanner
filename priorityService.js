function calculatePriority(task) {
  const now = new Date();
  const diff = new Date(task.dueDate) - now;

  const days = diff / (1000 * 60 * 60 * 24);

  let score = 0;

  if (days < 1) score += 5;
  else if (days < 3) score += 3;
  else score += 1;

  score += task.difficulty;

  return score;
}

module.exports = { calculatePriority };