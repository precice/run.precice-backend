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
        console.log("Executing the command");
        execCmd(socket, action.consoleId, action.partNumber);
        break;
      case 'socket/pause_simulation':
        console.log(`Pausing part ${action.partNumber}`);
        pauseSimulation(socket, action.partNumber);
        break;
      case 'socket/resume_simulation':
        console.log(`Resuming after stopping part ${action.partNumber}`);
        const storyCase = PARTS[action.partNumber];
        if (socket['afterPulse'] === null)  {
          doAfter(socket, storyCase );
        }
        else
          console.log("Attemps to resume non-stopped simulation");
        break;
      case 'socket/abort_simulation':
        console.log("Aborting simulation");
        resetSocket(socket);
        exit(socket, CONSOLE_ID_INVERSE['su2'], 1 );
        exit(socket, CONSOLE_ID_INVERSE['ccx'], 1);
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

  doBefore(socket, consoleId, storyCase);


}

// parts to send before second second participant is connected
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
        socket['afterCounter'] = 0;
        doAfter(socket, storyCase);
      }
    }
  }, THRESOLD);
}


function afterSendChunk(socket, parsedDumpSu2, parsedDumpCcx)
{
  const counter = socket['afterCounter'];
  const dump_length = Math.max(parsedDumpSu2.length, parsedDumpCcx.length);
  if (parsedDumpSu2[counter] && parsedDumpCcx[counter]) {
    send_output(socket, [CONSOLE_ID_INVERSE['su2'], CONSOLE_ID_INVERSE['ccx']], [parsedDumpSu2[counter], parsedDumpCcx[counter]]);

  } else if (parsedDumpSu2[counter]) {
    send_output(socket, CONSOLE_ID_INVERSE['su2'], parsedDumpSu2[counter]);
  }
  else if (parsedDumpCcx[counter]) {
    send_output(socket, CONSOLE_ID_INVERSE['ccx'], parsedDumpCcx[counter]);
  }
  socket['afterCounter']++;
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
}

// parts to send to both consoles, after both participants are connected
function doAfter(socket, storyCase) {
  const parsedDumpSu2 = DUMPS[storyCase]['su2']['after'];
  const parsedDumpCcx = DUMPS[storyCase]['ccx']['after'];
  socket['afterPulse'] = setInterval( () => { afterSendChunk( socket, parsedDumpSu2, parsedDumpCcx); }, THRESOLD);
}


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

function pauseSimulation(socket, storyCase)
{
  clearInterval(socket['afterPulse']);
  socket['afterPulse'] = null;
}
