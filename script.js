// Utility function to simplify document.getElementById
const $ = id => document.getElementById(id);

// Function to show the Connected Viewers and QR Code
function showConnectedViewers(viewersCount) {
    $('connectedViewers').textContent = viewersCount;
}

// Function to generate QR Code
function generateQrCode(url) {
    // Clear QR container
    $('qrBox').innerHTML = '<div id="qrContainer"></div>';

    // Generate QR code using the QRCode.js library
    new QRCode("qrContainer", {
        text: url,
        width: 256,
        height: 256,
        colorDark: "#ffffff",
        colorLight: "#000000",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Initialize WebSocket connection to server
let socket = null;

function initWebSocket() {
    const serverUrl = $('serverUrl').value.trim();

    if (!serverUrl) {
        alert("Veuillez entrer l’URL du serveur !");
        return;
    }

    // Close any existing connection
    if (socket) {
        socket.close();
    }

    socket = new WebSocket(serverUrl);

    socket.onopen = () => {
        console.log("✅ Connecté au serveur");
        $('status').textContent = "✅ Connecté au serveur";
        $('status').style.color = "#00ff00";

        // Send host ready signal
        socket.send(JSON.stringify({ type: "host_ready" }));
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
            console.log("Message:", data.message);
        }
    };

    socket.onerror = () => {
        $('status').textContent = "❌ Erreur de connexion";
        $('status').style.color = "#ff5555";
    };

    socket.onclose = () => {
        $('status').textContent = "🔌 Déconnecté";
        $('status').style.color = "#ffaa00";
    };
}

// Send action (next question, show leaderboard, etc.)
function sendAction(action) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        alert("Vous n’êtes pas connecté au serveur !");
        return;
    }

    socket.send(JSON.stringify({ type: "action", action }));
}

// Load JSON questions into server
function uploadQuestions() {
    const fileInput = $('questionsFile');
    const file = fileInput.files[0];

    if (!file) {
        alert("Veuillez sélectionner un fichier questions.json !");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const json = JSON.parse(e.target.result);

            socket.send(JSON.stringify({
                type: "upload_questions",
                questions: json.questions || []
            }));

            alert("✅ Questions envoyées au serveur !");
        } catch (err) {
            alert("❌ Erreur dans le fichier JSON");
            console.error(err);
        }
    };

    reader.readAsText(file);
}
