var Psql = require('./node_psql');

var Psql = new Psql({
  user: 'lixu',
  database: 'genomedb',
  port: 5432
});

Psql.connect();

// CRUD exmaples
// Psql.query(`SELECT * FROM photo;`);
// Psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`);
// Psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`);
// Psql.query(`DELETE FROM photo WHERE name='new';`);

// Transaction exmaple
// Psql.query(`
//   BEGIN;
//     select * from photo;
//   COMMIT;
// `);


// Function call
// Psql.query(`CREATE FUNCTION query_all() RETURNS SETOF photo AS $$ SELECT * FROM photo $$ LANGUAGE SQL;`);
// Psql.query(`select query_all()`);
// Psql.query(`DROP FUNCTION query_all()`);


// Psql.extQuery(`SELECT * FROM photo`);


Psql.copyFrom(`copy photo FROM STDIN `);
