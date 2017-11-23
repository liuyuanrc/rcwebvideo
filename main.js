var client, localStream, camera, microphone;

    var audioSelect = document.querySelector('select#audioSource');
    var videoSelect = document.querySelector('select#videoSource');
    var flag = false;
    var cur = {
      x: 0,
      y: 0
    }
    var nx, ny, dx, dy, x, y;
    var documentWidth = document.body.clientWidth;
    var documentHeight = document.body.clientHeight;
    function join() {
      document.getElementById("join").disabled = true;
      document.getElementById("isVideo").disabled = true;
      var channel_key = null;

      console.log("Init AgoraRTC client with vendor key: " + key.value);
      client = AgoraRTC.createClient({ mode: 'interop' });
      client.init(key.value, function () {
        console.log("AgoraRTC client initialized");
        client.join(channel_key, channel.value, null, function (uid) {
          console.log("User " + uid + " join channel successfully");

          if (document.getElementById("isVideo").checked) {
            camera = videoSource.value;
            microphone = audioSource.value;
            localStream = AgoraRTC.createStream({ streamID: uid, audio: true, cameraId: camera, microphoneId: microphone, video: document.getElementById("isVideo").checked, screen: false });
            //localStream = AgoraRTC.createStream({streamID: uid, audio: false, cameraId: camera, microphoneId: microphone, video: false, screen: true, extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg'});
            if (document.getElementById("isVideo").checked) {
              localStream.setVideoProfile('720p_3');
            }
            localStream.init(function () {
              console.log("getUserMedia successfully");
              localStream.play('agora_local');

              client.publish(localStream, function (err) {
                console.log("Publish local stream error: " + err);
              });

              client.on('stream-published', function (evt) {
                console.log("Publish local stream successfully");
              });

              // 打算在这里写拖放的效果(只手机端有此效果)
              agora_local.addEventListener("touchstart", function () {
                down();
              }, false);
              agora_local.addEventListener("touchmove", function () {
                move();
              }, false)
              agora_local.addEventListener("touchend", function () {
                end();
              }, false);
              // 2,5,10秒截图
              setTimeout(cut, 2000);
              setTimeout(cut, 5000);
              setTimeout(cut, 10000);

            }, function (err) {
              console.log("getUserMedia failed", err);
            });
          }
        }, function (err) {
          console.log("Join channel failed", err);
        });
      }, function (err) {
        console.log("AgoraRTC client init failed", err);
      });

      channelKey = "";
      client.on('error', function (err) {
        console.log("Got error msg:", err.reason);
        if (err.reason === 'DYNAMIC_KEY_TIMEOUT') {
          client.renewChannelKey(channelKey, function () {
            console.log("Renew channel key successfully");
          }, function (err) {
            console.log("Renew channel key failed: ", err);
          });
        }
      });

      client.on('stream-added', function (evt) {
        var stream = evt.stream;
        console.log("New stream added: " + stream.getId());
        console.log("Subscribe ", stream);
        client.subscribe(stream, function (err) {
          console.log("Subscribe stream failed", err);
        });
      });

      client.on('stream-subscribed', function (evt) {
        var stream = evt.stream;
        console.log("Subscribe remote stream successfully: " + stream.getId());
        if ($('div#video #agora_remote' + stream.getId()).length === 0) {
          $('#other_vedio').append('<div id="agora_remote' + stream.getId() + '"style="width:80%;height:80%;position:absolute;z-index:0;top:10%;left:10%;"></div>');
        }
        stream.play('agora_remote' + stream.getId());
      });

      client.on('stream-removed', function (evt) {
        var stream = evt.stream;
        stream.stop();
        $('#agora_remote' + stream.getId()).remove();
        console.log("Remote stream is removed " + stream.getId());
      });

      client.on('peer-leave', function (evt) {
        var stream = evt.stream;
        if (stream) {
          stream.stop();
          $('#agora_remote' + stream.getId()).remove();
          console.log(evt.uid + " leaved from this channel");
        }
      });
    }

    function leave() {
      document.getElementById("leave").disabled = true;
      client.leave(function () {
        console.log("Leavel channel successfully");
      }, function (err) {
        console.log("Leave channel failed");
      });
    }

    function publish() {
      document.getElementById("publish").disabled = true;
      document.getElementById("unpublish").disabled = false;
      client.publish(localStream, function (err) {
        console.log("Publish local stream error: " + err);
      });
    }

    function unpublish() {
      document.getElementById("publish").disabled = false;
      document.getElementById("unpublish").disabled = true;
      client.unpublish(localStream, function (err) {
        console.log("Unpublish local stream failed" + err);
      });
    }

    function getDevices() {
      AgoraRTC.getDevices(function (devices) {
        for (var i = 0; i !== devices.length; ++i) {
          var device = devices[i];
          var option = document.createElement('option');
          option.value = device.deviceId;
          if (device.kind === 'audioinput') {
            option.text = device.label || 'microphone ' + (audioSelect.length + 1);
            audioSelect.appendChild(option);
          } else if (device.kind === 'videoinput') {
            option.text = device.label || 'camera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
          } else {
            console.log('Some other kind of source/device: ', device);
          }
        }
      });
    }

    //audioSelect.onchange = getDevices;
    //videoSelect.onchange = getDevices;
    //getDevices();

    function cut() {
      var video = document.querySelector('#agora_local video');//获取前台要截图的video对象，
      console.log('---->>>' + video)
      var canvas = document.querySelectorAll('canvas')[0];//获取前台的canvas对象，用于作图
      var ctx = canvas.getContext('2d');//设置canvas绘制2d图，
      var width = 200;
      var height = 150;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);//将video视频绘制到canvas中
      var images = canvas.toDataURL('image/jpeg', 0.1);//canvas的api中的toDataURL（）保存图像
      console.log(images)
      // 把canvas内容保存为图片 用img标签显示出来
      // canvas.toBlob(function (blob) {
      //   var newImg = document.createElement("img"),
      //     url = URL.createObjectURL(blob);
      //   newImg.onload = function () {
      //     // no longer need to read the blob so it's revoked
      //     URL.revokeObjectURL(url);
      //   };
      //   newImg.src = url;
      //   document.body.appendChild(newImg);
      // });
    }
    function down() {
      flag = true;
      var touch;
      if (event.touches) {
        touch = event.touches[0];
      } else {
        touch = event;
      }
      cur.x = touch.clientX;
      cur.y = touch.clientY;
      dx = agora_local.offsetLeft;
      dy = agora_local.offsetTop;
    }
    function move() {
      if (flag) {
        var touch;
        if (event.touches) {
          touch = event.touches[0];
        } else {
          touch = event;
        }
        nx = touch.clientX - cur.x;
        ny = touch.clientY - cur.y;
        x = dx + nx;
        y = dy + ny;
        var agora_localWidth = agora_local.offsetWidth;
        var agora_localHeight = agora_local.offsetHeight;

        if (x <= 0) {
          x = 0;
        } else if (x >= documentWidth - agora_localWidth) {
          x = documentWidth - agora_local.offsetWidth;
        }
        if (y <= 0) {
          y = 0;
        } else if (y >= documentHeight - agora_localHeight) {
          y = documentHeight - agora_local.offsetHeight;
        }
        agora_local.style.left = x + "px";
        agora_local.style.top = y + "px";
        //阻止页面的滑动默认事件
        document.addEventListener("touchmove", function () {
          event.preventDefault();
        }, false);
      }
    }
    function end() {
      flag = false;
    }