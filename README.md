# node_psql
*node_psql is built by using pure socket based on [https://www.postgresql.org/docs/8.2/static/protocol-message-formats.html](https://www.postgresql.org/docs/8.2/static/protocol-message-formats.html)*

> **Note**: node_psql is for exploring postgres database purpose

<span><img src="https://img.shields.io/travis/USER/REPO.svg"/><span>
<span><img src="https://img.shields.io/npm/v/npm.svg" /><span>
<span><img src="https://badges.gitter.im/Join%20Chat.svg" /><span>


Start-up
46.2.2. Simple Query
46.2.3. Extended Query
46.2.4. Function Call
46.2.5. COPY Operations
46.2.6. Asynchronous Operations
46.2.7. Canceling Requests in Progress
46.2.8. Termination
46.2.9. SSL Session Encryption

1. [Start up](#Start up)
1. [Simple Query](#Simple Query)
1. [Extended Query](#Extended Query)
1. [Function Call](#Function Call)
1. [COPY Operations](#COPY Operations)
1. [Asynchronous Operations](#Asynchronous Operations)
1. [Canceling Requests in Progress](#Canceling Requests in Progress)
1. [Termination](#Termination)
1. [SSL Session Encryption](#SSL Session Encryption)

## Start up

```javascript
const psql = new Psql({
  user: 'user',
  database: 'db',
  password: 'user',
  port: 5432,
  ssl: true,
});
```

## Simple Query

```sql
psql.query(`SELECT * FROM photo;`, (res) => res );

psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`, (res) => res);

psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`, (res) => res);

psql.query(`DELETE FROM photo WHERE name='new';`, (res) => res);
```

## Function Call
> **Note**: using simple query instead

```sql
psql.query(`CREATE FUNCTION query_all() RETURNS SETOF photo AS $$ SELECT * FROM photo $$ LANGUAGE SQL;`);

psql.query(`select query_all()`);

psql.query(`DROP FUNCTION query_all()`);
```

## transaction example

```js
psql.query(`
  BEGIN;
    select * from photo;
  COMMIT;`
);
```

## Extended Query

```js
psql.extQuery(`SELECT * FROM photo;`, (res) => res);
```


## COPY Operations

```js
psql.copyFrom({
  copy: 'photo',
  data: [
    [ '1', 'user', 'I am near polar bears', 'photo-with-bears.jpg', '1', '0'],
    [ '2', 'user', 'I am near bears', 'photo-with-bears.jpg', '4', '1'],
  ]
});

psql.copyTo({
   copy: 'photo',
   delimiter: ','
}, (res) => { console.log(res) });

psql.query(`COPY photo FROM 'PATH/YOUR_FILE.csv' DELIMITER ','; `);
psql.query(`COPY photo TO 'PATH/YOUR_FILE.csv' DELIMITER ',';`);
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
