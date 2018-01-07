# node_psql
*node_psql is built by using pure socket based on [https://www.postgresql.org/docs/8.2/static/protocol-message-formats.html](https://www.postgresql.org/docs/8.2/static/protocol-message-formats.html)*

> **Note**: node_psql is for exploring postgres database purpose

<span><img src="https://img.shields.io/travis/USER/REPO.svg"/><span>
<span><img src="https://img.shields.io/npm/v/npm.svg" /><span>
<span><img src="https://badges.gitter.im/Join%20Chat.svg" /><span>

### INSTANTIATE

```javascript
var Psql = new Psql({
  user: 'username',
  database: 'database',
  password: 'password',
  port: 5432
});
```

### CRUD EXAMPLE

```sql
Psql.query(`SELECT * FROM photo;`);

Psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`);

Psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`);

Psql.query(`DELETE FROM photo WHERE name='new';`);
```

### TRANSACTION EXAMPLE

```js
Psql.query(`
  BEGIN;
    select * from photo;
  COMMIT;`
);
```
