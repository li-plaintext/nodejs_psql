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


Psql.extQuery(`SELECT * FROM photo;`, (res) => { console.log(res) });

// Psql.copyFrom({
//   copy: 'photo',
//   data: [
//     [ '41', 'lixu', 'I am near polar bears', 'photo-with-bears.jpg', '1', '0'],
//     [ '42', 'lixu', 'I am near bears', 'photo-with-bears', '4', '1'],
//   ]
// });

// Psql.copyTo({
//    copy: 'photo',
//    delimiter: ','
// }, (res) => { console.log(res) });

// Psql.query(`COPY photo FROM '/Users/lixu/Desktop/people.csv' DELIMITER ','; `);
// Psql.query(`COPY photo TO 'PATH/YOUR_FILE.csv' DELIMITER ',';`);
