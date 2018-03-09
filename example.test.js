const Psql = require('./node_psql');

const psql = new Psql({
  user: 'lixu',
  database: 'genomedb',
  password: 'lixu',
  port: 5432,
  ssl: true,
});

psql.connect();

// CRUD exmaples
// psql.query(`SELECT * FROM photo;`, (res) => {console.log(res)} );
// psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`, (res) => res);
// psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`, (res) => res);
// psql.query(`DELETE FROM photo WHERE name='new';`, (res) => res);

// Transaction exmaple
// psql.query(`
//   BEGIN;
//     select * from photo;
//   COMMIT;
// `, (res) => {console.log(res)});


// Function call
// psql.query(`CREATE FUNCTION query_all() RETURNS SETOF photo AS $$ SELECT * FROM photo $$ LANGUAGE SQL;`);
// psql.query(`select query_all()`, (res) => {console.log(res)});
// psql.query(`DROP FUNCTION query_all()`);


psql.extQuery(`SELECT * FROM photo;`, (res) => { console.log(res) });

// psql.copyFrom({
//   copy: 'photo',
//   data: [
//     [ '41', 'lixu', 'I am near polar bears', 'photo-with-bears.jpg', '1', '0'],
//     [ '42', 'lixu', 'I am near bears', 'photo-with-bears', '4', '1'],
//   ]
// });
//
// psql.copyTo({
//    copy: 'photo',
//    delimiter: ','
// }, (res) => { console.log(res) });
//
// psql.query(`COPY photo FROM '/Users/lixu/Desktop/people.csv' DELIMITER ','; `);
// psql.query(`COPY photo TO 'PATH/YOUR_FILE.csv' DELIMITER ',';`);
