import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ── IBM colorblind-friendly palette (same as profile.js) ────

const IBM_COLORS = ["#648FFF","#785EF0","#DC267F","#FE6100","#FFB000"];

function getAvatarColor(initial) {
  return IBM_COLORS[initial.charCodeAt(0) % IBM_COLORS.length];
}

// ── State ────────────────────────────────────────────────────

let allUsers = [];       // all user docs from Firestore
let currentUid = null;   // logged in user's uid
let currentTab = "challenges";

// ── Load data ────────────────────────────────────────────────

async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  allUsers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
  renderTable(currentTab);
}

// ── Auth state ───────────────────────────────────────────────

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUid = user.uid;
  } else {
    currentUid = null;
    document.getElementById("loginNotice").style.display = "block";
  }
  loadUsers();
});

// ── Tab switching ────────────────────────────────────────────

window.switchTab = function(tab, btnEl) {
  currentTab = tab;

  // Update tab styles
  document.querySelectorAll(".stat-tab").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");

  // Update column header
  const headers = { challenges: "Challenges", accuracy: "Accuracy %", time: "Hours Played" };
  document.getElementById("statColHeader").textContent = headers[tab];

  renderTable(tab);
};

// ── Render ───────────────────────────────────────────────────

function renderTable(tab) {
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("leaderboardWrap").style.display = "block";

  // Sort descending by the chosen stat
  const sorted = [...allUsers].sort((a, b) => {
    return getStatValue(b, tab) - getStatValue(a, tab);
  });

  const top50 = sorted.slice(0, 50);
  const currentUserRank = sorted.findIndex(u => u.uid === currentUid) + 1; // 1-indexed
  const currentUserData = sorted.find(u => u.uid === currentUid);
  const currentUserInTop50 = currentUserRank > 0 && currentUserRank <= 50;

  const tbody = document.getElementById("leaderboardBody");
  tbody.innerHTML = "";

  // Render top 50
  top50.forEach((user, i) => {
    const rank = i + 1;
    const isCurrentUser = user.uid === currentUid;
    tbody.appendChild(buildRow(rank, user, tab, isCurrentUser));
  });

  // If logged in user is outside top 50, show them at the bottom
  if (currentUid && currentUserData && !currentUserInTop50) {
    // Divider
    const dividerRow = document.createElement("tr");
    dividerRow.classList.add("lb-divider");
    dividerRow.innerHTML = `<td colspan="3">· · · YOUR RANKING · · ·</td>`;
    tbody.appendChild(dividerRow);

    tbody.appendChild(buildRow(currentUserRank, currentUserData, tab, true));
  }
}

// ── Build a single table row ─────────────────────────────────

function buildRow(rank, user, tab, isCurrentUser) {
  const tr = document.createElement("tr");
  if (isCurrentUser) tr.classList.add("is-current-user");

  const name = user.displayName || "User";
  const initial = name.charAt(0).toUpperCase();
  const avatarColor = getAvatarColor(initial);
  const statVal = formatStat(getStatValue(user, tab), tab);

  let rankDisplay = `#${rank}`;
if (rank === 1) rankDisplay = `<span class="rank-1" style="display:inline-flex;align-items:center;gap:4px;"><span class="material-icons" style="font-size:18px;">emoji_events</span>1</span>`;
else if (rank === 2) rankDisplay = `<span class="rank-2" style="display:inline-flex;align-items:center;gap:4px;"><span class="material-icons" style="font-size:18px;">emoji_events</span>2</span>`;
else if (rank === 3) rankDisplay = `<span class="rank-3" style="display:inline-flex;align-items:center;gap:4px;"><span class="material-icons" style="font-size:18px;">emoji_events</span>3</span>`;

  const youBadge = isCurrentUser ? `<span class="you-badge">YOU</span>` : "";

  tr.innerHTML = `
    <td class="rank-col">${rankDisplay}</td>
    <td>
      <div class="user-cell">
        <div class="table-avatar" style="background:${avatarColor};">${initial}</div>
        <span>${name}</span>
        ${youBadge}
      </div>
    </td>
    <td class="stat-val-col">${statVal}</td>
  `;

  return tr;
}

// ── Helpers ──────────────────────────────────────────────────

function getStatValue(user, tab) {
  const allTime = user.allTime || {};
  if (tab === "challenges") return allTime.challengesCompleted || 0;
  if (tab === "accuracy")   return allTime.accuracy || 0;
  if (tab === "time")       return allTime.totalTimeSpent || 0;
  return 0;
}

function formatStat(value, tab) {
  if (tab === "accuracy") return value + "%";
  if (tab === "time") {
    const hours = (value / 3600).toFixed(1);
    return hours + "h";
  }
  return value;
}