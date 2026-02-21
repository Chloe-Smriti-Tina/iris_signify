// ============================================================
//  word-engine.js  –  ASL Word Detection
//  Uses MediaPipe Handpose + Fingerpose (loads from CDN)
//  NO model files needed — everything loads automatically!
// ============================================================

// ── REQUIRED: Update your learn.html scripts section ─────────
// Replace your existing scripts at the bottom of <body> with:
//
//  <script src="https://unpkg.com/@tensorflow/tfjs-core@3.7.0/dist/tf-core.js"></script>
//  <script src="https://unpkg.com/@tensorflow/tfjs-converter@3.7.0/dist/tf-converter.js"></script>
//  <script src="https://unpkg.com/@tensorflow/tfjs-backend-webgl@3.7.0/dist/tf-backend-webgl.js"></script>
//  <script src="https://unpkg.com/@tensorflow-models/handpose@0.0.7/dist/handpose.js"></script>
//  <script src="https://cdn.jsdelivr.net/npm/fingerpose@0.1.0/dist/fingerpose.min.js"></script>
//  <script type="module" src="js/sign-engine.js"></script>
//  <script src="js/word-engine.js"></script>   ← NOT type="module"
//
// ─────────────────────────────────────────────────────────────

// ── Gesture Definitions ──────────────────────────────────────

function makeHelloGesture() {
    // Open hand, all fingers extended, pointing STRAIGHT UP
    const hello = new fp.GestureDescription('Thank You');
    for (const f of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        hello.addCurl(f, fp.FingerCurl.NoCurl, 1.0);
    }
    hello.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    hello.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
    hello.addDirection(fp.Finger.Ring, fp.FingerDirection.VerticalUp, 1.0);
    hello.addDirection(fp.Finger.Pinky, fp.FingerDirection.VerticalUp, 1.0);
    return hello;
}

function makeThankYouGesture() {
    // Flat hand, all fingers extended, pointing DIAGONALLY outward
    const thankYou = new fp.GestureDescription('Hello');
    for (const f of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        thankYou.addCurl(f, fp.FingerCurl.NoCurl, 1.0);
    }
    thankYou.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 1.0);
    thankYou.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 1.0);
    thankYou.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 1.0);
    thankYou.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 1.0);
    thankYou.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalUpLeft, 0.9);
    thankYou.addDirection(fp.Finger.Ring, fp.FingerDirection.DiagonalUpRight, 0.9);
    return thankYou;
}

function makeILoveYouGesture() {
    // Thumb + index + pinky extended, middle + ring fully curled
    const ily = new fp.GestureDescription('I Love You');
    ily.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    ily.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    ily.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
    ily.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    ily.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
    ily.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    ily.addDirection(fp.Finger.Pinky, fp.FingerDirection.VerticalUp, 1.0);
    return ily;
}

function makeYesGesture() {
    // Thumbs up — only thumb up, all others fully curled
    const yes = new fp.GestureDescription('Yes');
    yes.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    yes.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
    yes.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
    yes.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    yes.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
    yes.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp, 1.0);
    yes.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft, 0.7);
    yes.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 0.7);
    return yes;
}

function makeNoGesture() {
    // Peace sign — index + middle only, others curled
    const no = new fp.GestureDescription('No');
    no.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
    no.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);
    no.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
    no.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
    no.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
    no.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 0.5);
    no.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
    no.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.5);
    no.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    no.addDirection(fp.Finger.Middle, fp.FingerDirection.VerticalUp, 1.0);
    return no;
}

// ── Config ────────────────────────────────────────────────────
const WORD_INSTRUCTIONS = {
    'Hello': 'Raise your open hand, all five fingers pointing straight up like a salute.',
    'Thank You': 'Flat open hand, fingers angled outward/forward (not straight up).',
    'I Love You': 'Extend your thumb, index finger, and pinky — middle and ring fingers curled.',
    'Yes': 'Thumbs up — fist closed with only your thumb pointing straight up.',
    'No': 'Peace sign — index and middle fingers up, others curled.',
};
const WORDS = ['Hello', 'Thank You', 'I Love You', 'Yes', 'No'];
const MATCH_NEEDED = 15;

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
    [0, 1, 2, 3, 4],
    [0, 5, 6, 7, 8],
    [0, 9, 10, 11, 12],
    [0, 13, 14, 15, 16],
    [0, 17, 18, 19, 20],
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
        // Use low threshold (4.0) so we always get scores back, then evaluate them ourselves
        const est = gestureEstimator.estimate(predictions[0].landmarks, 4.0);

        if (est.gestures.length > 0) {
            const sorted = [...est.gestures].sort((a, b) => b.score - a.score);
            // Always log so we can see what's happening
            console.log(sorted.map(g => `${g.name}:${g.score.toFixed(1)}`).join(' | '), '→ target:', currentWord);

            const best = sorted[0];
            const label = best.name;
            const pct = Math.min(100, Math.round((best.score / 8.0) * 100));
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
                console.log(`✅ ${matchFrames}/${MATCH_NEEDED} frames matched`);
                if (matchFrames >= MATCH_NEEDED) {
                    advanceWord();
                    matchFrames = 0;
                }
            } else {
                matchFrames = Math.max(0, matchFrames - 1); // forgive brief dips
            }

        } else {
            drawHand(predictions, '#6d8bfa');
            console.log('No gesture matched at all');
            detectedEl.textContent = '🤔 Keep trying';
            confidenceEl.textContent = '—';
            progressBar.style.width = '5%';
            progressBar.textContent = 'Hand detected…';
            progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-info';
            matchFrames = Math.max(0, matchFrames - 1);
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
    const nextWord = WORDS[(WORDS.indexOf(currentWord) + 1) % WORDS.length];
    console.log('🎉 Advanced to:', nextWord);

    streaming = false;
    matchFrames = 0;

    progressBar.style.width = '100%';
    progressBar.textContent = '✓ Great job!';
    progressBar.className = 'progress-bar bg-success';

    setTimeout(() => {
        currentWord = nextWord;
        targetWordEl.textContent = `"${currentWord}"`;
        instructEl.textContent = WORD_INSTRUCTIONS[currentWord];
        progressBar.style.width = '0%';
        progressBar.textContent = '0% Match';
        progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
        streaming = true;
        detectLoop();
    }, 2000);
}

// ── Button ────────────────────────────────────────────────────
enableBtn.addEventListener('click', async () => {
    if (!handposeModel) { alert('Still loading, please wait.'); return; }
    enableBtn.disabled = true;
    enableBtn.textContent = '📷 Camera active';
    await startWebcam();
});

loadModels();