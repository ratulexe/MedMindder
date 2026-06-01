<h1 align="center">💊 MedMinder – Full-Stack Medication Management System</h1>

<p align="center">
A robust, full-stack medication management web application built using HTML, Tailwind CSS, JavaScript, Node.js, and Firebase. It provides intelligent scheduling, secure authentication, and real-time reminder delivery to combat medication non-adherence.
</p>

<hr/>

<h2>📄 Project Report</h2>
<p>
You can view or download the complete project report from the link below:<br/><br/>
🔗 <a href="https://drive.google.com/file/d/1Sz-zYFxgaQmRoNLfAYmTNQK1hYTS63e7/view?usp=drive_link" target="_blank">Click here to open Project Report</a>
</p>

<hr/>

<h2>🚀 Live Demo</h2>
<ul>
  <li><strong>Website:</strong> <a href="https://medminder-s4.web.app" target="_blank">https://medminder-s4.web.app</a></li>
  <li><strong>GitHub Repository:</strong> <a href="https://github.com/ratulexe/MedMindder" target="_blank">https://github.com/ratulexe/MedMindder</a></li>
</ul>
<p><strong>⚠️ Security Note:</strong> Sensitive environment variables (<code>.env</code>) and Firebase credentials (<code>serviceAccountKey.json</code>) have been intentionally removed from this public repository to protect the live database.</p>

<hr/>

<h2>📌 Features</h2>
<ul>
  <li>🔐 Secure dual-authentication system using passwords and email OTPs</li>
  <li>🔍 Smart hybrid search engine using the NLM API and a local Firestore database</li>
  <li>⏱️ Dynamic scheduling engine (Before Meals, Alternate Days, Specific Intervals, Cyclic)</li>
  <li>📦 Integrated inventory tracking with real-time low-stock alerts</li>
  <li>📊 Visual adherence dashboard displaying "On Time" vs "Late" progress via Chart.js</li>
  <li>🔔 Browser-based background daemon for accurate push notifications</li>
  <li>📄 Capability to digitally export and download the medication schedule as a PNG image</li>
</ul>

<hr/>

<h2>🛠 Technologies Used</h2>
<ul>
  <li><strong>HTML5 & Tailwind CSS</strong> – For structure and a fully responsive, modern UI</li>
  <li><strong>JavaScript (Vanilla)</strong> – For frontend logic, DOM manipulation, and asynchronous data fetching</li>
  <li><strong>Node.js & Express.js</strong> – For server runtime and REST API routing</li>
  <li><strong>Firebase Firestore</strong> – Secure NoSQL cloud database</li>
  <li><strong>Chart.js & Flatpickr</strong> – For interactive data visualization and mobile-friendly calendars</li>
  <li><strong>US NLM API & Google Apps Script</strong> – For clinical drug data fetching and secure email webhooks</li>
</ul>

<hr/>

<h2>🔧 How It Works</h2>
<ol>
  <li>User securely logs in using a hashed password or a temporary 6-digit email OTP.</li>
  <li>User searches for a medicine; JavaScript utilizes <code>Promise.allSettled()</code> to fetch data from both the NLM API and the local database simultaneously.</li>
  <li>User configures a dynamic schedule and links inventory counts.</li>
  <li>A background interval continuously cross-references the user's system time with scheduled doses.</li>
  <li>At the exact scheduled time, the app triggers a native Browser Push Notification.</li>
  <li>When marked as taken, a strict 60-minute grace period algorithm evaluates adherence and updates the visual pie charts.</li>
</ol>

<hr/>

<h2>📂 Project Structure</h2>

<pre>
MedMindder/
│── index.html
│── auth.html
│── css/
│    └── output.css
│── js/
│    ├── app.js
│    └── auth.js
│── backend/
│    ├── server.js
│    ├── routes/
│    └── controllers/
│── .gitignore
│── README.md
</pre>

<hr/>

<h2>🧪 Testing Performed</h2>
<ul>
  <li>✔ Security testing for password hashing and 10-minute OTP expirations</li>
  <li>✔ API optimization testing utilizing 90ms debouncing and concurrent fetching</li>
  <li>✔ Cross-browser and responsive UI testing across mobile, tablet, and desktop</li>
  <li>✔ Testing background notification triggers and the 60-minute grace period algorithms</li>
</ul>

<hr/>

<h2>🧠 What We Learned</h2>
<ul>
  <li>Building a decoupled Client-Server architecture using Node.js and Express</li>
  <li>Performing advanced NoSQL database operations using Firebase Firestore</li>
  <li>Overcoming cloud-hosting SMTP firewalls using Google Apps Script Webhooks</li>
  <li>Handling complex asynchronous JavaScript, DOM manipulation, and search debouncing</li>
  <li>Managing responsive utility-first design using the Tailwind CSS framework</li>
  <li>Using AI tools for guidance, troubleshooting, and improving the structure and quality of both the code and documentation</li>
</ul>

<hr/>

<h2>🔮 Future Enhancements</h2>
<ul>
  <li>Caregiver and Doctor Dashboards for remote patient monitoring</li>
  <li>SMS and WhatsApp alerts integrated via the Twilio API</li>
  <li>Drug-Drug Interaction Warnings to prevent dangerous medication combinations</li>
  <li>Hardware synchronization with wearable technology like Apple Watch or Wear OS</li>
  <li>Dedicated native mobile application using Flutter or React Native</li>
  <li>AI-Powered health insights to suggest optimal intake times based on habits</li>
</ul>

<hr/>

<h2>🙌 Contributors</h2>
<ul>
  <li><strong>Ratul Kole</strong> (24CS2011044)</li>
  <li><strong>Rick Biswas</strong> (24CS2011045)</li>
  <li><strong>Bodheedipta Bose</strong> (24CS2011021)</li>
  <li><strong>Sayan Tunga</strong> (24CS2011053)</li>
  <li><strong>Ajoy Maity</strong> (24CS2011005)</li>
</ul>

<hr/>

<h2>📜 License</h2>
<p>This project was developed for academic and learning purposes as a Bachelor of Technology requirement. It is open-source and freely available for development and reference.</p>
