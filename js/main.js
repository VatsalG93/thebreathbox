let audioClip = {
    0:'audio/Clear_audio.mpeg', 
    1:'audio/Distorted_audio.mpeg'
};
    
function init(audio, stream, waveform, canvas = false, imgElem = false, elem = "", sound=""){
    try{
        var audioContext = null;
        var analyser = null;
        var distortion = null;
        var timeArray = null;
        var freqArray = null;
        var freqBin = null;
        var fftsize = 2048;
        var constraints = {audio:true};
        var output;
        
    	window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext ||	window.msAudioContext;
    						
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        distortion = audioContext.createWaveShaper();
        freqBin = analyser.frequencyBinCount;
        console.log(freqBin);
        freqArray = new Uint8Array(analyser.frequencyBinCount);
        timeArray = new Uint8Array(analyser.frequencyBinCount);
        
        try{
            if (stream){
                navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.webkitGetUserMedia || navigator.mediaDevices.mozGetUserMedia;
            	navigator.mediaDevices.getUserMedia(constraints).then(function(aud_stream) {
            	        output = breathStream(audioContext,analyser,distortion,freqBin,freqArray,timeArray,fftsize,aud_stream, stream, waveform, canvas, imgElem, elem, sound);
            	    });
        	    }
    	    else{
    	        output = breathStream(audioContext,analyser,distortion,freqBin,freqArray,timeArray,fftsize, audio, stream, waveform, canvas, imgElem, elem, sound);
    	    }
        }
         catch(e){
        		alert('Exception :' + e);
        	}
        //getAudioStream(constraints, audio, stream, waveform, canvas,imgElem);
        
        return output;
	}
	catch(e){
		alert('Exception :' + e);
	}
}
function breathStream(audioContext,analyser,distortion,freqBin,freqArray,timeArray,fftsize,audioStream, stream = true, waveform = false, canvas = false, imgElem = false, elem="", sound=""){
    var RMSE = 0;
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
        
        var prev = 0;
        var majArr = [];
        var count = 0;
        
        function drawWaveform(canvasCtx){
            analyser.getByteTimeDomainData(timeArray);
            analyser.getByteFrequencyData(freqArray);
            
            var id = requestAnimationFrame(function(){
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
            //var RMSE = 0;
            
            //console.log(timeArray);
            for(var i = 0; i < bufferLength; i++) {
                var v = timeArray[i] / 128.0;
                RMSE += freqArray[i] * freqArray[i];
                
                y = v * height/2;
                if(i === 0) {
                    canvasCtx.moveTo(x, y);
                }
                else{
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            
            RMSE /= timeArray.length;
            RMSE = Math.sqrt(RMSE);
            
            if(canvas == "waveform2"){
                var newArr = [Math.round(RMSE)];
                
                if (prev !== Math.round(RMSE)){
                    prev = Math.round(RMSE);
                    majArr.push(prev);
                }
                else{
                   majArr = []; 
                }
                //console.log(majArr);
                var max_val = Math.max(...majArr);
                var max_len = majArr.length;
                
                if(max_len > 12 && max_len < 20 && max_val > 60 && max_val < 100){
                    count+=1;
                    console.log("Len: "+String(max_len));
                    console.log("Max: "+String(max_val));
                    //document.getElementById(imgElem).innerHTML = "Count: "+ String(count);
                    if (count > 50 ){
                        document.getElementById(elem).innerHTML = "Now listen to the audio again";
                        audioS = document.getElementById(sound);
                        audioS.src = audioClip[0];
                        audioS.load();
                        audioS.play();
                        canvasWaveCtx.clearRect(0,0,width,height);
                        window.cancelAnimationFrame(id);
                    } 
                }
            }
            canvasCtx.lineTo(width, height/2);
            canvasCtx.stroke();
        }
        drawWaveform(canvasWaveCtx);
        //setInterval(drawWaveform(canvasWaveCtx),500);
        return RMSE;
    }
    else{
        function scaleObject(imgElem){
            //var RMSE = 0;
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
        return RMSE;
        }
}