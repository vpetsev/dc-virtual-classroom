'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('Quizzes');
    if (!columns.questionnum) {
      await queryInterface.addColumn('Quizzes', 'questionnum', { type: Sequelize.INTEGER });
    }
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Quizzes', 'questionnum');
  },
};
