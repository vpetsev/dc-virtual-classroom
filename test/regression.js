const assert = require('assert').strict;
process.env.SESSION_SECRET = 'integration-test-secret';
const { prepare, start, models } = require('./support');
const bcrypt = require('bcrypt');
let server;
(async () => {
  await prepare();
  const columns = await models.sequelize.getQueryInterface().describeTable('Quizzes');
  assert(columns.questionnum, 'Fresh migrations must include every Quiz model column');
  const password = await bcrypt.hash('test-password', 4);
  const users = await models.User.bulkCreate([
    { username: 'student1@example.test', password, userType: 'student' },
    { username: 'student2@example.test', password, userType: 'student' },
    { username: 'admin@example.test', password, userType: 'admin' },
  ], { returning: true });
  server = await start(require('../app'));
  const call = server.request;
  const post = (route, body, cookie) => call(route, { method: 'POST', body, cookie, form: true });
  const login = async email => {
    const result = await post('/login', { email, password: 'test-password' });
    assert.equal(result.status, 302); return result.cookie;
  };
  assert.equal((await call('/student/student-dashboard')).location, '/login');
  const first = await login(users[0].username);
  const second = await login(users[1].username);
  const admin = await login(users[2].username);
  assert.equal((await call('/student/student-dashboard', { cookie: first })).status, 200);
  assert.equal((await call('/instructor/instructor-dash', { cookie: first })).status, 403);
  const quiz = await models.Quiz.create({
    quizName: 'Legacy stored answer', question: '2+2?', choice1: '4', choice2: '3', choice3: '2', choice4: '1',
    correct: '4', assignedTo: users[0].id,
  });
  const route = '/student/student-take-quiz/' + quiz.id;
  assert.equal((await call(route, { cookie: second })).status, 404);
  assert.equal((await post(route, { choice: '4' }, second)).status, 404);
  assert.equal(await models.completedquizes.count(), 0);
  assert.equal((await call(route, { cookie: first })).status, 200);
  assert.equal((await post(route, {}, first)).status, 400);
  assert.equal((await post(route, { choice: 'not a choice' }, first)).status, 400);
  assert.equal((await post(route, { choice: '4' }, first)).status, 302);
  assert.equal((await models.completedquizes.findOne()).isCorrect, true);
  assert.equal((await post(route, { choice: '3' }, first)).status, 302);
  assert.equal((await models.completedquizes.findAll({ order: [['id', 'DESC']] }))[0].isCorrect, false);
  assert.equal((await call('/student/student-take-quiz/99999', { cookie: first })).status, 404);
  assert.equal((await post('/register', { email: users[0].username, password: 'new' })).status, 409);
  assert.equal((await post('/register', { email: 'new@example.test', password: 'new', firstname: 'New', lastname: 'Student', userType: 'admin' })).status, 302);
  assert.equal((await models.User.findOne({ where: { username: 'new@example.test' } })).userType, 'student');
  assert.equal((await post('/login', { email: 'missing', password: 'wrong' })).status, 401);
  assert.equal((await post('/login', { email: users[0].username, password: 'wrong' })).status, 401);
  const body = {
    quizTitle: 'Multiple students', questionField: 'Pick blue', choiceA: 'red', choiceB: 'blue',
    choiceC: 'green', choiceD: 'yellow', correctAnswer: 'B',
    emailAdd: [users[0].username, users[1].username, users[0].username],
  };
  const created = await post('/instructor/instructor-create-quiz', body, admin);
  assert.equal(created.status, 302);
  assert.equal(created.location, '/instructor/instructor-dash');
  const assigned = await models.Quiz.findAll({ where: { quizName: body.quizTitle } });
  assert.equal(assigned.length, 2);
  assert.deepEqual(assigned.map(row => row.assignedTo).sort(), [users[0].id, users[1].id].sort());
  assert(assigned.every(row => row.correct === 'B'));
  const firstQuiz = assigned.find(row => row.assignedTo === users[0].id);
  assert.equal((await post('/student/student-take-quiz/' + firstQuiz.id, { choice: 'blue' }, first)).status, 302);
  assert.equal((await models.completedquizes.findOne({ where: { quizId: firstQuiz.id } })).isCorrect, true);
  const before = await models.Quiz.count();
  assert.equal((await post('/instructor/instructor-create-quiz', { ...body, emailAdd: [users[0].username, 'missing@example.test'] }, admin)).status, 400);
  assert.equal(await models.Quiz.count(), before, 'Invalid recipient must not leave a partial assignment');
  assert.equal((await post('/instructor/instructor-create-quiz', { ...body, emailAdd: [] }, admin)).status, 400);
  console.log('PASS: fresh migrations, role/quiz ownership, legacy and label grading, validation, duplicate registration, role injection and atomic multi-student assignment');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (server) await server.close();
  await models.sequelize.close();
});

