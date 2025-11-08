const $=id=>document.getElementById(id);
let socket=null, room=null, timerInt=null;
let bonus = { quick: 5, streakEvery: 3, streakBonus: 5, enableQuick:true, enableStreak:true };
function log(m){ const el=$('log'); el.textContent += m+"\n"; el.scrollTop=el.scrollHeight; }
function setPreview(){ const u=$('qImg').value.trim(); const img=$('preview'); if(u){ img.src=u; img.style.display='block'; } else { img.style.display='none'; } }
$('qImg').addEventListener('input', setPreview);
$('qType').addEventListener('change', ()=>{ document.getElementById('mcqBox').style.display = ($('qType').value==='mcq'?'block':'none'); });

function connect(){
  const url=$('ws').value.trim();
  room=$('room').value.trim().toUpperCase();
  if(!url||!room){ alert('Renseigne serveur et salle'); return; }
  socket=io(url,{transports:['websocket']});
  socket.on('connect', ()=> log('✅ Connecté au serveur'));
  socket.on('disconnect', ()=> log('❌ Déconnecté'));
  socket.on('room-info', (info)=> renderScores(info.scores||{}));
  socket.on('player-joined', p=> log('👤 '+p.name+' a rejoint'));
  socket.on('answer-received', p=> log('✍️ '+p.name+' → '+p.answer));
  socket.on('scores', s=> renderScores(s));
  socket.emit('host-join', {room});
}
$('connect').onclick = connect;

function start(){
  const type = $('qType').value;
  const q={
    room,
    type,
    text:$('qText').value.trim(),
    image:$('qImg').value.trim(),
    choices: type==='mcq' ? [ $('cA').value, $('cB').value, $('cC').value, $('cD').value ].map(x=>x||"").slice(0,4) : [],
    answer:$('qAns').value.trim(),
    points: parseInt($('qPts').value||'10',10),
    duration: parseInt($('qDur').value||'30',10),
    allowChange:true
  };
  if(!q.text||!q.answer){ alert('Au moins texte et bonne réponse'); return; }
  socket.emit('start-question', q);
  startTimer(q.duration);
  log('▶️ Question envoyée ('+q.type+')');
}
$('start').onclick=start;

function reveal(){
  socket.emit('reveal', {room});
  stopTimer();
  log('🎬 Révélé + scores envoyés');
}
$('reveal').onclick=reveal;

function nextQ(){
  ['qText','qImg','cA','cB','cC','cD','qAns'].forEach(id=> $(id).value='');
  $('preview').style.display='none';
  $('qPts').value='10'; $('qDur').value='30';
  $('time').textContent='—';
}
$('next').onclick=nextQ;

function startTimer(s){
  stopTimer();
  let t=s; $('time').textContent=t+'s';
  timerInt=setInterval(()=>{
    t--; $('time').textContent=t+'s';
    if(t<=0){ stopTimer(); }
  },1000);
}
function stopTimer(){ if(timerInt){ clearInterval(timerInt); timerInt=null; } }

function renderScores(scores){
  const arr=Object.values(scores).sort((a,b)=>b.score-a.score).slice(0,10);
  const box=$('scores'); box.innerHTML='';
  arr.forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='score';
    d.innerHTML = `<div>${i+1}. <b>${p.name}</b></div><div>${p.score} pts</div>`;
    box.appendChild(d);
  });
}

$('qrBtn').onclick = async()=>{
  const base=$('playerUrl').value.trim().replace(/\/+$/,'');
  if(!base){ alert('URL Player requise'); return; }
  const url = base + '/?code='+ encodeURIComponent(($('room').value||'').trim().toUpperCase());
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, url, {width: 220, color:{dark:'#000', light:'#fff'}});
  const box=$('qrBox'); box.innerHTML=''; box.appendChild(canvas);
};
