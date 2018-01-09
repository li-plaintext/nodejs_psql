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

### CRUD example

```sql
Psql.query(`SELECT * FROM photo;`);

Psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`);

Psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`);

Psql.query(`DELETE FROM photo WHERE name='new';`);
```

### function example

```sql
Psql.query(`CREATE FUNCTION query_all() RETURNS SETOF photo AS $$ SELECT * FROM photo $$ LANGUAGE SQL;`);

Psql.query(`select query_all()`);

Psql.query(`DROP FUNCTION query_all()`);
```

### transaction example

```js
Psql.query(`
  BEGIN;
    select * from photo;
  COMMIT;`
);
```

### License

BSD 2-Clause License

Copyright (c) 2017, Li Xu
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
