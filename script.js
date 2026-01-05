// --- DATABASE SYSTEM ---

const defaultUsers = {
    // MASTER ACCOUNT (God Mode)
    "master": { 
        pass: "master999", role: "Master", name: "System Overlord", notifications: [],
        quest: "Override Code", ans: "omega-level"
    },
    // SUPER ADMIN
    "admin": { 
        pass: "admin123", role: "Admin", name: "Principal System", notifications: [],
        quest: "What is the Master Key?", ans: "aura-master"
    },
    // LIMITED ADMIN
    "admin2": { 
        pass: "admin456", role: "Admin", name: "Vice Principal", notifications: [],
        quest: "What is the Staff Code?", ans: "staff-2025"
    },
    // TEACHERS (With Security Quest)
    "teach1": { pass: "teach123", role: "Teacher", name: "Mr. Sharma", subject: "Math", phone: "987-654-3210", quest: "Faculty ID?", ans: "T-101" },
    
    // STUDENTS (With Unique Access Codes)
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
let meetingLogs = []; // Stores meeting history
let activeMeetingCode = null; // Stores current active class code

let currentUser = null;
let tempUser = null; 
let realAdmin = null; 
let currentView = 'home';

function loadDatabase() {
    const savedData = localStorage.getItem('auraFlowDB');
    if (savedData) { 
        users = JSON.parse(savedData);
        // Repair DB
        if (!users['master']) { users['master'] = defaultUsers['master']; }
        if (!users['admin2']) { users['admin2'] = defaultUsers['admin2']; }
        if (users['admin'] && !users['admin'].quest) { users['admin'].quest = "What is the Master Key?"; users['admin'].ans = "aura-master"; }
        // Ensure teachers have quest default if missing
        if (users['teach1'] && !users['teach1'].quest) { users['teach1'].quest = "Faculty ID?"; users['teach1'].ans = "T-101"; }
        saveDatabase();
    } 
    else { users = defaultUsers; saveDatabase(); }
    
    const savedLogs = localStorage.getItem('auraLogs');
    if(savedLogs) meetingLogs = JSON.parse(savedLogs);
}

function saveDatabase() {
    localStorage.setItem('auraFlowDB', JSON.stringify(users));
}
function saveLogs() {
    localStorage.setItem('auraLogs', JSON.stringify(meetingLogs));
}

loadDatabase(); 

// --- GREETING ---
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

// --- VIEW NAVIGATION ---
function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');
    setupDashboard(currentUser);
}

// --- MEETING FUNCTIONS ---
function createMeeting() {
    // Generate Random Code
    activeMeetingCode = "CLASS-" + Math.floor(1000 + Math.random() * 9000);
    setupDashboard(currentUser); // Refresh view to show code
}

function joinMeeting() {
    const codeIn = document.getElementById('join-code').value;
    const accessIn = document.getElementById('join-access').value;
    
    // Check Meeting Code
    if (codeIn !== activeMeetingCode) {
        alert("Invalid or Inactive Meeting Code");
        return;
    }
    
    // Check Student's Unique Code
    if (accessIn !== users[currentUser].accessCode) {
        alert("Invalid Student Access Code. Check your profile.");
        return;
    }

    // Success
    alert(`Success! Joining Class ${codeIn}...`);
    // Log it
    const logEntry = {
        student: users[currentUser].name,
        id: currentUser,
        classCode: codeIn,
        time: new Date().toLocaleString()
    };
    meetingLogs.unshift(logEntry);
    saveLogs();
    
    // Simulate Video Window (New Tab)
    window.open("https://meet.jit.si/" + codeIn, "_blank");
}

// --- EXCEL EXPORT ---
function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,Username,Name,Role,Class,Phone,Attendance,Marks\n";
    for (let id in users) {
        let u = users[id];
        let marksStr = u.marks ? u.marks.join(" | ") : "";
        csvContent += `${id},${u.name},${u.role},${u.stdClass||'N/A'},${u.phone||'N/A'},${u.attendance||0}%,${marksStr}\n`;
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "School_Database.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    if(msg.includes("gave") || msg.includes("taken")) {
        for(let u in users) if(users[u].role==='Student' && users[u].marks.length>0) list.push(users[u].name);
        return list.length ? "Taken Exam: " + list.join(", ") : "No exams taken.";
    }
    return "Ask me: Who passed? Who failed? Who took the exam?";
}

