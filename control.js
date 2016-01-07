var currentFreq;
var currentMode;
var currentSquelch;

var timeOut = 200;

var reconnectTimeout = 2000;
var reconnectTries = 2;
var retry = reconnectTries;

var socket;

function connect() {
	socket = io();
	
	socket.on("connect", function() {
		$("#selectFreq").css("background-color", "#cfc");
		$("#display").css("background-color", "#cfc");
		reTry = reconnectTries;
	});

	socket.on("disconnect", function() {
		$("#selectFreq").css("background-color", "#aaa");
		$("#display").css("background-color", "#aaa");
		if (retry > 0) {
			setTimeout(connect, reconnectTimeout);
			retry--;
		};
		if (retry < 1) {
		};
	});

	socket.on("error", function() {
		$("#selectFreq").css("background-color", "#a00");
		$("#display").css("background-color", "#a00");
	});

	socket.on("command", function(msg) {
		var data = msg.split(" ");
		if (data.length > 1) {
			var val = data[0];
			if (val == "FREQ") {
				setFreq(data[1]);
			}
			else if (val == "SIG") {
				var sig = (parseFloat(data[1]) + 60.0).toString();
				$("#signalLevel").slider("disable");
				$("#signalLevel").val(sig).slider("refresh");
			}
			else if (val == "MODE") {
				setMode(data[1]);
				setBandwidth(data[2]);
			}
			else if (val == "SQL") {
				var sql = (parseFloat(data[1]) * 100.0).toString();
				if (sql > 0) {
					currentSquelch = sql;
				}
				$("#squelchValue").val(sql);
				setSquelch(sql);
			}
		}
	});

	audio = new Audio("");
	
	$(audio).bind("play", function() {
		$("#audioStart").html("Loading...");
	});
	
	$(audio).bind("loadeddata", function() {
		$("#audioStart").html("Stop Audio");
	});
	
	$(audio).bind("error", function() {
		audio.src = "";
		$("#audioStart").html("Start Audio");
	});

	$("#display").mousedown(changeDigit);
	
	//$("#selectFreq").change(changeFreq);

	$("#selectMode").change(changeModeBW);
	
	$("#selectBandwidth").change(changeModeBW);

	$("#selectSquelch").change(changeSquelch);
	
	$("#selectFreq").keypress(function(e) {
		if (e.which == 13) {
			$("#Enter").click();
			$("#selectFreq").blur();
		}
	});
	
	$("#selectFreq").blur(changeFreq);
	
	$("#squelchValue").keypress(function(e) {
		if (e.which == 13) {
			$("#squelchValue").blur();
		}
	});

	$("#squelchValue").blur(function() {
		var newSql = $("#squelchValue").val();

		if (newSql > 1) {
			newSql = newSql / 100;
		}
		socket.emit("command", "L SQL " + newSql);

		setSquelch(newSql);
	});

	$("#stepValue").val(function() {
		var stepval = $("#selectFreq").attr("step");
		if (stepval < 1) {
			stepval = stepval * 1000;
		}
		//$("#stepValue").val(stepval);
		return stepval;
	});

	$("#stepValue").change(changeStep);

	$("#selectARate").change(changeAudioRate);
	
	$("#Clear").click();
	
	$("#Back").click(function() {
		parent.history.back();
	});
	
	$("#Refresh").click(function() {
		location.reload();
	});
	
	$("#audioStart").click(function() {
		astate = $("#audioStart").html();
		if (astate == "Start Audio")
		{
			startAudio();
		}
		else 
		{
			audio.src = "";
			$("#audioStart").html("Start Audio");
		}
		$("#audioStart").blur();
	});
	
	function startAudio() {
		arate = $("#selectARate").val();
		if (arate == 0) {
			return;
		}
		aurl = audiocgi + "?" + arate;
		audio.src = aurl;
		audio.load();
		audio.play();
	};
	
	function changeModeBW() {
		var bw = $("#selectBandwidth").val();
		var mode = $("#selectMode").val();
		if (mode == "AM" && bw == "Medium")
			bandwidth = "15000";
		else if (mode == "FM" && bw == "Medium")
			bandwidth = "15000";
		else if (mode == "AM" || mode == "FM")
			bandwidth = "6000";
		else if (mode == "WFM")
			bandwidth = "230000";
		else if (mode == "CW" || mode == "CWR" || mode == "LSB" || mode == "USB")
			bandwidth == "2800";
		socket.emit("command", "M " + mode + " " + bandwidth);
		$("#selectBandwidth").blur();
		$("#selectMode").blur();
	};
	
	function changeSquelch() {
		var sqlset = $("#squelchValue").val();
		var sqlmode = $("#selectSquelch").val();
		if (sqlmode == "Off") {
			$("#squelchValue").val(0);
		}
		else {
			$("#squelchValue").val(currentSquelch);
		}
		$("#squelchValue").blur();
	};

	function changeStep() {
		var stepval = $("#stepValue").val();
		if (stepval > 1) {
			stepval = stepval / 1000;
		}
		$("#selectFreq").attr("step", stepval);
	};

	function changeFreq() {
		var newFreq = $("#selectFreq").val();
		newFreq = newFreq * 1000000;
		if (newFreq != currentFreq && newFreq > 0) {
			socket.emit("command", "F " + newFreq);
		}
	};

	function setFreq(freq) {
		var disp = freq;
		currentFreq = freq;
		var pad = "0000000000";
		disp = pad.substring(0, pad.length - disp.length) + disp;
		disp = disp.substring(0, 4) + "." + disp.substring(4, 7) + "." + disp.substring(7, 10);
		display.setValue(disp);
		if (freq > 2000) {
			freq = freq / 1000000;
		}
		$("#selectFreq").val(freq);
	};
	
	function setMode(mode) {
		//$("#selectMode").val("");
		$("#selectMode option[value=" + mode + "]").attr("selected", "selected");
		$("#selectMode").selectmenu("refresh");
	};
	
	function setBandwidth(mode) {
		//$("#selectBandwidth").val("");
		if (mode == "2800")
			$("#selectBandwidth option[value=Medium]").attr("selected", "selected");
		if (mode == "6000")
			$("#selectBandwidth option[value=Narrow]").attr("selected", "selected");
		if (mode == "15000")
			$("#selectBandwidth option[value=Medium]").attr("selected", "selected");
		if (mode == "230000")
			$("#selectBandwidth option[value=Wide]").attr("selected", "selected");
		$("#selectBandwidth").selectmenu("refresh");
	};

	function setSquelch(sql) {
		if (sql > 0)
			$("#selectSquelch option[value=On]").attr("selected", "selected");
		if (sql = 0)
			$("#selectSquelch option[value=Off]").attr("selected", "selected");
		$("#selectSquelch").slider("refresh");
	};
	
	function readAudioRate() {
		rate = localStorage.audioRate;
		if (typeof rate == "undefined") {
			rate = "32";
			localStorage.audioRate = rate;
			$("#selectARate").val(rate);
					
		}
		$("#selectARate option[value=" + rate + "]").attr("selected", "selected");
	}
	
	function changeAudioRate() {
		rate = localStorage.audioRate;
		if (typeof rate == "undefined") {
			rate = 32;
			localStorage.audioRate = rate;
		}
	
		srate = $("#selectARate").val();
		localStorage.audioRate = srate;
		$("#selectARate").val("");
		$("#selectARate option[value=" + srate + "]").attr("selected", "selected");
		$("#selectARate").selectmenu("refresh");
	};
	
	function changeDigit(event) {
		// -- Map of digits --
		// Digit 1 X: 0 25 	Y: 86
		// Digit 2 X: 30 55	Y: 86
		// Digit 3 X: 60 80	Y: 86
		// Digit 4 X: 85 110	Y: 86
		// Digit 5 X: 125 145	Y: 86
		// Digit 6 X: 150 175	Y: 86
		// Digit 7 X: 180 205	Y: 86
		// Digit 8 X: 220 245	Y: 86
		// Digit 9 X: 250 270	Y: 86
		// Digit 10 X: 275 300	Y: 86

		var cx = event.pageX;
		var cy = event.pageY;
		

		var centre = 86;

		var points = {1:25, 2:55, 3:80, 4:110, 5:145, 6:175, 7:205, 8:245, 9:270, 10:300};

		for (var kv in points) {
			if (cx < points[kv]) {
				var pad = "0000000000";
				var freq = pad.substring(0, pad.length - currentFreq.length) + currentFreq;

				var digit = freq.substr(kv - 1, 1);
				
				var ud;

				if (cy < centre) {
					digit++;
					if (digit > 9)
						digit = 0;
				}
				if (cy > centre) {
					digit--;
					if (digit < 0)
						digit = 9;
				}

				freq = freq.substr(0, kv - 1) + digit + freq.substr(kv);
				freq = parseInt(freq);

				if (freq != currentFreq) {
					socket.emit("command", "F " + freq);
				}

				break;
			}
		}
	}
};

// 7-segment display code
var display = new SegmentDisplay("display");
display.pattern         = "####.###.###";
display.displayAngle    = 6;
display.digitHeight     = 20;
display.digitWidth      = 14;
display.digitDistance   = 4.0;
display.segmentWidth    = 2.5;
display.segmentDistance = 0.3;
display.segmentCount    = 7;
display.cornerType      = 3;
display.colorOn         = "#090909";
display.colorOff        = "#e2e2e2";
display.draw();

$(document).ready(function () {
	connect();
});
