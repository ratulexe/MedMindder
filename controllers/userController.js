const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

const db = admin.firestore();

// 🚀 THE MAGIC TUNNEL: Bypasses Render's firewall by using Google Apps Script over HTTPS
async function sendSecureEmail(toEmail, subject, htmlContent) {
    const gasUrl = process.env.GAS_EMAIL_URL;
    if (!gasUrl) throw new Error("GAS_EMAIL_URL is missing in Render Environment Variables.");

    const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' }, 
        body: JSON.stringify({
            to: toEmail,
            subject: subject,
            html: htmlContent
        })
    });
    
    if (!response.ok) throw new Error("Failed to trigger Google Script tunnel.");
    return true;
}

// 1. Generate and Send OTP via Google Webhook
exports.sendRegistrationOTP = async (req, res) => {
    try {
        const { email, name } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();
        
        const existing = await db.collection('users').where('email', '==', normalizedEmail).get();
        if (!existing.empty) {
            return res.status(400).json({ error: "This email address is already registered." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await db.collection('otps').doc(normalizedEmail).set({
            otp: otp,
            expiresAt: Date.now() + 10 * 60 * 1000 
        });

        try {
            const htmlTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; padding-bottom: 15px;">
                        <img src="https://medminder-s4.web.app/logo/icon-192.png" alt="MedMinder Logo" style="width: 75px; height: 75px; border-radius: 18px;">
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Thank you for registering! Your 6-digit verification code is:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #1a504c; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 10 minutes.</p>
                </div>`;

            // Removed the emoji and replaced with standard text
            await sendSecureEmail(normalizedEmail, '[MedMinder] Your Registration Code', htmlTemplate);
            return res.json({ success: true, message: "Verification code dispatched to your email." });

        } catch (mailError) {
            console.error("GAS Tunnel Error:", mailError.message);
            return res.status(500).json({ error: "Failed to send verification code email. Please check server logs." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to process verification request." });
    }
};

// 2. Verify OTP code and create account document
exports.verifyOTPAndRegister = async (req, res) => {
    try {
        const { otp, name, email, phone, gender, dob, password } = req.body;
        const normalizedEmail = String(email).trim().toLowerCase();

        const otpDoc = await db.collection('otps').doc(normalizedEmail).get();
        if (!otpDoc.exists) return res.status(400).json({ error: "No verification request found for this email." });

        const otpData = otpDoc.data();
        if (otpData.otp !== String(otp).trim()) return res.status(400).json({ error: "The entered code is incorrect." });
        if (Date.now() > otpData.expiresAt) return res.status(400).json({ error: "This code has expired. Please request a new one." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUserRef = await db.collection('users').add({
            name: String(name).trim(),
            email: normalizedEmail,
            phone: String(phone).trim(),
            gender: String(gender).trim(),
            dob: String(dob).trim(),
            password: hashedPassword, 
            notificationPreference: 'email',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('otps').doc(normalizedEmail).delete();

        return res.json({ 
            userId: newUserRef.id, 
            name: String(name).trim(), 
            email: normalizedEmail, 
            gender: String(gender).trim() 
        });
    } catch (error) {
        return res.status(500).json({ error: "Account creation process failed." });
    }
};

// 3. Authenticate User
exports.loginUser = async (req, res) => {
    try {
        const { loginId, password } = req.body;
        const identifier = String(loginId).trim().toLowerCase();
        
        const emailSnap = await db.collection('users').where('email', '==', identifier).get();
        const phoneSnap = await db.collection('users').where('phone', '==', identifier).get();

        let userDoc;
        if (!emailSnap.empty) userDoc = emailSnap.docs[0];
        else if (!phoneSnap.empty) userDoc = phoneSnap.docs[0];

        if (!userDoc) return res.status(400).json({ error: "No account found matching those details." });

        const userData = userDoc.data();
        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) return res.status(400).json({ error: "Incorrect password entry." });

        return res.json({ 
            userId: userDoc.id, 
            name: userData.name, 
            email: userData.email, 
            gender: userData.gender 
        });
    } catch (error) {
        return res.status(500).json({ error: "Authentication system failure." });
    }
};

// 4. Fetch User Data Profile
exports.getUserProfile = async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.id).get();
        if (!userDoc.exists) return res.status(404).json({ error: "Profile document record missing." });
        
        const data = userDoc.data();
        return res.json({
            name: data.name,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            dob: data.dob
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to retrieve profile record details." });
    }
};

// 5. Update Alert Routing Configuration Settings
exports.updateNotificationPreference = async (req, res) => {
    try {
        const { userId, preference } = req.body;
        await db.collection('users').doc(userId).update({ notificationPreference: preference });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to apply profile preference update." });
    }
};

// 6. Generate and Send OTP for Password Recovery via Google Webhook
exports.sendRecoveryOTP = async (req, res) => {
    try {
        const { identifier } = req.body;
        const term = String(identifier).trim().toLowerCase();
        
        const snap = await db.collection('users').where('email', '==', term).get();
        const snapPhone = await db.collection('users').where('phone', '==', term).get();
        
        let userDoc = !snap.empty ? snap.docs[0] : (!snapPhone.empty ? snapPhone.docs[0] : null);
        if (!userDoc) return res.status(404).json({ error: "No account found matching those details." });

        const userEmail = userDoc.data().email;
        const userName = userDoc.data().name;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.collection('otps').doc(userEmail).set({
            otp: otp,
            expiresAt: Date.now() + 10 * 60 * 1000 
        });

        try {
            const htmlTemplate = `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; padding-bottom: 15px;">
                        <img src="https://medminder-s4.web.app/logo/icon-192.png" alt="MedMinder Logo" style="width: 75px; height: 75px; border-radius: 18px;">
                    </div>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <p>Hello <strong>${userName}</strong>,</p>
                    <p>We received a request to reset your password. Your 6-digit verification code is:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <h1 style="font-size: 32px; letter-spacing: 5px; color: #1a504c; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #64748b; font-size: 12px; text-align: center;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>`;

            // Removed the emoji and replaced with standard text
            await sendSecureEmail(userEmail, '[MedMinder] Password Reset Code', htmlTemplate);

            const maskedEmail = userEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp1 + gp2.replace(/./g, '*') + gp3);
            return res.json({ success: true, message: `A secure OTP has been sent to your registered email (${maskedEmail}).` });

        } catch (mailError) {
            console.error("Recovery GAS Tunnel Error:", mailError.message);
            return res.status(500).json({ error: "Failed to dispatch recovery email." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to process recovery request." });
    }
};

// 7. Verify OTP and securely apply New Password
exports.resetPasswordWithOTP = async (req, res) => {
    try {
        const { identifier, otp, newPassword } = req.body;
        const term = String(identifier).trim().toLowerCase();

        const snap = await db.collection('users').where('email', '==', term).get();
        const snapPhone = await db.collection('users').where('phone', '==', term).get();
        
        let userDoc = !snap.empty ? snap.docs[0] : (!snapPhone.empty ? snapPhone.docs[0] : null);
        if (!userDoc) return res.status(404).json({ error: "Account lookup failed." });

        const userEmail = userDoc.data().email;

        const otpDoc = await db.collection('otps').doc(userEmail).get();
        if (!otpDoc.exists) return res.status(400).json({ error: "No reset request found or code has expired." });

        const otpData = otpDoc.data();
        if (otpData.otp !== String(otp).trim()) return res.status(400).json({ error: "The entered code is incorrect." });
        if (Date.now() > otpData.expiresAt) return res.status(400).json({ error: "This code has expired. Please request a new one." });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await userDoc.ref.update({ password: hashed });

        await db.collection('otps').doc(userEmail).delete();

        return res.json({ success: true, message: "Your password has been successfully updated!" });
    } catch (error) {
        return res.status(500).json({ error: "Failed to reset password." });
    }
};

// 8. Basic Account Detail Recovery (Email or Phone Reminders)
exports.recoverCredentials = async (req, res) => {
    try {
        const { recoverType, identifier } = req.body;
        const term = String(identifier).trim().toLowerCase();
        
        const snap = await db.collection('users').where('email', '==', term).get();
        const snapPhone = await db.collection('users').where('phone', '==', term).get();
        
        let targetDoc = !snap.empty ? snap.docs[0] : (!snapPhone.empty ? snapPhone.docs[0] : null);
        if (!targetDoc) return res.status(404).json({ error: "No matching database profile records found." });

        if (recoverType === 'email') {
            return res.json({ message: `Your registered email is: ${targetDoc.data().email}` });
        } else if (recoverType === 'phone') {
            return res.json({ message: `Your registered contact number is: ${targetDoc.data().phone}` });
        } else {
            return res.status(400).json({ error: "Invalid recovery type selected." });
        }
    } catch (error) {
        return res.status(500).json({ error: "Credential recovery operation failed." });
    }
};