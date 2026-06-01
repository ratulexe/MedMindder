// ==========================================
// UNIVERSAL CUSTOM ALERT ENGINE
// ==========================================
window.MedAlert = {
    show: function(type, title, message, confirmCallback = null, isConfirm = false) {
        const existing = document.getElementById('med-alert-modal');
        if (existing) existing.remove();

        let iconHtml = '';
        let btnColor = 'bg-[#1a504c] hover:bg-[#133d3a]';
        
        if (type === 'error') {
            iconHtml = '<i class="fa-solid fa-circle-xmark text-5xl text-red-500"></i>';
            btnColor = 'bg-red-500 hover:bg-red-600';
        } else if (type === 'success') {
            iconHtml = '<i class="fa-solid fa-circle-check text-5xl text-teal-500"></i>';
        } else if (type === 'warning') {
            iconHtml = '<i class="fa-solid fa-triangle-exclamation text-5xl text-amber-500"></i>';
            btnColor = 'bg-amber-500 hover:bg-amber-600';
        }

        const html = `
        <div id="med-alert-modal" class="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm modal-backdrop transition-opacity duration-300 opacity-0"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-95 opacity-0 transition-all duration-300 modal-content flex flex-col border border-slate-100">
                <div class="p-6 text-center">
                    <div class="mb-4 flex justify-center drop-shadow-sm">${iconHtml}</div>
                    <h3 class="text-xl font-bold text-slate-800 font-cinzel tracking-wider mb-2">${title}</h3>
                    <p class="text-sm font-medium text-slate-500 leading-relaxed">${message}</p>
                </div>
                <div class="px-6 pb-6 flex gap-3 justify-center">
                    ${isConfirm ? `<button id="med-alert-cancel" class="flex-1 py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm tracking-wide">CANCEL</button>` : ''}
                    <button id="med-alert-ok" class="flex-1 py-3 px-4 ${btnColor} text-white font-bold rounded-xl transition-colors text-sm tracking-wide shadow-md">${isConfirm ? 'CONFIRM' : 'OKAY'}</button>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        
        const modal = document.getElementById('med-alert-modal');
        const backdrop = modal.querySelector('.modal-backdrop');
        const content = modal.querySelector('.modal-content');

        requestAnimationFrame(() => {
            backdrop.classList.remove('opacity-0');
            content.classList.remove('opacity-0', 'scale-95');
        });

        const close = (confirmed) => {
            backdrop.classList.add('opacity-0');
            content.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                modal.remove();
                if (confirmed && confirmCallback) confirmCallback();
            }, 300);
        };

        document.getElementById('med-alert-ok').addEventListener('click', () => close(true));
        if (isConfirm) document.getElementById('med-alert-cancel').addEventListener('click', () => close(false));
    }
};

// ==========================================
// AUTHENTICATION LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'https://medminder-backend.onrender.com';
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const recoverySection = document.getElementById('recovery-section');
    const otpSection = document.getElementById('otp-section');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn2 = document.getElementById('show-login-2');
    const showRecoveryBtn = document.getElementById('forgot-link');
    const showLoginFromRecoveryBtn = document.getElementById('show-login-from-recovery');
    const cancelOtpBtn = document.getElementById('cancel-otp');

    let pendingRegistrationData = null; 

    // --- ANTI-TEMP MAIL ENGINE ---
    const ALLOWED_EMAIL_DOMAINS = [
        'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
        'yahoo.com', 'ymail.com', 'icloud.com', 'me.com', 'mac.com', 'proton.me', 
        'protonmail.com', 'tutanota.com', 'aol.com', 'zoho.com', 'mail.com'
    ];

    function isTrustedEmail(email) {
        if (!email.includes('@')) return false;
        const domain = email.split('@')[1].toLowerCase();
        return ALLOWED_EMAIL_DOMAINS.includes(domain);
    }

    function showSection(sectionToShow) {
        [loginSection, registerSection, recoverySection, otpSection].forEach(sec => {
            if (sec) sec.classList.add('hidden');
        });
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.style.opacity = 0;
            setTimeout(() => sectionToShow.style.opacity = 1, 50);
        }
    }

    showRegisterBtn.addEventListener('click', () => showSection(registerSection));
    showLoginBtn2?.addEventListener('click', () => showSection(loginSection));
    showRecoveryBtn.addEventListener('click', (e) => { e.preventDefault(); showSection(recoverySection); });
    showLoginFromRecoveryBtn.addEventListener('click', () => showSection(loginSection));
    cancelOtpBtn.addEventListener('click', () => { pendingRegistrationData = null; showSection(registerSection); });

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // --- CUSTOM GENDER DROPDOWN UI ---
    const genderBtn = document.getElementById('gender-dropdown-btn');
    const genderMenu = document.getElementById('gender-dropdown-menu');
    const genderText = document.getElementById('gender-dropdown-text');
    const genderIcon = document.getElementById('gender-dropdown-icon');
    const genderInput = document.getElementById('reg-gender');
    const genderOptions = document.querySelectorAll('.gender-option');

    genderBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = genderMenu.classList.contains('opacity-100');
        if (!isOpen) {
            genderMenu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
            genderMenu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
            genderIcon.classList.add('rotate-180');
        } else {
            genderMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            genderMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            genderIcon.classList.remove('rotate-180');
        }
    });

    genderOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            genderText.textContent = opt.textContent;
            genderInput.value = opt.dataset.val;
            genderMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            genderMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            genderIcon.classList.remove('rotate-180');
        });
    });

    document.addEventListener('click', (e) => {
        if (genderBtn && !genderBtn.contains(e.target) && genderMenu && !genderMenu.contains(e.target)) {
            genderMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            genderMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            genderIcon.classList.remove('rotate-180');
        }
    });

    // --- FLATPICKR CALENDAR INITIALIZATION ---
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#reg-dob", {
            dateFormat: "d-m-Y", 
            maxDate: "today", 
            disableMobile: true, 
            allowInput: true 
        });
    }

    const dobInput = document.getElementById('reg-dob');
    if (dobInput) {
        dobInput.addEventListener('input', function(e) {
            let val = this.value.replace(/\D/g, ''); 
            if (val.length > 8) val = val.substring(0, 8);
            if (val.length > 4) {
                this.value = val.substring(0, 2) + '-' + val.substring(2, 4) + '-' + val.substring(4, 8);
            } else if (val.length > 2) {
                this.value = val.substring(0, 2) + '-' + val.substring(2, 4);
            } else {
                this.value = val;
            }
        });
    }

    // --- STRICT PASSWORD VALIDATOR ---
    function validateStrictPassword(pwd, userData) {
        const strictRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[^\s]{8,}$/;
        if (!strictRegex.test(pwd)) return "Password must be at least 8 characters, contain NO spaces, and include at least 1 Uppercase, 1 Lowercase, 1 Number, and 1 Special Character.";
        const lowerPwd = pwd.toLowerCase();
        const forbiddenPatterns = ['1234', '2345', '12345678', 'abcde', 'abcdefgh', 'qwerty', 'asdfgh', 'password', 'password123', 'admin123', 'welcome123'];
        for (let pattern of forbiddenPatterns) if (lowerPwd.includes(pattern)) return `Password cannot contain common or sequential patterns like '${pattern}'.`;
        if (userData.email) {
            const emailUsername = userData.email.split('@')[0].toLowerCase();
            if (emailUsername.length >= 4 && lowerPwd.includes(emailUsername)) return "Security Risk: Password cannot contain your email username.";
        }
        if (userData.phone && userData.phone.length >= 5 && pwd.includes(userData.phone.slice(-5))) return "Security Risk: Password cannot contain parts of your phone number.";
        if (userData.dob) {
            const dobParts = userData.dob.split('-'); 
            if (dobParts.length === 3 && (pwd.includes(dobParts[0]) || pwd.includes(dobParts[0].slice(-2)))) return "Security Risk: Password cannot contain your birth year.";
        }
        return null; 
    }

    // 1. Register Form Submission
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const phone = document.getElementById('reg-phone').value.trim();
        const gender = document.getElementById('reg-gender').value;
        const dob = document.getElementById('reg-dob').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;

        if (!name || !email || !phone || !dob || !password || !confirm) return MedAlert.show('warning', 'Missing Information', 'Please fill out all required fields to continue.');
        if (!isTrustedEmail(email)) return MedAlert.show('error', 'Unsupported Email', 'Please use a trusted email provider (like Gmail, Outlook, Yahoo, Apple, etc.). Disposable emails are blocked for security.');
        if (phone.length !== 10) return MedAlert.show('warning', 'Invalid Phone', 'Contact number must be exactly 10 digits.');
        if (password !== confirm) return MedAlert.show('error', 'Registration Error', 'The passwords you entered do not match!');

        const passwordError = validateStrictPassword(password, { email, phone, dob });
        if (passwordError) return MedAlert.show('error', 'Weak Password', passwordError);

        pendingRegistrationData = { name, email, phone, gender, dob, password };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GENERATING OTP...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/users/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingRegistrationData.email, name: pendingRegistrationData.name })
            });

            if (!res.ok && !res.headers.get('content-type')?.includes('application/json')) throw new Error("Backend server crashed. Check Render logs.");

            const data = await res.json();
            if (data.error) {
                MedAlert.show('error', 'Failed to Send', data.error);
                submitBtn.innerText = 'REGISTER ACCOUNT';
                submitBtn.disabled = false;
            } else {
                showSection(otpSection);
                submitBtn.innerText = 'REGISTER ACCOUNT';
                submitBtn.disabled = false;
            }
        } catch (err) { 
            MedAlert.show('error', 'Server Error', 'The backend server failed to respond. Please check your Render logs.');
            submitBtn.innerText = 'REGISTER ACCOUNT';
            submitBtn.disabled = false;
        }
    });

    // 2. Complete Account Registration via OTP
    document.getElementById('otp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const otpCode = document.getElementById('otp-code').value.trim();
        
        if (!otpCode) return MedAlert.show('warning', 'Missing Code', 'Please enter the 6-digit OTP code sent to your email.');

        const submitBtn = document.getElementById('btn-verify-otp');
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> COMPLETING REGISTRATION...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/users/verify-register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...pendingRegistrationData, otp: otpCode })
            });

            if (!res.ok && !res.headers.get('content-type')?.includes('application/json')) throw new Error("Server Crash");

            const data = await res.json();

            if (data.error) {
                MedAlert.show('error', 'Verification Failed', data.error);
                submitBtn.innerText = 'COMPLETE REGISTRATION';
                submitBtn.disabled = false;
            } else {
                MedAlert.show('success', 'Welcome!', 'Your MedMinder account was created successfully!', () => {
                    localStorage.setItem('medminder_user', JSON.stringify(data));
                    window.location.href = 'index.html';
                });
            }
        } catch {
            MedAlert.show('error', 'Server Error', 'The verification process timed out.');
            submitBtn.innerText = 'COMPLETE REGISTRATION';
            submitBtn.disabled = false;
        }
    });

    // 3. User Login (Password)
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginId = document.getElementById('login-id').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!loginId || !password) return MedAlert.show('warning', 'Missing Information', 'Please enter your email/phone and password.');
        if (loginId.includes('@') && !isTrustedEmail(loginId)) return MedAlert.show('error', 'Unsupported Email', 'Please login using a trusted email provider.');

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> CONNECTING...';
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, password })
            });
            
            if (!res.ok && !res.headers.get('content-type')?.includes('application/json')) throw new Error("Server Crash");

            const data = await res.json();

            if (data.error) {
                MedAlert.show('error', 'Login Failed', data.error);
                submitBtn.innerText = 'LOGIN';
                submitBtn.disabled = false;
            } else {
                localStorage.setItem('medminder_user', JSON.stringify(data));
                window.location.href = 'index.html';
            }
        } catch { 
            MedAlert.show('error', 'Server Error', 'Server connection failed. Please try again.');
            submitBtn.innerText = 'LOGIN';
            submitBtn.disabled = false;
        }
    });

    // 4. Secure 2-Step Recovery System
    const recoverInput = document.getElementById('recover-type');
    const recoverIdentifier = document.getElementById('recover-identifier');
    const passwordResetGroup = document.getElementById('password-reset-group');
    const btnSendOtp = document.getElementById('btn-send-recovery-otp');
    const btnSubmitRecovery = document.getElementById('btn-submit-recovery');
    const recoverOtpInput = document.getElementById('recover-otp');
    const recoverPasswordInput = document.getElementById('recover-password');

    // --- CUSTOM RECOVERY DROPDOWN UI ---
    const recoverBtn = document.getElementById('recover-dropdown-btn');
    const recoverMenu = document.getElementById('recover-dropdown-menu');
    const recoverText = document.getElementById('recover-dropdown-text');
    const recoverIcon = document.getElementById('recover-dropdown-icon');
    const recoverOptions = document.querySelectorAll('.recover-option');

    recoverBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = recoverMenu.classList.contains('opacity-100');
        if (!isOpen) {
            recoverMenu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
            recoverMenu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
            recoverIcon.classList.add('rotate-180');
        } else {
            recoverMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            recoverMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            recoverIcon.classList.remove('rotate-180');
        }
    });

    recoverOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.dataset.val;
            recoverText.textContent = opt.textContent;
            recoverInput.value = val;
            
            recoverMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            recoverMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            recoverIcon.classList.remove('rotate-180');

            passwordResetGroup.classList.add('hidden');
            recoverIdentifier.disabled = false;
            recoverOtpInput.value = '';
            recoverPasswordInput.value = '';
            
            if (val === 'password') {
                btnSendOtp.classList.remove('hidden');
                btnSubmitRecovery.classList.add('hidden');
                btnSendOtp.innerText = 'SEND OTP';
            } else {
                btnSendOtp.classList.add('hidden');
                btnSubmitRecovery.classList.remove('hidden');
                btnSubmitRecovery.innerText = 'RECOVER DETAILS';
            }
        });
    });

    document.addEventListener('click', (e) => {
        if (recoverBtn && !recoverBtn.contains(e.target) && recoverMenu && !recoverMenu.contains(e.target)) {
            recoverMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
            recoverMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
            recoverIcon.classList.remove('rotate-180');
        }
    });

    btnSendOtp.addEventListener('click', async () => {
        const identifier = recoverIdentifier.value.trim().toLowerCase();
        if (!identifier) return MedAlert.show('warning', 'Missing Information', 'Please enter your registered Gmail or Contact Number.');
        if (identifier.includes('@') && !isTrustedEmail(identifier)) return MedAlert.show('error', 'Unsupported Email', 'Please enter a trusted email provider.');
        
        btnSendOtp.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SENDING...';
        btnSendOtp.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/users/send-recovery-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            const data = await res.json();

            if (data.error) {
                MedAlert.show('error', 'Failed', data.error);
                btnSendOtp.innerText = 'SEND OTP';
                btnSendOtp.disabled = false;
            } else {
                MedAlert.show('success', 'OTP Sent!', data.message);
                btnSendOtp.classList.add('hidden');
                passwordResetGroup.classList.remove('hidden');
                btnSubmitRecovery.classList.remove('hidden');
                btnSubmitRecovery.innerText = 'RESET PASSWORD';
                recoverIdentifier.disabled = true; 
            }
        } catch {
            MedAlert.show('error', 'Connection Error', 'Server connection failed.');
            btnSendOtp.innerText = 'SEND OTP';
            btnSendOtp.disabled = false;
        }
    });

    document.getElementById('recovery-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recoverType = recoverInput.value;
        const identifier = recoverIdentifier.value.trim().toLowerCase();
        
        if (identifier.includes('@') && !isTrustedEmail(identifier)) return MedAlert.show('error', 'Unsupported Email', 'Please use a trusted email provider.');

        btnSubmitRecovery.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';
        btnSubmitRecovery.disabled = true;

        if (recoverType === 'password') {
            const otp = recoverOtpInput.value.trim();
            const newPassword = recoverPasswordInput.value;

            if (!otp || !newPassword) {
                btnSubmitRecovery.innerText = 'RESET PASSWORD';
                btnSubmitRecovery.disabled = false;
                return MedAlert.show('warning', 'Missing Information', 'Please enter the 6-digit OTP and your new password.');
            }

            const passwordError = validateStrictPassword(newPassword, { email: identifier, phone: identifier });
            if (passwordError) {
                btnSubmitRecovery.innerText = 'RESET PASSWORD';
                btnSubmitRecovery.disabled = false;
                return MedAlert.show('error', 'Weak Password', passwordError);
            }

            try {
                const res = await fetch(`${API_BASE}/api/users/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, otp, newPassword })
                });
                const data = await res.json();

                if (data.error) {
                    MedAlert.show('error', 'Reset Failed', data.error);
                } else {
                    MedAlert.show('success', 'Success', data.message, () => {
                        document.getElementById('recovery-form').reset();
                        recoverIdentifier.disabled = false;
                        passwordResetGroup.classList.add('hidden');
                        btnSendOtp.classList.remove('hidden');
                        btnSubmitRecovery.classList.add('hidden');
                        showSection(loginSection); 
                    });
                }
            } catch {
                MedAlert.show('error', 'Connection Error', 'Server connection failed.');
            } finally {
                btnSubmitRecovery.innerText = 'RESET PASSWORD';
                btnSubmitRecovery.disabled = false;
            }

        } else {
            try {
                const res = await fetch(`${API_BASE}/api/users/recover`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recoverType, identifier })
                });
                const data = await res.json();

                if (data.error) {
                    MedAlert.show('error', 'Recovery Failed', data.error);
                } else {
                    MedAlert.show('success', 'Details Found', data.message);
                }
            } catch {
                MedAlert.show('error', 'Connection Error', 'Server connection failed.');
            } finally {
                btnSubmitRecovery.innerText = 'RECOVER DETAILS';
                btnSubmitRecovery.disabled = false;
            }
        }
    });
});