const http = require('http').createServer();
const socket = require('socket.io');
const spawn = require('child_process').spawn;
const config = require('config');
const fs = require('fs');
const path = require('path');

const io = socket();
io.attach(http);

//Whenever someone connects this gets executed
io.on('connection', function (socket) {
  console.log('A user connected');
  socket.on('action', function (action) {
    switch (action.type) {
      case 'socket/exec_cmd':
        execCmd(action.consoleId, action.cmd, socket, action.relaxParam)
    }


  });
  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', function () {
    console.log('A user disconnected');
  });

});


const port = config.get('port');
http.listen(port, function () {
  console.log(`listening on *:${port}`);
});

function execCmd(consoleId, cmd, socket, relaxParam = '0.9') {

  console.log('exec command', cmd);


  if (config.get('fakeOutput')) {

    if (cmd === 'ccx_preCICE -i flap -precice-participant Calculix') {
      fakeOutput(consoleId, 'calculix', socket);
      return;
    } else if (cmd === 'SU2_CFD euler_config_coupled.cfg') {
      fakeOutput(consoleId, 'su2', socket);
      return;
    }
  }


  if (config.whitelist.indexOf(cmd) === -1) {
    socket.emit('action', {
      type: 'socket/stderr',
      consoleId,
      data: "Perission denied.",
    });
    socket.emit('action', {
      type: 'socket/exit',
      consoleId,
      code: 403,
    });
    return;
  }
  const proc = spawn('/bin/sh', ['-c', cmd], {cwd: path.join(config.get('cwd'), `sim${relaxParam}`)});

  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  proc.stdout.on('data', function (data) {
    console.log('stdout');
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


CMD_DUMPS = {};

CHUNK_SIZE = 100;

function fakeOutput(consoleId, name, socket) {

  if (!CMD_DUMPS[name]) {
    CMD_DUMPS[name] = fs.readFileSync('./cmd_dumps/' + name + '.log', {encoding: 'utf-8'}).split('\n');
  }

  const cmdDump = CMD_DUMPS[name];

  let i = 0;
  const numLines = cmdDump.length;

  const intval = setInterval(() => {

    const nexti = Math.min(i + CHUNK_SIZE, numLines - 1);

    socket.emit('action', {
      type: 'socket/stdout',
      consoleId,
      data: cmdDump.slice(i + 1, nexti).join('\n'),
    });

    i = nexti;

    if (i === numLines - 1
    ) {
      clearInterval(intval);
      socket.emit('action', {
        type: 'socket/exit',
        consoleId,
        code: 0,
      });
    }
  }, 200);


}

