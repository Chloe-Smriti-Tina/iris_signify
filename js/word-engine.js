// ============================================================
//  word-engine.js  –  ASL Word Detection
//  Uses MediaPipe Handpose + Fingerpose (loads from CDN)
//  NO model files needed — everything loads automatically!
// ============================================================

// ── Gesture Definitions ──────────────────────────────────────

function makeHelloGesture() {
    // Open hand, all fingers extended
    const hello = new fp.GestureDescription('Hello');
    for (const finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        hello.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
    }
    hello.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 0.9);
    hello.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 0.9);
    return hello;
}

function makeThankYouGesture() {
    // Flat hand angled diagonally, all fingers extended
    const thankYou = new fp.GestureDescription('Thank You');
    for (const finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        thankYou.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
    }
    thankYou.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 1.0);
    thankYou.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.9);
    thankYou.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 1.0);
    thankYou.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 0.9);
    return thankYou;
}

function makeILoveYouGesture() {
    // Thumb + index + pinky extended, middle + ring curled
    const ily = new fp.GestureDescription('I Love You');
    ily.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    ily.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    ily.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
    ily.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 0.7);
    ily.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    ily.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.7);
    ily.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
    ily.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    ily.addDirection(fp.Finger.Pinky, fp.FingerDirection.VerticalUp, 1.0);
    return ily;
}

function makeYesGesture() {
    // Thumbs up — fist with thumb pointing up
    const yes = new fp.GestureDescription('Yes');
    yes.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    yes.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
    yes.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
    yes.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    yes.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
    yes.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
    yes.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft, 0.8);
    yes.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 0.8);
    return yes;
}

function makeNoGesture() {
    // Index + middle extended (peace/scissors), others curled
    const no = new fp.GestureDescription('No');
    no.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.8);
    no.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.6);
    no.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    no.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
    no.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    no.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.7);
    no.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
    no.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.7);
    no.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    no.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
    return no;
}

function makePleaseGesture() {
    const please = new fp.GestureDescription('Please');
    please.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    please.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    please.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
    please.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
    please.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
    please.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 1.0);
    please.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 0.9);
    return please;
}

// ── Config ────────────────────────────────────────────────────
const WORD_INSTRUCTIONS = {
    'Hello': 'Open your hand flat and face your palm outward — all five fingers extended.',
    'Thank You': 'Touch your chin with flat fingers, then move your hand forward/outward.',
    'I Love You': 'Extend your thumb, index finger, and pinky — keep middle and ring fingers folded.',
    'Yes': 'Make a thumbs up — fist closed with thumb pointing straight up.',
    'No': 'Extend your index and middle fingers like a peace sign, others curled.',
    'Please': 'Flat open hand, rub palm in a circular motion on your chest.',
};
const WORDS = ['Hello', 'Thank You', 'I Love You', 'Yes', 'No', 'Please'];
const MIN_SCORE = 5.0;  // gesture confidence threshold out of 10
const MATCH_NEEDED = 20;   // consecutive matching frames before advancing

// ── DOM refs ──────────────────────────────────────────────────
const video = document.getElementById('webcam_words');
const canvas = document.getElementById('output_canvas_words');
const ctx = canvas.getContext('2d');
const enableBtn = document.getElementById('enableWebcamButtonWords');
const progressBar = document.getElementById('accuracy-bar-words');
const targetWordEl = document.getElementById('target-word');
const instructEl = document.getElementById('word-instruction');
const detectedEl = document.getElementById('detectedLabelWords');
const confidenceEl = document.getElementById('confidenceLabelWords');

let handposeModel = null;
let gestureEstimator = null;
let streaming = false;
let currentWord = 'Hello';
let matchFrames = 0;

// ── Load ──────────────────────────────────────────────────────
async function loadModels() {
    enableBtn.textContent = '⏳ Loading hand model…';
    enableBtn.disabled = true;
    try {
        handposeModel = await handpose.load();
        gestureEstimator = new fp.GestureEstimator([
            makeHelloGesture(),
            makeThankYouGesture(),
            makeILoveYouGesture(),
            makeYesGesture(),
            makeNoGesture(),
            makePleaseGesture(),
        ]);
        console.log('[word-engine] Ready ✓');
        enableBtn.textContent = '🎥 Enable Camera (Words)';
        enableBtn.disabled = false;
    } catch (err) {
        console.error('[word-engine] Load error:', err);
        enableBtn.textContent = '❌ Load failed – check console';
    }
}

