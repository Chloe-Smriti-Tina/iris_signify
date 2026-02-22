import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ── Inject modal + dropdown HTML ─────────────────────────────

document.body.insertAdjacentHTML("beforeend", `

  <!-- Auth Modal -->
  <div id="authModal" style="
    display:none;
    position:fixed;
    inset:0;
    z-index:9999;
    background:rgba(0,0,0,0.55);
    backdrop-filter:blur(4px);
    justify-content:center;
    align-items:center;
  ">
    <div style="
      background:#ffffff;
      border:1px solid rgba(255,255,255,0.1);
      border-radius:16px;
      padding:40px;
      width:100%;
      max-width:420px;
      position:relative;
      box-shadow:0 25px 60px rgba(0,0,0,0.5);
    ">
      <button id="authModalClose" style="
        position:absolute;top:16px;right:16px;
        background:none;border:none;color:#64748b;
        font-size:22px;cursor:pointer;line-height:1;
      ">✕</button>

      <!-- Tabs -->
      <div style="display:flex;margin-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.1);">
        <button id="tabSignIn" onclick="switchTab('signin')" style="
          flex:1;background:none;border:none;color:#fff;
          font-size:15px;font-weight:600;padding:10px;cursor:pointer;
          border-bottom:2px solid #648FFF;transition:all .2s;
        ">Sign In</button>
        <button id="tabSignUp" onclick="switchTab('signup')" style="
          flex:1;background:none;border:none;color:#64748b;
          font-size:15px;font-weight:600;padding:10px;cursor:pointer;
          border-bottom:2px solid transparent;transition:all .2s;
        ">Sign Up</button>
      </div>

      <!-- Sign In Form -->
      <div id="formSignIn">
        <h3 style="color:#0f172a;margin-bottom:24px;font-size:22px;">Welcome back</h3>
        <input id="siEmail" type="email" placeholder="Email address" style="
          width:100%;padding:13px 16px;margin-bottom:14px;
          background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:8px;color:#0f172a;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="siPassword" type="password" placeholder="Password" style="
          width:100%;padding:13px 16px;margin-bottom:20px;
          background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:8px;color:#0f172a;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <button onclick="handleSignIn()" style="
          width:100%;padding:14px;background:#648FFF;
          border:none;border-radius:8px;color:#fff;
          font-size:15px;font-weight:600;cursor:pointer;
        ">Sign In</button>
        <p id="siError" style="color:#ff6b6b;font-size:13px;margin-top:12px;display:none;"></p>
      </div>

      <!-- Sign Up Form -->
      <div id="formSignUp" style="display:none;">
        <h3 style="color:#0f172a;margin-bottom:24px;font-size:22px;">Create account</h3>
        <input id="suName" type="text" placeholder="Display name" style="
            width:100%;padding:13px 16px;margin-bottom:14px;
            background:#f8fafc;border:1px solid #e2e8f0;
            border-radius:8px;color:#0f172a;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="suEmail" type="email" placeholder="Email address" style="
          width:100%;padding:13px 16px;margin-bottom:14px;
          background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:8px;color:#0f172a;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="suPassword" type="password" placeholder="Password" style="
          width:100%;padding:13px 16px;margin-bottom:14px;
          background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:8px;color:#0f172a;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="suPassword2" type="password" placeholder="Confirm password" style="
          width:100%;padding:13px 16px;margin-bottom:20px;
          background:#f8fafc;border:1px solid #e2e8f0;
          border-radius:8px;color:#0f172a;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <button onclick="handleSignUp()" style="
          width:100%;padding:14px;background:#648FFF;
          border:none;border-radius:8px;color:#fff;
          font-size:15px;font-weight:600;cursor:pointer;
        ">Create Account</button>
        <p id="suError" style="color:#ff6b6b;font-size:13px;margin-top:12px;display:none;"></p>
      </div>
    </div>
  </div>

  <!-- Profile Dropdown -->
  <div id="profileDropdown" style="
    display:none;
    position:fixed;
    background:#ffffff;
    border:1px solid rgba(255,255,255,0.1);
    border-radius:10px;
    padding:8px;
    min-width:180px;
    box-shadow:0 10px 30px rgba(0,0,0,0.4);
    z-index:9998;
  ">
    <p id="dropdownEmail" style="
      color:#64748b;font-size:12px;
      padding:8px 12px 4px;margin:0 0 6px 0;
      border-bottom:1px solid rgba(255,255,255,0.08);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    "></p>
    <a href="profile.html" style="
      display:block;padding:9px 12px;
      color:#0f172a;text-decoration:none;font-size:14px;
      border-radius:6px;transition:background .15s;
    "
      onmouseover="this.style.background='rgba(83,93,161,0.3)'"
      onmouseout="this.style.background='none'"
    ><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#cecece"><path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/></svg> Go to Profile</a>
    <button onclick="handleSignOut()" style="
      width:100%;text-align:left;padding:9px 12px;
      background:none;border:none;color:#ff6b6b;
      font-size:14px;cursor:pointer;border-radius:6px;
      transition:background .15s;
    "
      onmouseover="this.style.background='rgba(255,107,107,0.1)'"
      onmouseout="this.style.background='none'"
    ><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#cecece"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg> Log Out</button>
  </div>

`);

