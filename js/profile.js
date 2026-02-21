import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCIm-UGhuGg9aNuK7nWdI2pZ6hLDFxxuis",
  authDomain: "signify-5ec23.firebaseapp.com",
  projectId: "signify-5ec23",
  storageBucket: "signify-5ec23.firebasestorage.app",
  messagingSenderId: "150947241043",
  appId: "1:150947241043:web:f2fbb25737e9b7a02c7aa6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── IBM colorblind-friendly palette ─────────────────────────
// Based on IBM's design guidance: https://www.ibm.com/design/language/color/

const IBM_COLORS = [
  "#648FFF", // blue
  "#785EF0", // purple
  "#DC267F", // magenta
  "#FE6100", // orange
  "#FFB000", // yellow
];

function getAvatarColor(initial) {
  const index = initial.charCodeAt(0) % IBM_COLORS.length;
  return IBM_COLORS[index];
}

// ── Auth state — load profile when user is known ─────────────

onAuthStateChanged(auth, async (user) => {
  document.getElementById("loadingState").style.display = "none";

  if (!user) {
    document.getElementById("notLoggedIn").style.display = "block";
    return;
  }

  // Hide not logged in, show content
  document.getElementById("notLoggedIn").style.display = "none";  

  document.getElementById("profileContent").style.display = "block";

  // Fetch Firestore document
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) return;

  const data = snap.data();

  // ── Display name & email ──
  const displayName = data.displayName || "User";
  document.getElementById("profileName").textContent = displayName;
  document.getElementById("profileEmail").textContent = data.email || user.email;

  // ── Avatar: first initial with IBM color ──
  const initial = displayName.charAt(0).toUpperCase();
  const avatarEl = document.getElementById("avatarCircle");
  avatarEl.textContent = initial;
  avatarEl.style.background = getAvatarColor(initial);

  // ── Joined date ──
  if (data.createdAt) {
    const date = data.createdAt.toDate();
    const formatted = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    document.getElementById("profileJoined").textContent = "Joined " + formatted;
  }

  // ── Stats ──
  const allTime = data.allTime || {};

  // totalTimeSpent is stored in seconds, show as hours
  const seconds = allTime.totalTimeSpent || 0;
  const hours = Math.floor(seconds / 60 / 60);
  document.getElementById("statTime").textContent = hours;

  document.getElementById("statChallenges").textContent = allTime.challengesCompleted || 0;

  const accuracy = allTime.accuracy || 0;
  document.getElementById("statAccuracy").textContent = accuracy + "%";
});