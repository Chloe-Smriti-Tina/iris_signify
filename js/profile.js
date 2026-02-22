import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const IBM_COLORS = ["#648FFF","#785EF0","#DC267F","rgb(254, 97, 0)","#FFB000"];
function getAvatarColor(initial) {
  return IBM_COLORS[initial.charCodeAt(0) % IBM_COLORS.length];
}

onAuthStateChanged(auth, async (user) => {
  document.getElementById("loadingState").style.display = "none";
  if (!user) {
    document.getElementById("notLoggedIn").style.display = "block";
    return;
  }

  document.getElementById("notLoggedIn").style.display = "none";
  document.getElementById("profileContent").style.display = "block";

  // Fetch user doc, all badges, and earned badges in parallel
  const [snap, allBadgesSnap, earnedSnap] = await Promise.all([
    getDoc(doc(db, "users", user.uid)),
    getDocs(collection(db, "badges")),
    getDocs(collection(db, "users", user.uid, "badges"))
  ]);

  if (!snap.exists()) return;
  const data = snap.data();

  // ── Name & email ──
  const displayName = data.displayName || "User";
  document.getElementById("profileName").textContent = displayName;
  document.getElementById("profileEmail").textContent = data.email || user.email;

  // ── Avatar ──
  const initial = displayName.charAt(0).toUpperCase();
  const avatarEl = document.getElementById("avatarCircle");
  avatarEl.textContent = initial;
  avatarEl.style.background = getAvatarColor(initial);

  // ── Joined date ──
  if (data.createdAt) {
    const date = data.createdAt.toDate();
    document.getElementById("profileJoined").textContent =
      "Joined " + date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // ── Stats ──
  const allTime = data.allTime || {};
  const currentStreak = data.currentStreak || {};
  document.getElementById("statTime").textContent = Math.floor((allTime.totalTimeSpent || 0) / 3600);
  document.getElementById("statChallenges").textContent = allTime.challengesCompleted || 0;
  document.getElementById("statAccuracy").textContent = (allTime.accuracy || 0) + "%";
  document.getElementById("statCurrentStreak").textContent = currentStreak.count || 0;
  document.getElementById("statLongestStreak").textContent = allTime.longestStreak || 0;

  // ── Badges ──
  const allBadges = allBadgesSnap.docs.map(d => d.data());
  const earnedIds = earnedSnap.docs.map(d => d.data().id);
  document.getElementById("statNumBadges").textContent = earnedIds.length;

  if (window.renderBadgePanels) {
    window.renderBadgePanels(allBadges, earnedIds, allTime);
  }
});