// --- LOGIN & SECURITY ---
function login() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    if (users[userIn] && users[userIn].pass === passIn) {
        
        // ADMIN OR TEACHER -> SECURITY CHECK
        if (users[userIn].role === 'Admin' || users[userIn].role === 'Master' || users[userIn].role === 'Teacher') {
            tempUser = userIn; 
            errorMsg.style.display = 'none';
            document.getElementById('security-question-text').innerText = users[userIn].quest || "Security Verification";
            document.getElementById('security-modal').classList.remove('hidden');
            return;
        }

        // STUDENT LOGIN
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

        // Animation for Super Admin/Master
        if (currentUser === 'admin' || currentUser === 'master') {
            document.getElementById('login-container').style.display = 'none';
            const verifyOverlay = document.getElementById('admin-verify-overlay');
            verifyOverlay.classList.remove('hidden');
            setTimeout(() => {
                verifyOverlay.classList.add('hidden');
                document.getElementById('main-dashboard').classList.remove('hidden');
                setupDashboard(currentUser);
            }, 2000);
        } else {
            // Teacher/Admin2 - No animation
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('main-dashboard').classList.remove('hidden');
            setupDashboard(currentUser);
        }
    } else { errorBox.style.display = 'block'; }
}

function cancelLogin() {
    document.getElementById('security-modal').classList.add('hidden');
    tempUser = null;
}

function logout() {
    currentUser = null;
    realAdmin = null;
    currentView = 'home';
    activeMeetingCode = null; // Reset meeting on logout
    document.getElementById('main-dashboard').classList.add('hidden');
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    const btn = document.getElementById('chat-btn-wrapper');
    if(btn) btn.remove();
}

// --- CORE ACTIONS ---
function createNewUser() {
    const id = document.getElementById('new-id').value;
    const pass = document.getElementById('new-pass').value;
    const name = document.getElementById('new-name').value;
    const role = document.getElementById('new-role').value;
    if(!id || !pass) return alert("Fill fields");
    // Generate Access Code for new students
    let newAccess = role === 'Student' ? "S-" + Math.floor(Math.random()*1000) : "";
    users[id] = { pass: pass, role: role, name: name, marks: [], attendance: 0, accessCode: newAccess };
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
    alert("Read-Only Mode");
}

function returnToAdmin() {
    if (realAdmin) { currentUser = realAdmin; realAdmin = null; currentView = 'home'; setupDashboard(currentUser); }
}

