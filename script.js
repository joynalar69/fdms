// ============ ফুয়েল লিমিট কনফিগারেশন ============
const FUEL_LIMITS = {
    private: {
        bike: 2,
        car: 8,
        truck: 20
    },
    rental_marketing: {
        bike: 3,
        car: 12,
        truck: 30
    }
};

const VEHICLE_NAMES = {
    bike: 'বাইক',
    car: 'গাড়ি',
    truck: 'ট্রাক/পিকআপ'
};

// ============ গ্লোবাল ভেরিয়েবল ============
let users = [];
let transactions = [];

// ============ ডাটা লোড ও সেভ ============
function loadData() {
    const storedUsers = localStorage.getItem('fdms_users_final_v4');
    const storedTransactions = localStorage.getItem('fdms_transactions_final_v4');
    
    if (storedUsers) {
        users = JSON.parse(storedUsers);
    } else {
        // ডেমো ইউজার 4455 - ১২ ঘন্টা আগে ২ লিটার নিয়েছে
        users = [{
            id: 1,
            fullName: 'মোঃ রহিম উদ্দিন',
            nid: '1234567890',
            vehicleNo: '4455',
            vehicleType: 'bike',
            ownershipType: 'private',
            mobile: '01712345678',
            idCardNumber: null,
            companyName: null,
            registrationDate: new Date().toISOString(),
            lastFuelTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            lastFuelAmount: 2,
            totalFuelTaken: 2,
            isVerified: true
        }];
        localStorage.setItem('fdms_users_final_v4', JSON.stringify(users));
    }
    
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    } else {
        transactions = [{
            id: Date.now(),
            vehicleNo: '4455',
            ownerName: 'মোঃ রহিম উদ্দিন',
            amount: 2,
            dateTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            operator: 'পাম্প এডমিন'
        }];
        localStorage.setItem('fdms_transactions_final_v4', JSON.stringify(transactions));
    }
}

function saveUsers() {
    localStorage.setItem('fdms_users_final_v4', JSON.stringify(users));
}

function saveTransactions() {
    localStorage.setItem('fdms_transactions_final_v4', JSON.stringify(transactions));
}

// ============ চেক লগইন ============
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('pumpLoggedIn');
    if (!isLoggedIn && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'login.html';
    }
}

// ============ রেজিস্ট্রেশন ============
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const nid = document.getElementById('nid').value;
        const vehicleNo = document.getElementById('vehicleNo').value.toUpperCase();
        const vehicleType = document.getElementById('vehicleType').value;
        const ownershipType = document.getElementById('ownershipType').value;
        const mobile = document.getElementById('mobile').value;
        
        let idCardNumber = null;
        let companyName = null;
        
        if (ownershipType === 'rental_marketing') {
            idCardNumber = document.getElementById('idCardNumber').value;
            companyName = document.getElementById('companyName').value;
            
            if (!idCardNumber) {
                document.getElementById('registerMessage').innerHTML = '<div class="alert alert-error">❌ আইডি কার্ড নম্বর প্রয়োজন!</div>';
                return;
            }
            if (!companyName) {
                document.getElementById('registerMessage').innerHTML = '<div class="alert alert-error">❌ কোম্পানির নাম প্রয়োজন!</div>';
                return;
            }
        }
        
        if (users.find(u => u.nid === nid)) {
            document.getElementById('registerMessage').innerHTML = '<div class="alert alert-error">❌ এই NID দিয়ে আগে রেজিস্ট্রেশন আছে!</div>';
            return;
        }
        
        if (users.find(u => u.vehicleNo === vehicleNo)) {
            document.getElementById('registerMessage').innerHTML = '<div class="alert alert-error">❌ এই গাড়ির নম্বর আগে রেজিস্ট্রেশন করা আছে!</div>';
            return;
        }
        
        const newUser = {
            id: Date.now(),
            fullName, nid, vehicleNo, vehicleType, ownershipType, mobile,
            idCardNumber, companyName,
            registrationDate: new Date().toISOString(),
            lastFuelTime: null, lastFuelAmount: 0, totalFuelTaken: 0,
            isVerified: ownershipType === 'private'
        };
        
        users.push(newUser);
        saveUsers();
        
        document.getElementById('registerForm').reset();
        const idCardSection = document.getElementById('idCardSection');
        if (idCardSection) idCardSection.classList.add('hidden');
        document.getElementById('registerMessage').innerHTML = '<div class="alert alert-success">✅ রেজিস্ট্রেশন সফল! পাম্প এডমিন লগইন করে তেল দিতে পারেন।</div>';
        
        setTimeout(() => {
            const msgDiv = document.getElementById('registerMessage');
            if (msgDiv) msgDiv.innerHTML = '';
        }, 3000);
    });
}

