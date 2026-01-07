// --- DATABASE SYSTEM ---

const defaultUsers = {
    // MASTER (Voice Pass: "activate system")
    "master": { 
        pass: "master999", role: "Master", name: "System Overlord", notifications: [],
        quest: "Override Code", ans: "omega-level", voicePass: "activate system"
    },
    // ADMIN
    "admin": { 
        pass: "admin123", role: "Admin", name: "Principal System", notifications: [],
        quest: "What is the Master Key?", ans: "aura-master"
    },
    // ADMIN 2
    "admin2": { 
        pass: "admin456", role: "Admin", name: "Vice Principal", notifications: [],
        quest: "What is the Staff Code?", ans: "staff-2025"
    },
    "teach1": { pass: "teach123", role: "Teacher", name: "Mr. Sharma", subject: "Math", phone: "987-654-3210" },
    "stud1": { 
        pass: "stud123", role: "Student", name: "Rahul", 
        stdClass: "10th A", rollNo: "21", accessCode: "S-101",
        phone: "987-654-3210", marks: ["Math: 95", "Eng: 88"], attendance: 85,
        classTeacher: "Mr. Sharma", teacherPhone: "987-654-3210"
    },
    "stud2": { 
        pass: "stud456", role: "Student", name: "Priya", 
        stdClass: "10th B", rollNo: "45", accessCode: "S-102",
        phone: "N/A", marks: ["Sci: 92"], attendance: 90,
        classTeacher: "Ms. Verma", teacherPhone: "Not Available"
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
    if (savedData) { 
        users = JSON.parse(savedData);
        if (!users['master']) users['master'] = defaultUsers['master'];
        if (!users['admin2']) users['admin2'] = defaultUsers['admin2'];
        if (users['admin'] && !users['admin'].quest) { users['admin'].quest = "What is the Master Key?"; users['admin'].ans = "aura-master"; }
        if (users['admin2'] && !users['admin2'].quest) { users['admin2'].quest = "What is the Staff Code?"; users['admin2'].ans = "staff-2025"; }
        if (users['master'] && !users['master'].voicePass) { users['master'].voicePass = "activate system"; }
        saveDatabase();
    } 
    else { users = defaultUsers; saveDatabase(); }
    const savedLogs = localStorage.getItem('auraLogs');
    if(savedLogs) meetingLogs = JSON.parse(savedLogs);
}

function saveDatabase() { localStorage.setItem('auraFlowDB', JSON.stringify(users)); }
function saveLogs() { localStorage.setItem('auraLogs', JSON.stringify(meetingLogs)); }

loadDatabase(); 

// --- UTILS ---
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');
    setupDashboard(currentUser);
}

// --- MASTER AUDIO & VOICE SECURITY SYSTEM ---
function playMasterAudio() {
    if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance("Access Granted. Welcome, System Overlord.");
        msg.rate = 0.9; msg.pitch = 0.7; 
        window.speechSynthesis.speak(msg);
    }
}

function startVoiceListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Voice API not supported in this browser."); return; }
    
    const recognition = new SpeechRecognition();
    const status = document.getElementById('voice-status');
    const icon = document.getElementById('mic-icon');
    
    status.innerText = "Listening...";
    icon.style.color = "#ff4757"; // Red when active
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        status.innerText = `Heard: "${transcript}"`;
        
        if (transcript.includes(users['master'].voicePass)) {
            // SUCCESS
            status.innerText = "Voice Match Confirmed!";
            status.style.color = "#00b894";
            icon.style.color = "#00b894";
            setTimeout(() => {
                document.getElementById('voice-modal').classList.add('hidden');
                finishMasterLogin();
            }, 1000);
        } else {
            // FAIL
            status.innerText = "Incorrect Phrase. Try again.";
            icon.style.color = "#333";
        }
    };
    
    recognition.onerror = () => {
        status.innerText = "Error listening. Try again.";
        icon.style.color = "#333";
    };
}

// --- LOGIN & SECURITY CHAIN ---
function login() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    if (users[userIn] && users[userIn].pass === passIn) {
        // SECURITY CHECK: If Admin or Master, trigger Multi-Factor Auth
        if (users[userIn].role === 'Admin' || users[userIn].role === 'Master') {
            tempUser = userIn; 
            errorMsg.style.display = 'none';
            document.getElementById('security-question-text').innerText = users[userIn].quest || "Security Verification";
            document.getElementById('security-modal').classList.remove('hidden');
            return;
        }
        // If Standard User, go straight to dashboard
        currentUser = userIn;
        errorMsg.style.display = 'none';
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-dashboard').classList.remove('hidden');
        setupDashboard(userIn);
    } else { errorMsg.style.display = 'block'; }
}

