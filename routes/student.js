const router = require('express').Router();
const models = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const { correctAnswer } = require('../lib/quizAnswers');

router.get('/student-dashboard/', asyncHandler(async (req, res) => {
  const quizzes = await models.Quiz.findAll({ where: { assignedTo: req.user.id } });
  res.render('student/student-dashboard', { quizzes: quizzes.map(quiz => quiz.dataValues) });
}));
router.get('/student-quiz-result', (req, res) => res.render('student/student-quiz-result'));

async function assignedQuiz(req) {
  if (!/^[1-9][0-9]*$/.test(req.params.id)) return null;
  return models.Quiz.findOne({ where: { id: req.params.id, assignedTo: req.user.id } });
}
router.get('/student-take-quiz/:id', asyncHandler(async (req, res) => {
  const quiz = await assignedQuiz(req);
  if (!quiz) return res.status(404).send('Quiz not found.');
  const { correct, ...view } = quiz.dataValues;
  res.render('student/student-take-quiz', view);
}));
router.post('/student-take-quiz/:id', asyncHandler(async (req, res) => {
  const quiz = await assignedQuiz(req);
  if (!quiz) return res.status(404).send('Quiz not found.');
  const answer = req.body.choice;
  if (typeof answer !== 'string' || ![quiz.choice1, quiz.choice2, quiz.choice3, quiz.choice4].includes(answer)) {
    return res.status(400).send('Choose one of the available answers.');
  }
  await models.completedquizes.create({
    studentId: req.user.id, quizId: quiz.id, studentAnswer: answer,
    isCorrect: correctAnswer(quiz) === answer,
  });
  res.redirect('/student/student-quiz-result');
}));
module.exports = router;
