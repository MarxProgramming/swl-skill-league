(() => {
  'use strict';
  if(window.SWLReplayEngine?.version===1)return;
  const FPS=24,FRAME_MS=1000/FPS,MAX_BYTES=64*1024*1024,MAX_CLIP_BYTES=32*1024*1024,MAX_FRAMES=800,MARGIN_MS=1500;
  let sequence=0;
  const now=()=>performance.now();
  const abortError=()=>{const error=new Error('Export canceled.');error.name='AbortError';return error;};
  const friendly=error=>({NotAllowedError:'Camera access was not allowed. Enable it in your browser, then try again.',PermissionDeniedError:'Camera access was not allowed. Enable it in your browser, then try again.',NotFoundError:'No camera was found on this device.',DevicesNotFoundError:'No camera was found on this device.',NotReadableError:'The camera is busy. Close other camera apps, then try again.',TrackStartError:'The camera is busy. Close other camera apps, then try again.',OverconstrainedError:'That camera is unavailable. Try the other camera.'}[error?.name]||error?.message||'The camera could not start. Please try again.');
  function create({video,canvas,onChange=()=>{}}={}){
    if(!video||!canvas||typeof canvas.getContext!=='function')throw TypeError('Replay needs a video element and a display canvas.');
    const media=window.navigator?.mediaDevices||(typeof navigator!=='undefined'?navigator.mediaDevices:null);
    const capture=document.createElement('canvas'),context=capture.getContext('2d',{alpha:false}),display=canvas.getContext('2d',{alpha:false});
    const URLApi=window.URL||(typeof URL!=='undefined'?URL:null),Recorder=window.MediaRecorder;
    const clock=()=>now();
    let active=true,destroyed=false,stream=null,cameraToken=0,captureTimer=null,encoding=false,startPromise=null,cancelReady=null,trackListeners=[];
    let frames=[],clip=null,review=false,delaySeconds=10,facingMode='environment',error='',phase='idle',limited=false,bufferCapped=false,frameSerial=0;
    let playing=false,speed=1,positionMs=0,playStarted=0,playOrigin=0,playTimer=null,playToken=0;
    let displayed=null,pendingDraw=null,renderFrame=null,drawing=false,drawEpoch=0,rendering=false,exportJob=null,exportProgress=0;
    const imageDecoders=new Set();
    video.muted=true;video.playsInline=true;
    const available=()=>active&&!destroyed&&!document.hidden;
    const span=()=>frames.length>1?(frames.at(-1).timeMs-frames[0].timeMs)/1000:0;
    const clipDuration=()=>clip?clip.durationMs/1000:0;
    function mimeType(){
      if(!Recorder||typeof Recorder.isTypeSupported!=='function')return null;
      for(const type of ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']){try{if(Recorder.isTypeSupported(type))return type;}catch(_) {}}
      return null;
    }
    const exportSupported=()=>Boolean(mimeType()&&typeof capture.captureStream==='function');
    function retainedBytes(){const seen=new Set();let bytes=0;for(const frame of frames.concat(clip?.frames||[],exportJob?.clip.frames||[],[displayed?.frame,pendingDraw?.frame,renderFrame])){if(frame&&!seen.has(frame.id)){seen.add(frame.id);bytes+=frame.blob.size;}}return bytes;}
    function metadata(){return clip?Object.freeze({id:clip.id,startTime:clip.startMs/1000,endTime:clip.endMs/1000,duration:clip.durationMs/1000,frameCount:clip.frames.length,width:clip.width,height:clip.height}):null;}
    function getState(){
      const list=review&&clip?clip.frames:frames,index=displayed?list.findIndex(frame=>frame.id===displayed.frame.id):-1;
      return Object.freeze({phase,cameraRunning:Boolean(stream),bufferSeconds:span(),effectiveDelaySeconds:Math.min(delaySeconds,span()),delaySeconds,clipDuration:clipDuration(),position:positionMs/1000,frameIndex:index,frameCount:list.length,playing,speed,error,limited,exporting:Boolean(exportJob),exportProgress,clipId:clip?.id||null,frameId:displayed?.frame.id||null,captureWidth:capture.width||0,captureHeight:capture.height||0,supported:Boolean(media?.getUserMedia&&context&&display&&typeof capture.toBlob==='function'),exportSupported:exportSupported(),rendering,bufferBytes:retainedBytes(),clip:metadata()});
    }
    function notify(){if(!destroyed)try{onChange(getState());}catch(_) {}}
    function cancelImages(owner){for(const task of [...imageDecoders])if(!owner||task.owner===owner)task.cancel();}
    function invalidateDraw(){drawEpoch++;pendingDraw=null;rendering=false;cancelImages('render');}
    function clearDisplay(){invalidateDraw();displayed=null;try{display?.clearRect(0,0,canvas.width,canvas.height);}catch(_) {}}
    async function decode(frame,owner){
      const bitmap=window.createImageBitmap||(typeof createImageBitmap==='function'?createImageBitmap:null);
      if(bitmap){const image=await bitmap(frame.blob);return{image,close(){image.close?.();}};}
      const ImageClass=window.Image;if(!ImageClass||!URLApi?.createObjectURL)throw Error('This browser cannot display captured frames.');
      return new Promise((resolve,reject)=>{const image=new ImageClass(),url=URLApi.createObjectURL(frame.blob);let released=false,timeout;const task={owner,cancel:()=>failed(abortError())};const release=()=>{if(released)return;released=true;clearTimeout(timeout);imageDecoders.delete(task);URLApi.revokeObjectURL(url);image.onload=image.onerror=null;};const failed=problem=>{release();image.src='';reject(problem);};imageDecoders.add(task);image.onload=()=>{release();resolve({image,close(){image.src='';}});};image.onerror=()=>failed(Error('A captured frame could not be displayed.'));timeout=setTimeout(()=>failed(Error('A captured frame took too long to display.')),5000);image.src=url;});
    }
    function requestDraw(frame,index,relativeMs,clipId=null){if(!frame||!available())return;pendingDraw={frame,index,relativeMs,clipId,epoch:drawEpoch};rendering=true;void pumpDraw();}
    async function pumpDraw(){
      if(drawing||!pendingDraw)return;drawing=true;
      try{
        while(pendingDraw&&!destroyed){const target=pendingDraw;pendingDraw=null;renderFrame=target.frame;let decoded;
          try{decoded=await decode(target.frame,'render');if(target.epoch!==drawEpoch||!available())continue;
            if(canvas.width!==target.frame.width)canvas.width=target.frame.width;if(canvas.height!==target.frame.height)canvas.height=target.frame.height;
            display.drawImage(decoded.image,0,0,canvas.width,canvas.height);displayed=target;rendering=Boolean(pendingDraw);notify();
          }catch(problem){if(target.epoch===drawEpoch&&available()&&problem?.name!=='AbortError'){error='A video frame could not be displayed. Try starting the camera again.';notify();}}
          finally{decoded?.close();renderFrame=null;}
        }
      }finally{drawing=false;if(!pendingDraw)rendering=false;}
    }
    function trim(){
      const cutoff=frames.length?frames.at(-1).timeMs-delaySeconds*1000-MARGIN_MS:0;while(frames.length>1&&frames[0].timeMs<cutoff)frames.shift();
      let capped=false;while(frames.length>MAX_FRAMES){frames.shift();capped=true;}
      while(frames.length&&retainedBytes()>MAX_BYTES){frames.shift();capped=true;}
      bufferCapped=capped||(bufferCapped&&span()+.001<delaySeconds);limited=bufferCapped&&span()+.001<delaySeconds;
    }
    function frameAt(list,timeMs){let low=0,high=list.length-1,index=0;while(low<=high){const mid=(low+high)>>1;if(list[mid].timeMs<=timeMs){index=mid;low=mid+1;}else high=mid-1;}return index;}
    function renderDelay(){
      if(review)return;if(!stream){phase=error?'error':'idle';notify();return;}
      const ready=span()+.001>=delaySeconds;
      phase=frames.length&&(ready||limited)?'delay':'buffering';
      if(frames.length&&(ready||limited)){const target=frames.at(-1).timeMs-delaySeconds*1000,index=frameAt(frames,target);if(displayed?.frame.id!==frames[index].id)requestDraw(frames[index],index,0);}
      notify();
    }
    function dimensions(){const width=Number(video.videoWidth),height=Number(video.videoHeight);if(!(width>0&&height>0))return null;const scale=Math.min(1,(width>=height?960:720)/width,(width>=height?720:960)/height);return{width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
    function scheduleCapture(token){
      if(captureTimer!==null)clearTimeout(captureTimer);let due=clock();
      const tick=()=>{
        captureTimer=null;if(token!==cameraToken||!stream||!available())return;
        const size=dimensions();if(!encoding&&size&&video.readyState>=2){
          if(capture.width!==size.width)capture.width=size.width;if(capture.height!==size.height)capture.height=size.height;
          const timestamp=clock();encoding=true;
          try{context.drawImage(video,0,0,size.width,size.height);capture.toBlob(blob=>{
            if(token!==cameraToken||destroyed)return;encoding=false;
            if(!blob||!Number.isFinite(blob.size)||blob.size<=0||blob.size>MAX_CLIP_BYTES){cameraFailure('The camera frame could not be captured. Try starting it again.');return;}
            const frame=Object.freeze({id:'frame-'+(++frameSerial)+'-'+(++sequence),blob,timeMs:timestamp,width:size.width,height:size.height});frames.push(frame);trim();renderDelay();if(review)notify();
          },'image/jpeg',.7);}catch(_){encoding=false;cameraFailure('The camera frame could not be captured. Try starting it again.');return;}
        }
        if(token!==cameraToken||!stream||!available())return;due+=FRAME_MS;if(due<=clock())due=clock()+FRAME_MS;captureTimer=setTimeout(tick,Math.max(0,due-clock()));
      };tick();
    }
    function releaseCamera(){
      cameraToken++;if(captureTimer!==null)clearTimeout(captureTimer);captureTimer=null;encoding=false;cancelReady?.();cancelReady=null;
      for(const [track,listener]of trackListeners)track.removeEventListener?.('ended',listener);trackListeners=[];
      const previous=stream;stream=null;if(previous)for(const track of previous.getTracks())try{track.stop();}catch(_) {}
      try{video.pause?.();video.srcObject=null;}catch(_) {}
    }
    function cameraFailure(message){releaseCamera();error=message;phase=review&&clip?'replay':'error';notify();}
    function waitForVideo(token){
      return new Promise((resolve,reject)=>{
        let settled=false,timeout=null,startedPlaying=false;const finish=problem=>{if(settled)return;settled=true;clearTimeout(timeout);video.removeEventListener?.('loadedmetadata',check);video.removeEventListener?.('loadeddata',check);video.removeEventListener?.('error',failed);if(cancelReady===cancel)cancelReady=null;problem?reject(problem):resolve();};
        const cancel=()=>finish(abortError()),failed=()=>finish(Error('The camera preview could not start. Please try again.'));
        const check=()=>{if(token!==cameraToken||!available()){cancel();return;}if(startedPlaying&&dimensions()&&video.readyState>=2)finish();};
        cancelReady=cancel;video.addEventListener?.('loadedmetadata',check);video.addEventListener?.('loadeddata',check);video.addEventListener?.('error',failed);timeout=setTimeout(()=>finish(Error('The camera did not send video. Try starting it again.')),10000);
        let started;try{started=video.play();}catch(problem){finish(problem);return;}
        Promise.resolve(started).then(()=>{startedPlaying=true;check();},finish);check();
      });
    }
    function start(settings={}){
      if(startPromise)return startPromise;if(!available())return Promise.resolve(false);
      if(settings.delaySeconds!==undefined)setDelay(settings.delaySeconds);
      if(settings.facingMode!==undefined)facingMode=settings.facingMode==='user'?'user':'environment';
      if(!getState().supported){error='Camera replay is not supported in this browser. Try Safari or Chrome on a secure page.';phase='error';notify();return Promise.resolve(false);}
      releaseCamera();pause();frames=[];limited=bufferCapped=false;error='';if(!review)clearDisplay();phase='starting';const token=cameraToken;notify();
      const promise=(async()=>{
        try{
          const acquired=await media.getUserMedia({audio:false,video:{facingMode:{ideal:facingMode},width:{ideal:960},height:{ideal:720},frameRate:{ideal:FPS,max:FPS}}});
          if(token!==cameraToken||!available()){for(const track of acquired.getTracks())track.stop();return false;}
          stream=acquired;
          for(const track of stream.getVideoTracks()){const ended=()=>{if(token===cameraToken)cameraFailure('The camera stopped. Start it again when you’re ready.');};track.addEventListener?.('ended',ended);trackListeners.push([track,ended]);}
          video.srcObject=stream;await waitForVideo(token);if(token!==cameraToken||!available())return false;
          phase=review&&clip?'replay':'buffering';scheduleCapture(token);notify();return token===cameraToken&&Boolean(stream);
        }catch(problem){if(token===cameraToken&&problem?.name!=='AbortError')cameraFailure(friendly(problem));return false;}
      })();startPromise=promise;promise.then(()=>{if(startPromise===promise)startPromise=null;},()=>{if(startPromise===promise)startPromise=null;});return promise;
    }
    function cancelPlayback(){playToken++;if(playTimer!==null)clearTimeout(playTimer);playTimer=null;}
    function currentPosition(){return playing?Math.min(clip?.durationMs||0,playOrigin+(clock()-playStarted)*speed):positionMs;}
    function pause(){
      if(destroyed)return;if(playing){positionMs=displayed?.clipId===clip?.id?displayed.relativeMs:currentPosition();invalidateDraw();}playing=false;cancelPlayback();notify();
    }
    function cancelExport(){exportJob?.cancel();}
    function suspend(){pause();releaseCamera();invalidateDraw();cancelExport();phase=review&&clip?'replay':error?'error':'idle';notify();}
    function stop(){if(!destroyed)suspend();}
    function setActive(value){if(destroyed)return;active=Boolean(value);if(!active)suspend();else notify();}
    function setDelay(value){const seconds=Number(value);if(!Number.isFinite(seconds)||seconds<1||seconds>30)throw RangeError('Choose a delay from 1 to 30 seconds.');delaySeconds=seconds;trim();renderDelay();}
    function replay(){
      if(!available())return false;if(!frames.length){error='Record a moment before replaying it.';notify();return false;}
      pause();cancelExport();const last=frames.at(-1).timeMs,chosen=frames.filter(frame=>frame.timeMs>=last-delaySeconds*1000).slice(-MAX_FRAMES);let bytes=chosen.reduce((total,frame)=>total+frame.blob.size,0);while(chosen.length>1&&bytes>MAX_CLIP_BYTES)bytes-=chosen.shift().blob.size;const first=chosen[0];
      clip=Object.freeze({id:'clip-'+(++sequence),frames:Object.freeze(chosen.slice()),startMs:first.timeMs,endMs:last,durationMs:last-first.timeMs,width:first.width,height:first.height});review=true;positionMs=0;error='';phase='replay';clearDisplay();trim();requestDraw(first,0,0,clip.id);notify();return true;
    }
    function returnToDelay(){if(destroyed)return;pause();review=false;positionMs=0;error='';clearDisplay();trim();renderDelay();}
    function showPosition(milliseconds){if(!clip)return;positionMs=Math.min(clip.durationMs,Math.max(0,milliseconds));const index=frameAt(clip.frames,clip.startMs+positionMs);if(displayed?.frame.id!==clip.frames[index].id||displayed.clipId!==clip.id)requestDraw(clip.frames[index],index,clip.frames[index].timeMs-clip.startMs,clip.id);}
    function play(){
      if(!available()||!clip||clip.durationMs<=0||playing)return false;review=true;phase='replay';if(positionMs>=clip.durationMs)positionMs=0;
      playing=true;playOrigin=positionMs;playStarted=clock();const token=++playToken;
      const tick=()=>{playTimer=null;if(token!==playToken||!playing||!available())return;showPosition(currentPosition());if(positionMs>=clip.durationMs){playing=false;notify();return;}notify();playTimer=setTimeout(tick,FRAME_MS);};tick();return true;
    }
    function seek(seconds){if(!available()||!clip)return false;const value=Number(seconds);if(!Number.isFinite(value))return false;pause();review=true;phase='replay';invalidateDraw();showPosition(value*1000);notify();return true;}
    function step(delta){if(!available()||!clip)return false;const amount=Math.trunc(Number(delta));if(!Number.isFinite(amount))return false;pause();review=true;phase='replay';const index=displayed?.clipId===clip.id?clip.frames.findIndex(frame=>frame.id===displayed.frame.id):frameAt(clip.frames,clip.startMs+positionMs);const target=Math.max(0,Math.min(clip.frames.length-1,index+amount));invalidateDraw();showPosition(clip.frames[target].timeMs-clip.startMs);notify();return true;}
    function setSpeed(value){const next=Number(value);if(![.25,.5,1,2].includes(next))throw RangeError('Choose 0.25×, 0.5×, 1× or 2× speed.');const wasPlaying=playing,position=currentPosition();pause();speed=next;positionMs=position;if(wasPlaying)play();else notify();}
    function getCurrentFrame(){if(!displayed)return null;const frame=displayed.frame,list=displayed.clipId&&clip?.id===displayed.clipId?clip.frames:frames;return Object.freeze({blob:frame.blob,id:frame.id,index:list.findIndex(item=>item.id===frame.id),time:displayed.clipId?displayed.relativeMs/1000:frame.timeMs/1000,timeMs:frame.timeMs,width:frame.width,height:frame.height,clipId:displayed.clipId});}
    function exportClip({onProgress=()=>{},signal}={}){
      if(destroyed||!available())return Promise.reject(abortError());if(exportJob)return Promise.reject(Error('An export is already running.'));
      if(!clip||clip.durationMs<=0)return Promise.reject(Error('Capture at least two frames before exporting video.'));
      const type=mimeType();if(!exportSupported()||!type)return Promise.reject(Error('Video export is not supported in this browser. You can still save a frame.'));
      if(signal?.aborted)return Promise.reject(abortError());
      const frozen=clip,output=document.createElement('canvas'),ctx=output.getContext('2d',{alpha:false});output.width=frozen.width;output.height=frozen.height;
      return new Promise((resolve,reject)=>{
        const job={closed:false,cancel:null,clip:frozen,stream:null,recorder:null,timers:new Set(),waiters:new Set(),chunks:[],bytes:0};exportJob=job;exportProgress=0;notify();
        const progress=value=>{if(job.closed)return;exportProgress=Math.max(0,Math.min(1,value));try{onProgress(exportProgress);}catch(_){}notify();};
        const finish=(problem,result)=>{if(job.closed)return;job.closed=true;for(const timer of job.timers)clearTimeout(timer);job.timers.clear();for(const resolveWait of job.waiters)resolveWait();job.waiters.clear();cancelImages(job);signal?.removeEventListener?.('abort',job.cancel);if(job.recorder){job.recorder.ondataavailable=job.recorder.onerror=job.recorder.onstop=null;try{if(job.recorder.state!=='inactive')job.recorder.stop();}catch(_) {}}for(const track of job.stream?.getTracks()||[])try{track.stop();}catch(_){}job.chunks=[];job.clip=null;if(exportJob===job)exportJob=null;if(problem&&problem.name!=='AbortError')error=problem.message||'Video export failed. Please try again.';notify();problem?reject(problem):resolve(result);};
        job.cancel=()=>finish(abortError());signal?.addEventListener?.('abort',job.cancel,{once:true});
        const wait=delay=>new Promise(resolveWait=>{if(job.closed){resolveWait();return;}job.waiters.add(resolveWait);const timer=setTimeout(()=>{job.timers.delete(timer);job.waiters.delete(resolveWait);resolveWait();},Math.max(0,delay));job.timers.add(timer);});
        const draw=decoded=>{ctx.fillStyle='#000';ctx.fillRect(0,0,output.width,output.height);const width=decoded.image.width||output.width,height=decoded.image.height||output.height,scale=Math.min(output.width/width,output.height/height);ctx.drawImage(decoded.image,(output.width-width*scale)/2,(output.height-height*scale)/2,width*scale,height*scale);};
        void(async()=>{
          let decoded;
          try{
            decoded=await decode(frozen.frames[0],job);if(job.closed)return;draw(decoded);decoded.close();decoded=null;
            let manual=true;try{job.stream=output.captureStream(0);}catch(_){manual=false;job.stream=output.captureStream(FPS);}
            let track=job.stream.getVideoTracks()[0];if(!track)throw Error('This browser could not create an export video.');
            if(manual&&typeof track.requestFrame!=='function'){for(const item of job.stream.getTracks())item.stop();job.stream=output.captureStream(FPS);track=job.stream.getVideoTracks()[0];manual=false;}
            const recorder=new Recorder(job.stream,{mimeType:type,videoBitsPerSecond:4000000});job.recorder=recorder;
            recorder.ondataavailable=event=>{if(job.closed||!event.data?.size)return;job.bytes+=event.data.size;if(job.bytes>MAX_BYTES){finish(Error('This export is too large. Try a shorter clip.'));return;}job.chunks.push(event.data);};
            recorder.onerror=()=>finish(Error('The browser could not finish this video. Try exporting again.'));
            recorder.onstop=()=>{if(job.closed)return;try{if(!job.chunks.length)throw Error('The browser returned an empty video. Try exporting again.');const actualType=recorder.mimeType||type,blob=new Blob(job.chunks,{type:actualType});progress(1);finish(null,{blob,type:actualType,duration:frozen.durationMs/1000,width:output.width,height:output.height});}catch(problem){finish(problem);}};
            recorder.start();const started=clock();if(manual)track.requestFrame();progress(0);
            const end=setTimeout(()=>{job.timers.delete(end);if(!job.closed)try{recorder.stop();if(!job.closed){const timeout=setTimeout(()=>{job.timers.delete(timeout);finish(Error('The browser did not finish this video. Try exporting again.'));},5000);job.timers.add(timeout);}}catch(problem){finish(problem);}},frozen.durationMs);job.timers.add(end);
            for(let index=1;index<frozen.frames.length&&!job.closed;index++){
              const elapsed=clock()-started;while(index+1<frozen.frames.length&&frozen.frames[index+1].timeMs-frozen.startMs<=elapsed)index++;
              decoded=await decode(frozen.frames[index],job);if(job.closed)break;
              await wait(started+frozen.frames[index].timeMs-frozen.startMs-clock());if(job.closed)break;
              draw(decoded);decoded.close();decoded=null;if(manual)track.requestFrame();progress((clock()-started)/frozen.durationMs);
            }
          }catch(problem){finish(problem);}finally{decoded?.close();}
        })();
      });
    }
    function visibility(){if(document.hidden&&!destroyed)suspend();}
    function pagehide(){if(!destroyed)suspend();}
    function destroy(){if(destroyed)return;suspend();destroyed=true;invalidateDraw();frames=[];clip=null;displayed=null;onChange=()=>{};document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',pagehide);capture.width=capture.height=1;}
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pagehide);notify();
    return Object.freeze({start,stop,setActive,setDelay,replay,returnToDelay,play,pause,seek,step,setSpeed,exportClip,destroy,getState,getCurrentFrame});
  }
  window.SWLReplayEngine=Object.freeze({version:1,create});
})();
