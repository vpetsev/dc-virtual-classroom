exports.correctAnswer = quiz => {
  const index = ['A', 'B', 'C', 'D'].indexOf(quiz.correct);
  return index === -1 ? quiz.correct : quiz['choice' + (index + 1)];
};
exports.normalizeAnswer = (answer, choices) => {
  if (typeof answer !== 'string') return null;
  const index = ['A', 'B', 'C', 'D'].indexOf(answer.trim().toUpperCase());
  if (index !== -1) return ['A', 'B', 'C', 'D'][index];
  return choices.includes(answer) ? ['A', 'B', 'C', 'D'][choices.indexOf(answer)] : null;
};
