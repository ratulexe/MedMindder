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
// DASHBOARD LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'https://medminder-backend.onrender.com';
  
  /* ═══════════════════════════════════════════════
     PHASE 4: AUTH GUARD & PROFILE MANAGEMENT
     ═══════════════════════════════════════════════ */
  const sessionData = localStorage.getItem('medminder_user');
  if (!sessionData) {
      window.location.replace('auth.html');
      return; 
  }
  const currentUser = JSON.parse(sessionData);

  const STORAGE_KEY = `medminder.medicines_${currentUser.userId}`;

  function getGenderIcon(gender, mode = 'large') {
      const g = String(gender).toLowerCase();
      const icon = g === 'male' ? '<i class="fa-solid fa-user-tie"></i>' : '<i class="fa-solid fa-user"></i>';

      if (mode === 'small') {
          return `<div class="w-6 h-6 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-500 flex items-center justify-center text-white text-[10px] shadow-sm">${icon}</div>`;
      }
      return `
      <div class="relative w-full h-full rounded-full bg-gradient-to-b from-slate-700 to-slate-900 flex items-center justify-center border-[4px] border-[#0f172a] shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
          <div class="absolute inset-[2px] rounded-full border border-blue-300/40 shadow-[inset_0_0_15px_rgba(147,197,253,0.2)]"></div>
          <div class="text-white text-4xl z-10 mt-1 opacity-90 drop-shadow-md">${icon}</div>
      </div>`;
  }

  const navUserIcon = document.getElementById('nav-user-icon');
  const navUserName = document.getElementById('nav-user-name');
  if (navUserName) navUserName.textContent = currentUser.name.split(' ')[0];
  if (navUserIcon) {
      navUserIcon.className = "inline-block mr-2 align-middle"; 
      navUserIcon.innerHTML = getGenderIcon(currentUser.gender, 'small');
  }

  const profileBtn = document.getElementById('profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const closeProfile = document.getElementById('close-profile');
  const logoutBtn = document.getElementById('logout-btn');

  profileBtn?.addEventListener('click', async () => {
      profileModal.classList.remove('hidden');
      
      document.getElementById('modal-user-name').textContent = "LOADING...";
      document.getElementById('modal-user-gender').textContent = "Please wait";
      document.getElementById('modal-user-email').textContent = "...";
      document.getElementById('modal-user-phone').textContent = "...";
      document.getElementById('modal-user-dob').textContent = "...";
      document.getElementById('modal-user-icon').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-slate-400 text-2xl"></i>';
      document.getElementById('modal-user-icon').className = "w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center shadow-inner mb-4 border border-slate-600";

      if (!currentUser || !currentUser.userId) return;
      
      try {
          const res = await fetch(`${API_BASE}/api/users/profile/${currentUser.userId}`);
          const data = await res.json();
          if (data.error) throw new Error(data.error);

          document.getElementById('modal-user-icon').className = "w-24 h-24 mx-auto mb-4 flex items-center justify-center";
          document.getElementById('modal-user-icon').innerHTML = getGenderIcon(data.gender, 'large');
          document.getElementById('modal-user-name').textContent = data.name;
          document.getElementById('modal-user-gender').textContent = data.gender;
          document.getElementById('modal-user-email').textContent = data.email || 'Not Provided';
          document.getElementById('modal-user-phone').textContent = data.phone || 'Not Provided';
          
          let dobText = data.dob || 'Not Provided';
          if (data.dob) {
              const d = new Date(data.dob);
              if (!isNaN(d)) dobText = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          }
          document.getElementById('modal-user-dob').textContent = dobText;
          
      } catch (err) {
          console.error("Failed to fetch profile:", err);
          document.getElementById('modal-user-name').textContent = "FETCH FAILED";
          document.getElementById('modal-user-icon').innerHTML = '<i class="fa-solid fa-xmark text-red-500 text-3xl"></i>';
      }
  });

  closeProfile?.addEventListener('click', () => profileModal.classList.add('hidden'));
  logoutBtn?.addEventListener('click', () => {
      localStorage.removeItem('medminder_user');
      medicines = []; 
      window.location.replace('auth.html');
  });

  /* ═══════════════════════════════════════════════
     TAB NAVIGATION
     ═══════════════════════════════════════════════ */
  const navDashboard = document.getElementById('nav-dashboard');
  const navSchedule = document.getElementById('nav-schedule');
  const viewDashboard = document.getElementById('dashboard-view');
  const viewSchedule = document.getElementById('schedule-view');

  function switchTab(tab) {
      if (tab === 'dashboard') {
          viewDashboard.classList.remove('hidden');
          viewDashboard.classList.add('flex');
          viewSchedule.classList.add('hidden');
          
          navDashboard.className = "nav-link relative bg-white/10 border border-white/20 px-4 py-2 rounded-lg cursor-pointer mr-2 transition-colors text-white text-sm font-bold tracking-wider";
          navSchedule.className = "nav-link relative bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 px-4 py-2 rounded-lg cursor-pointer mr-4 transition-colors text-white text-sm font-bold tracking-wider";
      } else {
          viewSchedule.classList.remove('hidden');
          viewDashboard.classList.add('hidden');
          viewDashboard.classList.remove('flex');
          
          navSchedule.className = "nav-link relative bg-white/10 border border-white/20 px-4 py-2 rounded-lg cursor-pointer mr-4 transition-colors text-white text-sm font-bold tracking-wider";
          navDashboard.className = "nav-link relative bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 px-4 py-2 rounded-lg cursor-pointer mr-2 transition-colors text-white text-sm font-bold tracking-wider";
          
          renderHistory();
      }
  }

  navDashboard?.addEventListener('click', () => switchTab('dashboard'));
  navSchedule?.addEventListener('click', () => switchTab('schedule'));

  function renderHistory() {
      const historyList = document.getElementById('history-list');
      if (!historyList) return;
      
      historyList.innerHTML = '';
      const takenMeds = medicines.filter(m => m.taken);
      
      if (takenMeds.length === 0) {
          historyList.innerHTML = `
            <div class="text-center py-10 text-slate-400">
                <i class="fa-solid fa-clock text-4xl mb-3 opacity-50"></i>
                <p class="font-bold uppercase tracking-wider text-sm">No history yet</p>
                <p class="text-xs mt-2 font-medium">Medicines you mark as 'Taken' will appear here.</p>
            </div>`;
          return;
      }

      takenMeds.forEach(med => {
          // Dynamic Badges based on Grace Window
          let statusBadge = `<span class="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-1.5 rounded-md shadow-sm tracking-wider"><i class="fa-solid fa-check-double mr-1"></i>TAKEN</span>`;
          
          if (med.statusLabel === 'ON TIME') {
              statusBadge = `<span class="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1.5 rounded-md shadow-sm tracking-wider"><i class="fa-solid fa-check-circle mr-1"></i>ON TIME</span>`;
          } else if (med.statusLabel === 'LATE') {
              statusBadge = `<span class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-md shadow-sm tracking-wider"><i class="fa-solid fa-clock-rotate-left mr-1"></i>LATE</span>`;
          }

          historyList.insertAdjacentHTML('beforeend', `
              <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl mb-3">
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center">
                          <i class="fa-solid fa-check"></i>
                      </div>
                      <div>
                          <h4 class="font-bold text-slate-800">${escHtml(med.name)}</h4>
                          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">${escHtml(med.freq)}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      ${statusBadge}
                      ${med.takenAt ? `<div class="text-[9px] text-slate-400 mt-1 font-bold">${new Date(med.takenAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
                  </div>
              </div>
          `);
      });
  }

  window.clearHistory = function() {
      MedAlert.show('warning', 'Clear History', 'Are you sure you want to clear your medication history? Active medications will NOT be affected.', () => {
          medicines = medicines.filter(m => !m.taken); 
          persistMedicines();
          renderMedicines();
          renderStats();
          renderHistory();
      }, true);
  };

/* ═══════════════════════════════════════════════
     NOTIFICATIONS & CUSTOM DROPDOWN ENGINE
     ═══════════════════════════════════════════════ */
  const notifyBtn = document.getElementById('open-notifications-btn');
  const notifyModal = document.getElementById('notification-modal');
  const closeNotify = document.getElementById('close-notification-modal');
  const btnBrowserAllow = document.getElementById('btn-browser-allow');
  const backupPref = document.getElementById('backup-notify-pref');
  const saveNotifyBtn = document.getElementById('save-notify-btn');

  const notifyDropdownBtn = document.getElementById('notify-dropdown-btn');
  const notifyDropdownMenu = document.getElementById('notify-dropdown-menu');
  const notifyDropdownText = document.getElementById('notify-dropdown-text');
  const notifyDropdownIcon = document.getElementById('notify-dropdown-icon');
  const notifyOptions = document.querySelectorAll('.notify-option');

  // Updates the dropdown UI visually
  function updateCustomDropdownUI(val) {
      const opt = Array.from(notifyOptions).find(o => o.dataset.val === val);
      if (opt && notifyDropdownText) {
          notifyDropdownText.innerHTML = `<i class="fa-solid ${opt.dataset.icon} text-slate-400"></i>${opt.dataset.text}`;
          if (backupPref) backupPref.value = val;
      }
  }

  // FIX: Opens and closes the dropdown menu using smooth CSS Transitions
  notifyDropdownBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifyDropdownMenu.classList.contains('opacity-100');
      
      if (!isOpen) {
          // Open Animation
          notifyDropdownMenu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
          notifyDropdownMenu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
          notifyDropdownIcon.classList.add('rotate-180');
      } else {
          // Close Animation
          notifyDropdownMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
          notifyDropdownMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
          notifyDropdownIcon.classList.remove('rotate-180');
      }
  });

  // Handle option selection
  notifyOptions.forEach(opt => {
      opt.addEventListener('click', () => {
          updateCustomDropdownUI(opt.dataset.val);
          // Close smoothly after selection
          notifyDropdownMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
          notifyDropdownMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
          notifyDropdownIcon.classList.remove('rotate-180');
      });
  });

  // Close dropdown if clicking anywhere outside of it
  document.addEventListener('click', (e) => {
      if (notifyDropdownBtn && !notifyDropdownBtn.contains(e.target) && notifyDropdownMenu && !notifyDropdownMenu.contains(e.target)) {
          notifyDropdownMenu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
          notifyDropdownMenu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
          notifyDropdownIcon.classList.remove('rotate-180');
      }
  });

  // Open modal and load saved preferences
  notifyBtn?.addEventListener('click', () => {
      notifyModal.classList.remove('hidden');

      const savedPref = currentUser.notificationPreference || 'none';
      updateCustomDropdownUI(savedPref);

      if ("Notification" in window && Notification.permission === 'granted') {
          btnBrowserAllow.textContent = 'GRANTED';
          btnBrowserAllow.classList.replace('bg-[#1a504c]', 'bg-teal-600');
          btnBrowserAllow.classList.replace('hover:bg-[#133d3a]', 'hover:bg-teal-700');
          btnBrowserAllow.disabled = true;
          notifyBtn.querySelector('.absolute')?.classList.add('hidden');
      }
  });

  closeNotify?.addEventListener('click', () => notifyModal.classList.add('hidden'));

  btnBrowserAllow?.addEventListener('click', async () => {
      if (!("Notification" in window)) {
          return MedAlert.show('error', 'Not Supported', 'Your browser does not support desktop notifications.');
      }
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
          btnBrowserAllow.textContent = 'GRANTED';
          btnBrowserAllow.classList.replace('bg-[#1a504c]', 'bg-teal-600');
          btnBrowserAllow.classList.replace('hover:bg-[#133d3a]', 'hover:bg-teal-700');
          btnBrowserAllow.disabled = true;
          new Notification("MedMinder Alerts Enabled!", {
              body: "You will receive medicine reminders here.",
              icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png" 
          });
      }
  });

  // Save changes to database and local memory
  saveNotifyBtn?.addEventListener('click', async () => {
      const pref = backupPref.value;
      try {
          const res = await fetch(`${API_BASE}/api/users/preferences`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: currentUser.userId, preference: pref })
          });
          const data = await res.json();
          if (data.success) {
              currentUser.notificationPreference = pref;
              localStorage.setItem('medminder_user', JSON.stringify(currentUser));

              MedAlert.show('success', 'Preferences Synced', `Alert routing path successfully saved.`, () => {
                  notifyModal.classList.add('hidden');
              });
          } else {
              MedAlert.show('error', 'Sync Failed', 'Configuration profile sync rejected.');
          }
      } catch { 
          MedAlert.show('error', 'Network Error', 'Network execution failure while syncing preferences.'); 
      }
  });

  /* ═══════════════════════════════════════════════
     MEDICINE ENGINE
     ═══════════════════════════════════════════════ */
  const NLM_URL = q => `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(q)}&ef=STRENGTHS_AND_FORMS&maxList=8`;
  let medicines = loadMedicines();

  // CLOUD SYNC
  async function syncCloudMedicines() {
      try {
          const res = await fetch(`${API_BASE}/api/medicines/user/${currentUser.userId}`);
          if (res.ok) {
              const cloudMeds = await res.json();
              if (cloudMeds.length > 0) {
                  medicines = cloudMeds; 
                  persistMedicines();    
                  renderMedicines();     
                  renderStats();
                  renderHistory();
              }
          }
      } catch (error) { console.log("Cloud sync skipped."); }
  }
  syncCloudMedicines();

  let currentStep = 1, currentFreq = 'once', selectedUnit = 'piece(s)', debounceTimer = null, activeAC = null, suggestIdx = -1, isForward = true;

  const medForm = document.getElementById('add-med-form'), medList = document.getElementById('med-list'), taskCounter = document.getElementById('task-counter');
  const medNameInput = document.getElementById('med-name'), medUnitSelect = document.getElementById('med-unit'), suggestBox = document.getElementById('med-suggestions');
  const startDateInput = document.getElementById('start-date'), intakesWrapper = document.getElementById('intakes-wrapper'), configSchedule = document.getElementById('config-schedule');
  const configOnDemand = document.getElementById('config-ondemand'), advContainer = document.getElementById('advanced-options-container'), invToggle = document.getElementById('inv-toggle');
  const invInputsCont = document.getElementById('inv-inputs-container'), successOverlay = document.getElementById('success-overlay'), stepLabel = document.getElementById('step-label');
  const searchSpinner = document.getElementById('search-spinner'), btnBack = document.getElementById('btn-back'), btnNext = document.getElementById('btn-next'), btnSave = document.getElementById('btn-save');
  const exportBtn = document.getElementById('export-btn'), freqCards = Array.from(document.querySelectorAll('.freq-card')), advCards = Array.from(document.querySelectorAll('.adv-card'));
  const unitPills = Array.from(document.querySelectorAll('.unit-pill')), timePicker = document.getElementById('custom-time-picker');
  const tpOutHours = document.getElementById('tp-hours'), tpOutMins = document.getElementById('tp-mins');
  let currentTrigger = null;

  if (startDateInput) startDateInput.valueAsDate = new Date();
  setFreq('once'); initTimePicker(); renderMedicines(); renderStats();

  function goToStep(targetStep, forward = true) {
    const from = document.getElementById(`step-panel-${currentStep}`), to = document.getElementById(`step-panel-${targetStep}`);
    if (!from || !to) return;
    isForward = forward; from.classList.remove('is-active'); to.classList.add('is-active');
    if (!forward) to.classList.add('slide-from-left');
    setTimeout(() => to.classList.remove('slide-from-left'), 250);
    currentStep = targetStep; updateWizardUI();
    if (targetStep === 3) { updateFormLayout(); renderIntakes(); }
  }

  function updateWizardUI() {
    if (stepLabel) stepLabel.textContent = `Step ${currentStep} of 3`;
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`wiz-step-${i}`), dot = el?.querySelector('.wiz-dot');
      el?.classList.remove('is-active', 'is-done');
      if (i < currentStep) { el?.classList.add('is-done'); if (dot) dot.textContent = ''; } 
      else if (i === currentStep) { el?.classList.add('is-active'); if (dot) dot.textContent = String(i); } 
      else { if (dot) dot.textContent = String(i); }
    }
    for (let i = 1; i <= 2; i++) document.getElementById(`wiz-conn-${i}`)?.classList.toggle('is-done', i < currentStep);
    document.querySelectorAll('.step-dot').forEach((dot, idx) => {
      dot.classList.remove('is-active', 'is-done');
      if (idx + 1 < currentStep) dot.classList.add('is-done');
      else if (idx + 1 === currentStep) dot.classList.add('is-active');
    });
    btnBack?.classList.toggle('hidden', currentStep === 1);
    btnNext?.classList.toggle('hidden', currentStep === 3);
    btnSave?.classList.toggle('hidden', currentStep !== 3);
  }

  btnNext?.addEventListener('click', () => {
    if (currentStep === 1 && !medNameInput?.value.trim()) {
      medNameInput?.focus(); medNameInput?.classList.add('ring-2', 'ring-red-400');
      setTimeout(() => medNameInput?.classList.remove('ring-2', 'ring-red-400'), 1200); return;
    }
    if (currentStep < 3) goToStep(currentStep + 1, true);
  });
  btnBack?.addEventListener('click', () => { if (currentStep > 1) goToStep(currentStep - 1, false); });

  function initTimePicker() {
    if(!timePicker) return;
    tpOutHours.innerHTML = ''; tpOutMins.innerHTML = '';
    for(let i=0; i<24; i++) tpOutHours.insertAdjacentHTML('beforeend', `<div class="tp-item" data-val="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</div>`);
    for(let i=0; i<60; i++) tpOutMins.insertAdjacentHTML('beforeend', `<div class="tp-item" data-val="${i.toString().padStart(2, '0')}">${i.toString().padStart(2, '0')}</div>`);
    timePicker.addEventListener('click', e => {
      if (e.target.classList.contains('tp-item')) {
        const col = e.target.closest('.tp-col');
        col.querySelectorAll('.tp-item').forEach(el => el.classList.remove('is-active'));
        e.target.classList.add('is-active'); updateTrigger(); e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
    document.getElementById('tp-close')?.addEventListener('click', () => { timePicker.classList.add('hidden'); currentTrigger = null; });
    document.addEventListener('click', e => {
      if (!timePicker.classList.contains('hidden') && !timePicker.contains(e.target) && !e.target.closest('.time-trigger')) {
        timePicker.classList.add('hidden'); currentTrigger = null;
      }
    });
  }

  window.openTimePicker = function(triggerEl) {
    currentTrigger = triggerEl;
    const hiddenInput = triggerEl.querySelector('.intake-time'), [hh, mm] = (hiddenInput.value || '08:00').split(':');
    tpOutHours.querySelectorAll('.tp-item').forEach(el => el.classList.toggle('is-active', el.dataset.val === hh));
    tpOutMins.querySelectorAll('.tp-item').forEach(el => el.classList.toggle('is-active', el.dataset.val === mm));
    const rect = triggerEl.getBoundingClientRect();
    timePicker.style.top = `${rect.bottom + window.scrollY + 6}px`;
    timePicker.style.left = rect.left + window.scrollX + 176 > window.innerWidth ? `${window.innerWidth - 180}px` : `${rect.left + window.scrollX}px`;
    timePicker.classList.remove('hidden');
    setTimeout(() => { tpOutHours.querySelector('.is-active')?.scrollIntoView({block: 'center'}); tpOutMins.querySelector('.is-active')?.scrollIntoView({block: 'center'}); }, 10);
  };

  function updateTrigger() {
    if (!currentTrigger) return;
    const hActive = tpOutHours.querySelector('.is-active'), mActive = tpOutMins.querySelector('.is-active');
    if (hActive && mActive) {
      const timeStr = `${hActive.dataset.val}:${mActive.dataset.val}`;
      currentTrigger.querySelector('.intake-time').value = timeStr;
      currentTrigger.querySelector('.tt-display').textContent = formatTime(timeStr);
    }
  }

  freqCards.forEach(card => card.addEventListener('click', () => setFreq(card.dataset.val)));
  function setFreq(mode) {
    currentFreq = mode; freqCards.forEach(c => c.classList.toggle('is-active', c.dataset.val === mode));
    if (mode === 'advanced') {
      advContainer?.classList.remove('hidden');
      const checked = document.querySelector('input[name="adv_type"]:checked') || document.querySelector('input[name="adv_type"]');
      if (checked) checked.checked = true; syncAdvCards();
    } else advContainer?.classList.add('hidden');
    if (currentStep === 3) { updateFormLayout(); renderIntakes(); }
  }

  advCards.forEach(card => {
    const radio = card.querySelector('input[type="radio"]');
    radio?.addEventListener('change', () => { syncAdvCards(); renderIntakes(); });
    card.addEventListener('click', () => { if (radio) radio.checked = true; syncAdvCards(); renderIntakes(); });
  });

  function syncAdvCards() {
    advCards.forEach(card => {
      const active = card.querySelector('input[type="radio"]')?.checked;
      card.classList.toggle('is-selected', !!active);
      card.querySelector('.expandable')?.classList.toggle('hidden', !active);
    });
  }

  ['adv-int-val','adv-multi-times','adv-range-days','adv-cyc-on','adv-cyc-off'].forEach(id => document.getElementById(id)?.addEventListener('input', renderIntakes));
  document.querySelectorAll('.day-chk').forEach(cb => cb.addEventListener('change', renderIntakes));

  unitPills.forEach(pill => {
    pill.addEventListener('click', () => {
      selectedUnit = pill.dataset.unit; unitPills.forEach(p => p.classList.remove('is-active')); pill.classList.add('is-active');
      if (medUnitSelect) medUnitSelect.value = selectedUnit;
      document.querySelectorAll('.dynamic-unit-label').forEach(el => el.textContent = selectedUnit);
    });
  });

  function getScheduleMeta() {
    const m = { type: currentFreq, label: '', items: [] };
    if (currentFreq === 'once') { m.label = 'Once daily'; m.items = [{ time: '08:00', dose: 1 }]; } 
    else if (currentFreq === 'twice') { m.label = 'Twice daily'; m.items = [{ time: '08:00', dose: 1 }, { time: '20:00', dose: 1 }]; } 
    else if (currentFreq === 'thrice') { m.label = 'Thrice daily'; m.items = [{ time: '08:00', dose: 1 }, { time: '14:00', dose: 1 }, { time: '20:00', dose: 1 }]; } 
    else if (currentFreq === 'before_meal') { m.label = 'Before meal'; m.items = [{ time: '07:30', dose: 1 }, { time: '12:30', dose: 1 }, { time: '19:30', dose: 1 }]; } 
    else if (currentFreq === 'after_meal') { m.label = 'After meal'; m.items = [{ time: '08:30', dose: 1 }, { time: '13:30', dose: 1 }, { time: '20:30', dose: 1 }]; } 
    else if (currentFreq === 'bedtime') { m.label = 'Bedtime'; m.items = [{ time: '22:00', dose: 1 }]; } 
    else if (currentFreq === 'ondemand') { m.label = 'On demand'; } 
    else if (currentFreq === 'advanced') {
      const advType = document.querySelector('input[name="adv_type"]:checked')?.value || 'weekly';
      if (advType === 'interval_hours') { m.label = `Every ${document.getElementById('adv-int-val')?.value || 6} hours`; m.items = [{ time: '08:00', dose: 1 }]; } 
      else if (advType === 'custom_times') {
        const n = Math.max(1, Number(document.getElementById('adv-multi-times')?.value || 4)); m.label = `${n} custom times`;
        m.items = Array.from({ length: n }, (_, i) => ({ time: ['08:00','13:00','18:00','22:00'][i] || '08:00', dose: 1 }));
      } 
      else if (advType === 'alternate_days') { m.label = 'Alternate days'; m.items = [{ time: '08:00', dose: 1 }]; } 
      else if (advType === 'date_range') { m.label = `Only for ${document.getElementById('adv-range-days')?.value || 5} days`; m.items = [{ time: '08:00', dose: 1 }]; } 
      else if (advType === 'cyclic') { m.label = `Cyclic ${document.getElementById('adv-cyc-on')?.value || 21}/${document.getElementById('adv-cyc-off')?.value || 7}`; m.items = [{ time: '08:00', dose: 1 }]; } 
      else if (advType === 'weekly') {
        const days = Array.from(document.querySelectorAll('.day-chk:checked')).map(cb => cb.value);
        m.label = days.length ? days.join(' / ') : 'Weekly'; m.items = [{ time: '08:00', dose: 1 }];
      }
    }
    return m;
  }

  function updateFormLayout() { configSchedule?.classList.toggle('hidden', currentFreq === 'ondemand'); configOnDemand?.classList.toggle('hidden', currentFreq !== 'ondemand'); }

  function renderIntakes() {
    if (!intakesWrapper || currentFreq === 'ondemand') return intakesWrapper.innerHTML = '';
    const sched = getScheduleMeta(), items = sched.items.length ? sched.items : [{ time: '08:00', dose: 1 }];
    intakesWrapper.innerHTML = items.map((item, idx) => `
      <div class="schedule-chip">
        <div class="schedule-chip__head">
          <h5>${['First','Second','Third','Fourth','Fifth','Sixth'][idx] || `Intake ${idx + 1}`} intake</h5><span class="schedule-chip__tag">${escHtml(sched.label)}</span>
        </div>
        <div class="schedule-chip__row">
          <label>Time</label>
          <div class="time-trigger" onclick="openTimePicker(this)"><span class="tt-display">${formatTime(item.time)}</span><i class="fa-solid fa-chevron-down text-[0.6rem] text-slate-400 ml-2"></i><input type="hidden" class="intake-time" value="${item.time}" required></div>
        </div>
        <div class="schedule-chip__row">
          <label>Dose</label><div class="dose-wrap"><input type="number" step="0.5" min="0.5" value="${item.dose}" class="intake-dose" required><span class="dynamic-unit-label">${escHtml(selectedUnit)}</span></div>
        </div>
      </div>
    `).join('');
  }

  invToggle?.addEventListener('change', e => { if (invInputsCont) { invInputsCont.style.opacity = e.target.checked ? '1' : '0.4'; invInputsCont.style.pointerEvents = e.target.checked ? 'auto' : 'none'; } });

  medNameInput?.addEventListener('input', function () {
    clearTimeout(debounceTimer); const q = this.value.trim();
    if (q.length < 2) { suggestBox?.classList.add('hidden'); searchSpinner?.classList.add('hidden'); return; }
    debounceTimer = setTimeout(() => fetchSuggestions(q), 90);
  });

  async function fetchSuggestions(query) {
      if (activeAC) activeAC.abort();
      activeAC = new AbortController(); searchSpinner?.classList.remove('hidden');
      if (suggestBox) { suggestBox.innerHTML = `<li class="suggestion suggestion--loading"><i class="fa-solid fa-spinner fa-spin"></i> Searching for "${escHtml(query)}"…</li>`; suggestBox.classList.remove('hidden'); }
      
      let combinedResults = [];
      const qLower = query.toLowerCase();

      // 1. Search your locally saved medicines first (Instant load)
      const localMatches = [...new Set(medicines.filter(m => m.name.toLowerCase().includes(qLower)).map(m => m.name))];
      combinedResults.push(...localMatches.map(name => ({ name, dosage: 'Saved List' })));

      try {
          // 2. Fetch from NLM API and Custom Backend Database simultaneously
          const [nlmRes, dbRes] = await Promise.allSettled([
              fetch(NLM_URL(query), { signal: activeAC.signal }).then(r => r.json()),
              fetch(`${API_BASE}/api/search-meds?q=${encodeURIComponent(query)}`, { signal: activeAC.signal }).then(r => r.json())
          ]);

          // 3. Add Custom Database Results
          if (dbRes.status === 'fulfilled' && Array.isArray(dbRes.value)) {
              dbRes.value.forEach(dbItem => {
                  if (!combinedResults.some(r => r.name.toLowerCase() === dbItem.name?.toLowerCase())) {
                      combinedResults.push({ name: dbItem.name, dosage: dbItem.dosage || 'Database' });
                  }
              });
          }

          // 4. Add NLM Results
          if (nlmRes.status === 'fulfilled') {
              const names = Array.isArray(nlmRes.value[1]) ? nlmRes.value[1] : [];
              const strengths = nlmRes.value[2]?.STRENGTHS_AND_FORMS || [];
              names.forEach((name, i) => {
                  if (!combinedResults.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                      combinedResults.push({ name, dosage: strengths[i]?.[0] || '' });
                  }
              });
          }

      } catch (err) {
          if (err.name !== 'AbortError') console.error(err);
      } finally { 
          searchSpinner?.classList.add('hidden'); 
          showSuggestions(combinedResults, query);
      }
  }

  function showSuggestions(results, query) {
    if (!suggestBox) return; suggestBox.innerHTML = ''; suggestIdx = -1;
    
    // Check if the user's exact query already exists in the results
    const exactMatch = results.some(r => r.name.toLowerCase() === query.toLowerCase());

    // SCENARIO 1: No results found anywhere (Fully custom)
    if (!results?.length) { 
        const li = document.createElement('li');
        li.className = 'suggestion suggestion--empty cursor-pointer hover:bg-teal-50 transition-colors p-3';
        li.innerHTML = `<div class="flex items-center text-[#1a504c] font-bold"><i class="fa-solid fa-pen-to-square mr-2"></i> Save custom medicine: "${escHtml(query)}"</div>`;
        
        // NOW IT IS CLICKABLE!
        li.addEventListener('click', () => { 
            if (medNameInput) medNameInput.value = query; 
            suggestBox.classList.add('hidden'); 
        });
        suggestBox.appendChild(li);
        suggestBox.classList.remove('hidden'); 
        return; 
    }

    // SCENARIO 2: Show mixed results (NLM + DB + Local)
    results.slice(0, 8).forEach((item, i) => {
      const li = document.createElement('li'); li.className = 'suggestion cursor-pointer hover:bg-teal-50 transition-colors';
      li.innerHTML = `<div class="suggestion__main"><strong>${escHtml(item.name || '')}</strong><span class="text-xs text-slate-500 ml-2 font-medium">${escHtml(item.dosage || '')}</span></div>`;
      li.addEventListener('click', () => { if (medNameInput) medNameInput.value = item.name || ''; suggestBox.classList.add('hidden'); });
      suggestBox.appendChild(li);
    });

    // SCENARIO 3: ALWAYS append a clickable "Use Custom" option at the bottom so you can bypass the API completely
    if (!exactMatch && query.length > 1) {
        const customLi = document.createElement('li');
        customLi.className = 'suggestion cursor-pointer bg-slate-50 hover:bg-teal-50 border-t border-slate-200 transition-colors p-3';
        customLi.innerHTML = `<div class="suggestion__main text-[#1a504c] font-bold"><i class="fa-solid fa-plus-circle mr-2"></i> Add exactly as typed: "${escHtml(query)}"</div>`;
        customLi.addEventListener('click', () => { if (medNameInput) medNameInput.value = query; suggestBox.classList.add('hidden'); });
        suggestBox.appendChild(customLi);
    }
    
    suggestBox.classList.remove('hidden');
  }

  medForm?.addEventListener('submit', async e => {
    e.preventDefault(); const name = medNameInput?.value.trim(); if (!name) return;

    const isTracking = currentFreq === 'ondemand' && !!invToggle?.checked, invCurrent = isTracking ? Number(document.getElementById('inv-current')?.value || 0) : null, invThreshold = isTracking ? Number(document.getElementById('inv-threshold')?.value || 0) : null;
    const startDateVal = startDateInput?.value || new Date().toISOString().slice(0, 10), startDateStr = new Date(startDateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), sched = getScheduleMeta();
    const scheduleItems = currentFreq !== 'ondemand' ? Array.from(intakesWrapper?.querySelectorAll('.schedule-chip') || []).map(chip => ({ time : chip.querySelector('.intake-time')?.value || '08:00', dose : parseFloat(chip.querySelector('.intake-dose')?.value || 1) })) : [];

    let detailsHtml = currentFreq === 'ondemand' ? `<div class="med-detail"><i class="fa-solid fa-box-open"></i> ${isTracking ? `Inventory: ${invCurrent} ${escHtml(selectedUnit)} · Refill below ${invThreshold}` : 'Inventory tracking disabled'}</div>` : `<div class="med-meta"><span class="info-chip"><i class="fa-solid fa-flag-checkered"></i> Start: ${startDateStr}</span>${scheduleItems.map(item => `<span class="info-chip"><i class="fa-regular fa-clock"></i> ${formatTime(item.time)} · ${item.dose} ${escHtml(selectedUnit)}</span>`).join('')}</div>`;

    const newMedicine = {
      id: Date.now(), 
      userId: currentUser.userId,
      userEmail: currentUser.email || '', 
      userName: currentUser.name || '',
      name, rawName: name, rawUnit: selectedUnit, freq: sched.label,
      details: detailsHtml, scheduleItems, startDate: startDateVal, taken: false, isTracking, invCurrent, invThreshold
    };

    medicines.unshift(newMedicine);
    renderMedicines(); renderStats();
    successOverlay?.classList.add('is-visible');
    
    try {
        await fetch(`${API_BASE}/api/medicines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMedicine)
        });
    } catch (err) { console.log("Database sync failed"); }

    setTimeout(() => { successOverlay?.classList.remove('is-visible'); resetForm(); }, 1100);
  });

  function resetForm() {
    medForm?.reset(); if (startDateInput) startDateInput.valueAsDate = new Date(); if (invToggle) invToggle.checked = true;
    if (invInputsCont) { invInputsCont.style.opacity = '1'; invInputsCont.style.pointerEvents = 'auto'; }
    selectedUnit = 'piece(s)'; unitPills.forEach(p => p.classList.toggle('is-active', p.dataset.unit === 'piece(s)'));
    if (medUnitSelect) medUnitSelect.value = 'piece(s)'; document.querySelectorAll('.dynamic-unit-label').forEach(el => el.textContent = 'piece(s)');
    setFreq('once'); document.querySelector('.step-panel.is-active')?.classList.remove('is-active'); document.getElementById('step-panel-1')?.classList.add('is-active');
    currentStep = 1; updateWizardUI();
  }

  function renderStats() {
    const lowStock = medicines.filter(m => m.isTracking && Number(m.invCurrent) <= Number(m.invThreshold)).length, todayDoses = medicines.reduce((sum, m) => sum + (m.scheduleItems?.length || 0), 0), nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    let nextDose = null;
    medicines.forEach(m => (m.scheduleItems || []).forEach(item => {
      const itemMin = parseInt(item.time.split(':')[0]) * 60 + parseInt(item.time.split(':')[1]);
      if (itemMin > nowMin && (!nextDose || itemMin < nextDose.totalMin)) nextDose = { totalMin: itemMin, label: formatTime(item.time) };
    }));
    if (document.getElementById('stat-total-val')) document.getElementById('stat-total-val').textContent = medicines.length;
    if (document.getElementById('stat-doses-val')) document.getElementById('stat-doses-val').textContent = todayDoses;
    if (document.getElementById('stat-next-val')) document.getElementById('stat-next-val').textContent = nextDose?.label || '—';
    if (document.getElementById('stat-stock-val')) document.getElementById('stat-stock-val').textContent = lowStock;
    if (exportBtn) exportBtn.style.display = medicines.length ? 'flex' : 'none';
  }

  function renderMedicines() {
    if (!medList) return; medList.innerHTML = '';
    if (taskCounter) taskCounter.textContent = `${medicines.length} Med${medicines.length !== 1 ? 's' : ''}`;
    if (!medicines.length) { medList.innerHTML = `<div class="empty-state"><i class="fa-solid fa-notes-medical"></i><p>No medicines added yet.</p></div>`; persistMedicines(); return; }
    medicines.forEach(med => {
      const card = document.createElement('div'); card.className = `med-card ${med.taken ? 'med-card--done' : ''}`;
      card.innerHTML = `
        <div class="med-card__top"><div class="med-card__name-row"><div class="med-icon"><i class="fa-solid fa-capsules"></i></div><span class="med-card__title">${escHtml(med.name)}</span></div><span class="med-pill"><i class="fa-regular fa-clock"></i> ${escHtml(med.freq)}</span></div>${med.details || ''}
        <div class="med-card__actions">
          ${med.taken ? `<button class="action-btn action-btn--take" disabled><i class="fa-solid fa-check-double"></i> Taken</button>` : `<button class="action-btn action-btn--take" onclick="takeMedicine(${med.id})"><i class="fa-solid fa-bolt"></i> Take Now</button>`}
          <button class="action-btn action-btn--edit" onclick="editMedicine(${med.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="action-btn action-btn--delete" onclick="deleteMedicine(${med.id})"><i class="fa-solid fa-trash"></i></button>
        </div>`;
      medList.appendChild(card);
    });
    persistMedicines();
  }

  window.takeMedicine = function (id) {
    const med = medicines.find(m => m.id === id); 
    if (!med || med.taken) return; 
    
    // 1. Mark as taken & save the exact timestamp
    med.taken = true;
    med.takenAt = new Date().toISOString(); 

    // 2. Find the scheduled time closest to right now
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    let closestItem = null;
    let minDiff = Infinity;
    
    (med.scheduleItems || []).forEach(item => {
        const [h, m] = item.time.split(':').map(Number);
        const itemMins = h * 60 + m;
        const diff = Math.abs(currentMins - itemMins);
        if (diff < minDiff) { minDiff = diff; closestItem = item; }
    });

    // 3. Evaluate the 60-Minute Grace Window
    if (closestItem) {
        const scheduledDate = new Date();
        const [h, m] = closestItem.time.split(':').map(Number);
        scheduledDate.setHours(h, m, 0, 0);
        med.scheduledTime = scheduledDate.toISOString();

        const diffInMinutes = Math.abs((now.getTime() - scheduledDate.getTime()) / (1000 * 60));
        med.statusLabel = diffInMinutes <= 60 ? 'ON TIME' : 'LATE';
    } else {
        med.statusLabel = 'TAKEN'; // Fallback for On-Demand medicines
    }

    // 4. Update Inventory
    if (med.isTracking && Number(med.invCurrent) > 0) { 
        med.invCurrent--; 
        med.details = `<div class="med-detail"><i class="fa-solid fa-box-open"></i> Inventory: ${med.invCurrent} ${escHtml(med.rawUnit)} · Refill below ${med.invThreshold}</div>`; 
    }
    
    // 5. Update UI & Save
    renderMedicines(); 
    renderStats(); 
    renderHistory(); 
  };
  window.editMedicine = function (id) {
    const med = medicines.find(m => m.id === id); if (!med) return;
    if (medNameInput) medNameInput.value = med.rawName; selectedUnit = med.rawUnit || 'piece(s)';
    unitPills.forEach(p => p.classList.toggle('is-active', p.dataset.unit === selectedUnit)); if (medUnitSelect) medUnitSelect.value = selectedUnit; document.querySelectorAll('.dynamic-unit-label').forEach(el => el.textContent = selectedUnit);
    document.querySelector('.step-panel.is-active')?.classList.remove('is-active'); document.getElementById('step-panel-1')?.classList.add('is-active');
    currentStep = 1; updateWizardUI(); setFreq('once'); medicines = medicines.filter(m => m.id !== id);
    renderMedicines(); renderStats(); renderHistory(); window.scrollTo({ top: 0, behavior: 'smooth' }); medNameInput?.focus();
  };

  function loadMedicines() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
  function persistMedicines() { localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines)); }
  function formatTime(t) { if (!t) return ''; const [h, m] = t.split(':'); return `${parseInt(h) % 12 || 12}:${m} ${parseInt(h) >= 12 ? 'PM' : 'AM'}`; }
  function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const listPanel = document.querySelector('.list-panel'); if (!listPanel) return; listPanel.classList.add('exporting');
      setTimeout(() => { html2canvas(listPanel, { scale: 2, backgroundColor: '#ffffff', borderRadius: 16 }).then(canvas => { const link = document.createElement('a'); link.download = 'MedMinder-Schedule.png'; link.href = canvas.toDataURL('image/png'); link.click(); listPanel.classList.remove('exporting'); }); }, 150);
    });
  }

  updateWizardUI(); syncAdvCards();

  let lastNotifiedMinute = null;
  setInterval(() => {
      if (!("Notification" in window) || Notification.permission !== 'granted') return;
      const now = new Date(), currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (lastNotifiedMinute === currentTime) return; 

      let triggered = false;
      medicines.forEach(med => {
          if (med.taken) return; 
          (med.scheduleItems || []).forEach(item => {
              if (item.time === currentTime) {
                  const notification = new Notification(`Time for ${med.name}`, { body: `Dose: ${item.dose} ${med.rawUnit}\nClick to mark it as taken!`, icon: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png" });
                  notification.onclick = function() { window.focus(); window.takeMedicine(med.id); this.close(); };
                  triggered = true;
              }
          });
      });
      if (triggered) lastNotifiedMinute = currentTime;
  }, 10000); 
});