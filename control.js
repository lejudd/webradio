var currentFreq;
var currentMode;
var currentSquelch;

var timeOut = 200;

var reconnectTimeout = 2000;
var reconnectTries = 2;
var retry = reconnectTries;

//audiocgi = "/cgi-bin/audio.sh";

var ws;

function connect() {
	var ws = new WebSocket("ws://" + location.hostname + "/ws/");
	
	ws.onopen = function() {
	        $("#selectFreq").css("background-color", "#cfc");
		reTry = reconnectTries;
	};

	ws.onclose = function() {
	        $("#selectFreq").css("background-color", "#aaa");
		if (retry > 0) {
			setTimeout(connect, reconnectTimeout);
			retry--;
		};
		if (retry < 1) {
		};
	};

	ws.onerror = function() {
	        $("#selectFreq").css("background-color", "#a00");	
	};

	ws.onmessage = function(event) {
		var ev = event.data;
		var data = event.data.split(" ");
		if (data.length > 1) {
			var val = data[0];
			if (val == "FREQ") {
				setFreq(data[1]);
			}
			else if (val == "SIG") {
				$("#signalLevel").slider("disable");
				$("#signalLevel").val(data[1]).slider("refresh");
			}
			else if (val == "MODE") {
				setMode(data[1]);
				setBandwidth(data[2]);
			}
			else if (val == "SQL") {
				if (data[1] > 0) {
					currentSquelch = data[1];
				}
				$("#squelchValue").val(data[1]);
				setSquelch(data[1]);
			}
		}
	};

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
	
	$("#selectFreq").change(changeFreq);

	$("#selectMode").change(changeModeBW);
	
	$("#selectBandwidth").change(changeModeBW);

	$("#selectSquelch").change(changeSquelch);
	
	$("#selectFreq").keypress(function(e) {
		if (e.which == 13) {
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
		ws.send("L SQL " + newSql);

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
		ws.send("M " + mode + " " + bandwidth);
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
		if (newFreq != currentFreq) {
			if (newFreq < 2000) {
				newFreq = newFreq * 1000000;
			}
			ws.send("F " + newFreq);
		}
	};

	function setFreq(freq) {
		if (freq > 2000) {
			freq = freq / 1000000;
		}
		$("#selectFreq").val(freq);
	};
	
	function setMode(mode) {
		$("#selectMode").val([]);
		$("#selectBandwidth").val([]);
		$("#selectMode option[value=" + mode + "]").attr("selected", "selected");
		$("#selectMode").selectmenu("refresh");
	};
	
	function setBandwidth(mode) {
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
		$("#selectARate").val([]);
		$("#selectARate option[value=" + srate + "]").attr("selected", "selected");
		$("#selectARate").selectmenu("refresh");
	};

};

$(document).ready(function () {
	connect();
});
