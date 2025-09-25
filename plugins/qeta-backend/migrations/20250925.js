// favicons typically require > 3000 characters
// 12 000 is a safe upper limit for larger favicons
const MAX_FAVICON_LENGTH = 12_000;

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('posts', table => {
    table.string('favicon', MAX_FAVICON_LENGTH).nullable();
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('favicon'); // default length is 255
  });
};
