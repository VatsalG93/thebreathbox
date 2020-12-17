var audioContext = null;
var analyser = null;
var distortion = null;
var timeArray = null;
var freqArray = null;
var freqBin = null;
var fftsize = 2048;
var constraints = {audio:true};

function init(audio, stream, waveform, canvas = false, imgElem = false){
    try{
    	window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext ||	window.msAudioContext;
    						
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        distortion = audioContext.createWaveShaper();
        freqBin = analyser.frequencyBinCount;
        console.log(freqBin);
        freqArray = new Uint8Array(analyser.frequencyBinCount);
        timeArray = new Uint8Array(analyser.frequencyBinCount);
        getAudioStream(constraints, audio, stream, waveform, canvas,imgElem);
	}
	catch(e){
		alert('Exception :' + e);
	}
}
function getAudioStream(constraints, audio, stream, waveform, canvas = false, imgElem = false){
    try{            
        navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;
		navigator.mediaDevices.getUserMedia(constraints).then(function(aud_stream) {
		    if (stream){
		        breathStream(aud_stream, stream, waveform, canvas, imgElem);
		    }else{
		        breathStream(audio, stream, waveform, canvas, imgElem);
		    }
		});
    }
 	catch(e){
			alert('Exception :' + e);
		}
}
function breathStream(audioStream, stream = true, waveform = false, canvas = false, imgElem = false){
    console.log("breath starts");
    if(stream){ 
        src = audioContext.createMediaStreamSource(audioStream);
    }
    else{
        src = audioContext.createMediaElementSource(audioStream);
    }
    src.connect(analyser);
    analyser.connect(distortion);
    distortion.connect(audioContext.destination);
    
    analyser.fftSize = fftsize;
    var bufferLength = analyser.frequencyBinCount;
    
    console.log(bufferLength);
    
    if (waveform !== false && canvas !== false){
        var canvasWave = document.getElementById(canvas);
        var width = canvasWave.width;
        var height = canvasWave.height;
        
        var canvasWaveCtx = canvasWave.getContext("2d");
        canvasWaveCtx.clearRect(0,0,width,height);
        
        function drawWaveform(canvasCtx){
            analyser.getByteTimeDomainData(timeArray);
            analyser.getByteFrequencyData(freqArray);
            
            requestAnimationFrame(function(){
                drawWaveform(canvasCtx);
            });
            
            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            canvasCtx.fillRect(0, 0, width, height);
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            canvasCtx.beginPath();
            
            var sliceWidth = width * 1.0 / bufferLength;
            var x = 0;
            var y = 0;
            var total = 0;
            var RMSE = 0;

            var node = audioContext.createScriptProcessor(fftsize*2, 1, 1);
            node.onaudioprocess = function () {
                var rms = this.getRMS(freqArray);
                console.log("rmse");
                console.log(rms);
            }
        
            for(var i = 0; i < bufferLength; i++) {
                var v = timeArray[i] / 128.0;
                RMSE += freqArray[i] * freqArray[i];
                //total += freqArray[i];
                
                y = v * height/2;
                if(i === 0) {
                    canvasCtx.moveTo(x, y);
                }
                else{
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            //console.log(y);
            RMSE /= timeArray.length;
            RMSE = Math.sqrt(RMSE);
        
            console.log("RMSE: ");
            console.log(RMSE);
            
            canvasCtx.lineTo(width, height/2);
            canvasCtx.stroke();
        }
        drawWaveform(canvasWaveCtx);
        //console.log(freqArray);
        //analyser.getByteFrequencyData();
        //analyser.getByteTimeDomainData();
        //analyser.getFloatTimeDomainData();
    }
    else{
        function scaleObject(imgElem){
            var RMSE = 0;
            analyser.getByteTimeDomainData(timeArray);
            analyser.getByteFrequencyData(freqArray);
            requestAnimationFrame(function(){
                scaleObject(imgElem);
            });
            for(var i = 0; i < bufferLength; i++) {
                RMSE += freqArray[i] * freqArray[i];
            }
            RMSE /= timeArray.length;
            RMSE = Math.sqrt(RMSE);
            
            if(imgElem !== false){
                console.log("RMSE: ");
                console.log(RMSE);
                document.getElementById(imgElem).style.transform = 'scale('+String(RMSE/50)+')';
            }
        }
        console.log(imgElem);
        scaleObject(imgElem);
        }
}