const $ = id => document.getElementById(id);

let socket = null;
let roomCode = null;
let timerInt = null;
let left = 0;

function log(t){ const el = $("log"); el.textContent += t + "\n"; el.scrollTop = el.scrollHeight; }
function setTime(n){ $("time").textContent = n > 0 ? `${n}s` : "—"; }

$("connect").onclick = () => {
  const url = $("ws").value.trim();
  roomCode = $("room").value.trim().toUpperCase();
  if(!url || !roomCode) { alert("Serveur + code requis"); return; }

  socket = io(url, { transports:["websocket"], path:"/socket.io" });
  socket.on("connect", ()=>{
    log("✅ Connecté au serveur");
    socket.emit("host-join", { room: roomCode });
  });
  socket.on("disconnect", ()=> log("🔌 Déconnecté"));

  socket.on("scores", (scores)=>{
    const arr = Object.values(scores).sort((a,b)=>b.score-a.score).slice(0,10);
    $("scores").innerHTML = arr.map((s,i)=> `${i+1}. ${s.name} — ${s.score} pts`).join("\n");
  });

  socket.on("question", (q)=>{
    log(`➡️ Question: ${q.text || "(image only)"} ${q.image ? "[image]" : ""}`);
    clearInterval(timerInt);
    left = Number(q.duration || 30);
    setTime(left);
    timerInt = setInterval(()=>{
      left--; setTime(left);
      if(left<=0){ clearInterval(timerInt); }
    }, 1000);
  });

  socket.on("reveal", (d)=>{
    log(`✅ Reveal: ${d.answer}`);
  });
};

$("loadRound").onclick = () => {
  if(!socket) return alert("Connecte d'abord");
  const round = $("roundName").value.trim();
  if(!round) return alert("Nom de manche requis");
  socket.emit("start-from-server", { room: roomCode, round });
  log(`📁 Round chargé: ${round}`);
};

$("nextServer").onclick = () => {
  if(!socket) return alert("Connecte d'abord");
  socket.emit("next-from-server", { room: roomCode });
  log("➡️ Question suivante");
};

$("reveal").onclick = () => {
  if(!socket) return alert("Connecte d'abord");
  socket.emit("reveal", { room: roomCode });
  log("🎬 Reveal demandé");
};

$("start").onclick = ()=>{
  if(!socket) return alert("Connecte d'abord");
  const payload = {
    room: roomCode,
    type: $("qType").value,
    text: $("qText").value,
    image: $("qImg").value,
    choices: [$("cA").value, $("cB").value, $("cC").value, $("cD").value].filter(Boolean),
    answer: $("qAns").value,
    points: Number($("qPts").value||10),
    duration: Number($("qDur").value||30),
  };
  socket.emit("start-question", payload);
  log("📝 Question manuelle envoyée");
};