// ============ লগইন ============
function handleLogin() {
    const adminCode = document.getElementById('adminCode').value;
    
    if (adminCode === 'admin123') {
        sessionStorage.setItem('pumpLoggedIn', 'true');
        window.location.href = 'dashboard.html';
    } else {
        document.getElementById('loginMessage').innerHTML = '<div class="alert alert-error">❌ ভুল পাম্প কোড!</div>';
    }
}

// ============ সার্চ গাড়ি (পাম্প কর্তৃপক্ষ) ============
function searchVehicle() {
    const vehicleNo = document.getElementById('searchVehicle').value.toUpperCase();
    const user = users.find(u => u.vehicleNo === vehicleNo);
    const vehicleInfoDiv = document.getElementById('vehicleInfo');
    
    if (!user) {
        if (vehicleInfoDiv) {
            vehicleInfoDiv.innerHTML = '<div class="alert alert-error">❌ গাড়ির নম্বর পাওয়া যায়নি! প্রথমে রেজিস্ট্রেশন করুন।</div>';
        }
        return;
    }
    
    const lastFuel = user.lastFuelTime ? new Date(user.lastFuelTime) : null;
    const now = new Date();
    const hoursSinceLastFuel = lastFuel ? (now - lastFuel) / (1000 * 60 * 60) : 24;
    const canTakeFuel = !lastFuel || hoursSinceLastFuel >= 24;
    const limit = FUEL_LIMITS[user.ownershipType][user.vehicleType];
    
    let nextAvailableTime = '';
    let statusBadge = '';
    let statusMessage = '';
    
    if (!canTakeFuel && lastFuel) {
        const nextAvailable = new Date(lastFuel.getTime() + 24 * 60 * 60 * 1000);
        const remainingHours = Math.floor((nextAvailable - now) / (1000 * 60 * 60));
        const remainingMinutes = Math.floor(((nextAvailable - now) % (1000 * 60 * 60)) / (1000 * 60));
        nextAvailableTime = `${remainingHours} ঘন্টা ${remainingMinutes} মিনিট`;
        statusBadge = '<span class="status-badge status-blocked">⛔ তেল দেওয়া যাবে না</span>';
        statusMessage = `<div class="alert alert-warning">
            <strong>⚠️ ২৪ ঘণ্টা পূর্ণ হয়নি!</strong><br>
            সর্বশেষ তেল নেওয়া: ${lastFuel.toLocaleString()}<br>
            পরবর্তী তেল নেওয়া যাবে: ${nextAvailable.toLocaleString()}<br>
            বাকি সময়: ${nextAvailableTime}
        </div>`;
    } else {
        statusBadge = '<span class="status-badge status-allowed">✅ তেল দেওয়া যাবে</span>';
        statusMessage = `<div class="alert alert-success">
            <strong>✅ এই গাড়িটি তেল নিতে পারবে!</strong><br>
            সর্বশেষ তেল নেওয়া: ${lastFuel ? lastFuel.toLocaleString() : 'কখনো নেয়নি'}<br>
            দৈনিক লিমিট: ${limit} লিটার
        </div>`;
    }
    
    let verificationStatus = '';
    if (user.ownershipType === 'rental_marketing' && !user.isVerified) {
        verificationStatus = `
            <div class="alert alert-warning">
                ⚠️ এই গাড়িটি এখনও ভেরিফাইড নয়! 
                <button onclick="verifyVehicle('${user.vehicleNo}')" class="btn-primary" style="margin-left: 10px;">✅ ভেরিফাই করুন</button>
            </div>
        `;
    }
    
    let ownershipInfo = '';
    if (user.ownershipType === 'rental_marketing') {
        const extraLimit = limit - FUEL_LIMITS.private[user.vehicleType];
        ownershipInfo = `
            <br><strong>🚕 ধরন:</strong> ভাড়া/মার্কেটিং 
            <span class="status-badge status-allowed">+${extraLimit} লিটার বেশি</span><br>
            <strong>🆔 আইডি কার্ড:</strong> ${user.idCardNumber || 'N/A'}<br>
            <strong>🏢 কোম্পানি:</strong> ${user.companyName || 'N/A'}
        `;
    } else {
        ownershipInfo = `<br><strong>🏠 ধরন:</strong> মালিকানা গাড়ি (স্ট্যান্ডার্ড লিমিট)`;
    }
    
    let html = `
        <div class="dashboard-info">
            <div class="info-box">
                <strong>👤 মালিকের নাম:</strong> ${user.fullName}<br>
                <strong>🚗 গাড়ির নম্বর:</strong> ${user.vehicleNo}<br>
                <strong>🚙 গাড়ির ধরন:</strong> ${VEHICLE_NAMES[user.vehicleType]}${ownershipInfo}<br>
                <strong>📞 মোবাইল:</strong> ${user.mobile}<br>
                <strong>📊 মোট তেল গ্রহণ:</strong> ${user.totalFuelTaken || 0} লিটার
            </div>
            <div class="info-box">
                <strong>⛽ দৈনিক লিমিট:</strong> ${limit} লিটার/দিন<br>
                <strong>📅 শেষ তেল গ্রহণ:</strong> ${lastFuel ? lastFuel.toLocaleString() : 'কখনো নেয়নি'}<br>
                <strong>⛽ শেষ পরিমাণ:</strong> ${user.lastFuelAmount || 0} লিটার<br>
                <strong>${statusBadge}</strong>
            </div>
        </div>
        ${verificationStatus}
        ${statusMessage}
    `;
    
    // তেল দেওয়ার ফর্ম - শুধুমাত্র যদি তেল দেওয়া যায়
    if (canTakeFuel && (user.ownershipType === 'private' || user.isVerified)) {
        html += `
            <div class="form-group" style="margin-top: 20px; border-top: 2px solid #28a745; padding-top: 20px;">
                <label style="font-size: 18px; font-weight: bold;">⛽ তেল বিতরণ করুন</label>
                <label>পরিমাণ (লিটার):</label>
                <input type="number" id="fuelAmount_${user.vehicleNo}" min="1" max="${limit}" step="0.5" value="${limit}">
                <button onclick="dispenseFuel('${user.vehicleNo}')" class="btn-primary" style="margin-top: 10px; width: 100%;">✅ তেল বিতরণ করুন</button>
            </div>
        `;
    } else if (canTakeFuel && user.ownershipType === 'rental_marketing' && !user.isVerified) {
        html += '<div class="alert alert-warning" style="margin-top: 20px;">⚠️ ভেরিফিকেশন প্রয়োজন! উপরে ভেরিফাই বাটনে ক্লিক করুন।</div>';
    }
    
    if (vehicleInfoDiv) {
        vehicleInfoDiv.innerHTML = html;
    }
}