// ── Webcam ────────────────────────────────────────────────────
async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
        });
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            streaming = true;
            detectLoop();
        });
    } catch (err) {
        console.error('[word-engine] Webcam error:', err);
        alert('Could not access webcam. Please allow camera permissions.');
    }
}

// ── Draw skeleton ─────────────────────────────────────────────
const FINGER_PATHS = [
    [0, 1, 2, 3, 4],    // thumb
    [0, 5, 6, 7, 8],    // index
    [0, 9, 10, 11, 12], // middle
    [0, 13, 14, 15, 16],// ring
    [0, 17, 18, 19, 20],// pinky
];

function drawHand(predictions, color) {
    if (!predictions.length) return;
    const lm = predictions[0].landmarks;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    for (const path of FINGER_PATHS) {
        ctx.beginPath();
        ctx.moveTo(lm[path[0]][0], lm[path[0]][1]);
        for (let i = 1; i < path.length; i++) ctx.lineTo(lm[path[i]][0], lm[path[i]][1]);
        ctx.stroke();
    }
    for (const [x, y] of lm) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ── Detection loop ────────────────────────────────────────────
async function detectLoop() {
    if (!streaming) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const predictions = await handposeModel.estimateHands(video);

    if (predictions.length > 0) {
        const est = gestureEstimator.estimate(predictions[0].landmarks, MIN_SCORE);

        if (est.gestures.length > 0) {
            const best = est.gestures.reduce((a, b) => a.score > b.score ? a : b);
            const label = best.name;
            const pct = Math.min(100, Math.round((best.score / 7.0) * 100));
            const isMatch = label === currentWord;

            drawHand(predictions, isMatch ? '#22c55e' : '#6d8bfa');

            detectedEl.textContent = label;
            confidenceEl.textContent = `${pct}%`;
            progressBar.style.width = `${pct}%`;
            progressBar.setAttribute('aria-valuenow', pct);
            progressBar.textContent = `${pct}% Match`;
            progressBar.className = `progress-bar progress-bar-striped progress-bar-animated ${isMatch ? 'bg-success' : 'bg-warning'}`;

            if (isMatch) {
                matchFrames++;
                console.log('Match frames:', matchFrames, '/', MATCH_NEEDED);
                if (matchFrames >= MATCH_NEEDED) {
                    advanceWord();
                    matchFrames = 0;
                }
            } else {
                matchFrames = Math.max(0, matchFrames - 1); // forgives brief dips
            }

        } else {
            drawHand(predictions, '#6d8bfa');
            detectedEl.textContent = '🤔 Keep trying';
            confidenceEl.textContent = '—';
            progressBar.style.width = '5%';
            progressBar.textContent = 'Hand detected…';
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-info';
            matchFrames = 0;
        }
    } else {
        detectedEl.textContent = '—';
        confidenceEl.textContent = '—';
        progressBar.style.width = '0%';
        progressBar.textContent = '0% Match';
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
        matchFrames = 0;
    }

    requestAnimationFrame(detectLoop);
}

// ── Advance word ──────────────────────────────────────────────
function advanceWord() {
    const idx = WORDS.indexOf(currentWord);
    currentWord = WORDS[(idx + 1) % WORDS.length];
    targetWordEl.textContent = `"${currentWord}"`;
    instructEl.textContent = WORD_INSTRUCTIONS[currentWord];
    progressBar.style.width = '100%';
    progressBar.textContent = '✓ Great job! Next word…';
    progressBar.className = 'progress-bar bg-success';
    setTimeout(() => {
        progressBar.style.width = '0%';
        progressBar.textContent = '0% Match';
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
    }, 1200);
}

// ── Button ────────────────────────────────────────────────────
enableBtn.addEventListener('click', async () => {
    if (!handposeModel) { alert('Still loading, please wait.'); return; }
    enableBtn.disabled = true;
    enableBtn.textContent = '📷 Camera active';
    await startWebcam();
});

loadModels();