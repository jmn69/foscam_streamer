(function() {
  var Mpeg1Muxer, STREAM_MAGIC_BYTES, VideoStream, events, util, ws;

  ws = require('ws');

  util = require('util');

  events = require('events');

  Mpeg1Muxer = require('./mpeg1muxer');

  STREAM_MAGIC_BYTES = 'jsmp';

  var config = require('../../config');

  var getParameterByName = require('../../getParameterByName');

  VideoStream = function(options) {
    this.name = options.name;
    this.streamUrl = options.streamUrl;
    this.width = options.width;
    this.height = options.height;
    this.wsPort = options.wsPort;
    this.inputStreamStarted = false;
    this.stream = void 0;
    this.pipeStreamToSocketServer();
    return this;
  };

  util.inherits(VideoStream, events.EventEmitter);

  VideoStream.prototype.startMpeg1Stream = function() {
    var gettingInputData, gettingOutputData, inputData, outputData, self;
    this.mpeg1Muxer = new Mpeg1Muxer({
      url: this.streamUrl,
    });
    self = this;
    if (this.inputStreamStarted) {
      return;
    }
    this.mpeg1Muxer.on('mpeg1data', function(data) {
      return self.emit('camdata', data);
    });
    gettingInputData = false;
    inputData = [];
    gettingOutputData = false;
    outputData = [];
    this.mpeg1Muxer.on('ffmpegError', function(data) {
      var size;
      data = data.toString();
      if (data.indexOf('Input #') !== -1) {
        gettingInputData = true;
      }
      if (data.indexOf('Output #') !== -1) {
        gettingInputData = false;
        gettingOutputData = true;
      }
      if (data.indexOf('frame') === 0) {
        gettingOutputData = false;
      }
      if (gettingInputData) {
        inputData.push(data.toString());
        size = data.match(/\d+x\d+/);
        if (size != null) {
          size = size[0].split('x');
          if (self.width == null) {
            self.width = parseInt(size[0], 10);
          }
          if (self.height == null) {
            return (self.height = parseInt(size[1], 10));
          }
        }
      }
    });
    this.mpeg1Muxer.on('ffmpegError', function(data) {
      return global.process.stderr.write(data);
    });
    return this;
  };

  VideoStream.prototype.pipeStreamToSocketServer = function() {
    var self;
    self = this;
    this.wsServer = new ws.Server({
      port: this.wsPort,
    });
    this.wsServer.on('connection', function(socket) {
      // add simple auth for ws
      // TODO: implement database connection to fetch user/pwd and compare with a token
      console.log(
        'url: ' + getParameterByName('wsSecretKey', socket.upgradeReq.url)
      );
      try {
        var wsSecretKey = getParameterByName(
          'wsSecretKey',
          socket.upgradeReq.url
        );
      } catch (e) {
        console.log('connection closed due to invalid JSON input data');
        socket.close();
        return;
      }
      if (wsSecretKey === config.wsSecretKey) {
        self.startMpeg1Stream();
        return self.onSocketConnect(socket);
      } else {
        console.log('connection closed due to invalid authentication');
        socket.close();
      }
    });
    this.wsServer.broadcast = function(data, opts) {
      var i, _results;
      _results = [];
      for (i in this.clients) {
        if (this.clients[i].readyState === 1) {
          _results.push(this.clients[i].send(data, opts));
        } else {
          _results.push(
            console.log('Error: Client (' + i + ') not connected.')
          );
        }
      }
      return _results;
    };
    return this.on('camdata', function(data) {
      return self.wsServer.broadcast(data);
    });
  };

  VideoStream.prototype.onSocketConnect = function(socket) {
    var self, streamHeader;
    self = this;
    streamHeader = new Buffer(8);
    streamHeader.write(STREAM_MAGIC_BYTES);
    streamHeader.writeUInt16BE(this.width, 4);
    streamHeader.writeUInt16BE(this.height, 6);
    socket.send(streamHeader, {
      binary: true,
    });
    console.log(
      '' +
        this.name +
        ': New WebSocket Connection (' +
        this.wsServer.clients.length +
        ' total)'
    );
    return socket.on('close', function(code, message) {
      console.log(self);
      self.mpeg1Muxer.stream.kill();
      return console.log(
        '' +
          this.name +
          ': Disconnected WebSocket (' +
          self.wsServer.clients.length +
          ' total)'
      );
    });
  };

  module.exports = VideoStream;
}.call(this));
