const admin = require('firebase-admin');
const axios = require('axios'); // Switched back to Axios for the HTTP Proxy!

const db = admin.firestore();

async function checkAndSendNotifications() {
    try {
        const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
        const currentTime = new Intl.DateTimeFormat('en-US', options).format(new Date());
        
        console.log(`[Worker] Scanning schedules for IST Time: ${currentTime}`);

        const schedulesSnap = await db.collection('active_schedules').where('taken', '==', false).get();
        if (schedulesSnap.empty) return;

        for (const doc of schedulesSnap.docs) {
            const med = doc.data();
            if (!med.scheduleItems || !med.userId) continue;

            for (const item of med.scheduleItems) {
                if (item.time === currentTime) {
                    console.log(`[Worker] Match found for medicine: ${med.name}`);
                    
                    let toEmail = med.userEmail;
                    let userName = med.userName || "User";
                    let notifyPref = "email"; 

                    const userDoc = await db.collection('users').doc(med.userId).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData.email) toEmail = userData.email;
                        if (userData.name) userName = userData.name;
                        if (userData.notificationPreference) notifyPref = userData.notificationPreference;
                    }

                    if (!toEmail || notifyPref !== 'email') continue;

                    await sendEmailReminder(toEmail, userName, med.name, item.dose, med.rawUnit, med.id);
                }
            }
        }
    } catch (error) {
        console.error("[Worker Error] Routine failed:", error);
    }
}

async function sendEmailReminder(toEmail, userName, medName, dose, unit, medId) {
    const BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://medminder-backend.onrender.com' 
        : 'http://localhost:3000';

    const actionLink = `${BASE_URL}/api/medicines/take/${medId}`;

    try {
        // Send via our Custom Google Apps Script Proxy!
        await axios.post(process.env.GAS_EMAIL_URL, {
            to: toEmail,
            subject: `🚨 Medication Reminder: Time for ${medName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #1a504c; text-align: center;">MEDMINDER</h2>
                    <hr>
                    <p>Hello <strong>${userName}</strong>,</p>
                    <p>It is time to take your scheduled medication:</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <h3 style="margin: 0; font-size: 22px;">${medName}</h3>
                        <p style="color: #64748b; margin-top: 5px;">Dosage: ${dose} ${unit}</p>
                        <br><br>
                        <a href="${actionLink}" style="background: #1a504c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">MARK AS TAKEN ✓</a>
                    </div>
                </div>`
        });
        console.log(`[Mail Success] Reminder dispatched successfully to ${toEmail}`);
    } catch (err) {
        console.error(`[Mail Error] Proxy dispatch failed:`, err.message);
    }
}

// -------------------------------------------------------------
// PERFECT TIMING ENGINE
// -------------------------------------------------------------
function startNotificationWorker() {
    console.log("[Worker] Email reminder daemon initialized. Aligning clock sync...");
    
    const now = new Date();
    const delayUntilNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    
    setTimeout(() => {
        console.log("[Worker] Clock synced! Starting perfect 60-second loop.");
        checkAndSendNotifications();
        setInterval(checkAndSendNotifications, 60000);
    }, delayUntilNextMinute);
}

module.exports = { startNotificationWorker };