const router = require('express').Router();
const models = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
const { normalizeAnswer } = require('../lib/quizAnswers');

router.get('/instructor-dash', asyncHandler(async (req, res) => {
  const quizzes = await models.Quiz.findAll();
  res.render('instructor/instructor-dash', { quizzes: quizzes.map(quiz => quiz.dataValues) });
}));
router.get('/instructor-quizzes', (req, res) => res.redirect('/instructor/instructor-dash'));
for (const [route, view] of [
  ['/instructor-quizzes/:id', 'instructor/instructor-quiz'],
  ['/instructor-edit-quiz/:id', 'instructor/instructor-edit-quiz'],
]) router.get(route, asyncHandler(async (req, res) => {
  const quiz = await models.Quiz.findByPk(req.params.id);
  if (!quiz) return res.status(404).send('Quiz not found.');
  res.render(view, quiz.dataValues);
}));

router.post('/update-quiz-answer/:id', asyncHandler(async (req, res) => {
  const quiz = await models.Quiz.findByPk(req.params.id);
  if (!quiz) return res.status(404).send('Quiz not found.');
  const correct = normalizeAnswer(req.body.correctAnswer, [quiz.choice1, quiz.choice2, quiz.choice3, quiz.choice4]);
  if (correct === null) return res.status(400).send('Choose a valid correct answer.');
  await quiz.update({ correct });
  res.redirect('/instructor/instructor-edit-quiz/' + quiz.id);
}));
router.post('/update-title-name/:id', asyncHandler(async (req, res) => {
  const quiz = await models.Quiz.findByPk(req.params.id);
  if (!quiz) return res.status(404).send('Quiz not found.');
  if (typeof req.body.quizName !== 'string' || !req.body.quizName.trim()) {
    return res.status(400).send('A quiz title is required.');
  }
  await quiz.update({ quizName: req.body.quizName });
  res.redirect('/instructor/instructor-edit-quiz/' + quiz.id);
}));
router.get('/instructor-create-quiz', asyncHandler(async (req, res) => {
  const users = await models.User.findAll({ where: { userType: 'student' } });
  res.render('instructor/instructor-create-quiz', { users });
}));
router.post('/instructor-create-quiz', asyncHandler(async (req, res) => {
  const body = req.body;
  const choices = [body.choiceA, body.choiceB, body.choiceC, body.choiceD];
  const required = [body.quizTitle, body.questionField, ...choices];
  if (required.some(value => typeof value !== 'string' || !value.trim())) {
    return res.status(400).send('A title, question and four choices are required.');
  }
  const correct = normalizeAnswer(body.correctAnswer, choices);
  if (correct === null) return res.status(400).send('Choose a valid correct answer.');
  const emails = [...new Set(Array.isArray(body.emailAdd) ? body.emailAdd : [body.emailAdd])];
  if (!emails.length || emails.some(email => typeof email !== 'string' || !email.trim())) {
    return res.status(400).send('Select at least one student.');
  }
  const created = await models.sequelize.transaction(async transaction => {
    const students = await models.User.findAll({
      where: { username: emails, userType: 'student' }, transaction,
    });
    if (students.length !== emails.length) return false;
    await models.Quiz.bulkCreate(students.map(student => ({
      quizName: body.quizTitle, question: body.questionField,
      choice1: choices[0], choice2: choices[1], choice3: choices[2], choice4: choices[3],
      correct, assignedTo: student.id,
    })), { transaction });
    return true;
  });
  if (!created) return res.status(400).send('One or more selected students do not exist.');
  res.redirect('/instructor/instructor-dash');
}));
router.get('/instructor-delete-quiz/:id', asyncHandler(async (req, res) => {
  await models.sequelize.transaction(async transaction => {
    await models.completedquizes.update({ quizId: null }, { where: { quizId: req.params.id }, transaction });
    await models.Quiz.destroy({ where: { id: req.params.id }, transaction });
  });
  res.redirect('/instructor/instructor-dash');
}));
module.exports = router;
