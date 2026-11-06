# DC-Virtual Classroom

A Learning Management System for software educators and students. 

## Overview: 

Virtual Classroom allows Software Educators and Students to better manage their materials surrounding learning in a remote setting. The applications allows for educators to create and assign quizzes to students using a relational database. The inital MVP (minimum viable product) goals were reached and work is being done on the stretch goals.

## What we used: 

### Technologies: 

* HTML5
* CSS3
* JavaScript ES6
* Node.JS
* PostgreSQL
* Sequelized
* MustacheJS
* Heroku

## Minimum Viable Product:
* Registration and sign for all users
* Encryption on log-in, checking user-type (student, instructor) and routing to appropriate portal
* Instructor can create quizzes and assign quizzes to students. Students can take quizzes assigned to them.
* Mobile-Responsiveness
* Sign out functionality to end the current session

## Stretch Goals:
* Add an additional usertype for admin
* Time-limits and due-dates for quizzes
* File storage 

## Contributors

See also the list of
[contributors](https://github.com/PurpleBooth/a-good-readme-template/contributors)
who participated in this project.
(https://github.com/Vpetsev96)
(https://github.com/NathanNOSUDO)


## Local configuration and regression tests

The database configuration now reads `DATABASE_URL` or `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` from the environment. Production requires `DATABASE_URL` and `SESSION_SECRET`. Export the values shown in `.env.example` before starting; this application does not automatically load an `.env` file. Previously committed database credentials must be rotated by their owner; this change does not revoke historical copies.

```sh
npm install
npx sequelize-cli@5 db:migrate
npm start
```

The default HTTP port is 3003; `PORT` overrides it. `SESSION_SECRET` should be a random persistent value. Development without one uses an ephemeral random key and logs out sessions on restart. Public registration always creates a student. Instructor accounts have the `admin` role and must be provisioned by an authorized database administrator, not through the signup form.

Apply the new question-number migration before starting the updated app. It adds the column used by the Quiz model and tolerates deployments that already added it manually. Assignments accept one or multiple student emails, are validated before insertion, and are saved atomically. Correct-answer labels A–D and older stored answer text are supported when grading.

Regression tests require Node 18+ and a fresh, empty PostgreSQL database; they refuse a database containing public tables:

```sh
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/classroom_test npm test
```

The suite applies all migrations and exercises real HTTP role restrictions, quiz ownership on both reading and submission, correct/incorrect grading, multi-student assignments, invalid-recipient rollback, duplicate registration and attempts to choose an elevated role. bcrypt 6 retains the same API while supporting modern Node installations without the obsolete bcrypt 4 binding.
