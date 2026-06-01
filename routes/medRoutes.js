const express = require('express');
const router = express.Router();
const medController = require('../controllers/medController');

// FIX: Pointed to the newly upgraded searchMeds function
router.get('/search-meds', medController.searchMeds);
router.post('/medicines', medController.addMedicine);
router.delete('/medicines/:id', medController.deleteMedicine); 
router.get('/medicines/take/:id', medController.markTakenViaEmail);
router.get('/medicines/user/:userId', medController.getUserMedicines); 

module.exports = router;