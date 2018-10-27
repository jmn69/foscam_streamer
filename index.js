const Stream = require('./node-rtsp-stream');
const config = require('./config');

stream = new Stream({
  name: config.name,
  streamUrl: config.streamUrl,
  wsPort: config.port,
  width: 1280,
  height: 720,
});