function verifySecurityAnswer() {
    const ansIn = document.getElementById('security-answer').value;
    const errorBox = document.getElementById('security-error');

    if (ansIn === users[tempUser].ans) {
        errorBox.style.display = 'none';
        document.getElementById('security-modal').classList.add('hidden');
        document.getElementById('security-answer').value = ""; 
        currentUser = tempUser;
        tempUser = null;

        // SECURITY LEVEL 2: If Master -> Go to Voice Check
        if (currentUser === 'master') {
            document.getElementById('voice-modal').classList.remove('hidden');
        } 
        // If Admin -> Show Bio-metric Animation
        else if (currentUser === 'admin') {
            document.getElementById('login-container').style.display = 'none';
            const verifyOverlay = document.getElementById('admin-verify-overlay');
            verifyOverlay.classList.remove('hidden');
            setTimeout(() => {
                verifyOverlay.classList.add('hidden');
                document.getElementById('main-dashboard').classList.remove('hidden');
                setupDashboard(currentUser);
            }, 2000);
        } 
        else {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-dashboard').classList.remove('hidden');
            setupDashboard(currentUser);
        }
    } else { errorBox.style.display = 'block'; }
}

function finishMasterLogin() {
    document.getElementById('login-container').style.display = 'none';
    const verifyOverlay = document.getElementById('admin-verify-overlay');
    verifyOverlay.classList.remove('hidden');
    playMasterAudio();
    setTimeout(() => {
        verifyOverlay.classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        setupDashboard(currentUser);
    }, 2000);
}

function cancelLogin() {
    document.getElementById('security-modal').classList.add('hidden');
    document.getElementById('voice-modal').classList.add('hidden');
    tempUser = null;
}

function logout() {
    currentUser = null;
    realAdmin = null;
    currentView = 'home';
    activeMeetingCode = null; 
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    document.getElementById('admin-verify-overlay').classList.add('hidden');
    const btn = document.getElementById('chat-btn-wrapper');
    if(btn) btn.remove();
}

// --- PASSWORD CHANGE LOGIC ---
function openChangePassword(username) {
    targetUserForPass = username;
    document.getElementById('target-user-display').innerText = "Changing Password for: " + users[username].name;
    document.getElementById('password-modal').classList.remove('hidden');
}

function closePassModal() {
    document.getElementById('password-modal').classList.add('hidden');
    document.getElementById('new-pass-input').value = "";
    targetUserForPass = null;
}

function confirmPasswordChange() {
    const newPass = document.getElementById('new-pass-input').value;
    if(newPass && targetUserForPass) {
        users[targetUserForPass].pass = newPass;
        saveDatabase();
        alert(`Password for ${targetUserForPass} changed successfully.`);
        closePassModal();
        setupDashboard(currentUser); 
    } else {
        alert("Enter a valid password.");
    }
}

// --- STANDARD FUNCTIONS (CRUD & UTILS) ---
function updateAllStudentData() {
    if (realAdmin) { alert("Restricted."); return; }
    const sId = document.getElementById('t-student-id').value;
    const sSub = document.getElementById('t-subject').value;
    const sScore = document.getElementById('t-score').value;
    const sAtt = document.getElementById('t-attendance').value;
    if (!users[sId] || users[sId].role !== 'Student') { alert("Student not found!"); return; }
    if (sSub && sScore) users[sId].marks.push(`${sSub}: ${sScore}`);
    if (sAtt) users[sId].attendance = parseInt(sAtt);
    saveDatabase(); alert("Updated!");
}

function createNewUser() {
    const id = document.getElementById('new-id').value;
    const pass = document.getElementById('new-pass').value;
    const name = document.getElementById('new-name').value;
    const role = document.getElementById('new-role').value;
    if(!id || !pass) return alert("Fill fields");
    let newAccess = role === 'Student' ? "S-" + Math.floor(Math.random()*1000) : "";
    users[id] = { pass: pass, role: role, name: name, marks: [], attendance: 0, accessCode: newAccess, classTeacher: "N/A", teacherPhone: "N/A" };
    saveDatabase(); alert("Created!"); setupDashboard(currentUser);
}

function deleteUser(id) {
    if(confirm("Delete " + id + "?")) { delete users[id]; saveDatabase(); setupDashboard(currentUser); }
}

