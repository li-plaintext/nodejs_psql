var Psql = require('./node_psql');

var Psql = new Psql({
  user: 'lixu',
  database: 'genomedb',
  password: 'lixu',
  port: 5432,
  ssl: true,
  sslPath: './ssl/keys/'
});

Psql.connect();

// CRUD exmaples
// Psql.query(`SELECT * FROM photo;`, (res) => {console.log(res)} );
// Psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`, (res) => res);
// Psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`, (res) => res);
// Psql.query(`DELETE FROM photo WHERE name='new';`, (res) => res);

// Transaction exmaple
// Psql.query(`
//   BEGIN;
//     select * from photo;
//   COMMIT;
// `, (res) => {console.log(res)});


// Function call
// Psql.query(`CREATE FUNCTION query_all() RETURNS SETOF photo AS $$ SELECT * FROM photo $$ LANGUAGE SQL;`);
// Psql.query(`select query_all()`, (res) => {console.log(res)});
// Psql.query(`DROP FUNCTION query_all()`);


// Psql.extQuery(`SELECT * FROM photo;`, (res) => { console.log(res) });


Psql.copyFrom(`copy photo FROM STDIN `);
