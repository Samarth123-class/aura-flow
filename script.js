// --- DATABASE SYSTEM ---

const defaultUsers = {
    "master": { 
        pass: "master999", role: "Master", name: "System Overlord", 
        quest: "Override Code", ans: "omega-level", voicePass: "activate system"
    },
    "admin": { 
        pass: "admin123", role: "Admin", name: "Principal System", 
        quest: "What is the Master Key?", ans: "aura-master"
    },
    "stud1": { 
        pass: "stud123", role: "Student", name: "Rahul", stdClass: "10th A", 
        accessCode: "S-101", marks: ["Math: 95", "Eng: 88"], attendance: 85
    }
};

let users = {};
let meetingLogs = []; 
let activeMeetingCode = null; 
let currentUser = null;
let tempUser = null; 
let realAdmin = null; 
let currentView = 'home';
let targetUserForPass = null;

function loadDatabase() {
    const savedData = localStorage.getItem('auraFlowDB');
    users = savedData ? JSON.parse(savedData) : defaultUsers;
    if(!users['master']) users['master'] = defaultUsers['master'];
    const savedLogs = localStorage.getItem('auraLogs');
    if(savedLogs) meetingLogs = JSON.parse(savedLogs);
}
function saveDatabase() { localStorage.setItem('auraFlowDB', JSON.stringify(users)); }
loadDatabase(); 

// ==========================================
// NEW: GLOBAL STARTUP SECURITY ("Voice OR Code")
// ==========================================
const GLOBAL_AUDIO_PASS = "heyyy it's me samarth give me the access";
const GLOBAL_TEXT_PASS = "SamarthOP"; // <--- CHANGE SPECIAL CODE HERE

function initSecurityLayer() {
    // Voice Listener
    document.getElementById('globalMicBtn').addEventListener('click', startGlobalSecurityListening);
    
    // Code Listener
    document.getElementById('codeSubmitBtn').addEventListener('click', checkGlobalCode);
    
    // Allow pressing "Enter" in the input field
    document.getElementById('specialCodeInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') checkGlobalCode();
    });

    // Skip Listener
    document.getElementById('globalSkipBtn').addEventListener('click', skipGlobalVerification);
}

function checkGlobalCode() {
    const inputVal = document.getElementById('specialCodeInput').value;
    const msgEl = document.getElementById('globalStatusMsg');
    
    if (inputVal === GLOBAL_TEXT_PASS) {
        unlockGlobalSystem("Code Verified!");
    } else {
        msgEl.textContent = "Invalid Code.";
        msgEl.style.color = "red";
        document.getElementById('specialCodeInput').value = ""; // Clear input
        setTimeout(() => {
            msgEl.textContent = "Click Mic or Enter Code";
            msgEl.style.color = "#555";
        }, 2000);
    }
}

function startGlobalSecurityListening() {
    const msgEl = document.getElementById('globalStatusMsg');
    const dot = document.getElementById('globalRecordingDot');
    const btn = document.getElementById('globalMicBtn');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        msgEl.textContent = "Browser not supported.";
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        msgEl.textContent = "Listening...";
        msgEl.style.color = "#333";
        dot.style.display = "inline-block";
        btn.disabled = true;
        btn.style.opacity = "0.7";
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const cleanTranscript = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();

        if (cleanTranscript.includes(GLOBAL_AUDIO_PASS)) {
            unlockGlobalSystem("Voice Match Confirmed!");
        } else {
            msgEl.textContent = "No match.";
            msgEl.style.color = "red";
        }
    };

    recognition.onend = function() {
        dot.style.display = "none";
        btn.disabled = false;
        btn.style.opacity = "1";
    };
    recognition.start();
}

function skipGlobalVerification() {
    unlockGlobalSystem("Manual Bypass.");
}

function unlockGlobalSystem(reason) {
    const layer = document.getElementById('global-security-layer');
    const msgEl = document.getElementById('globalStatusMsg');
    
    msgEl.textContent = "Access Granted!";
    msgEl.style.color = "green";

    setTimeout(() => {
        layer.style.opacity = "0";
        setTimeout(() => {
            layer.style.display = "none";
            runBootSequence(); 
        }, 500);
    }, 600);
}

