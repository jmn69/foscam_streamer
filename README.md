# foscam_streamer

I have changed few things compare to the original foscam_streamer of chpmrc repository :
- Simple auth key for the websocket connection (through an nginx managing ssl)
- Start/stop the ffmpeg child process in sync with the websocket event (ffmpeg would not run all the time)
No need for supervisor nor watchdog script with that.
- Change some ffmpeg properties to fits my foscam C1


## Credits

- Thanks to the creators and maintainers of https://github.com/chpmrc/foscam_streamer, https://www.npmjs.com/package/node-rtsp-stream and https://github.com/phoboslab/jsmpeg.
