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

### License

MIT License

Copyright (c) 2017 Li Xu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
