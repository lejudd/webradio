//**********************************************************************
//  Configuration settings to communicate with the radio
// 
var program = "/usr/local/bin/rigctl"
var radio = 2;
var device = "localhost";
//
//**********************************************************************

var http_port = 3000;
var express = require("express");
var http = require("http");
var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);

var spawn = require("child_process").spawn;
var child = spawn;

var c = {freq:"", mode:"", sql:"", sig:"", lvl:""};
var f = {freq:0, mode:0, sql:0, sig:0, lvl:0};


app.get("/", function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

app.get("/control.js", function(req, res) {
	res.sendFile(__dirname + "/control.js");
});

app.get("/excanvas.js", function(req, res) {
	res.sendFile(__dirname + "/excanvas.js");
});

app.get("/display.js", function(req, res) {
	res.sendFile(__dirname + "/display.js");
});

server.listen(http_port, function(){
	console.log("Node.JS Socket.IO server running on :" + http_port);
});

io.on("connection", function(s){
	var address = s.request.connection.remoteAddress;

	s.on("command", function(msg){
		// Debug code
		//console.log(address + ": " + msg);
		// Process command received from web
		radioCmd(msg);
		var read = msg.split(" ")[0].toLowerCase();
		if (read == "f" || read == "m") {
			radioCmd(msg);
		}
	});
	// Debug code
	//console.log("Connected to: " + address);
	// Send data on conection
	radioCmd("f");
	radioCmd("m");
	radioCmd("l AF");
	radioCmd("l SQL");
	radioCmd("l STRENGTH");
	io.emit("command", "FREQ " + c.freq);
	io.emit("command", "MODE " + c.mode);
	io.emit("command", "SQL " + c.sql);
	io.emit("command", "SIG " + c.sig);
	io.emit("command", "AF " + c.lvl);
});


setInterval(function() {
	radioCmd("l STRENGTH");
	sendUpdate();
}, 200);

function radioCmd(cmd) {
	var resp = "";
	cmd = cmd.trim();
	var args = "-m " + radio + " -r " + device + " " + cmd; 
	args = args.trim();

	args = args.split(" ");

	child = spawn(program, args);

	child.stdout.on("data", function(data) {
		data = data.toString("utf8");
		resp = resp + data;
	});

	child.stderr.on("data", function(data) {
			//console.log(data.toString("utf8"));
	});

	child.on("close", function() {
		resp = resp.replace("\r", " ").replace("\n", " ").replace("  ", " ").trim();

		if (cmd == "f") {
			if (c.freq != resp) {
				f.freq = 1;
			}
			c.freq = resp;
		}
		if (cmd == "m") {
			if (c.mode != resp) {
				f.mode = 1;
			}
			c.mode = resp;
		}
		if (cmd == "l AF") {
			if (c.lvl != resp) {
				f.lvl = 1;
			}
			c.lvl = resp;
		}
		if (cmd == "l SQL") {
			if (c.sql != resp) {
				f.sql = 1;
			}
			c.sql = resp;
		}
		if (cmd == "l STRENGTH") {
			if (c.sig != resp) {
				f.sig = 1;
			}
			c.sig = resp;
		}
	});
	sendUpdate();
}

function sendUpdate() {
	if (f.freq > 0) {
		f.freq = 0;
		//console.log("FREQ " + c.freq);
		io.emit("command", "FREQ " + c.freq);
	}
	if (f.mode > 0) {
		f.mode = 0;
		//console.log("MODE " + c.mode);
		io.emit("command", "MODE " + c.mode);
	}
	if (f.sql > 0) {
		f.sql = 0;
		//console.log("SQL " + c.sql);
		io.emit("command", "SQL " + c.sql);
	}
	if (f.sig > 0) {
		f.sig = 0;
		//console.log("SIG " + c.sig);
		io.emit("command", "SIG " + c.sig);
	}
	if (f.lvl > 0) {
		f.lvl = 0;
		//console.log("AF " + c.lvl);
		io.emit("command", "AF " + c.lvl);
	}
}