// --- DASHBOARD GENERATOR ---
function setupDashboard(userId) {
    const user = users[userId];
    const role = user.role;
    let displayTitle = `${role} Dashboard: ${user.name}`;
    if (userId === 'admin' || userId === 'master') displayTitle += ' <i class="fas fa-shield-alt" style="color:#00b894; margin-left:10px;"></i>';
    
    document.getElementById('welcome-header').innerHTML = displayTitle;
    document.getElementById('welcome-message').innerText = `${getGreeting()}, ${user.name}!`;
    
    // Sidebar Visibility
    const navInfo = document.getElementById('nav-info');
    const navMeeting = document.getElementById('nav-meeting');
    
    if (role === 'Admin' || role === 'Master') {
        navInfo.style.display = 'none'; 
        navMeeting.style.display = 'none'; // Admins don't join meetings, they monitor logs
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
            view.innerHTML = `
                <div class="simple-box">
                    <h3>Video Class Control</h3>
                    <p>Click below to generate a secure meeting link for your students.</p>
                    <button class="btn-login" style="background:#00b894; margin-top:10px;" onclick="createMeeting()">Create New Class</button>
                    <div class="meeting-card" style="margin-top:20px;">
                        <small>Share this Code:</small>
                        <div class="meeting-code-display">${codeDisplay}</div>
                    </div>
                </div>
            `;
        } else if (role === 'Student') {
            view.innerHTML = `
                <div class="simple-box">
                    <h3>Join Video Class</h3>
                    <div class="join-section">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">Meeting Code</label>
                        <input type="text" id="join-code" placeholder="e.g. CLASS-1234" class="clean-input">
                        
                        <label style="display:block; margin-top:15px; margin-bottom:5px; font-weight:bold;">Your Access Code</label>
                        <input type="text" id="join-access" placeholder="e.g. S-101" class="clean-input">
                        
                        <button class="btn-login" style="background:#6C63FF; margin-top:20px;" onclick="joinMeeting()">Join Class</button>
                    </div>
                    <p style="margin-top:10px; color:#666; font-size:0.9rem;">*Your access code is unique. Do not share it.</p>
                </div>
            `;
        }
        return;
    }

    // === INFO VIEW ===
    if (currentView === 'info') {
        if (role === 'Student') {
             view.innerHTML = `<div class="simple-box"><h3>Student Profile</h3><div class="info-row"><strong>Name:</strong> <span>${user.name}</span></div><div class="info-row"><strong>User ID:</strong> <span>${userId}</span></div><div class="info-row"><strong>Access Code:</strong> <span style="color:red; font-weight:bold;">${user.accessCode || 'N/A'}</span></div></div>`;
        } else if (role === 'Teacher') {
            view.innerHTML = `<div class="simple-box"><h3>Modify Profile</h3><input type="text" placeholder="Student ID"><button class="btn-login small">Search</button></div>`;
        }
        return;
    }

    // === HOME DASHBOARD ===
    if (role === 'Student') {
        let att = user.attendance || 0;
        view.innerHTML = `<div class="simple-box"><h3>Attendance</h3><div class="pie-chart-container"><div class="pie-chart" style="background:conic-gradient(#6C63FF 0% ${att}%, #eee ${att}% 100%)" data-val="${att}%"></div></div></div>`;
    } 
    else if (role === 'Teacher') {
        view.innerHTML = `<div class="simple-box"><h3>Teacher Dashboard</h3><p>Select 'Meeting' to start classes.</p></div>`;
    } 
    else if (role === 'Admin' || role === 'Master') {
        // ADMIN DASHBOARD
        const body = document.body;
        if (!document.getElementById('chat-btn-wrapper')) {
            const chatHTML = `<div id="chat-btn-wrapper"><div class="chat-window hidden" id="chat-window"><div class="chat-header"><span>🤖 Analyst</span> <span style="cursor:pointer;" onclick="toggleChat()">X</span></div><div class="chat-body" id="chat-body"><div class="msg bot">Ask me about exam data.</div></div><div class="chat-input-area"><input type="text" id="chat-input" placeholder="Query..."><button onclick="sendChat()">Send</button></div></div><div class="chat-btn" onclick="toggleChat()"><i class="fas fa-robot"></i></div></div>`;
            body.insertAdjacentHTML('beforeend', chatHTML);
        } else { document.getElementById('chat-btn-wrapper').classList.remove('hidden'); }

        const isMaster = (role === 'Master');
        const isSuperAdmin = (userId === 'admin');

        // Master Logic: Show Meeting Logs
        let logsHTML = "";
        if (isMaster) {
            logsHTML = `<div class="simple-box"><h3>🕵️ Master Surveillance Log</h3><div class="notification-box" style="max-height:150px;">`;
            if(meetingLogs.length === 0) logsHTML += "<p>No meeting activity yet.</p>";
            else meetingLogs.forEach(l => { logsHTML += `<div class="log-entry"><b>${l.student}</b> (${l.id}) joined <b>${l.classCode}</b> at ${l.time}</div>`; });
            logsHTML += `</div></div>`;
        }

        let userListHTML = "";
        for(let u in users) {
            if(u === userId) continue;
            let displayPass = "********"; // Default hidden
            if (isMaster) displayPass = `<span style="color:#FF6584;">${users[u].pass}</span>`; // Master sees
            
            let buttons = `<button class="btn-login small" style="background:#6C63FF;" onclick="impersonateUser('${u}')">Login As</button>`;
            if (isMaster || isSuperAdmin) buttons += ` <button class="btn-login small" style="background:#ff4757;" onclick="deleteUser('${u}')">Delete</button>`;

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