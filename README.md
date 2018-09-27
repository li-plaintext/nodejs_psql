# node_psql
*node_psql is built by using pure socket based on [https://www.postgresql.org/docs/8.2/static/protocol-message-formats.html](https://www.postgresql.org/docs/8.2/static/protocol-message-formats.html)*

> **Note**: node_psql is for exploring postgres database purpose

> **More Information**: https://www.npmjs.com/package/nodejs_psql

<span><img src="https://img.shields.io/travis/USER/REPO.svg"/><span>
<span><img src="https://img.shields.io/npm/v/npm.svg" /><span>
<span><img src="https://badges.gitter.im/Join%20Chat.svg" /><span>

  1. [Startup](#Start_up) :white_check_mark:
  1. [Simple Query](#Simple_Query) :white_check_mark:
  1. [Extended Query](#Extended_Query) :white_check_mark:
  1. [Function Call](#Function_Call) :x:
  1. [COPY Operations](#COPY_Operations) :white_check_mark:
  1. [Asynchronous Operations](#Asynchronous_Operations) :white_check_mark:
  1. [Canceling Requests in Progress](#Canceling_Requests_in_Progress) :x:
  1. [Termination](#Termination) :white_check_mark:
  1. [SSL Session Encryption](#SSL_Session_Encryption) :white_check_mark:

## Installation
> $ npm install nodejs_psql

## Start up

```javascript
const Psql = require('nodejs_psql');

const psql = new Psql({
  user: 'user',
  database: 'db',
  password: 'user',
  port: 5432,
  ssl: true,
});

psql.connect();
```

## Simple Query

```sql
psql.query(`SELECT * FROM photo;`, (res) => res );

psql.query(`INSERT INTO photo (name, description, filename, views, age) VALUES ('new', 'description', 'filename', 1, 2);`, (res) => res);

psql.query(`UPDATE photo SET description='xxx' WHERE name='new';`, (res) => res);

psql.query(`DELETE FROM photo WHERE name='new';`, (res) => res);
```

## Function Call
> **Note**: Currently, using simple query instead, since function call is a legacy feature.

```sql
psql.query(`CREATE FUNCTION query_all() RETURNS SETOF photo AS $$ SELECT * FROM photo $$ LANGUAGE SQL;`);

psql.query(`select query_all()`);

psql.query(`DROP FUNCTION query_all()`);
```
> Transaction example

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

> Standard input/output


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
```

> Non standard input/output


```js
psql.query(`COPY photo FROM 'PATH/YOUR_FILE.csv' DELIMITER ','; `);
psql.query(`COPY photo TO 'PATH/YOUR_FILE.csv' DELIMITER ',';`);
```

## SSL Session Encryption
It supports any CA that can be recognised by Nodejs `tls` modules.
Currently `rejectUnauthorized` is set up to `false`, so any self-signed CA works.
In ssl/self-signed-certificate, it roughly gives an idea how to generate a self-signed-certificate by using openssl command line tools.

## License
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
