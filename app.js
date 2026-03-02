/* ============================================================
   THE SEED CYCLING — Learning Path App Logic
   Supabase real-time sync + localStorage fallback + clipboard
   ============================================================ */

// ── Supabase setup ──────────────────────────────────────────
var supabaseClient = null;
var useSupabase = false;

function initSupabase() {
  if (
    typeof SUPABASE_URL === 'undefined' ||
    typeof SUPABASE_ANON_KEY === 'undefined' ||
    SUPABASE_URL.indexOf('TU_PROYECTO') !== -1 ||
    SUPABASE_ANON_KEY.indexOf('TU_ANON_KEY') !== -1
  ) {
    console.info('[SeedCycling] Supabase no configurado — modo localStorage activo');
    return false;
  }
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
    console.info('[SeedCycling] Supabase conectado');
    return true;
  } catch (e) {
    console.warn('[SeedCycling] Error al conectar Supabase, usando localStorage', e);
    return false;
  }
}

// ── Progress state ──────────────────────────────────────────
var LOCAL_KEY = 'seed_cycling_progress';

function loadLocalProgress() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}'); }
  catch (e) { return {}; }
}

function saveLocalProgress(state) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('[SeedCycling] localStorage no disponible', e); }
}

var progressState = {};

function fetchProgress(callback) {
  if (useSupabase) {
    supabaseClient.from('step_progress').select('*').then(function(result) {
      if (result.error) {
        console.warn('Supabase fetch error', result.error);
        progressState = loadLocalProgress();
      } else {
        progressState = {};
        result.data.forEach(function(row) { progressState[row.step_id] = row; });
      }
      callback();
    });
  } else {
    progressState = loadLocalProgress();
    callback();
  }
}

function markStep(stepId, completed) {
  var now = new Date().toISOString();
  if (useSupabase) {
    supabaseClient.from('step_progress').upsert(
      { step_id: stepId, completed: completed, completed_at: completed ? now : null },
      { onConflict: 'step_id' }
    ).then(function(result) {
      if (result.error) console.warn('Supabase upsert error', result.error);
    });
    progressState[stepId] = { step_id: stepId, completed: completed, completed_at: completed ? now : null };
  } else {
    progressState[stepId] = { step_id: stepId, completed: completed, completed_at: completed ? now : null };
    saveLocalProgress(progressState);
  }
  renderCard(stepId);
  updateProgressBar();
  showToast(completed ? 'Paso completado' : 'Marcado como pendiente');
}

// ── Real-time subscription ──────────────────────────────────
function subscribeRealtime() {
  if (!useSupabase) return;
  supabaseClient
    .channel('step_progress_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'step_progress' }, function(payload) {
      var row = payload.new || payload.old;
      if (!row || !row.step_id) return;
      progressState[row.step_id] = payload.new;
      renderCard(row.step_id);
      updateProgressBar();
    })
    .subscribe();
}

// ── Render helpers ──────────────────────────────────────────
function renderAllCards() {
  document.querySelectorAll('.step-card').forEach(function(card) {
    renderCard(card.dataset.stepId);
  });
}

function renderCard(stepId) {
  var card = document.querySelector('[data-step-id="' + stepId + '"]');
  if (!card) return;
  var row = progressState[stepId];
  var completed = row && row.completed === true;
  card.classList.toggle('completed', completed);
  card.classList.remove('in-progress');
  var btn = card.querySelector('.btn-check');
  if (btn) btn.title = completed ? 'Marcar como pendiente' : 'Marcar como completado';
}

function updateProgressBar() {
  var cards = document.querySelectorAll('.step-card');
  var total = cards.length;
  var done = 0;
  cards.forEach(function(card) {
    var row = progressState[card.dataset.stepId];
    if (row && row.completed) done++;
  });
  var pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  var counter = document.getElementById('progress-counter');
  if (counter) counter.textContent = done + '/' + total;
  var pctEl = document.getElementById('progress-pct');
  if (pctEl) pctEl.textContent = pct + '%';
}

// ── Card accordion toggle ───────────────────────────────────
function toggleCard(card) {
  var isOpen = card.classList.contains('open');
  document.querySelectorAll('.step-card.open').forEach(function(c) { c.classList.remove('open'); });
  if (!isOpen) card.classList.add('open');
}

// ── Clipboard ───────────────────────────────────────────────
function copyPrompt(btn, text) {
  var doSuccess = function() {
    btn.textContent = 'Copiado';
    btn.classList.add('copied');
    showToast('Prompt copiado al portapapeles');
    setTimeout(function() {
      btn.textContent = 'Copiar prompt';
      btn.classList.remove('copied');
    }, 2000);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(doSuccess).catch(function() { fallbackCopy(text, doSuccess); });
  } else {
    fallbackCopy(text, doSuccess);
  }
}

function fallbackCopy(text, callback) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
  if (callback) callback();
}

// ── Toast ───────────────────────────────────────────────────
var toastTimer = null;
function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2200);
}

// ── Tabs ────────────────────────────────────────────────────
function bindTabs() {
  var btns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
      // Keep active tab visible in the scrollable nav bar
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });
}

// ── Event delegation — single listener handles all clicks ───
// Checks btn-check BEFORE step-header so the check button always wins
function bindEvents() {
  document.addEventListener('click', function(e) {

    // 1. Check button (mark step complete/incomplete)
    var btnCheck = e.target.closest('.btn-check');
    if (btnCheck) {
      var card = btnCheck.closest('.step-card');
      if (!card) return;
      var stepId = card.dataset.stepId;
      var row = progressState[stepId];
      markStep(stepId, !(row && row.completed === true));
      return;
    }

    // 2. Step header → accordion toggle
    var header = e.target.closest('.step-header');
    if (header) {
      var card = header.closest('.step-card');
      if (card) toggleCard(card);
      return;
    }

    // 3. Copy prompt button
    var btnCopy = e.target.closest('.btn-copy');
    if (btnCopy) {
      var block = btnCopy.closest('.claude-block');
      if (block) {
        var promptEl = block.querySelector('.claude-prompt');
        if (promptEl) copyPrompt(btnCopy, promptEl.textContent);
      }
      return;
    }
  });

  // Checklist checkboxes — local storage only
  document.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(function(cb) {
    try {
      var key = 'cl_' + cb.id;
      cb.checked = localStorage.getItem(key) === 'true';
      cb.addEventListener('change', function() {
        try { localStorage.setItem(key, cb.checked); } catch(e) {}
      });
    } catch(e) {}
  });
}

// ── Reset ────────────────────────────────────────────────────
function resetProgress() {
  if (!confirm('¿Segura? Esto borra todo el progreso guardado en este dispositivo.')) return;
  try { localStorage.removeItem(LOCAL_KEY); } catch(e) {}
  progressState = {};
  renderAllCards();
  updateProgressBar();
  showToast('Progreso reseteado');
}

// ── Init ────────────────────────────────────────────────────
function init() {
  initSupabase();
  bindTabs();
  fetchProgress(function() {
    renderAllCards();
    updateProgressBar();
    bindEvents();
    subscribeRealtime();
  });
}

document.addEventListener('DOMContentLoaded', init);
