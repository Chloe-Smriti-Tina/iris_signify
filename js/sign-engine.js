import {
    GestureRecognizer,
    FilesetResolver,
    DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// ============================================================================
// 1. DOM ELEMENTS & STATE
// ============================================================================
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const enableWebcamButton = document.getElementById("enableWebcamButton");
const accuracyBar = document.getElementById("accuracy-bar");

let gestureRecognizer;
let runningMode = "VIDEO";
let webcamRunning = false;
let lastVideoTime = -1;

// ============================================================================
// 2. INITIALIZE MEDIAPIPE 
// ============================================================================
const createGestureRecognizer = async () => {
    // 1. Load the WebAssembly backend for MediaPipe
    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    
    // 2. Create the Recognizer
    // PERSON A: Right now, this uses Google's default gesture model (Thumbs Up, Open Palm, etc.)
    // Once you train your ASL model, replace the modelAssetPath with: "models/classroom_gestures.task"
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU" // Uses the device's GPU for faster processing!
        },
        runningMode: runningMode,
        numHands: 2 // Detect both hands if needed
    });

    // Enable the button only AFTER the model has finished loading
    enableWebcamButton.innerText = "Enable Camera";
    enableWebcamButton.classList.remove("disabled");
    enableWebcamButton.addEventListener("click", enableCam);
};

// Start the loading process immediately
enableWebcamButton.innerText = "Loading AI Engine...";
enableWebcamButton.classList.add("disabled");
createGestureRecognizer();

// ============================================================================
// 3. WEBCAM LOGIC
// ============================================================================
function enableCam(event) {
    if (!gestureRecognizer) {
        alert("Please wait for the AI model to load.");
        return;
    }

    if (webcamRunning === true) {
        // --- TURN OFF THE CAMERA ---
        webcamRunning = false;
        enableWebcamButton.innerText = "Enable Camera";

        // 1. Grab the active stream from the video element
        const stream = video.srcObject;
        if (stream) {
            // 2. Loop through all media tracks (video/audio) and stop them
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        // 3. Disconnect the stream from the video element
        video.srcObject = null;
        
        // 4. Clear the drawing canvas so the skeleton disappears
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    } else {
        // --- TURN ON THE CAMERA ---
        webcamRunning = true;
        enableWebcamButton.innerText = "Disable Camera";

        // Request access to the webcam
        const constraints = { video: true };
        navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
        });
    }
}

// ============================================================================
// 4. THE MAIN GAME LOOP 
// ============================================================================
async function predictWebcam() {
    const webcamElement = document.getElementById("webcam");
    
    // Ensure the canvas matches the video dimensions exactly
    canvasElement.style.width = video.videoWidth;;
    canvasElement.style.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;

    // Run the gesture recognizer if the video frame has updated
    let startTimeMs = performance.now();
    let results;
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = gestureRecognizer.recognizeForVideo(video, startTimeMs);
    }

    // Clear the previous frame's drawings
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    const drawingUtils = new DrawingUtils(canvasCtx);

    // If hands are detected...
    if (results && results.landmarks) {
        for (const landmarks of results.landmarks) {
            // Draw the skeleton (This creates the cool "hacker/tech" vibe for judges)
            drawingUtils.drawConnectors(
                landmarks,
                GestureRecognizer.HAND_CONNECTIONS,
                { color: "#5371e0", lineWidth: 5 } // Matches your Signify blue!
            );
            drawingUtils.drawLandmarks(landmarks, {
                color: "#ffffff",
                lineWidth: 2
            });
        }
    }

    // ========================================================================
    // UPDATE THE UI 
    // ========================================================================
    if (results && results.gestures.length > 0) {
        // Grab the best guess from the AI (e.g., "Closed_Fist", "Open_Palm")
        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(0);

        // --- GAME LOGIC ---
        // Let's say the target letter is "A" (which looks like a Closed Fist in the default model)
        const targetGesture = "Closed_Fist"; // Person B: You will dynamically change this later based on the lesson!

        if (categoryName === targetGesture) {
            // Success! Update the progress bar
            accuracyBar.style.width = `${categoryScore}%`;
            accuracyBar.innerText = `${categoryScore}% Match`;
            accuracyBar.classList.replace("bg-danger", "bg-success");
            
            // Trigger confetti or a "Ding!" sound here if score > 80!
        } else {
            // Wrong sign
            accuracyBar.style.width = `10%`;
            accuracyBar.innerText = `Keep Trying... (Detected: ${categoryName})`;
            accuracyBar.classList.replace("bg-success", "bg-danger");
        }
    } else {
        // No hands detected
        accuracyBar.style.width = `0%`;
        accuracyBar.innerText = `Waiting for hands...`;
        accuracyBar.classList.replace("bg-success", "bg-danger");
    }

    canvasCtx.restore();

    // Keep the loop running as long as the webcam is on
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}