function runBootSequence() {
    const bootScreen = document.getElementById('boot-screen');
    bootScreen.style.display = 'flex'; 
    if ('speechSynthesis' in window) { 
        const msg = new SpeechSynthesisUtterance(); 
        msg.text = "Welcome to Aura Flow"; 
        window.speechSynthesis.speak(msg); 
    }
    setTimeout(() => { 
        bootScreen.classList.add('fade-out'); 
        setTimeout(() => { bootScreen.style.display = 'none'; }, 1000); 
    }, 4000);
}

// --- APP LOGIC ---
function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');
    setupDashboard(currentUser);
}

function login() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    if (users[userIn] && users[userIn].pass === passIn) {
        if (users[userIn].role === 'Admin' || users[userIn].role === 'Master') {
            tempUser = userIn; 
            errorMsg.style.display = 'none';
            document.getElementById('security-question-text').innerText = users[userIn].quest || "Security Verification";
            document.getElementById('security-modal').classList.remove('hidden');
            return;
        }
        currentUser = userIn;
        errorMsg.style.display = 'none';
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-dashboard').classList.remove('hidden');
        setupDashboard(userIn);
    } else { errorMsg.style.display = 'block'; }
}

function verifySecurityAnswer() {
    const ansIn = document.getElementById('security-answer').value;
    if (ansIn === users[tempUser].ans) {
        document.getElementById('security-modal').classList.add('hidden');
        currentUser = tempUser;
        if (currentUser === 'master') {
            document.getElementById('voice-modal').classList.remove('hidden');
        } else {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-dashboard').classList.remove('hidden');
            setupDashboard(currentUser);
        }
    } else { document.getElementById('security-error').style.display = 'block'; }
}

function startVoiceListening() {
    // Internal Master Voice Check
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    const status = document.getElementById('voice-status');
    status.innerText = "Listening...";
    recognition.start();
    recognition.onresult = (event) => {
        if (event.results[0][0].transcript.toLowerCase().includes(users['master'].voicePass)) {
            document.getElementById('voice-modal').classList.add('hidden');
            finishMasterLogin();
        } else { status.innerText = "Incorrect."; }
    };
}

function finishMasterLogin() {
    document.getElementById('login-container').style.display = 'none';
    const verifyOverlay = document.getElementById('admin-verify-overlay');
    verifyOverlay.classList.remove('hidden');
    setTimeout(() => {
        verifyOverlay.classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        setupDashboard(currentUser);
    }, 2000);
}

function cancelLogin() {
    document.getElementById('security-modal').classList.add('hidden');
    document.getElementById('voice-modal').classList.add('hidden');
}

function logout() {
    currentUser = null;
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
}

function setupDashboard(userId) {
    const user = users[userId];
    document.getElementById('welcome-header').innerText = `${user.role} Dashboard`;
    document.getElementById('welcome-message').innerText = `Welcome, ${user.name}`;
    
    // Only show certain nav items based on role
    const navInfo = document.getElementById('nav-info');
    const navMeeting = document.getElementById('nav-meeting');
    if(user.role === 'Admin' || user.role === 'Master') {
        navInfo.style.display = 'none'; navMeeting.style.display = 'none';
    } else {
        navInfo.style.display = 'flex'; navMeeting.style.display = 'flex';
    }

    const view = document.getElementById('simple-view');
    view.innerHTML = "";

    if (currentView === 'home') {
        if (user.role === 'Student') {
            view.innerHTML = `<div class="simple-box"><h3>Academic Report</h3><p>Marks: ${user.marks.join(', ')}</p><p>Attendance: ${user.attendance}%</p></div>`;
        } else if (user.role === 'Admin' || user.role === 'Master') {
            let list = "<ul>";
            for(let u in users) { if(u!=='master') list += `<li>${users[u].name} (${u})</li>`; }
            list += "</ul>";
            view.innerHTML = `<div class="simple-box"><h3>All Users</h3>${list}</div>`;
        }
    } else if (currentView === 'info') {
        view.innerHTML = `<div class="simple-box"><h3>Profile</h3><p>Name: ${user.name}</p><p>ID: ${userId}</p></div>`;
    } else if (currentView === 'meeting') {
        view.innerHTML = `<div class="simple-box"><h3>Meeting</h3><p>No active meetings.</p></div>`;
    }
}

// Initial Listener
window.addEventListener('load', initSecurityLayer);
                                                                 