// ── Tab switching ────────────────────────────────────────────

window.switchTab = function(tab) {
  const isSignIn = tab === "signin";
  document.getElementById("formSignIn").style.display = isSignIn ? "block" : "none";
  document.getElementById("formSignUp").style.display = isSignIn ? "none" : "block";
  document.getElementById("tabSignIn").style.color = isSignIn ? "#fff" : "#aaa";
  document.getElementById("tabSignIn").style.borderBottom = isSignIn ? "2px solid #535da1" : "2px solid transparent";
  document.getElementById("tabSignUp").style.color = isSignIn ? "#aaa" : "#fff";
  document.getElementById("tabSignUp").style.borderBottom = isSignIn ? "2px solid transparent" : "2px solid #535da1";
};

// ── Modal open/close ─────────────────────────────────────────

function openModal() {
  document.getElementById("authModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("authModal").style.display = "none";
}

document.getElementById("authModalClose").addEventListener("click", closeModal);
document.getElementById("authModal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});

// ── Dropdown logic ───────────────────────────────────────────

let dropdownOpen = false;

function handleIconClick(e) {
  const user = auth.currentUser;
  const dropdown = document.getElementById("profileDropdown");

  if (!user) {
    openModal();
    return;
  }

  if (dropdownOpen) {
    dropdown.style.display = "none";
    dropdownOpen = false;
    return;
  }

  const rect = e.target.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + 8) + "px";
  dropdown.style.left = (rect.left - 100) + "px";
  document.getElementById("dropdownEmail").textContent = user.email;
  dropdown.style.display = "block";
  dropdownOpen = true;
}

document.addEventListener("click", function(e) {
  const dropdown = document.getElementById("profileDropdown");
  if (
    dropdownOpen &&
    !dropdown.contains(e.target) &&
    !e.target.classList.contains("profile-icon-btn")
  ) {
    dropdown.style.display = "none";
    dropdownOpen = false;
  }
});

// ── Auth handlers ────────────────────────────────────────────

window.handleSignIn = async function() {
  const email = document.getElementById("siEmail").value.trim();
  const password = document.getElementById("siPassword").value;
  const errEl = document.getElementById("siError");
  errEl.style.display = "none";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeModal();
  } catch (err) {
    errEl.textContent = friendlyError(err.code);
    errEl.style.display = "block";
  }
};

window.handleSignUp = async function() {
  const name = document.getElementById("suName").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const password = document.getElementById("suPassword").value;
  const password2 = document.getElementById("suPassword2").value;
  const errEl = document.getElementById("suError");
  errEl.style.display = "none";

  if (!name) {
    errEl.textContent = "Please enter a display name.";
    errEl.style.display = "block";
    return;
    }

  if (password !== password2) {
    errEl.textContent = "Passwords don't match.";
    errEl.style.display = "block";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email: cred.user.email,
      displayName: name,
      createdAt: new Date(),
      allTime: { totalTimeSpent: 0, challengesCompleted: 0, accuracy: 0, longestStreak: 0 },
        currentStreak: { startDate: null, recentDate: null, count: 0 }
    });
    closeModal();
  } catch (err) {
    errEl.textContent = friendlyError(err.code);
    errEl.style.display = "block";
  }
};

window.handleSignOut = async function() {
  await signOut(auth);
  document.getElementById("profileDropdown").style.display = "none";
  dropdownOpen = false;
};

// ── Auth state listener ──────────────────────────────────────

onAuthStateChanged(auth, (user) => {
  document.querySelectorAll(".profile-icon-btn").forEach(icon => {
    icon.style.color = user ? "#648FFF" : "#0f172a";
  });
});

// ── Friendly error messages ──────────────────────────────────

