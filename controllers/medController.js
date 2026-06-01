const admin = require('firebase-admin');
const axios = require('axios');

const db = admin.firestore();
const searchCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const NLM_TIMEOUT_MS = 450;

function normalizeQuery(q) { return String(q || '').trim(); }
function cacheGet(key) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { searchCache.delete(key); return null; }
  return entry.value;
}
function cacheSet(key, value) { searchCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS }); }
function dedupeResults(results) {
  const seen = new Set();
  return results.filter(item => {
    const key = `${String(item.name || '').toLowerCase()}|${String(item.dosage || '').toLowerCase()}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  });
}

// UPGRADED: Now searches both Firestore and NLM simultaneously 
exports.searchMeds = async (req, res) => {
  try {
    const query = normalizeQuery(req.query.q);
    if (!query) return res.json([]);
    const cacheKey = query.toLowerCase();
    const cached = cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const qLower = query.toLowerCase();
    let combinedResults = [];

    // 1. Fetch custom medicines from your local_medicines collection
    try {
      const snapshot = await db.collection('local_medicines').get();
      snapshot.forEach(doc => {
        const data = doc.data();
        const brandName = data.brandName || '';
        const genericName = data.genericName || '';
        
        // Smart search matching either brand or generic name
        if (brandName.toLowerCase().includes(qLower) || genericName.toLowerCase().includes(qLower)) {
          let dosageStr = 'Local DB';
          if (data.dosages && Array.isArray(data.dosages)) {
              dosageStr = data.dosages.join(' / ') + ' mg';
          } else if (data.dosages) {
              dosageStr = data.dosages + ' mg';
          }
          combinedResults.push({ name: brandName, dosage: dosageStr, source: 'Database' });
        }
      });
    } catch (dbErr) {
      console.error("Local DB Search Error:", dbErr);
    }

    // 2. Fetch from NLM API
    try {
      const nlmUrl = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(query)}&ef=STRENGTHS_AND_FORMS`;
      const response = await axios.get(nlmUrl, { timeout: NLM_TIMEOUT_MS + 100 });
      const data = response.data || [];
      const names = Array.isArray(data[1]) ? data[1] : [];
      const strengths = data[2]?.STRENGTHS_AND_FORMS || [];

      names.forEach((name, index) => {
        combinedResults.push({
          name, 
          dosage: Array.isArray(strengths[index]) && strengths[index][0] ? strengths[index][0] : '', 
          source: 'NLM'
        });
      });
    } catch (nlmErr) {
      console.error("NLM Search Error:", nlmErr.message);
    }

    // Deduplicate and limit to 10 results
    const results = dedupeResults(combinedResults).slice(0, 10);
    
    cacheSet(cacheKey, results); 
    return res.json(results);
  } catch (error) { 
    res.status(500).json({ error: 'Failed to search medicines' }); 
  }
};

exports.addMedicine = async (req, res) => {
  try {
    const medData = req.body;
    if (!medData.name) return res.status(400).json({ error: 'Medicine name is required' });
    const docRef = await db.collection('active_schedules').add({
      ...medData, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return res.json({ success: true, id: docRef.id });
  } catch (error) { res.status(500).json({ error: 'Failed to save schedule' }); }
};

// Find medicine document matching your custom numeric id format
exports.deleteMedicine = async (req, res) => {
  try {
    const medId = Number(req.params.id);
    const snapshot = await db.collection('active_schedules').where('id', '==', medId).get();
    
    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
    }
    return res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to remove entry from database' }); }
};

exports.markTakenViaEmail = async (req, res) => {
  try {
    const medId = Number(req.params.id); 
    const snap = await db.collection('active_schedules').where('id', '==', medId).get();
    if (snap.empty) return res.send('<h2 style="color:red; text-align:center; margin-top:50px;">Medicine not found.</h2>');
    
    const doc = snap.docs[0];
    await db.collection('active_schedules').doc(doc.id).update({ taken: true });
    res.send('<div style="text-align: center; margin-top: 100px;"><h1 style="color: #059669; font-size: 50px;">✅</h1><h2>Marked as Taken!</h2><script>setTimeout(() => window.close(), 3000);</script></div>');
  } catch (error) { res.status(500).send('Failed to update.'); }
};

// Point lookup sync query folder precisely to active_schedules 
exports.getUserMedicines = async (req, res) => {
    try {
        const snapshot = await db.collection('active_schedules').where('userId', '==', req.params.userId).get();
        const meds = [];
        snapshot.forEach(doc => meds.push(doc.data()));
        res.status(200).json(meds);
    } catch (error) { res.status(500).json({ error: "Failed to sync" }); }
};