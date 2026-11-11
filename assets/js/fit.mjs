/**
 * Slide-fit guard for Reveal.js. Keeps headings, tables and media within the
 * 1280x720 virtual slide where possible. It does NOT conceal excess content.
 * The publisher should split slides if the compact preset is still too tall.
 */
export const FIT_CLASSES = ['slide-content-compact', 'slide-content-tight'];

export function measuredSlideHeight(slide) {
  if (!slide) return 0;
  // scrollHeight is in virtual CSS pixels and includes content outside the slide.
  // Do not use bounding-client rect, which is scaled by Reveal.js for the viewport.
  return Math.max(Number(slide.scrollHeight) || 0, Number(slide.offsetHeight) || 0);
}

/** Returns compact, tight or overflow; never removes/scroll-clips content. */
export function fitSlide(slide, {height = 720, safeGap = 18} = {}) {
  if (!slide || !slide.classList || slide.classList.contains('cover') ||
      slide.classList.contains('closing') || slide.classList.contains('stack')) {
    return {mode:'skip', height:0, limit:height};
  }
  const limit = Math.max(200, height - safeGap);
  slide.classList.remove(...FIT_CLASSES);
  let measured = measuredSlideHeight(slide);
  if (measured <= limit) return {mode:'normal',height:measured,limit};
  slide.classList.add(FIT_CLASSES[0]);
  measured = measuredSlideHeight(slide);
  if (measured <= limit) return {mode:'compact',height:measured,limit};
  slide.classList.add(FIT_CLASSES[1]);
  measured = measuredSlideHeight(slide);
  if (measured <= limit) return {mode:'tight',height:measured,limit};
  return {mode:'overflow',height:measured,limit};
}

/** Schedules a fit pass after Reveal has positioned the active slide. */
export function setupSlideFit({reveal,enabled=true,safeGap=18,win=window,doc=document}={}) {
  if (!reveal || !enabled) return {run:()=>null,dispose:()=>{}};
  let token=0;
  let disposed=false;
  let lastWarning='';
  const diagnostics={checked:0,last:null,warnings:[]};
  win.slideFitDiagnostics=diagnostics;

  const run=() => {
    if (disposed) return null;
    const slide=reveal.getCurrentSlide();
    const height=reveal.getConfig().height;
    const result=fitSlide(slide,{height,safeGap});
    diagnostics.checked++;
    diagnostics.last=result;
    const position=reveal.getIndices?.() ?? {h:0,v:0};
    const id=`${position.h}/${position.v||0}`;
    if (result.mode==='overflow' && lastWarning!==id) {
      diagnostics.warnings.push({slide:id,overflowPx:result.height-result.limit});
      console.warn(`[README to Slides] Slide ${id} exceeds the canvas by `+
        `${Math.ceil(result.height-result.limit)}px even in compact mode. Split the Markdown slide with --- or --.`);
      lastWarning=id;
    }
    return result;
  };
  const schedule=() => {
    const seq=++token;
    win.requestAnimationFrame(()=>{
      if (disposed || seq!==token) return;
      const result=run();
      if (result && result.mode!=='skip') reveal.layout();
    });
  };
  const afterAssets=()=>schedule();
  reveal.on('slidechanged',schedule);
  // Resize and theme changes may alter measured text and SVG dimensions.
  win.addEventListener('resize',afterAssets);
  doc.fonts?.ready?.then(schedule).catch(()=>{});
  // New images (or cached images) can change layout after initial render.
  const onAssetLoad=e=>{if(e.target?.tagName==='IMG' && reveal.getCurrentSlide()?.contains(e.target))schedule();};
  doc.addEventListener('load',onAssetLoad,true);
  schedule();
  return {
    run:()=>{run();reveal.layout();return diagnostics.last;},
    schedule,
    diagnostics,
    dispose:()=>{disposed=true;token++;win.removeEventListener('resize',afterAssets);
      doc.removeEventListener('load',onAssetLoad,true);reveal.off?.('slidechanged',schedule);}
  };
}
