// --- DATABASE SYSTEM ---

const defaultUsers = {
    "master": { 
        pass: "master999", role: "Master", name: "System Overlord", 
        quest: "Override Code", ans: "omega-level", 
        voicePass: "activate system",
        codePass: "SamarthOP" // <--- NEW MASTER CODE
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
let currentView = 'home';

function loadDatabase() {
    const savedData = localStorage.getItem('auraFlowDB');
    try {
        const defaults = JSON.parse(JSON.stringify(defaultUsers));
        users = savedData ? JSON.parse(savedData) : defaults;
        
        // Ensure master exists and has the new codePass field (patching old data)
        if(!users['master']) {
            users['master'] = defaults['master'];
        } else if (!users['master'].codePass) {
            users['master'].codePass = defaults['master'].codePass;
        }

    } catch(e) {
        console.error("Data corrupted, resetting DB", e);
        users = JSON.parse(JSON.stringify(defaultUsers));
    }

    const savedLogs = localStorage.getItem('auraLogs');
    if(savedLogs) {
        try {
            meetingLogs = JSON.parse(savedLogs);
        } catch(e) {
            meetingLogs = [];
        }
    }
}

function saveDatabase() { localStorage.setItem('auraFlowDB', JSON.stringify(users)); }
loadDatabase(); 

// --- BOOT SEQUENCE ---
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const status = document.getElementById('voice-status');

    if(!SpeechRecognition) {
        status.innerText = "Browser not supported";
        return;
    }
    
    const recognition = new SpeechRecognition();
    status.innerText = "Listening...";
    status.style.color = "#00b894";

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        // Check if transcript includes the pass phrase
        if (transcript.includes(users['master'].voicePass)) {
            document.getElementById('voice-modal').classList.add('hidden');
            finishMasterLogin();
        } else { 
            status.innerText = "Voice Not Recognized"; 
            status.style.color = "red";
        }
    };
    
    recognition.onerror = () => {
        status.innerText = "Error. Try Code.";
        status.style.color = "red";
    }
}

function verifyMasterCode() {
    const codeIn = document.getElementById('master-code-input').value;
    const status = document.getElementById('voice-status'); // reuse status text area

    if (codeIn === users['master'].codePass) {
        document.getElementById('voice-modal').classList.add('hidden');
        finishMasterLogin();
    } else {
        status.innerText = "Invalid Master Code";
        status.style.color = "red";
        document.getElementById('master-code-input').value = ""; // Clear input
    }
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
    document.getElementById('master-code-input').value = "";
    document.getElementById('voice-status').innerText = "...";
}

function logout() {
    currentUser = null;
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    document.getElementById('security-answer').value = "";
}

function setupDashboard(userId) {
    const user = users[userId];
    if(!user) return; 

    document.getElementById('welcome-header').innerText = `${user.role} Dashboard`;
    document.getElementById('welcome-message').innerText = `Welcome, ${user.name}`;
    
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

// Start boot sequence immediately on load
window.addEventListener('load', runBootSequence);