function impersonateUser(id) {
    if (!realAdmin) realAdmin = currentUser;
    const btn = document.getElementById('chat-btn-wrapper');
    if(btn) btn.classList.add('hidden');
    currentUser = id;
    currentView = 'home';
    setupDashboard(id);
    alert(`Viewing as ${users[id].name}. (Read-Only)`);
}

function returnToAdmin() {
    if (realAdmin) { currentUser = realAdmin; realAdmin = null; currentView = 'home'; setupDashboard(currentUser); }
}

function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,Username,Name,Role,Marks,Attendance\n";
    for (let id in users) {
        let u = users[id];
        let marksStr = u.marks ? u.marks.join(" | ") : "";
        csvContent += `${id},${u.name},${u.role},"${marksStr}",${u.attendance || 0}%\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "School_Database.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function calculateQuickPercent() {
    const obt = parseFloat(document.getElementById('calc-obt').value);
    const tot = parseFloat(document.getElementById('calc-tot').value);
    if(obt && tot) document.getElementById('calc-result').innerText = `Result: ${((obt/tot)*100).toFixed(1)}%`;
}

function downloadStudentReport() {
    if (realAdmin) { alert("Restricted."); return; }
    if (!currentUser) return;
    alert(`Downloading report for ${users[currentUser].name}...`);
}

// --- MEETING ---
function createMeeting() {
    activeMeetingCode = "CLASS-" + Math.floor(1000 + Math.random() * 9000);
    setupDashboard(currentUser); 
}
function launchMeeting(code) {
    if(code) window.open("https://meet.jit.si/" + code, "_blank");
}
function joinMeeting() {
    const codeIn = document.getElementById('join-code').value;
    const accessIn = document.getElementById('join-access').value;
    if (codeIn !== activeMeetingCode) { alert("Invalid Meeting Code"); return; }
    if (accessIn !== users[currentUser].accessCode) { alert("Invalid Access Code"); return; }
    alert(`Success! Joining Class ${codeIn}...`);
    const logEntry = { student: users[currentUser].name, id: currentUser, classCode: codeIn, time: new Date().toLocaleString() };
    meetingLogs.unshift(logEntry);
    saveLogs();
    window.open("https://meet.jit.si/" + codeIn, "_blank");
}

// --- CHATBOT ---
function toggleChat() { document.getElementById('chat-window').classList.toggle('hidden'); }
function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim().toLowerCase();
    if (!msg) return;
    document.getElementById('chat-body').innerHTML += `<div class="msg user">${input.value}</div>`;
    input.value = "";
    setTimeout(() => {
        let reply = getAdminBotResponse(msg);
        document.getElementById('chat-body').innerHTML += `<div class="msg bot">${reply}</div>`;
    }, 500);
}
function getAdminBotResponse(msg) {
    let list = [];
    if(msg.includes("pass")) {
        for(let u in users) if(users[u].role==='Student' && users[u].marks.every(m=>parseInt(m.split(':')[1])>=33)) list.push(users[u].name);
        return list.length ? "Passed: " + list.join(", ") : "None passed.";
    }
    if(msg.includes("fail")) {
        for(let u in users) if(users[u].role==='Student' && users[u].marks.some(m=>parseInt(m.split(':')[1])<33)) list.push(users[u].name);
        return list.length ? "Failed: " + list.join(", ") : "No failures.";
    }
    if(msg.includes("users")) {
        let reply = "<b>Accounts:</b><br>";
        for(let u in users) { if(u !== 'admin' && u !== 'master' && u !== 'admin2') reply += `- ${users[u].name} (${u})<br>`; }
        return reply;
    }
    return "I analyze data. Ask: Who passed? Who failed? Show users.";
}

// --- DASHBOARD GENERATOR ---
function setupDashboard(userId) {
    const user = users[userId];
    const role = user.role;
    let displayTitle = `${role} Dashboard: ${user.name}`;
    if (userId === 'admin' || userId === 'master') displayTitle += ' <i class="fas fa-shield-alt" style="color:#00b894; margin-left:10px;" title="Verified"></i>';
    
    document.getElementById('welcome-header').innerHTML = displayTitle;
    document.getElementById('welcome-message').innerText = `${getGreeting()}, ${user.name}!`;
    
    const navInfo = document.getElementById('nav-info');
    const navMeeting = document.getElementById('nav-meeting');
    
    if (role === 'Admin' || role === 'Master') {
        navInfo.style.display = 'none'; 
        navMeeting.style.display = 'none';
    } else {
        navInfo.style.display = 'flex';
        navMeeting.style.display = 'flex';
    }

    document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${currentView}`).classList.add('active');

    const adminControls = document.getElementById('admin-controls-header');
    if (realAdmin) adminControls.innerHTML = `<button onclick="returnToAdmin()" class="btn-login small" style="background:#FF6584;">Exit View</button>`;
    else adminControls.innerHTML = "";

    const avatar = document.getElementById('header-avatar');
    avatar.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236C63FF'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

    const view = document.getElementById('simple-view');
    view.innerHTML = ""; 

    // === MEETING VIEW ===
    if (currentView === 'meeting') {
        if (role === 'Teacher') {
            let codeDisplay = activeMeetingCode ? activeMeetingCode : "No active meeting";
            let startBtn = activeMeetingCode ? `<button class="btn-login" style="background:#00b894; margin-top:15px;" onclick="launchMeeting('${activeMeetingCode}')"><i class="fas fa-video"></i> Start Meeting Now</button>` : "";
            view.innerHTML = `<div class="simple-box"><h3>Video Class Control</h3><button class="btn-login" style="background:#6C63FF;" onclick="createMeeting()">Generate New Code</button><div class="meeting-card" style="margin-top:20px;"><div class="meeting-code-display">${codeDisplay}</div>${startBtn}</div></div>`;
        } else if (role === 'Student') {
            view.innerHTML = `<div class="simple-box"><h3>Join Video Class</h3><div class="join-section"><input type="text" id="join-code" placeholder="Meeting Code" class="clean-input"><input type="text" id="join-access" placeholder="Your Access Code" class="clean-input" style="margin-top:10px;"><button class="btn-login" style="background:#6C63FF; margin-top:20px;" onclick="joinMeeting()">Join Class</button></div></div>`;
        }
        return;
    }

    // === INFO VIEW ===
    if (currentView === 'info') {
        if (role === 'Student') {
             view.innerHTML = `<div class="simple-box"><h3>Student Profile</h3><div class="info-row"><strong>Name:</strong> <span>${user.name}</span></div><div class="info-row"><strong>User ID:</strong> <span>${userId}</span></div><div class="info-row"><strong>Access Code:</strong> <span style="color:red; font-weight:bold;">${user.accessCode || 'N/A'}</span></div><hr><div class="info-row"><strong>Class Teacher:</strong> <span>${user.classTeacher || 'N/A'}</span></div></div>`;
        } else if (role === 'Teacher') {
            view.innerHTML = `<div class="simple-box"><h3>My Profile</h3><div class="info-row"><strong>Name:</strong> <span>${user.name}</span></div><div class="info-row"><strong>Subject:</strong> <span>${user.subject || 'N/A'}</span></div></div>`;
        }
        return;
    }

    // === HOME VIEW ===
    if (role === 'Student') {
        let tableRows = "";
        let marksArray = user.marks || [];
        marksArray.forEach(m => {
            let parts = m.split(":");
            let status = parseInt(parts[1]) >= 33 ? '<span class="pass-badge">Pass</span>' : '<span class="fail-badge">Fail</span>';
            tableRows += `<tr><td>${parts[0]}</td><td>${parts[1]}</td><td>${status}</td></tr>`;
        });
        let att = user.attendance || 0;
        let pieStyle = `conic-gradient(#6C63FF 0% ${att}%, #eee ${att}% 100%)`;

        view.innerHTML = `
            <div class="simple-box"><h3>Attendance</h3><div class="pie-chart-container"><div class="pie-chart" style="background:${pieStyle}" data-val="${att}%"></div></div></div>
            <div class="simple-box"><div style="display:flex; justify-content:space-between; align-items:center;"><h3>Academic Report</h3><button class="btn-login small" style="background:#00b894; margin:0;" onclick="downloadStudentReport()"><i class="fas fa-file-download"></i> Report</button></div><table class="excel-table"><tr><th>Subject</th><th>Marks</th><th>Status</th></tr>${tableRows || '<tr><td colspan="3">No records found.</td></tr>'}</table></div>
        `;
    } 
    else if (role === 'Teacher') {
        view.innerHTML = `
            <div class="simple-box" style="border-left: 5px solid #6C63FF;"><h3>🎓 One-Click Student Update</h3><input type="text" id="t-student-id" placeholder="Student ID (e.g. stud1)" style="width:100%; padding:12px; margin-bottom:15px; border:1px solid #ccc; border-radius:5px;"><div class="input-row"><input type="text" id="t-subject" placeholder="Subject"><input type="number" id="t-score" placeholder="Score"></div><div class="input-row"><input type="number" id="t-attendance" placeholder="Attendance %"><button class="btn-login small" style="background:#00b894; width:100%;" onclick="updateAllStudentData()">Update</button></div></div>
            <div class="simple-box"><h3>Calculator</h3><div class="input-row" style="align-items:center;"><input type="number" id="calc-obt" placeholder="Obtained"><input type="number" id="calc-tot" placeholder="Total"><button class="btn-login small" style="background:#333;" onclick="calculateQuickPercent()">Calc</button></div><div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px;"><p id="calc-result" style="font-weight:bold;">Result: 0%</p><div class="pie-chart mini-pie" id="calc-pie" data-val="0%"></div></div></div>
        `;
    } 
    else if (role === 'Admin' || role === 'Master') {
        const body = document.body;
        if (!document.getElementById('chat-btn-wrapper')) {
            const chatHTML = `<div id="chat-btn-wrapper"><div class="chat-window hidden" id="chat-window"><div class="chat-header"><span>🤖 Analyst</span> <span style="cursor:pointer;" onclick="toggleChat()">X</span></div><div class="chat-body" id="chat-body"><div class="msg bot">Ask me: "Who passed?"</div></div><div class="chat-input-area"><input type="text" id="chat-input" placeholder="Query..."><button onclick="sendChat()">Send</button></div></div><div class="chat-btn" onclick="toggleChat()"><i class="fas fa-robot"></i></div></div>`;
            body.insertAdjacentHTML('beforeend', chatHTML);
        } else { document.getElementById('chat-btn-wrapper').classList.remove('hidden'); }

        const isMaster = (role === 'Master');
        const isSuperAdmin = (userId === 'admin');

        let logsHTML = "";
        if (isMaster) {
            logsHTML = `<div class="simple-box"><h3>🕵️ Master Surveillance Log</h3><div class="notification-box" style="max-height:150px;">`;
            if(meetingLogs.length === 0) logsHTML += "<p>No meeting activity yet.</p>";
            else meetingLogs.forEach(l => { logsHTML += `<div class="log-entry"><b>${l.student}</b> joined <b>${l.classCode}</b> at ${l.time}</div>`; });
            logsHTML += `</div></div>`;
        }

        let userListHTML = "";
        for(let u in users) {
            if(u === userId) continue; 
            // Hide Master from everyone (including Admins)
            if (u === 'master' && !isMaster) continue;

            let displayPass = "********"; 
            if (isMaster) displayPass = `<span style="color:#FF6584;">${users[u].pass}</span>`; 
            
            let buttons = `<button class="btn-login small" style="background:#6C63FF;" onclick="impersonateUser('${u}')">Login As</button>`;
            if (isMaster) {
                buttons += ` <button class="btn-login small" style="background:#00b894;" onclick="openChangePassword('${u}')">Pass</button>`;
                buttons += ` <button class="btn-login small" style="background:#ff4757;" onclick="deleteUser('${u}')">Delete</button>`;
            } else if (isSuperAdmin && users[u].role !== 'Master' && u !== 'admin2') {
                buttons += ` <button class="btn-login small" style="background:#ff4757;" onclick="deleteUser('${u}')">Delete</button>`;
            }

            userListHTML += `<li><span><b>${users[u].name}</b> (${u}) - ${displayPass}</span> <div style="display:flex; gap:5px;">${buttons}</div></li>`;
        }

        view.innerHTML = `
            ${logsHTML}
            <div class="simple-box"><h3>Database Controls</h3><button class="btn-login" style="background:#00b894;" onclick="exportToExcel()">Download Database</button></div>
            <div class="simple-box"><h3>Add New User</h3><div class="input-row"><input type="text" id="new-name" placeholder="Name"><input type="text" id="new-id" placeholder="User"></div><div class="input-row"><input type="text" id="new-pass" placeholder="Pass"><select id="new-role" style="padding:10px;"><option value="Student">Student</option><option value="Teacher">Teacher</option></select><button class="btn-login small" onclick="createNewUser()">Create</button></div></div>
            <div class="simple-box"><h3>All Users</h3><ul>${userListHTML}</ul></div>
        `;
    }
}

function playWelcomeAudio() { if ('speechSynthesis' in window) { const msg = new SpeechSynthesisUtterance(); msg.text = "Welcome to Aura Flow"; window.speechSynthesis.speak(msg); } }
window.addEventListener('load', function() { playWelcomeAudio(); setTimeout(() => { document.getElementById('boot-screen').classList.add('fade-out'); setTimeout(() => { document.getElementById('boot-screen').style.display = 'none'; }, 1000); }, 5000); });
