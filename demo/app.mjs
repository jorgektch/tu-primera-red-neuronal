import {validateModel,predictProbability,predictLabel} from './inference.mjs';
import {fromCanvas} from './preprocess.mjs';

const $=id=>document.getElementById(id);
let model=null,stream=null;
const camera=$('camera'), status=$('model-status'), pad=$('draw-pad');
const scratch=document.createElement('canvas');scratch.width=96;scratch.height=96;
const scratchCtx=scratch.getContext('2d',{willReadFrequently:true});
const preview=$('normalized-preview').getContext('2d');
const pointCtx=pad.getContext('2d');
pointCtx.lineWidth=12;pointCtx.lineCap='round';pointCtx.lineJoin='round';
function resetPad(){pointCtx.fillStyle='#ffffff';pointCtx.fillRect(0,0,pad.width,pad.height);pointCtx.strokeStyle='#101010';}
resetPad();
function setStatus(message,err=false){status.textContent=message;status.classList.toggle('error',err)}
function renderPixels(pixels){
  const image=preview.createImageData(28,28);
  for(let i=0;i<784;i++){
    const v=Math.round(pixels[i]*255);image.data[i*4]=v;image.data[i*4+1]=v;image.data[i*4+2]=v;image.data[i*4+3]=255;
  }
  const tiny=document.createElement('canvas');tiny.width=28;tiny.height=28;
  tiny.getContext('2d').putImageData(image,0,0);
  preview.imageSmoothingEnabled=false;
  preview.clearRect(0,0,280,280);preview.drawImage(tiny,0,0,280,280);
}
function predictFromCanvas(canvas){
  if(!model){setStatus('El modelo todavía no está disponible.',true);return;}
  scratchCtx.fillStyle='#fff';scratchCtx.fillRect(0,0,96,96);
  scratchCtx.drawImage(canvas,0,0,96,96);
  const {pixels,empty}=fromCanvas(scratch);
  renderPixels(pixels);
  if(empty){$('prediction').textContent='No se detectó un dibujo';$('emoji').textContent='✍️';$('confidence').textContent='Dibuja una carita con tinta oscura y vuelve a intentar.';return;}
  const p=predictProbability(pixels,model);const result=predictLabel(p,model);
  $('emoji').textContent=result.emoji;
  $('prediction').textContent=result.label;
  $('confidence').textContent=`Salida sigmoide (feliz): ${(p*100).toFixed(1)} %`;
  $('probability-bar').style.width=`${p*100}%`;
}
function captureFrame(){
  if(!camera.videoWidth){setStatus('No hay fotograma disponible.',true);return;}
  const size=Math.min(camera.videoWidth,camera.videoHeight);
  const x=(camera.videoWidth-size)/2,y=(camera.videoHeight-size)/2;
  scratchCtx.drawImage(camera,x,y,size,size,0,0,96,96);
  predictFromCanvas(scratch);
}
async function startCamera(){
  if(!navigator.mediaDevices?.getUserMedia){setStatus('Necesitas HTTPS o localhost para utilizar la cámara.',true);return;}
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}});
    camera.srcObject=stream;await camera.play();
    $('capture').disabled=false;$('stop-camera').disabled=false;
    setStatus('Cámara lista. Coloca el dibujo dentro del recuadro y pulsa Capturar y clasificar.');
  }catch(e){setStatus(`No se pudo iniciar la cámara: ${e.message}. También puedes subir una imagen o dibujar aquí.`,true);}
}
function stopCamera(){if(stream){stream.getTracks().forEach(track=>track.stop());stream=null;}camera.srcObject=null;$('capture').disabled=true;$('stop-camera').disabled=true;}
$('start-camera').addEventListener('click',startCamera);
$('stop-camera').addEventListener('click',stopCamera);
$('capture').addEventListener('click',captureFrame);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera()});
for(const tab of document.querySelectorAll('.tab')){
  tab.addEventListener('click',()=>{
    for(const t of document.querySelectorAll('.tab')){const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));$('panel-'+t.dataset.tab).hidden=!active;}
    if(tab.dataset.tab!=='camera')stopCamera();
  });
}
$('upload').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')){setStatus('Selecciona un archivo de imagen.',true);return;}
  try{const image=await createImageBitmap(file);const canvas=$('uploaded-preview'),ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,96,96);
    const n=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-n)/2,(image.height-n)/2,n,n,0,0,96,96);
    image.close();predictFromCanvas(canvas);
  }catch(err){setStatus(`No se pudo leer la imagen: ${err.message}`,true);}
});
let drawing=false;
function point(e){const r=pad.getBoundingClientRect();return {x:(e.clientX-r.left)*pad.width/r.width,y:(e.clientY-r.top)*pad.height/r.height};}
pad.addEventListener('pointerdown',e=>{drawing=true;pad.setPointerCapture(e.pointerId);const p=point(e);pointCtx.beginPath();pointCtx.moveTo(p.x,p.y);pointCtx.lineTo(p.x+.001,p.y+.001);pointCtx.stroke();});
pad.addEventListener('pointermove',e=>{if(!drawing)return;const p=point(e);pointCtx.lineTo(p.x,p.y);pointCtx.stroke()});
for(const type of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(type,()=>drawing=false);
$('clear-draw').addEventListener('click',()=>{resetPad();$('prediction').textContent='Dibuja una carita para comenzar';});
$('classify-draw').addEventListener('click',()=>predictFromCanvas(pad));
try{
  const response=await fetch('./model.json',{cache:'no-store'});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  model=validateModel(await response.json());
  setStatus(`Modelo NumPy cargado: ${model.layers.map(l=>l.output).join(' → ')} neuronas. Todo se ejecuta en tu dispositivo.`);
}catch(e){setStatus(`Error cargando model.json: ${e.message}`,true);}
