/** Preprocesamiento del navegador; contrato paralelo al de src/preprocess.py.
 * Imagen de hoja blanca, tinta oscura -> intensidades 0..1, cuadrado 28x28.
 * No es un detector de rostros: encuadra el dibujo dentro del recuadro guía.
 */
export const IMAGE_SIZE = 28;
export function preprocessRGBA(rgba, width, height) {
  if (rgba.length !== width*height*4 || width < 8 || height < 8) throw Error('Imagen RGBA inválida');
  const gray=new Float32Array(width*height);
  for (let i=0;i<gray.length;i++) gray[i]=0.299*rgba[4*i]+0.587*rgba[4*i+1]+0.114*rgba[4*i+2];
  const sorted=Array.from(gray).sort((a,b)=>a-b);
  const bg=sorted[Math.floor(.95*(sorted.length-1))];
  const ink=new Float32Array(gray.length);
  const contrast=Math.max(bg*.75,20);
  let minX=width,minY=height,maxX=-1,maxY=-1,inkCount=0;
  for (let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const i=y*width+x;
    let v=Math.max(0,Math.min(1,(bg-gray[i])/contrast));
    if(v<.10)v=0;
    ink[i]=v;
    if(v>.22){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);inkCount++;}
  }
  const result=new Float32Array(784);
  if(inkCount<14) return {pixels:result,inkCount,empty:true};
  const pad=Math.max(1,Math.round(Math.max(maxX-minX+1,maxY-minY+1)*.06));
  minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);
  maxX=Math.min(width-1,maxX+pad);maxY=Math.min(height-1,maxY+pad);
  const cropW=maxX-minX+1,cropH=maxY-minY+1;
  const factor=24/Math.max(cropW,cropH);
  const newW=Math.max(1,Math.min(24,Math.round(cropW*factor)));
  const newH=Math.max(1,Math.min(24,Math.round(cropH*factor)));
  const offX=Math.floor((28-newW)/2),offY=Math.floor((28-newH)/2);
  // Bilinear interpolation with source-pixel-center coordinates.
  for(let y=0;y<newH;y++)for(let x=0;x<newW;x++) {
    const fy=Math.max(0,Math.min(cropH-1,(y+.5)*(cropH/newH)-.5));
    const fx=Math.max(0,Math.min(cropW-1,(x+.5)*(cropW/newW)-.5));
    const y0=Math.floor(fy),x0=Math.floor(fx);
    const y1=Math.min(cropH-1,y0+1),x1=Math.min(cropW-1,x0+1);
    const a=fy-y0,b=fx-x0;
    const v00=ink[(minY+y0)*width+minX+x0];
    const v01=ink[(minY+y0)*width+minX+x1];
    const v10=ink[(minY+y1)*width+minX+x0];
    const v11=ink[(minY+y1)*width+minX+x1];
    result[(offY+y)*28+offX+x]=((1-a)*((1-b)*v00+b*v01)+a*((1-b)*v10+b*v11));
  }
  return {pixels:result,inkCount,empty:false};
}
export function fromCanvas(canvas) {
  const context=canvas.getContext('2d',{willReadFrequently:true});
  const data=context.getImageData(0,0,canvas.width,canvas.height);
  return preprocessRGBA(data.data,canvas.width,canvas.height);
}
