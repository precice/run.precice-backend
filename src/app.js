const http = require('http').createServer();
const socket = require('socket.io');
const spawn = require('child_process').spawn;


const io = socket();
io.attach(http);

//Whenever someone connects this gets executed
io.on('connection', function (socket) {
  console.log('A user connected');
  socket.on('action', function (action) {
    switch (action.type) {
      case 'socket/exec_cmd':
        execCmd(action.consoleId, action.cmd, socket)
    }


  });
  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });

});


http.listen(3001, function () {
  console.log('listening on *:3001');
});

function execCmd(consoleId, cmd, socket) {
  console.log('exec command', cmd);

  const proc = spawn('/bin/sh', ['-c', cmd]);
  proc.stdout.on('data', function (data) {
    socket.emit('action', {
      type: 'socket/stdout',
      consoleId,
      data,
    });
  });
  proc.stderr.on('data', function (data) {
    socket.emit('action', {
      type: 'socket/stderr',
      consoleId,
      data: data,
    });
  });

  proc.on('exit', function (code) {
    socket.emit('action', {
      type: 'socket/exit',
      consoleId,
      code,
    });
  });

}