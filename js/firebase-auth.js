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
  setDoc
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
      background:#1a1a2e;
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
        background:none;border:none;color:#aaa;
        font-size:22px;cursor:pointer;line-height:1;
      ">✕</button>

      <!-- Tabs -->
      <div style="display:flex;margin-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.1);">
        <button id="tabSignIn" onclick="switchTab('signin')" style="
          flex:1;background:none;border:none;color:#fff;
          font-size:15px;font-weight:600;padding:10px;cursor:pointer;
          border-bottom:2px solid #535da1;transition:all .2s;
        ">Sign In</button>
        <button id="tabSignUp" onclick="switchTab('signup')" style="
          flex:1;background:none;border:none;color:#aaa;
          font-size:15px;font-weight:600;padding:10px;cursor:pointer;
          border-bottom:2px solid transparent;transition:all .2s;
        ">Sign Up</button>
      </div>

      <!-- Sign In Form -->
      <div id="formSignIn">
        <h3 style="color:#fff;margin-bottom:24px;font-size:22px;">Welcome back</h3>
        <input id="siEmail" type="email" placeholder="Email address" style="
          width:100%;padding:13px 16px;margin-bottom:14px;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
          border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="siPassword" type="password" placeholder="Password" style="
          width:100%;padding:13px 16px;margin-bottom:20px;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
          border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <button onclick="handleSignIn()" style="
          width:100%;padding:14px;background:#535da1;
          border:none;border-radius:8px;color:#fff;
          font-size:15px;font-weight:600;cursor:pointer;
        ">Sign In</button>
        <p id="siError" style="color:#ff6b6b;font-size:13px;margin-top:12px;display:none;"></p>
      </div>

      <!-- Sign Up Form -->
      <div id="formSignUp" style="display:none;">
        <h3 style="color:#fff;margin-bottom:24px;font-size:22px;">Create account</h3>
        <input id="suEmail" type="email" placeholder="Email address" style="
          width:100%;padding:13px 16px;margin-bottom:14px;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
          border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="suPassword" type="password" placeholder="Password" style="
          width:100%;padding:13px 16px;margin-bottom:14px;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
          border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <input id="suPassword2" type="password" placeholder="Confirm password" style="
          width:100%;padding:13px 16px;margin-bottom:20px;
          background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
          border-radius:8px;color:#fff;font-size:14px;box-sizing:border-box;outline:none;
        ">
        <button onclick="handleSignUp()" style="
          width:100%;padding:14px;background:#535da1;
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
    background:#1a1a2e;
    border:1px solid rgba(255,255,255,0.1);
    border-radius:10px;
    padding:8px;
    min-width:180px;
    box-shadow:0 10px 30px rgba(0,0,0,0.4);
    z-index:9998;
  ">
    <p id="dropdownEmail" style="
      color:#aaa;font-size:12px;
      padding:8px 12px 4px;margin:0 0 6px 0;
      border-bottom:1px solid rgba(255,255,255,0.08);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    "></p>
    <a href="profile.html" style="
      display:block;padding:9px 12px;
      color:#fff;text-decoration:none;font-size:14px;
      border-radius:6px;transition:background .15s;
    "
      onmouseover="this.style.background='rgba(83,93,161,0.3)'"
      onmouseout="this.style.background='none'"
    >👤 Go to Profile</a>
    <button onclick="handleSignOut()" style="
      width:100%;text-align:left;padding:9px 12px;
      background:none;border:none;color:#ff6b6b;
      font-size:14px;cursor:pointer;border-radius:6px;
      transition:background .15s;
    "
      onmouseover="this.style.background='rgba(255,107,107,0.1)'"
      onmouseout="this.style.background='none'"
    >🚪 Log Out</button>
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
  const email = document.getElementById("suEmail").value.trim();
  const password = document.getElementById("suPassword").value;
  const password2 = document.getElementById("suPassword2").value;
  const errEl = document.getElementById("suError");
  errEl.style.display = "none";

  if (password !== password2) {
    errEl.textContent = "Passwords don't match.";
    errEl.style.display = "block";
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email: cred.user.email,
      createdAt: new Date(),
      allTime: { totalTimeSpent: 0, challengesCompleted: 0, accuracy: 0 }
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
    icon.style.color = user ? "#535da1" : "#000000";
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

document.querySelectorAll(".profile-icon-btn").forEach(icon => {
  icon.addEventListener("click", handleIconClick);
});