const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const DEBUG = true;

var Psql = function(config = {}) {
  this.config = config;
  this.port = config.port || 5432;
  this.host = config.host || '127.0.0.1';
  this.queries = [];
  this.results = [];
  this.callback = undefined;
  this.stream = new net.Stream();
  this.offset = 0;
  this.isEmpty = false;

  this.connect = function() {
    if (this.stream.readyState == 'closed') {
      this.stream.connect(this.port, this.host);
    }
    var self = this;
    this.stream.on('connect', function() {
      if (self.config.ssl) {
        log('SSL mode');
        self.SSLRequest();
      } else {
        log('Ordinary mode');
        self.sendStartupMessage();
      }
    });

    this.stream.on('data', this.parseIncomingBuffer.bind(this));

    this.stream.on('error', function(error) {
      log(error.toString());
    });
  };

  this.parseIncomingBuffer = function(buffer) {
    var self = this;

    while (self.offset < buffer.length) {
      let identifier = String.fromCharCode(buffer[self.offset]);
      log('curent identifier: ' + identifier, NAMING[identifier]);
      switch (String.fromCharCode(buffer[self.offset])) {
        case 'R':
          self.AuthenticationProcess(buffer);
          break;
        case 'S':
          if (buffer.length === 1) {
            self.SSLResponse(buffer);
            self.SSLConnect();
          } else self.ParseparameterStatus(buffer);
          break;
        case 'Z':
          self.queries.length <= 0 && self.terminate();
          self.ReadyForQuery(buffer);
          self.execQuery();
          break;
        case 'K':
          self.BackendKeyData(buffer);
          break;
        case 'T':
          self.RowDescription(buffer);
          break;
        case 'D':
          let row = self.DataRow(buffer);
          this.results.push(row);
          break;
        case 'C':
          const { text } = self.CommandComplete(buffer);
          if (text && !text.match(/BEGIN/g) && typeof this.callback === 'function') {
            this.callback(this.results);
            this.callback = undefined;
            this.results = [];
          }
          break;
        case 'G':
          log(self.CopyInResponse(buffer));
          self.isEmpty = true;
          self.execQuery();
          break;
        case 'H':
          log(self.CopyOutResponse(buffer));
          break;
        case 'd':
          let CopyDataRow = self.receiveCopyData(buffer);
          this.results.push(CopyDataRow);
          break;
        case 'c':
          self.receiveCopyDone(buffer);
          break;
        case 'E':
          log(self.ErrorResponse(buffer));
          break;
        case 'N':
          if (buffer.length === 1) self.SSLResponse(buffer);
          else self.NoticeResponse(buffer);
          break;
        case 'A':
          self.NotificationResponse(buffer);
          break;
        case '1':
          log(self.parseComplete(buffer));
          break;
        case '2':
          log(self.bindComplete(buffer));
          break;
        default:
          // if something bad happen
          self.offset = buffer.length;
          break;
      }
    }

    //clean up
    self.offset = 0;
  };

  this.sendStartupMessage = function() {
    let startupMessageBuffer = this.startupMessage(this.config);
    this.stream.write(startupMessageBuffer);
  };

  this.startupMessage = function(config) {
    /*
      startup Message
      -----------------------------------------------------------------------------------------------
      | int32 len | int32 protocol | 'user' \0 'xxx_user' \0 'database' \0 'xxx_database' \0 ... \0 |
      -----------------------------------------------------------------------------------------------
     */

    let payloadBuffer = Buffer.from(
      'user' +
        '\0' +
        config.user +
        '\0' +
        'database' +
        '\0' +
        config.database +
        '\0' +
        '\0',
      'utf8'
    );
    let protocolBuffer = new Buffer([0, 3, 0, 0]);
    let length = 4 + protocolBuffer.length + payloadBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      lengthBuffer,
      protocolBuffer,
      payloadBuffer
    ]);

    return resBuffer;
  };

  this.sendPasswordMessage = function(salt) {
    let password = this.config.password;

    if (salt) {
      let userPassBuffer = Buffer.from(
        this.md5(this.config.password + this.config.user)
      );
      let passwordWithSalt = Buffer.concat([userPassBuffer, salt]);
      password = 'md5' + this.md5(passwordWithSalt).toString('utf8');
    }
    let passwordMessageBuffer = this.PasswordMessage(password);

    this.stream.write(passwordMessageBuffer);
  };

  this.PasswordMessage = function(text = '') {
    let identifierBuffer = Buffer([0x70]);
    let passwordBuffer = Buffer.from(text + '\0', 'utf8');
    let length = 4 + passwordBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      passwordBuffer
    ]);

    return resBuffer;
  };

  this.AuthenticationProcess = function(data) {
    let identifier = data[this.offset++];
    let length = this.readInt32(data);
    let indicator = this.readInt32(data);

    if (length === 8) {
      switch (indicator) {
        case 0:
          return this.AuthenticationOk(data);
        case 2:
          return this.AuthenticationKerberosV5(data);
        case 3:
          return this.AuthenticationCleartextPassword(data);
        case 6:
          return this.AuthenticationSCMCredential(data);
        case 7:
          return this.AuthenticationGSS(data);
        case 9:
          return this.AuthenticationSSPI(data);
        default:
          break;
      }
    }

    if (length === 12 && indicator === 5)
      return this.AuthenticationMD5Password(data);

    if (indicator === 8) return this.AuthenticationGSSContinue(data);
  };
  this.AuthenticationOk = function(data) {};
  this.AuthenticationKerberosV5 = function(data) {};
  this.AuthenticationCleartextPassword = function(data) {
    log('request CleartextPassword');
    this.sendPasswordMessage();
  };
  this.AuthenticationMD5Password = function(data) {
    log('request MD5Password');
    // let salt = this.readStringWithLen(data, 4);
    // log('---------', salt.length);
    let salt = data.slice(this.offset, this.offset + 4);
    this.offset += 4;
    this.sendPasswordMessage(salt);
  };
  this.AuthenticationSCMCredential = function(data) {};
  this.AuthenticationGSS = function(data) {};
  this.AuthenticationSSPI = function(data) {};
  this.AuthenticationGSSContinue = function(data) {};

  this.ParseparameterStatus = function(data) {
    /**
     ParseparameterStatus Message
     ------------------------------------------
     | 'S' | int32 len | 'name' \0 'value' \0 |
     ------------------------------------------
     */
    let identifier = this.readChar(data);
    let length = this.readInt32(data);

    let name = this.readString(data);
    let value = this.readString(data);

    return { name, value };
  };

  this.ErrorResponse = function(data) {
    log('ErrorResponse in error ');
    /**
     * ErrorResponse
     * in 2.0 it was just a string, in 3.0 it has structure
     */
    let identifier = this.readChar(data);
    let length = this.readInt32(data);

    var errors = [];
    while (this.offset < length) {
      errors.push({
        code: String.fromCharCode(data[this.offset++]),
        value: this.readString(data)
      });
    }

    return errors;
  };

  this.BackendKeyData = function(data) {
    /**
     BackendKeyData Message
     ----------------------------------------------------------
     | 'K' | int32 len |  int32 processId |  int32 secretKey |
     ----------------------------------------------------------
     */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);

    let processId = this.readInt32(data);
    let secretKey = this.readInt32(data);

    return { processId, secretKey };
  };

  this.CommandComplete = function(data) {
    /**
     CommandComplete Message
     -------------------------------
     | 'C' | int32 len |  str text |
     -------------------------------
     */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);

    let text = this.readString(data);

    return { text };
  };

  this.ReadyForQuery = function(data) {
    /**
     ReadyForQuery Message
     ---------------------------------------
     | 'Z' | int32 len | 'I' or 'T' or 'E' |
     ---------------------------------------
     */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);

    let status = this.readChar(data);

    return { status };
  };

  this.RowDescription = function(data) {
    /**
      RowDescription Message
      --------------------------------------------------------------------------------------------------------------------------------------------
      | 'T' | int32 len | int16 numfields | str name | int32 tableId | int16 columnId | int32 typeId | int16 typelen | int32 typmod | int16 format |
      --------------------------------------------------------------------------------------------------------------------------------------------
     */
    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let numfields = this.readInt16(data);

    let columnArray = [];
    for (var i = 0; i < numfields; i++) {
      columnArray.push({
        name: this.readString(data),
        tableId: this.readInt32(data),
        columnId: this.readInt16(data),
        typeId: this.readInt32(data),
        typeLen: this.readInt16(data),
        typmod: this.readInt32(data),
        format: this.readInt16(data)
      });
    }

    return columnArray;
  };

  this.DataRow = function(data) {
    /**
      DataRow Message
      ---------------------------------------------------------------------
      | 'D' | int32 len | int16 numfields | int32 textLength |  str text |
      ---------------------------------------------------------------------
     */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let numfields = this.readInt16(data);

    let rowArray = [];
    for (var i = 0; i < numfields; i++) {
      let textLength = this.readInt32(data);
      let text =
        textLength == -1
          ? null
          : data.toString('utf8', this.offset, (this.offset += textLength));
      rowArray.push(text);
    }

    return rowArray;
  };

  this.query = function(text, callback) {
    /**
      Query Message
      -------------------------------
      | 'Q' | int32 len | str query |
      -------------------------------
    */
    let payloadBuffer = Buffer.from(text + '\0', 'utf8');
    let length = 4 + payloadBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);
    let identifierBuffer = Buffer([0x51]);
    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      payloadBuffer
    ]);

    this.pushToQuereies(resBuffer, callback);
  };

  this.pushToQuereies = function(buffer, callback) {
    this.queries.push({
      buffer,
      callback
    });
  }

  this.execQuery = function() {
    if (this.queries.length <= 0) return;

    if (this.isEmpty) {
      // <= send rest of buffer in array
      while (this.queries.length > 0) {
        const { buffer, callback } = this.queries.shift();
        this.callback = callback;
        this.stream.write(buffer);
      };
    } else {
      const { buffer, callback } = this.queries.shift();
      this.callback = callback;
      this.stream.write(buffer);
    }
  };

  this.terminate = function() {
    /**
      terminate Message
      -------------------
      | 'X' | int32 len |
      -------------------
    */
    this.stream.write(new Buffer([88, 0, 0, 0, 4]));
  };

  this.extQuery = function(text, callback) {
    this.parseMessage(text);
    this.bindMessage();
    this.executeMessage();
    this.syncMessage(callback);

    this.isEmpty = true;
  };

  this.parseMessage = function(text) {
    /**
      parse Message
      ------------------------------------------------------------------------------------------------
      | 'P' | int32 len | str statement | str query | int16 lenOfDataTypes | ... int32 data type ... |
      ------------------------------------------------------------------------------------------------
    */
    let identifierBuffer = Buffer([0x50]);
    let statementBuffer = Buffer.from('\0', 'utf8');
    let queryBuffer = Buffer.from(text + '\0', 'utf8');
    let parameterDataTypesLenBuffer = Buffer([0, 0]);

    let length =
      4 +
      statementBuffer.length +
      queryBuffer.length +
      parameterDataTypesLenBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      statementBuffer,
      queryBuffer,
      parameterDataTypesLenBuffer
    ]);

    this.pushToQuereies(resBuffer);
  };

  this.parseComplete = function(data) {
    /**
      parseComplete Message
      -------------------
      | '1' | int32 len |
      -------------------
    */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let resDataLength = length - 4;
    this.comsumeUnfinishedData(resDataLength); // TODO: wierd

    return { identifier };
  };

  this.bindMessage = function(values = []) {
    /**
      bind Message
      ----------------------------------------------------------------------------------------------------------------------------------------------------------------
      | 'B' | int32 len | str portal | str statement | int16 param format (1 or 0) | int16 numOfvalues | ... | int32 len | Byten value | ... | int16 result format (1 or 0) |
      ----------------------------------------------------------------------------------------------------------------------------------------------------------------
    */
    let identifierBuffer = Buffer([0x42]);
    let portalBuffer = Buffer(0);
    let statementBuffer = Buffer(0);
    let parameterFormatBuffer = Buffer([0, 0]);
    let resultFormatBuffer = Buffer([0, 0]);

    let valueBufferArr = values.map(value => {
      let convertedValue = String(value === null ? value : -1);
      let length = 4 + convertedValue.length;
      let valueBuffer = Buffer(4 + length);
      valueBuffer.writeUInt32BE(length, 0);
      valueBuffer.writeUIntBE(convertedValue, 4);

      return valueBuffer;
    });

    let valueBufferInOne = Buffer.concat(valueBufferArr);

    let numOfvalueBuffer = Buffer(4 + values.length);
    numOfvalueBuffer.writeUInt32BE(values.length, 0);

    let length =
      4 +
      portalBuffer.length +
      statementBuffer.length +
      valueBufferInOne.length +
      parameterFormatBuffer.length +
      numOfvalueBuffer.length +
      resultFormatBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      portalBuffer,
      statementBuffer,
      parameterFormatBuffer,
      numOfvalueBuffer,
      valueBufferInOne,
      resultFormatBuffer
    ]);

    this.pushToQuereies(resBuffer);
  };

  this.bindComplete = function(data) {
    /**
      bindComplete Message
      -------------------
      | '2' | int32 len |
      -------------------
    */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let resDataLength = length - 4;
    this.comsumeUnfinishedData(resDataLength); // TODO: wierd

    return { identifier };
  };

  this.describeMessage = function() {
    /**
      describeMessage Message
      -------------------------------------------------------
      | 'D' | int32 len | 'S'or'P'| str statement or portal |
      -------------------------------------------------------
    */

    let identifierBuffer = Buffer([0x44]);
    let indicatorBuffer = Buffer.from('S', 'utf8');

    let length = indicatorBuffer.length;
    let lengthBuffer = Buffer(4 + length);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      indicatorBuffer
    ]);

    this.stream.write(resBuffer);
  };

  this.executeMessage = function() {
    /**
      executeMessage
      -----------------------------------------------------------
      | 'E' | int32 len | str statement or portal | Int32 rows  |
      -----------------------------------------------------------
    */

    let identifierBuffer = Buffer([0x45]);
    let indicatorBuffer = Buffer.from('\0', 'utf8');
    let numberOfRowsBuffer = Buffer([0, 0, 0, 0]);

    let length = 4 + indicatorBuffer.length + numberOfRowsBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      indicatorBuffer,
      numberOfRowsBuffer
    ]);

    this.pushToQuereies(resBuffer);
  };

  this.syncMessage = function(callback) {
    /**
      syncMessage
      -------------------
      | 'S' | int32 len |
      -------------------
    */

    let identifierBuffer = Buffer([0x53]);

    let length = 4 + 0;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([identifierBuffer, lengthBuffer]);

    this.pushToQuereies(resBuffer, callback);
  };

  this.copyTo = function(query, callback) {
    const copy = query.copy;
    const delimiter = query.delimiter || ',';
    const data = query.data instanceof Array? query.data : [];
    const queryString = `COPY ${copy} TO STDOUT DELIMITER '${delimiter}'`;

    this.query(queryString, callback);
  };
  this.copyFrom = function(query) {
    const copy = query.copy;
    const data = query.data instanceof Array? query.data : [];
    const queryString = `COPY ${copy} FROM STDIN`;

    this.query(queryString);
    while(data.length > 0) this.sendCopyData(data.shift());


    this.sendCopyDone();
  };

  this.sendCopyData = function(arr) {
    /**
     * @type {[Copy-in mode]}
      -----------------------------------
      | 'd' | int32 len | str query |
      -----------------------------------
    */
    let identifierBuffer = Buffer([0x64]);
    let dataString = arr.toString().replace(/,/g, '\t');
    let queryBuffer = Buffer.from(dataString + '\n', 'utf8');

    let length = 4 + queryBuffer.length;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([
      identifierBuffer,
      lengthBuffer,
      queryBuffer
    ]);

    this.pushToQuereies(resBuffer);
  };
  this.receiveCopyData = function(data) {
    /**
      copyData
      -----------------------------------
      | 'd' | int32 len | str data |
      -----------------------------------
    */
    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let dataInRow = this.readStringWithLen(data, length - 4)
      .replace(/\n/g, '')
      .split(/\t/g);

    return { identifier, length, dataInRow };
  };

  this.receiveCopyDone = function(data) {
    /**
      receiveCopyDone
      -------------------
      | 'c' | int32 len |
      -------------------
    */
    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let dataInRow = this.readStringWithLen(data, length - 4);

    return { identifier };
  };
  this.sendCopyDone = function() {
    /**
      CopyDone
      -------------------
      | 'c' | int32 len |
      -------------------
    */
    let identifierBuffer = Buffer([0x63]);
    let length = 4;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let resBuffer = Buffer.concat([identifierBuffer, lengthBuffer]);

    this.pushToQuereies(resBuffer);
  };

  this.CopyFail = function() {
    //TODO
  };

  this.CopyInResponse = function(data) {
    /**
      CopyInResponse Message
      ------------------------------------------------
      | 'G' | int32 len | int8 indicator | int16 num |
      ------------------------------------------------
    */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let indicator = this.readInt8(data);
    let num = this.readInt16(data);
    let resDataLength = length - 4 - 1 - 2;
    this.comsumeUnfinishedData(resDataLength); // TODO: wierd

    return { identifier, length, indicator, num };
  };
  this.CopyOutResponse = function(data) {
    /**
      CopyOutResponse Message
      ------------------------------------------------
      | 'H' | int32 len | int8 indicator | int16 num |
      ------------------------------------------------
    */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let indicator = this.readInt8(data);
    let num = this.readInt16(data);
    let resDataLength = length - 4 - 1 - 2;
    this.comsumeUnfinishedData(resDataLength); // TODO: wierd

    return { identifier, length, indicator, num };
  };

  this.NoticeResponse = function(data) {
    /**
      NoticeResponse Message
      ------------------------------------------------------
      | 'N' | int32 len | ... | byte1 code | str value |...
      ------------------------------------------------------
    */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let resDataLength = length - 4;
    this.comsumeUnfinishedData(resDataLength); // TODO

    return { identifier };
  };

  this.NotificationResponse = function() {
    /**
      NotificationResponse Message
      -----------------------------------------------------------
      | 'A' | int32 len | int32 processID | str name | str msg  |
      -----------------------------------------------------------
    */

    let identifier = this.readChar(data);
    let length = this.readInt32(data);
    let processID = this.readInt32(data);
    let name = this.readString(data);
    let msg = this.readString(data);

    return { identifier, length, processID, name, msg };
  };

  /**
   *
   * SSL
   *
   */

  this.SSLConnect = function() {
    var self = this;

    self.stream = tls.connect({
      socket: self.stream,
      servername: self.host,
      rejectUnauthorized: false
    });

    this.sendStartupMessage();

    this.stream.on('data', this.parseIncomingBuffer.bind(this));
    this.stream.on('error', function(data) {
      log('error', data);
    });
  };

  this.SSLRequest = function() {
    /**
      SSLRequest
      -----------------------------------
      | int32 len | int32 [1234...5678] |
      -----------------------------------
    */
    let length = 8;
    let lengthBuffer = Buffer(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let SSLRequestCode = Buffer(4);
    SSLRequestCode.writeUInt16BE(1234, 0);
    SSLRequestCode.writeUInt16BE(5679, 2);

    let resBuffer = Buffer.concat([lengthBuffer, SSLRequestCode]);

    this.stream.write(resBuffer);
  };

  this.SSLResponse = function(data) {
    let identifier = this.readChar(data);

    return { identifier };
  };

  /**
   *  utils
   *
   *  buffer reader/parser
   */

  this.readChar = function(data) {
    return data[this.offset++];
  };

  this.readInt32 = function(data) {
    let int32 = data.readUIntBE(this.offset, 4);
    this.offset += 4;
    return int32;
  };

  this.readInt16 = function(data) {
    let int16 = data.readUIntBE(this.offset, 2);
    this.offset += 2;
    return int16;
  };

  this.readInt8 = function(data) {
    let int8 = data.readUIntBE(this.offset++);
    return int8;
  };

  this.readString = function(data) {
    var start = this.offset;
    while (data[this.offset++]) {}
    return data.toString('utf8', start, this.offset - 1);
  };

  this.readStringWithLen = function(data, end) {
    let str = data.toString('utf8', this.offset, this.offset + end);
    this.offset += end;
    return str;
  };

  this.comsumeUnfinishedData = function(length) {
    this.offset += length;
  };

  this.md5 = function(text) {
    return crypto
      .createHash('md5')
      .update(text)
      .digest('hex');
  };
};

const NAMING = {
  // request
  'send->Q': 'simple query',
  'send->X': 'terminate',
  'send->P': 'parse',
  'send->B': 'bind',
  'send->E': 'exection',
  'send->S': 'sync',

  // response
  R: 'AuthenticationOk',
  S: 'ParameterStatus',
  K: 'BackendKeyData',
  Z: 'ReadyForQuery',
  T: 'RowDescription',
  D: 'DataRow',
  C: 'CommandComplete',
  E: 'Error',
  N: 'Notice',
  '1': 'ParseComplete',
  '2': 'BindComplete',
  A: 'Notification',
  G: 'CopyInResponse',
  H: 'CopyOutResponse',
  N: 'NoticeResponse',
  A: 'NotificationResponse',
  c: 'CopyDone',
  d: 'CopyData'
};

const log = function(first, second) {
  if (DEBUG) {
    second ? console.log(first, second) : console.log(first);
  }
};

module.exports = Psql;
