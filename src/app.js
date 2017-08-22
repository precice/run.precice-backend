var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var spawn = require('child_process').spawn;
/*
app.get('/', function(req, res){
    res.sendfile('src/index.html');
});
*/
//Whenever someone connects this gets executed
io.on('connection', function(socket){
    console.log('A user connected');
    socket.on('cmd2Backend', function(cmd){
        console.log(cmd.code);
        const proc = spawn(cmd.code);
        proc.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
            socket.emit('data2Backend', {text: data.toString()});
        });
        proc.stderr.on('data', function (data) {
            console.log('stderr: ' + data);
        });

        proc.on('exit', function (code) {
            console.log('child process exited with code ' + code);
        });

    });
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });

});


http.listen(3001, function(){
    console.log('listening on *:3001');
});