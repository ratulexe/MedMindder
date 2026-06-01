const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');

// 1. Initialize Express App FIRST so it is available for routes below
const app = express();
const port = process.env.PORT || 3000;

// 2. UptimeRobot Keep-Awake Route (Now safe from initialization errors)
app.get('/', (req, res) => {
    res.status(200).send("MedMinder API is Awake!");
});

// 3. Initialize Firebase Admin (so controllers can safely use the database)
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 4. Import your Routes and Background Services
const medRoutes = require('./routes/medRoutes');
const userRoutes = require('./routes/userRoutes');
const { startNotificationWorker } = require('./services/notificationService'); 

// 5. Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 6. Attach your routes to the "/api" URL prefix
app.use('/api', medRoutes);
app.use('/api/users', userRoutes);

// 7. Start the server
app.listen(port, () => {
    console.log(`🚀 MedMinder Server is running at http://localhost:${port}`);
    
    // 8. Fire up the notification scheduler daemon to run in the background
    startNotificationWorker(); 
});