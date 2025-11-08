// ===== Utils =====
const $ = id => document.getElementById(id);

// ✅ URL Socket.IO du serveur (Render)
const IO_URL = "https://quizcine-server-1.onrender.com";

let socket = null;
let room = "CINE"; // mets ton code par défaut si tu veux

// ----- QR Code vers le PLAYER -----
function generateQrCode(url) {
  $('qrBox').innerHTML = '<div id="qrContainer"></div>';
  new QRCode("qrContainer", {
    text: url,
    width: 256,
    height: 256,
    colorDark: "#ffffff",
    colorLight: "#000000",
    correctLevel: QRCode.CorrectLevel.H
  });
}

function log(msg) {
  const el = $('log'); if (!el) return;
  el.textContent += msg + "\n";
  el.scrollTop = el.scrollHeight;
}

function renderScores(scores){
  const box = $('scores'); if(!box) return;
  box.innerHTML = "";
  Object.values(scores)
    .sort((a,b)=>b.score-a.score)
    .slice(0,10)
    .forEach((p,i)=>{
      const d = document.createElement('div');
      d.className = 'line';
      d.innerHTML = `<div>${i+1}. <b>${p.name}</b></div><div>${p.score} pts</div>`;
      box.appendChild(d);
    });
}

// ===== Connexion Socket.IO =====
function connectIO(){
  // IMPORTANT: Socket.IO client, pas WebSocket natif
  socket = io(IO_URL, {
    transports: ["websocket"],   // évite long-polling
    path: "/socket.io"           // path par défaut côté server
  });

  $('status').textContent = "Connexion...";
  $('status').style.color = "#ffaa00";

  socket.on("connect", () => {
    $('status').textContent = "✅ Connecté";
    $('status').style.color = "#00ff00";
    log("Connecté à Socket.IO");
    // Le host se joint aussi à la salle pour recevoir infos
    socket.emit("host-join", { room });
  });

  socket.on("disconnect", () => {
    $('status').textContent = "🔌 Déconnecté (reconnexion auto)";
    $('status').style.color = "#ffaa00";
    log("Déconnecté");
  });

  // Événements du serveur (conformes à ton index.js)
  socket.on("room-info", (info)=> {
    renderScores(info?.scores || {});
  });
  socket.on("player-joined", (p)=> log(`👤 ${p.name} a rejoint`));
  socket.on("answer-received", (p)=> log(`✍️ ${p.name} → ${p.answer}`));
  socket.on("scores", (s)=> renderScores(s));
  socket.on("server-round-loaded", (d)=> log(`📂 Manche chargée (${d.count} questions)`));
}

// ===== Actions Host =====
function loadRound(){
  const rn = ($('roundName')?.value || "").trim();
  if(!rn){ alert("Nom de manche requis"); return; }
  room = ($('room')?.value || "CINE").trim().toUpperCase();
  socket.emit("host-join", { room });
  socket.emit("start-from-server", { room, round: rn });
  log(`Demande de chargement de la manche "${rn}"`);
}

function nextFromServer(){
  socket.emit("next-from-server", { room });
  log("➡️ Question suivante (serveur)");
}

function revealNow(){
  socket.emit("reveal", { room });
  log("🎬 Révéler & compter");
}

function startManual(){
  const type = $('qType').value;
  const q = {
    room,
    type,
    text: $('qText').value.trim(),
    image: $('qImg').value.trim(),
    choices: type==='mcq' ? [
      $('cA').value, $('cB').value, $('cC').value, $('cD').value
    ] : [],
    answer: $('qAns').value.trim(),
    points: parseInt($('qPts').value||'10',10),
    duration: parseInt($('qDur').value||'30',10),
    allowChange: true
  };
  if(!q.text || !q.answer){ alert("Texte + bonne réponse requis"); return; }
  socket.emit("start-question", q);
  log("▶️ Question manuelle envoyée");
}

// ===== QR vers le Player =====
function makePlayerQR(){
  const playerBase = $('playerUrl')?.value?.trim() || "";
  if(!playerBase){ alert("URL du Player requise"); return; }
  const rn = ($('room')?.value || "CINE").trim().toUpperCase();
  const url = `${playerBase}?code=${encodeURIComponent(rn)}`;
  generateQrCode(url);
  log(`🔗 QR vers ${url}`);
}

// ===== Bind UI =====
window.addEventListener("load", ()=>{
  // Connexion auto
  connectIO();

  $('loadRound')?.addEventListener('click', loadRound);
  $('nextServer')?.addEventListener('click', nextFromServer);
  $('reveal')?.addEventListener('click', revealNow);
  $('start')?.addEventListener('click', startManual);
  $('qrBtn')?.addEventListener('click', makePlayerQR);
});