// ============ গাড়ি ভেরিফাই ============
function verifyVehicle(vehicleNo) {
    const userIndex = users.findIndex(u => u.vehicleNo === vehicleNo);
    if (userIndex !== -1) {
        users[userIndex].isVerified = true;
        saveUsers();
        const resultDiv = document.getElementById('fuelRequestResult');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="alert alert-success">✅ গাড়িটি ভেরিফাইড করা হয়েছে! এখন তেল দিতে পারবেন。</div>';
        }
        setTimeout(() => {
            if (resultDiv) resultDiv.innerHTML = '';
            searchVehicle();
        }, 1500);
    }
}

// ============ তেল বিতরণ (পাম্প কর্তৃপক্ষ করবেন) ============
function dispenseFuel(vehicleNo) {
    const fuelInput = document.getElementById(`fuelAmount_${vehicleNo}`);
    if (!fuelInput) {
        console.error('Fuel input not found');
        return;
    }
    
    const amount = parseFloat(fuelInput.value);
    const userIndex = users.findIndex(u => u.vehicleNo === vehicleNo);
    const resultDiv = document.getElementById('fuelRequestResult');
    
    if (userIndex === -1) {
        if (resultDiv) resultDiv.innerHTML = '<div class="alert alert-error">❌ গাড়ি পাওয়া যায়নি!</div>';
        return;
    }
    
    const user = users[userIndex];
    const limit = FUEL_LIMITS[user.ownershipType][user.vehicleType];
    const lastFuel = user.lastFuelTime ? new Date(user.lastFuelTime) : null;
    
    // ২৪ ঘণ্টা চেক
    if (lastFuel && (new Date() - lastFuel) < 24 * 60 * 60 * 1000) {
        const nextAvailable = new Date(lastFuel.getTime() + 24 * 60 * 60 * 1000);
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="alert alert-error">
                    ❌ ২৪ ঘণ্টার মধ্যে তেল দেওয়া সম্ভব নয়!<br>
                    পরবর্তী সময়: ${nextAvailable.toLocaleString()}
                </div>
            `;
        }
        return;
    }
    
    // লিমিট চেক
    if (isNaN(amount) || amount < 1 || amount > limit) {
        if (resultDiv) {
            resultDiv.innerHTML = `<div class="alert alert-error">❌ ১ থেকে ${limit} লিটার পর্যন্ত দিতে পারবেন!</div>`;
        }
        return;
    }
    
    // ইউজার আপডেট
    users[userIndex].lastFuelTime = new Date().toISOString();
    users[userIndex].lastFuelAmount = amount;
    users[userIndex].totalFuelTaken = (users[userIndex].totalFuelTaken || 0) + amount;
    saveUsers();
    
    // ট্রানজেকশন সেভ
    const transaction = {
        id: Date.now(),
        vehicleNo: user.vehicleNo,
        ownerName: user.fullName,
        amount: amount,
        dateTime: new Date().toISOString(),
        operator: 'পাম্প এডমিন'
    };
    transactions.push(transaction);
    saveTransactions();
    
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="alert alert-success">
                ✅ ${amount} লিটার তেল বিতরণ করা হয়েছে!<br>
                📅 সময়: ${new Date().toLocaleString()}<br>
                🚗 গাড়ি: ${user.vehicleNo} (${user.fullName})
            </div>
        `;
    }
    
    // রিফ্রেশ
    setTimeout(() => {
        searchVehicle();
        loadAllTransactions();
        if (resultDiv) {
            setTimeout(() => {
                resultDiv.innerHTML = '';
            }, 2000);
        }
    }, 1000);
}

