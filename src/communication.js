function send_output(socket, consoleId, data) {
  if (data === "") {
    // don't send empty strings
    return;
  }
  socket.emit('action', {
    type: 'socket/stdout',
    consoleId,
    data,
  });
}

function exit(socket, consoleId, code = 0) {
  socket.emit('action', {
    type: 'socket/exit',
    consoleId,
    code,
  });
}

module.exports = {
  send_output,
  exit,
};