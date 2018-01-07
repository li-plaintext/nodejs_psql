# node_psql

<img src="https://img.shields.io/travis/USER/REPO.svg"/>
<img src="https://img.shields.io/npm/v/npm.svg" />

node_psql is for exploring postgres database purpose.

### instantiate

```
var Psql = new Psql({
  user: 'username',
  database: 'database',
  password: 'password',
  port: 5432
});
```

### CRUD EXAMPLE

```
Psql.query(`SELECT * FROM photo;`);

Psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`);

Psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`);

Psql.query(`DELETE FROM photo WHERE name='new';`);
```

### TRANSACTION EXAMPLE

```
BEGIN;
  select * from photo;
COMMIT;
```