// ============ সকল লেনদেন দেখানো ============
function loadAllTransactions() {
    const transactionsDiv = document.getElementById('allTransactions');
    if (!transactionsDiv) return;
    
    if (transactions.length === 0) {
        transactionsDiv.innerHTML = '<div class="alert alert-info">📊 এখনো কোন লেনদেন হয়নি।</div>';
        return;
    }
    
    let html = '';
    transactions.slice().reverse().forEach(t => {
        const date = new Date(t.dateTime);
        html += `
            <div class="transaction-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>🚗 ${t.vehicleNo}</strong> - ${t.ownerName}<br>
                        <small>📅 ${date.toLocaleDateString('bn-BD')} | ⏰ ${date.toLocaleTimeString('bn-BD')}</small><br>
                        <small>⛽ ${t.amount} লিটার | 👨‍💼 ${t.operator}</small>
                    </div>
                    <div style="font-size: 20px;">✅</div>
                </div>
            </div>
        `;
    });
    transactionsDiv.innerHTML = html;
}

// ============ টগল ফাংশন ============
function toggleIdCardUpload() {
    const ownershipTypeSelect = document.getElementById('ownershipType');
    const idCardSection = document.getElementById('idCardSection');
    
    if (ownershipTypeSelect && idCardSection) {
        if (ownershipTypeSelect.value === 'rental_marketing') {
            idCardSection.classList.remove('hidden');
        } else {
            idCardSection.classList.add('hidden');
        }
    }
}

// ============ লগআউট ============
function logout() {
    sessionStorage.removeItem('pumpLoggedIn');
    window.location.href = 'index.html';
}

// ============ স্টার্টআপ ============
loadData();
checkLoginStatus();

// ড্যাশবোর্ড পেজে থাকলে লেনদেন লোড করো
if (window.location.pathname.includes('dashboard.html')) {
    loadAllTransactions();
}

// গ্লোবাল ফাংশন এক্সপোর্ট
window.searchVehicle = searchVehicle;
window.verifyVehicle = verifyVehicle;
window.dispenseFuel = dispenseFuel;
window.handleLogin = handleLogin;
window.logout = logout;
window.toggleIdCardUpload = toggleIdCardUpload;