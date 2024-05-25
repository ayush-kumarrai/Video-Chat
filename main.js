const startButton = document.getElementById('startButton');

startButton.addEventListener('click', startChat);

let localStream;
let peerConnection;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

async function startChat() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate) {
                // Send the candidate to the remote peer
                signalingServer.send(JSON.stringify({ 'new-ice-candidate': event.candidate }));
            }
        });

        peerConnection.addEventListener('track', event => {
            const remoteAudio = new Audio();
            remoteAudio.srcObject = event.streams[0];
            remoteAudio.play();
        });

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        signalingServer.send(JSON.stringify({ 'sdp': peerConnection.localDescription }));
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

// Signaling Server Connection
const signalingServer = new WebSocket('https://video-chat-dz15.onrender.com');
signalingServer.onmessage = async message => {
    const data = JSON.parse(message.data);

    if (data.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

        if (data.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            signalingServer.send(JSON.stringify({ 'sdp': peerConnection.localDescription }));
        }
    } else if (data['new-ice-candidate']) {
        try {
            await peerConnection.addIceCandidate(data['new-ice-candidate']);
        } catch (e) {
            console.error('Error adding received ICE candidate', e);
        }
    }
};
