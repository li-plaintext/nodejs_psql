var net = require('net');


/*
  'R' -> AuthenticationOk
  'S' -> ParameterStatus
  'K' -> BackendKeyData
  'Z' -> ReadyForQuery
  'T' -> RowDescription
  'D' -> DataRow
  'C' -> CommandComplete
  'E' -> Error

  'Q' for query message
  'X' for ???
 */

var Psql = function(config = {}) {
  this.config = config;
  this.port = config.port || 5432;
  this.host = config.host || '127.0.0.1';
  this.queries = [];
  this.stream = new net.Stream();
  this.offset = 0;

  this.connect = function() {
    if(this.stream.readyState == 'closed'){
      this.stream.connect(this.port, this.host);
    }
    var self = this;
    this.stream.on('connect', function() {
      let startupMessageBuffer = self.startupMessage(self.config);
      self.stream.write(startupMessageBuffer);

    });

    this.stream.on('data', function(buffer) {
      while(self.offset < buffer.length){
        console.log("curent identifier: ", String.fromCharCode(buffer[self.offset]));
        switch(String.fromCharCode(buffer[self.offset])) {
          case 'R' :
            self.ParseAuthenticationOk(buffer);
            break;
          case 'S' :
            self.ParseparameterStatus(buffer);
            break;
          case 'Z' :
            self.ReadyForQuery(buffer);
            self.execQuery();
            break;
          case 'K' :
            self.BackendKeyData(buffer);
            break;
          case 'T' :
            console.log(self.RowDescription(buffer));
            break;
          case 'D' :
            let row = self.DataRow(buffer);
            console.log(row);
            break;
          case 'C' :
            self.CommandComplete(buffer);
            break;
          case 'E' :
            console.log(self.ErrorResponse(buffer));
            break;
          default:
            self.offset = buffer.length;
            break;
        }
      }

      console.log('=============end==================');
      console.log('offset: ', self.offset);
      console.log('buffer length: ', buffer.length);

      //clean up
      self.offset = 0;
    });

    this.stream.on('error', function(error){
      console.log(error.toString());
    });
  };

  this.startupMessage = function (config) {
    /*
      startup Message
      -----------------------------------------------------------------------------------------------
      | int32 len | int32 protocol | 'user' \0 'xxx_user' \0 'database' \0 'xxx_database' \0 ... \0 |
      -----------------------------------------------------------------------------------------------
     */

     let payloadBuffer = Buffer.from(
                   'user' + '\0' + config.user + '\0' +
                   'database' + '\0' + config.database + '\0' +
                   '\0', 'utf8');
     let protocolBuffer = new Buffer([0,3,0,0]);
     let length = 4 + protocolBuffer.length + payloadBuffer.length;
     let lengthBuffer = Buffer(4);
     lengthBuffer.writeUInt32BE(length, 0);

     let resBuffer = Buffer.concat([lengthBuffer, protocolBuffer, payloadBuffer]);

     return resBuffer;
  };

  this.parse = function(data) {

  }

  this.readChar = function(data) {
    return data[this.offset++];
  }

  this.readInt32 = function(data) {
    let int32 = data.readUIntBE(this.offset, 4);
    this.offset += 4;
    return int32;
  }

  this.readInt16 = function(data) {
    let int16 = data.readUIntBE(this.offset, 2);
    this.offset += 2;
    return int16;
  }

  this.readString = function(data) {
    var start = this.offset;
    while(data[this.offset++]) { };
    return data.toString('utf8',start, this.offset - 1);
  };

  this.ParseAuthenticationOk = function(data) {
    let identifier = data[this.offset++];
    let length = data.readUIntBE(this.offset, 4)
    this.offset += length;
  }

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

    return {name, value};
  }

  this.ErrorResponse = function(data) {
    let identifier = this.readChar(data);
    let length = this.readInt32(data);

    var errors = [];
    while(this.offset < length) {
      errors.push({
        code : String.fromCharCode(data[this.offset++]),
        value : this.readString(data),
      })
    };

    return errors;
  }

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

    return {processId, secretKey};
  }

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

    return {text};
  }

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

    return {status};
  }

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
    for(var i = 0; i < numfields; i++){
      columnArray.push({
        name: this.readString(data),
        tableId: this.readInt32(data),
        columnId: this.readInt16(data),
        typeId: this.readInt32(data),
        typeLen: this.readInt16(data),
        typmod: this.readInt32(data),
        format: this.readInt16(data),
      });
    }

    return columnArray;
  }

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
    for(var i = 0; i < numfields; i++) {
      let textLength = this.readInt32(data);
      let text = textLength == -1 ? null : data.toString('utf8', this.offset, (this.offset += textLength));
      rowArray.push(text);
    };

    return rowArray;
  };

  this.query = function(text) {
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
    let resBuffer = Buffer.concat([identifierBuffer, lengthBuffer, payloadBuffer]);

    this.queries.push(resBuffer);

  };

  this.execQuery = function() {
    if (this.queries.length <= 0) return;
    this.stream.write(this.queries.shift());
  };

  this.terminate = function() {
    /**
      terminate Message
      -------------------
      | 'X' | int32 len |
      -------------------
    */
    this.stream.write(new Buffer([88,0,0,0,4]));
  };

};


module.exports = Psql;