function friendlyError(code) {
  const map = {
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/invalid-credential": "Invalid email or password."
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ── Attach click handlers to profile icons ───────────────────
// Must be last so all functions above are defined first

onAuthStateChanged(auth, async (user) => {
  // 1. Update Profile Icons Globally
  document.querySelectorAll(".profile-icon-btn").forEach(icon => {
    icon.style.color = user ? "#648FFF" : "#0f172a";
  });

  // 2. Dashboard Logic (ONLY runs if we are on home.html)
  const returningUserView = document.getElementById('returningUserView');
  const newUserView = document.getElementById('newUserView');
  const loadingView = document.getElementById('loadingView');

  if (returningUserView && newUserView && loadingView) {
      if (user) {
          // Hide Onboarding, Show Dashboard Loading
          newUserView.style.display = 'none';
          loadingView.style.display = 'block';

          // Fetch and populate data
          await loadUserData(user);
          await loadMiniLeaderboard(user.uid);

          // Show Dashboard
          loadingView.style.display = 'none';
          returningUserView.style.display = 'block';
      } else {
          // Logged out: Show Onboarding
          returningUserView.style.display = 'none';
          loadingView.style.display = 'none';
          newUserView.style.display = 'block';
      }
  }
});

// ── Dashboard Helper Functions ───────────────────────────────
async function loadUserData(user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const data = userSnap.data();

    // Populate the UI safely (Checking if elements exist first)
    const greetEl = document.getElementById('dashboard-greeting');
    if (greetEl) greetEl.innerText = `Welcome back, ${data.displayName || 'Friend'}!`;
    
    const streakEl = document.getElementById('stat-streak');
    if (streakEl) streakEl.innerText = `${data.streak || 0} Days`;
    
    const xpEl = document.getElementById('stat-xp');
    if (xpEl) xpEl.innerText = `${data.xp || 0} XP`;
    
    const pAtoMText = document.getElementById('progress-AtoM-text');
    if (pAtoMText) pAtoMText.innerText = `${data.progressAtoM || 0}%`;
    
    const pAtoMBar = document.getElementById('progress-AtoM-bar');
    if (pAtoMBar) pAtoMBar.style.width = `${data.progressAtoM || 0}%`;
    
    const pNtoZText = document.getElementById('progress-NtoZ-text');
    if (pNtoZText) pNtoZText.innerText = `${data.progressNtoZ || 0}%`;
    
    const pNtoZBar = document.getElementById('progress-NtoZ-bar');
    if (pNtoZBar) pNtoZBar.style.width = `${data.progressNtoZ || 0}%`;

    const nextBtn = document.getElementById('next-lesson-btn');
    if (nextBtn) nextBtn.innerText = `Jump to Letter "${data.nextLetter || 'A'}"`;
}

async function loadMiniLeaderboard(currentUid) {
    const leaderboardEl = document.getElementById('mini-leaderboard');
    if (!leaderboardEl) return;
    
    leaderboardEl.innerHTML = ''; 

    // Query top users by XP
    const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(4));
    const querySnapshot = await getDocs(q);

    let rank = 1;
    let currentUserRanked = false;

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isMe = doc.id === currentUid;
        
        if(isMe) {
            currentUserRanked = true;
            const rankEl = document.getElementById('stat-rank');
            if (rankEl) rankEl.innerText = `Rank #${rank}`;
        }

        // Medals for top 3
        let iconHtml = `<i class="bi bi-${rank}-circle-fill text-secondary me-2"></i>`;
        if (rank === 1) iconHtml = `<i class="bi bi-1-circle-fill text-warning me-2"></i>`;
        if (rank === 3) iconHtml = `<i class="bi bi-3-circle-fill me-2" style="color: #cd7f32;"></i>`;
        if (rank > 3) iconHtml = `<span class="me-2 text-muted fw-bold">${rank}.</span>`;

        const displayName = data.displayName || data.email.split('@')[0];

        const li = document.createElement('li');
        li.className = `list-group-item d-flex justify-content-between align-items-center px-0 ${isMe ? 'bg-light rounded mt-2 p-2 border' : ''}`;
        li.innerHTML = `
            <span>${iconHtml} ${isMe ? '<strong>' + displayName + ' (You)</strong>' : displayName}</span>
            <span class="badge rounded-pill" style="background-color: ${isMe ? 'var(--signify-blue)' : 'var(--signify-dark)'};">${data.xp || 0} XP</span>
        `;
        leaderboardEl.appendChild(li);
        rank++;
    });

    if(!currentUserRanked) {
        const rankEl = document.getElementById('stat-rank');
        if (rankEl) rankEl.innerText = `Keep Learning!`;
    }
}

// Bind click events dynamically on load
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".profile-icon-btn").forEach(icon => {
        // Remove existing listener to avoid duplicates if re-injected
        icon.removeEventListener("click", handleIconClick);
        icon.addEventListener("click", handleIconClick);
    });
});