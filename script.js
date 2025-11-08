// Utility function
const $ = id => document.getElementById(id);

// ✅ URL FIXE — AUTOMATIQUE
const FIXED_SERVER_URL = "wss://quizcine-server-1.onrender.com";

let socket = null;

// ----------------------------
// ✅ Generate QR Code
// ----------------------------
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

// ----------------------------
// ✅ Show Connected Users
// ----------------------------
function showConnectedViewers(count) {
    $('connectedViewers').textContent = count;
}

// ----------------------------
// ✅ AUTO-CONNECT to WebSocket
// ----------------------------
function initWebSocket() {

    const serverUrl = FIXED_SERVER_URL; // ✅ URL FIXE

    $('status').textContent = "Connexion...";
    $('status').style.color = "#ffaa00";

    socket = new WebSocket(serverUrl);

    socket.onopen = () => {
        console.log("✅ Connecté au serveur WebSocket");
        $('status').textContent = "✅ Connecté";
        $('status').style.color = "#00ff00";

        socket.send(JSON.stringify({ type: "host_ready" }));
    };

    socket.onerror = () => {
        $('status').textContent = "❌ Erreur WebSocket";
        $('status').style.color = "#ff5555";
    };

    socket.onclose = () => {
        $('status').textContent = "🔌 Déconnecté (retry dans 3s)";
        $('status').style.color = "#ffaa00";
        setTimeout(initWebSocket, 3000); // ✅ Reconnexion automatique
    };

    socket.onmessage = event => {
        const data = JSON.parse(event.data);

        if (data.type === "viewer_count") {
            showConnectedViewers(data.count);
        }

        if (data.type === "qr_url") {
            generateQrCode(data.url);
        }

        if (data.type === "message") {
            console.log("Message serveur:", data.message);
        }
    };
}

// ----------------------------
// ✅ Send Action to Server
// ----------------------------
function sendAction(action) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("❌ Serveur non connecté !");
        return;
    }

    socket.send(JSON.stringify({
        type: "action",
        action
    }));
}

// ----------------------------
// ✅ Upload JSON File
// ----------------------------
function uploadQuestions() {
    const fileInput = $('questionsFile');
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un questions.json");
        return;
    }

    const reader = new FileReader();

    reader.onload = e => {
        try {
            const json = JSON.parse(e.target.result);

            socket.send(JSON.stringify({
                type: "upload_questions",
                questions: json.questions || []
            }));

            alert("✅ Questions envoyées au serveur !");
        } catch (err) {
            alert("❌ JSON invalide");
            console.error(err);
        }
    };

    reader.readAsText(file);
}

// ----------------------------
// ✅ AUTO-START
// ----------------------------
window.addEventListener("load", initWebSocket);
