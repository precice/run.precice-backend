const http = require('http').createServer();
const socket = require('socket.io');
const spawn = require('child_process').spawn;
const config = require('config');
const fs = require('fs');
const path = require('path');


const { send_output, exit } = require('./communication');
const { get_dump_obj } = require('./faker-utils');
const { THRESOLD, CONSOLE_ID_INVERSE, CONSOLE_ID_MAPPING, PARTS } = require('./constants');


const DUMPS = get_dump_obj();

const io = socket();
io.attach(http);

//Whenever someone connects this gets executed
io.on('connection', function (socket) {
  console.log('A user connected');
  socket.on('action', function (action) {
    switch (action.type) {
      case 'socket/exec_cmd':
        execCmd(socket, action.consoleId, action.partNumber)
    }


  });
  //Whenever someone disconnects this piece of code executed
  socket.on('disconnect', function () {
    console.log('A user disconnected');
    resetSocket(socket);
  });

});


const port = config.get('port');
http.listen(port, function () {
  console.log(`listening on *:${port}`);
});

function execCmd(socket, consoleId, partNumber) {

  const storyCase = PARTS[partNumber];

  const cmd = CONSOLE_ID_MAPPING[consoleId];

  if (socket[cmd + 'Running']) {
    return;
  }
  socket[cmd + 'Running'] = true;

  // doBefore(socket, consoleId, '01explConvergence');
  doBefore(socket, consoleId, storyCase);


}

function doBefore(socket, consoleId, storyCase) {
  const cmd = CONSOLE_ID_MAPPING[consoleId];
  const parsedDump = DUMPS[storyCase][cmd]['before'];
  let counter = 0;
  const dump_length = parsedDump.length;
  socket[cmd + 'Pulse'] = setInterval(() => {
    send_output(socket, consoleId, parsedDump[counter]);
    counter++;
    if (counter >= dump_length) {
      clearInterval(socket[cmd + 'Pulse']);
      socket[cmd + 'Pulse'] = null;
      socket[cmd + 'Loaded'] = true;
      if (socket['su2Loaded'] && socket['ccxLoaded']) {
        doAfter(socket, storyCase);
      }
    }
  }, THRESOLD);
}

function doAfter(socket, storyCase) {
  const parsedDumpSu2 = DUMPS[storyCase]['su2']['after'];
  const parsedDumpCcx = DUMPS[storyCase]['ccx']['after'];
  let counter = 0;
  const dump_length = Math.max(parsedDumpSu2.length, parsedDumpCcx.length);
  socket['afterPulse'] = setInterval(() => {

    if (parsedDumpSu2[counter] && parsedDumpCcx[counter]) {
      send_output(socket, [CONSOLE_ID_INVERSE['su2'], CONSOLE_ID_INVERSE['ccx']], [parsedDumpSu2[counter], parsedDumpCcx[counter]]);

    } else if (parsedDumpSu2[counter]) {
      send_output(socket, CONSOLE_ID_INVERSE['su2'], parsedDumpSu2[counter]);
    }
    else if (parsedDumpCcx[counter]) {
      send_output(socket, CONSOLE_ID_INVERSE['ccx'], parsedDumpCcx[counter]);
    }
    counter++;
    if (counter === parsedDumpSu2.length) {
      exit(socket, CONSOLE_ID_INVERSE['su2']);
    }
    if (counter === parsedDumpCcx.length) {
      exit(socket, CONSOLE_ID_INVERSE['ccx']);
    }

    if (counter >= dump_length) {
      clearInterval(socket['afterPulse']);
      resetSocket(socket);
    }
  }, THRESOLD);
}


CMD_DUMPS = {};

CHUNK_SIZE = 100;


function resetSocket(socket) {
  ['ccxPulse', 'su2Pulse', 'afterPulse'].forEach((prop) => {
    if (socket[prop]) {
      clearInterval(socket[prop]);
      socket[prop] = null;
    }
  });
  socket.ccxLoaded = false;
  socket.su2Loaded = false;
  socket.ccxRunning = false;
  socket.su2Running = false;
}