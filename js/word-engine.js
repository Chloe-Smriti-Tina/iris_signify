// ============================================================
//  word-engine.js  –  ASL Word Detection
//  Uses MediaPipe Handpose + Fingerpose (loads from CDN)
// ============================================================

function makeHelloGesture() {
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
const WORD_TIPS = {
    'Hello': 'Think of it like a casual salute — fingers up, palm forward.',
    'Thank You': 'Like blowing a kiss forward from your chin.',
    'I Love You': 'Combine I, L, and Y handshapes into one!',
    'Yes': 'A confident thumbs up — keep your fist firm.',
    'No': 'Classic peace sign — V for victory!',
};
const WORD_XP = {
    'Hello': 100,
    'Thank You': 100,
    'I Love You': 100,
    'Yes': 100,
    'No': 100,
};
const WORDS = ['Hello', 'Thank You', 'I Love You', 'Yes', 'No'];
const MATCH_NEEDED = 15;

// ── DOM refs ──────────────────────────────────────────────────
const video = document.getElementById('webcam_words');
const canvas = document.getElementById('output_canvas_words');
const ctx = canvas.getContext('2d');
const enableBtn = document.getElementById('enableWebcamButtonWords');
const progressBar = document.getElementById('accuracy-bar-words');
const holdLabel = document.getElementById('holdLabel');
const detectedEl = document.getElementById('detectedLabelWords');
const confidenceEl = document.getElementById('confidenceLabelWords');
const progFill = document.getElementById('progFill');
const progressCount = document.getElementById('progressCount');

// Hero card elements
const wordHighlight = document.getElementById('wordHighlight');
const wordDesc = document.getElementById('wordDesc');
const wordTip = document.getElementById('wordTip');

// Sidebar
const sbXp = document.getElementById('sb-xp');
const sbDone = document.getElementById('sb-done');
const wordListEl = document.getElementById('wordList');

// Success overlay
const successOverlay = document.getElementById('successOverlay');
const successTitle = document.getElementById('successTitle');
const successSub = document.getElementById('successSub');
const nextWordBtn = document.getElementById('nextWordBtn');

// Camera overlay
const camOverlay = document.getElementById('camOverlay');

let handposeModel = null;
let gestureEstimator = null;
let streaming = false;
let currentWordIdx = 0;
let currentWord = WORDS[0];
let matchFrames = 0;
let totalXP = 0;
let wordsCompleted = 0;

// ── Build sidebar word list ───────────────────────────────────
function buildWordList() {
    wordListEl.innerHTML = '';
    const emojis = ['👋', '🙏', '❤️', '👍', '✌️'];
    WORDS.forEach((word, i) => {
        const div = document.createElement('div');
        div.className = 'word-item' + (i === currentWordIdx ? ' active' : i < currentWordIdx ? ' done' : '');
        div.id = `wi-${i}`;
        div.innerHTML = `
            <div class="wi-icon">${emojis[i]}</div>
            <span>${word}</span>
            <i class="bi bi-check-circle-fill wi-check"></i>
        `;
        wordListEl.appendChild(div);
    });
}

function updateWordList() {
    WORDS.forEach((_, i) => {
        const el = document.getElementById(`wi-${i}`);
        if (!el) return;
        el.className = 'word-item' + (i === currentWordIdx ? ' active' : i < currentWordIdx ? ' done' : '');
    });
}

function updateOverallProgress() {
    const pct = Math.round((wordsCompleted / WORDS.length) * 100);
    progFill.style.width = `${pct}%`;
    progressCount.textContent = `${wordsCompleted} / ${WORDS.length}`;
    sbDone.textContent = `${wordsCompleted}/${WORDS.length}`;
}

// ── Load ──────────────────────────────────────────────────────
async function loadModels() {
    enableBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading Model…';
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
        enableBtn.innerHTML = '<i class="bi bi-camera-video"></i> Enable Camera';
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
            camOverlay.style.display = 'none';
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
    [0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [0, 9, 10, 11, 12], [0, 13, 14, 15, 16], [0, 17, 18, 19, 20],
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
        const est = gestureEstimator.estimate(predictions[0].landmarks, 4.0);

        if (est.gestures.length > 0) {
            const sorted = [...est.gestures].sort((a, b) => b.score - a.score);
            const best = sorted[0];
            const label = best.name;
            const pct = Math.min(100, Math.round((best.score / 8.0) * 100));
            const isMatch = label === currentWord;



            detectedEl.textContent = label;
            confidenceEl.textContent = `${pct}%`;
            progressBar.style.width = `${pct}%`;
            progressBar.className = `hold-fill${isMatch ? ' success' : ''}`;

            if (isMatch) {
                matchFrames++;
                const holdPct = Math.round((matchFrames / MATCH_NEEDED) * 100);
                holdLabel.textContent = matchFrames >= MATCH_NEEDED ? '✓ Perfect!' : `Hold… ${holdPct}%`;
                if (matchFrames >= MATCH_NEEDED) {
                    advanceWord();
                    matchFrames = 0;
                }
            } else {
                matchFrames = Math.max(0, matchFrames - 1);
                holdLabel.textContent = 'Make the sign!';
            }
        } else {

            detectedEl.textContent = '🤔 Keep trying';
            confidenceEl.textContent = '—';
            progressBar.style.width = '5%';
            progressBar.className = 'hold-fill';
            holdLabel.textContent = 'Hand detected…';
            matchFrames = Math.max(0, matchFrames - 1);
        }
    } else {
        detectedEl.textContent = '—';
        confidenceEl.textContent = '—';
        progressBar.style.width = '0%';
        progressBar.className = 'hold-fill';
        holdLabel.textContent = 'Make the sign!';
        matchFrames = 0;
    }

    requestAnimationFrame(detectLoop);
}

// ── Advance word ──────────────────────────────────────────────
function advanceWord() {
    streaming = false;
    matchFrames = 0;

    // Update XP + completed count
    const xpEarned = WORD_XP[currentWord] || 100;
    totalXP += xpEarned;
    wordsCompleted++;
    sbXp.textContent = totalXP;
    updateOverallProgress();
    updateWordList();

    const isLast = currentWordIdx >= WORDS.length - 1;

    // Show success overlay
    successTitle.textContent = `Nice work! "${currentWord}" ✓`;
    document.querySelector('.success-card .xp-tag').textContent = `+${xpEarned} XP`;
    successSub.textContent = isLast
        ? '🎉 You\'ve completed all Stage 1 words!'
        : `Up next: "${WORDS[currentWordIdx + 1]}"`;
    nextWordBtn.textContent = isLast ? 'Finish Stage →' : 'Next Word →';
    successOverlay.classList.add('visible');

    // Confetti!
    if (typeof confetti === 'function') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
}

// ── Next word button ──────────────────────────────────────────
nextWordBtn.addEventListener('click', () => {
    successOverlay.classList.remove('visible');

    const isLast = currentWordIdx >= WORDS.length - 1;
    if (isLast) {
        // All done — redirect to stages page
        window.location.href = 'learn-word.html';
        return;
    }

    currentWordIdx++;
    currentWord = WORDS[currentWordIdx];

    // Update hero card
    wordHighlight.textContent = `"${currentWord}"`;
    wordDesc.textContent = WORD_INSTRUCTIONS[currentWord];
    wordTip.innerHTML = `<i class="bi bi-lightbulb"></i> ${WORD_TIPS[currentWord]}`;

    // Reset hold bar
    progressBar.style.width = '0%';
    progressBar.className = 'hold-fill';
    holdLabel.textContent = 'Make the sign!';
    detectedEl.textContent = '—';
    confidenceEl.textContent = '—';

    updateWordList();

    streaming = true;
    detectLoop();
});

// ── Button ────────────────────────────────────────────────────
enableBtn.addEventListener('click', async () => {
    if (!handposeModel) { alert('Still loading, please wait.'); return; }
    enableBtn.disabled = true;
    enableBtn.innerHTML = '<i class="bi bi-camera-video-fill"></i> Camera active';
    await startWebcam();
});

// ── Init ──────────────────────────────────────────────────────
buildWordList();
updateOverallProgress();
loadModels();