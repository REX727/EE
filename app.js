(()=>{
'use strict';
const english=document.documentElement.lang==='en';
const t=(zh,en)=>english?en:zh;
const STORAGE_KEY='esp32-lab-progress-v2';
const checks=[...document.querySelectorAll('[data-check]')];
const validKeys=new Set(checks.map(c=>c.dataset.check));
let state={},storageWorks=true;
try {
 const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
 if(saved && typeof saved==='object' && !Array.isArray(saved))
  for(const key of validKeys) if(saved[key]===true) state[key]=true;
} catch {storageWorks=false;}
function refresh(){
 checks.forEach(c=>{c.checked=state[c.dataset.check]===true;});
 const total=checks.filter(c=>c.checked).length;
 document.querySelector('#progress').value=total;
 document.querySelector('#progress-text').textContent=`${total} / ${checks.length}`;
 for(let n=1;n<=28;n++){
  const count=checks.filter(c=>c.dataset.check.startsWith(`u${n}-`)&&c.checked).length;
  document.querySelector(`#count-${n}`).textContent=`${count} / 7`;
  document.querySelector(`#nav-count-${n}`).textContent=`${count}/7`;
 }
 if(!storageWorks)document.querySelector('#storage-note').textContent=t('瀏覽器未能儲存，請匯出備份。','Storage is unavailable. Please export a backup.');
}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{storageWorks=false;}refresh();}
checks.forEach(c=>c.addEventListener('change',()=>{state[c.dataset.check]=c.checked;save();}));
refresh();
window.addEventListener('storage',event=>{
 if(event.key!==STORAGE_KEY)return;
 try{const incoming=JSON.parse(event.newValue||'{}');state={};for(const key of validKeys)if(incoming?.[key]===true)state[key]=true;refresh();}catch{}
});
let toastTimer;
function toast(message){
 const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4500);
}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
 const target=document.getElementById(button.dataset.copy);
 const text=target.tagName==='TEXTAREA'?target.value:target.textContent;
 try{await navigator.clipboard.writeText(text);toast(t('已複製。可貼到你的 AI 或編輯器。','Copied. Paste it into your AI or editor.'));}
 catch{
  if(target.tagName==='TEXTAREA'){target.closest('details').open=true;target.focus();target.select();}
  else {const selection=window.getSelection();const range=document.createRange();range.selectNodeContents(target);selection.removeAllRanges();selection.addRange(range);}
  toast(t('已選取文字，請按 Ctrl/Cmd + C。','Text selected. Press Ctrl/Cmd + C.'));
 }
}));
const menu=document.querySelector('#menu'),sidebar=document.querySelector('#sidebar');
function closeMenu(){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',closeMenu));
const sections=[...document.querySelectorAll('main>section[id],main>article[id]')];
const languageLink=document.querySelector('.language-switch');
const languageBase=languageLink.getAttribute('href');
let scrolling=false,selectedId='start';
function highlight(){
 let selected=sections[0];
 for(const section of sections)if(section.getBoundingClientRect().top<=160)selected=section;
 selectedId=selected.id;
 document.querySelectorAll('nav a').forEach(a=>{
  const active=a.hash===`#${selectedId}`;a.classList.toggle('active',active);
  if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
 });
 languageLink.href=languageBase+`#${selectedId}`;
 scrolling=false;
}
window.addEventListener('scroll',()=>{if(!scrolling){scrolling=true;requestAnimationFrame(highlight);}},{passive:true});
function openCurrentStage(){
 const id=location.hash.slice(1);
 const link=[...document.querySelectorAll('nav a')].find(a=>a.hash===location.hash);
 if(link?.closest('details'))link.closest('details').open=true;
 if(id&&document.getElementById(id)){selectedId=id;languageLink.href=languageBase+`#${id}`;}
}
highlight();openCurrentStage();
window.addEventListener('hashchange',openCurrentStage);
document.querySelector('#export').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify({course:'esp32-lab-v2',exportedAt:new Date().toISOString(),checks:state},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='electrical-engineering-progress.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 toast(t('已匯出進度備份。','Progress backup exported.'));
});
document.querySelector('#import').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try{
  if(file.size>100000)throw new Error('large');
  const data=JSON.parse(await file.text());
  if(data.course!=='esp32-lab-v2'||!data.checks||typeof data.checks!=='object'||Array.isArray(data.checks))throw new Error('format');
  const entries=Object.entries(data.checks);
  if(entries.some(([key,value])=>!validKeys.has(key)||typeof value!=='boolean'))throw new Error('format');
  if(!window.confirm(t('匯入會取代目前的勾選進度。確定繼續？','Importing will replace your current checks. Continue?')))return;
  state={};for(const[key,value]of entries)state[key]=value;save();
  toast(t('已匯入進度。','Progress imported.'));
 }catch{toast(t('未能匯入：請選擇本課程匯出的有效 JSON 備份。','Could not import: choose a valid JSON backup from this course.'));}
 finally{event.target.value='';}
});
document.querySelector('#print').addEventListener('click',()=>window.print());
const resistor=document.querySelector('#resistance'),duty=document.querySelector('#duty');
function updateResistor(){
 const r=Number(resistor.value);
 document.querySelector('#resistance-output').textContent=`R = ${r} Ω   →   I ≈ ${(1300/r).toFixed(2)} mA`;
}
function updateDuty(){
 const d=Number(duty.value);
 document.querySelector('#duty-output').textContent=`${d}%   →   HIGH = ${(d/100).toFixed(2)} ms / 1 ms`;
 document.querySelector('#pwm-high').style.width=`${d}%`;
}
resistor.addEventListener('input',updateResistor);duty.addEventListener('input',updateDuty);updateResistor();updateDuty();
const dialog=document.createElement('dialog');
dialog.setAttribute('aria-label',t('放大圖解','Enlarged visual guide'));
const top=document.createElement('div');top.className='dialog-top';
const heading=document.createElement('strong');heading.textContent=t('圖解','Visual guide');
const close=document.createElement('button');close.textContent=t('關閉','Close');
const zoomContent=document.createElement('div');zoomContent.className='zoom-content';
top.append(heading,close);dialog.append(top,zoomContent);document.body.append(dialog);
close.addEventListener('click',()=>dialog.close());
document.querySelectorAll('.visual,.photo').forEach(figure=>{
 const button=document.createElement('button');button.className='zoom-button';
 button.textContent=t('放大','Enlarge');
 button.setAttribute('aria-label',t('放大：','Enlarge: ')+(figure.querySelector('svg')?.getAttribute('aria-label')||figure.querySelector('img').alt));
 figure.querySelector('figcaption').prepend(button);
 button.addEventListener('click',()=>{
  const clone=figure.querySelector('svg,img').cloneNode(true);
  clone.querySelectorAll?.('[id]').forEach(el=>{
   const previous=el.id;el.id=previous+'-zoom';
   clone.querySelectorAll('[marker-end]').forEach(path=>{
    if(path.getAttribute('marker-end')===`url(#${previous})`)path.setAttribute('marker-end',`url(#${previous}-zoom)`);
   });
  });
  zoomContent.replaceChildren(clone);dialog.showModal();
 });
});

})();
