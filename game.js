(() => {
 const boot=()=>{
  const shell=document.querySelector('.g-shell'); if(!shell||shell.dataset.gameReady)return; shell.dataset.gameReady='true';
  const $=s=>shell.querySelector(s), $$=s=>[...shell.querySelectorAll(s)];
  const mobile=()=>matchMedia('(max-width:760px), (max-width:1000px) and (max-height:500px)').matches;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const viewport=$('.g-viewport'),world=$('.g-world'),player=$('.g-player');
  const desktopPoints=[{x:720,y:600},{x:1320,y:460},{x:1900,y:780},{x:2480,y:540},{x:2940,y:900}];
  const verticalPoints=[{x:440,y:600},{x:400,y:1450},{x:470,y:2300},{x:410,y:3150},{x:440,y:4000}];
  const content=[
   {kicker:'ПЕРВЫЙ ПРЫЖОК',title:'Ваши первые<br>800 метров',body:'<p>Самостоятельный прыжок с парашютом «Юниор». Всё начинается на земле — со знакомства с программой и инструктажа.</p>',next:'К подготовке'},
   {kicker:'ПОДГОТОВКА',title:'Знать,<br>что делать в небе',body:'<p>Пройдите обязательный инструктаж. Условия допуска, необходимые документы и доступные даты уточните у аэроклуба.</p>',next:'Узнать стоимость'},
   {kicker:'СТОИМОСТЬ',title:'7 500 ₽',body:'<p><strong>Инструктаж и страхование включены.</strong> Программа «Юниор», высота 800 метров.</p><p class="g-fine">Прайс от 01.01.2026. Актуальную стоимость уточните при записи.</p>',next:'Место встречи'},
   {kicker:'АЭРОДРОМ ЯСЮНИХА',title:'Встречаемся<br>в Иванове',body:'<p>Перед поездкой согласуйте дату, время приезда и проезд.</p><p><a href="tel:+74932352087">+7 (4932) 35-20-87</a></p>',next:'Оставить заявку'},
   {kicker:'ВАШ СЛЕДУЮЩИЙ ШАГ',title:'Ваш прыжок<br>начинается здесь',body:'<p>Оставьте контакты для согласования первого прыжка.</p>',next:'Оставить заявку'}
  ];
  let x=600,y=660,cameraX=0,cameraY=0,selected=0,target=null,last=0,started=false,position=0,step=0,wasMobile=mobile(),transitionUntil=0,wheelActive=false,wheelSum=0,wheelTimer,scrollTimer,swipe=null,motion=null,anchorX=null,anchorY=null,landingRevealAt=0;
  const held=new Set(),visited=new Set();
  const dialog=$('.g-dialog'),application=$('.g-application'),formContent=$('.g-application-content'),form=$('.g-request-form');
  function setCollapsed(collapsed){
   $('.g-flight-card').classList.toggle('is-collapsed',collapsed);
   $('.g-card-toggle').textContent=collapsed?'+':'−'; $('.g-card-toggle').setAttribute('aria-expanded',String(!collapsed));
   $('.g-card-toggle').setAttribute('aria-label',collapsed?'Развернуть информацию':'Свернуть информацию');
  }
  function select(index){
   const changed=index!==selected,card=$('.g-flight-card');
   card.getAnimations?.().forEach(animation=>animation.cancel());
   const previousHeight=card.offsetHeight;
   selected=index;shell.dataset.step=String(index);
   $('.g-card-index').textContent=`0${index+1} / 05`;
   $('.g-card-kicker').textContent=content[index].kicker;
   $('.g-card-title').innerHTML=content[index].title;
   $('.g-card-description').innerHTML=content[index].body;
   $('.g-card-next').innerHTML=`${content[index].next} <span>↓</span>`;
   $('.g-card-status').textContent=visited.has(index)?'ТОЧКА ПРОЙДЕНА':'ВАШ МАРШРУТ';
   $$('[data-g-go]').forEach((b,i)=>{b.classList.toggle('is-current',i===index);if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
   setCollapsed(false);
   if(mobile()&&changed&&index<4&&!reduced){
    const nextHeight=card.offsetHeight;
    card.animate?.([{height:`${previousHeight}px`},{height:`${nextHeight}px`}],{duration:600,easing:'cubic-bezier(.22,.65,.25,1)'});
    $('.g-card-content').animate?.([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.22,.65,.25,1)'});
   }
  }
  function arrive(index){
   if(visited.has(index))return;visited.add(index);
   $(`[data-g-beacon="${index}"]`).classList.add('is-visited');$(`[data-g-go="${index}"]`).classList.add('is-visited');
   $('[data-g-progress]').textContent=`${visited.size} / 5`;
   if(!mobile())select(index);
  }
  const stepHeight=()=>document.querySelector('.g-scroll-stop')?.getBoundingClientRect().height||innerHeight;
  function goStep(index,scroll=true){
   const next=clamp(index,0,4);
   if(next===step&&(motion||shell.classList.contains('is-touchdown')||shell.classList.contains('is-landed')))return;
   step=next;started=true;shell.classList.add('has-started');
   shell.classList.remove('is-touchdown','is-landed');landingRevealAt=0;
   shell.classList.toggle('is-landing',step===4);
   select(step);for(let i=0;i<=step;i++)arrive(i);
   const now=performance.now(),duration=Math.min(1500,900+Math.abs(step-position)*150);
   motion={from:position,to:step,start:now,duration};
   transitionUntil=now+duration+(step===4?1250:100);
   if(scroll)window.scrollTo({top:step*stepHeight(),behavior:reduced?'instant':'smooth'});
   if(reduced){position=step;motion=null;if(step===4)shell.classList.add('is-touchdown','is-landed');}
  }
  function flyTo(index){
   if(mobile()){goStep(index);return;}
   started=true;shell.classList.add('has-started');select(index);target={...desktopPoints[index],index};
   if(reduced){x=target.x;y=target.y;arrive(index);target=null;paint(true);}
  }
  function configure(){
   const points=mobile()?verticalPoints:desktopPoints;
   $$('[data-g-beacon]').forEach((b,i)=>{b.style.left=`${points[i].x}px`;b.style.top=`${points[i].y}px`;});
   $('.g-route-line').setAttribute('viewBox',mobile()?'0 0 880 4600':'0 0 3300 1500');
   $('.g-route-line path').setAttribute('d',mobile()?'M440 600C440 900 400 1150 400 1450S470 2000 470 2300 410 2850 410 3150 440 3700 440 4000':'M340 660C520 660 450 550 720 600S1000 340 1320 460 1610 920 1900 780 2150 400 2480 540 2740 900 2940 900');
   if(mobile()){
    viewport.append(player);started=true;shell.classList.add('has-started');goStep(step,false);position=step;motion=null;
    if(step===4)shell.classList.add('is-touchdown','is-landed');
   }else{world.append(player);shell.classList.remove('is-landing','is-touchdown','is-landed');}
   anchorX=null;anchorY=null;target=null;
  }
  function openForm(){
   held.clear();target=null;
   if(mobile()){if(step===4&&shell.classList.contains('is-landed'))form.querySelector('[name=name]').focus({preventScroll:true});else goStep(4);return;}
   $('.g-form-host').append(formContent);dialog.showModal();
  }
  function closeForm(){dialog.close();application.append(formContent);}
  $$('[data-g-apply]').forEach(b=>b.addEventListener('click',openForm));
  $('.g-dialog-close').addEventListener('click',closeForm);
  dialog.addEventListener('cancel',()=>application.append(formContent));
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeForm();}});
  form.addEventListener('submit',async e=>{
   if(new URL(form.action,location.href).origin!==location.origin)return;
   e.preventDefault();if(!form.reportValidity())return;
   const submit=form.querySelector('button[type=submit]'),status=$('.g-form-status');
   submit.disabled=true;submit.textContent='Отправляем…';status.textContent='';
   try{
    const response=await fetch(form.action||'/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});
    if(!response.ok)throw new Error('Submission failed');
    form.reset();form.hidden=true;$('.g-request-success').hidden=false;$('.g-request-success').focus();
   }catch{
    status.textContent='Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 (4932) 35-20-87.';
    submit.disabled=false;submit.innerHTML='Отправить заявку <span>↗︎</span>';
   }
  });
  $('.g-start').addEventListener('click',()=>{flyTo(0);if(!mobile())viewport.focus({preventScroll:true});});
  $('.g-brand').addEventListener('click',e=>{e.preventDefault();if(mobile()){goStep(0);return;}x=600;y=660;started=false;target=null;shell.classList.remove('has-started');select(0);paint(true);});
  $$('[data-g-go]').forEach(b=>b.addEventListener('click',()=>flyTo(Number(b.dataset.gGo))));
  $('.g-card-next').addEventListener('click',()=>selected===4?openForm():flyTo(selected+1));
  $('.g-card-toggle').addEventListener('click',()=>setCollapsed(!$('.g-flight-card').classList.contains('is-collapsed')));
  const keyMap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
  window.addEventListener('keydown',e=>{
   if(dialog.open||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)||(mobile()&&nestedScroll(e.target)))return;
   if(mobile()){
    if(['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();if(performance.now()>transitionUntil)goStep(step+(['ArrowDown','PageDown'].includes(e.key)?1:-1));}return;
   }
   const key=keyMap[e.key];if(!key)return;e.preventDefault();started=true;shell.classList.add('has-started');target=null;held.add(key);
  });
  window.addEventListener('keyup',e=>held.delete(keyMap[e.key]));window.addEventListener('blur',()=>held.clear());
  $$('[data-g-direction]').forEach(b=>{
   b.addEventListener('pointerdown',e=>{e.preventDefault();target=null;started=true;shell.classList.add('has-started');held.add(b.dataset.gDirection);b.setPointerCapture(e.pointerId);});
   const release=()=>held.delete(b.dataset.gDirection);b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  });
  function nestedScroll(target){return target.closest('.g-application,.g-dialog')||target.closest('.g-card-content')?.scrollHeight>target.closest('.g-card-content')?.clientHeight+2;}
  window.addEventListener('wheel',e=>{
   if(!mobile()||dialog.open||nestedScroll(e.target))return;
   e.preventDefault();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{wheelActive=false;wheelSum=0;},240);
   if(wheelActive||performance.now()<transitionUntil)return;
   wheelSum+=e.deltaY;if(Math.abs(wheelSum)<25)return;
   wheelActive=true;goStep(step+(wheelSum>0?1:-1));
  },{passive:false});
  viewport.addEventListener('pointerdown',e=>{if(!mobile())return;swipe={id:e.pointerId,x:e.clientX,y:e.clientY};viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener('pointerup',e=>{
   if(!swipe||swipe.id!==e.pointerId)return;const dy=swipe.y-e.clientY,dx=swipe.x-e.clientX;swipe=null;
   if(Math.abs(dy)>35&&Math.abs(dy)>Math.abs(dx)&&performance.now()>transitionUntil)goStep(step+(dy>0?1:-1));
  });
  viewport.addEventListener('pointercancel',()=>swipe=null);viewport.addEventListener('lostpointercapture',()=>swipe=null);
  window.addEventListener('scroll',()=>{
   if(!mobile()||performance.now()<transitionUntil)return;
   clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const nearest=clamp(Math.round(scrollY/stepHeight()),0,4);if(nearest!==step)goStep(nearest,false);},90);
  },{passive:true});
  function paint(immediate=false){
   const w=viewport.clientWidth,h=viewport.clientHeight;
   if(mobile()){
    const a=verticalPoints[Math.floor(position)],b=verticalPoints[Math.min(4,Math.floor(position)+1)],f=position-Math.floor(position);
    x=a.x+(b.x-a.x)*f;y=a.y+(b.y-a.y)*f;
    const cardTop=selected===4?h:$('.g-flight-card').getBoundingClientRect().top;
    let screenY=clamp(Math.min(h*.3,cardTop-player.clientHeight*.4-18),110,h*.4);
    let screenX=w*(w>h*1.3?.25:position<.5?.68:.5);
    const ground=$('.g-landing-scene'),touchdown=$('#g-touchdown-mark').getBoundingClientRect();
    ground.style.opacity=String(clamp((position-2.5)/1.5,0,1));
    if(step===4){
     const u=clamp(position-3,0,1),blend=u*u*(3-2*u);
     screenY=screenY+(touchdown.top+touchdown.height/2-player.clientHeight*.36-screenY)*blend;
     screenX=screenX+(touchdown.left+touchdown.width/2-screenX)*blend;
    }
    if(immediate||anchorX===null){anchorX=screenX;anchorY=screenY;}
    else{anchorX+=(screenX-anchorX)*.16;anchorY+=(screenY-anchorY)*.16;}
    if(shell.classList.contains('is-touchdown')){anchorX=touchdown.left+touchdown.width/2;anchorY=touchdown.top+touchdown.height/2-player.clientHeight*.36;}
    cameraX=x-anchorX;cameraY=y-anchorY;
    world.style.transform=`translate(${-cameraX}px,${-cameraY}px)`;
    player.style.left=`${anchorX}px`;player.style.top=`${anchorY}px`;player.style.transform='translate(-50%,-60%)';
    $('[data-g-altitude]').textContent=Math.max(0,Math.round(800*(1-position/4)));return;
   }
   const desiredX=clamp(x-w*.44,0,Math.max(0,3300-w)),desiredY=clamp(y-h*.52,0,Math.max(0,1500-h));
   if(immediate||reduced){cameraX=desiredX;cameraY=desiredY;}else{cameraX+=(desiredX-cameraX)*.08;cameraY+=(desiredY-cameraY)*.08;}
   world.style.transform=`translate(${-cameraX}px,${-cameraY}px)`;
   const lean=held.has('left')?-8:held.has('right')?8:0;
   player.style.left=`${x}px`;player.style.top=`${y}px`;player.style.transform=`translate(-50%,-60%) rotate(${lean}deg)`;
   $('[data-g-altitude]').textContent=Math.round(800-(y-600)*.17);
  }
  function tick(t){
   const dt=Math.min((t-last)/1000,.04)||0;last=t;
   if(mobile()){
    if(motion){
     const u=clamp((t-motion.start)/motion.duration,0,1),ease=u*u*u*(u*(u*6-15)+10);
     position=motion.from+(motion.to-motion.from)*ease;
     if(u===1){position=motion.to;motion=null;if(step===4){shell.classList.add('is-touchdown');landingRevealAt=t+1100;}}
    }
    if(landingRevealAt&&t>=landingRevealAt){shell.classList.add('is-landed');shell.classList.remove('is-landing');landingRevealAt=0;}
   }
   else if(!dialog.open){
    let dx=(held.has('right')?1:0)-(held.has('left')?1:0),dy=(held.has('down')?1:0)-(held.has('up')?1:0);
    if(dx||dy){const mag=Math.hypot(dx,dy);x+=dx/mag*270*dt;y+=dy/mag*270*dt;}
    if(target){const dx=target.x-x,dy=target.y-y,d=Math.hypot(dx,dy),travel=480*dt;if(d<travel+4){x=target.x;y=target.y;arrive(target.index);target=null;}else{x+=dx/d*travel;y+=dy/d*travel;}}
    x=clamp(x,110,3190);y=clamp(y,260,1100);if(started)desktopPoints.forEach((p,i)=>{if(Math.hypot(x-p.x,y-p.y)<78)arrive(i);});
   }
   paint();requestAnimationFrame(tick);
  }
  window.addEventListener('resize',()=>{if(mobile()!==wasMobile){wasMobile=mobile();configure();if(!mobile()){window.scrollTo({top:0,behavior:'instant'});x=desktopPoints[selected].x;y=desktopPoints[selected].y;}}paint(true);});
  configure();select(0);paint(true);requestAnimationFrame(tick);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
