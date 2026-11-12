(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ---------- storage (safe) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tasbeeh.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tasbeeh.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- haptics ----------
  const hapticLabel = $('#haptic');
  function haptic(times) {
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(12);
        else if (hapticLabel) hapticLabel.click();
      }, i * 110);
    }
  }

  // ---------- tabs ----------
  function showView(name) {
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
    store.set('view', name);
    if (name === 'tasbeeh') { scrollCarouselTo(dIdx, false); updateCounter(false); }
  }
  $$('.tab').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));

  // =========================================================
  //  DUAS
  // =========================================================
  let duaIndex = Math.max(0, Math.min(store.get('duaIndex', 0), DUAS.length - 1));

  function renderDua(dir) {
    const d = DUAS[duaIndex];
    const card = $('#dua-card');
    card.style.setProperty('--tone', 'var(--' + (d.tone || 'gold') + ')');
    card.innerHTML =
      `<div class="tag">${esc(d.tag)}</div>` +
      `<h1 class="title">${esc(d.title)}</h1>` +
      (d.when ? `<p class="when">${esc(d.when)}</p>` : '') +
      `<p class="arabic ${d.arabic.length > 140 ? 'long' : ''}" dir="rtl" lang="ar">${esc(d.arabic)}</p>` +
      `<p class="translit">${esc(d.translit)}</p>` +
      `<p class="meaning">${esc(d.meaning)}</p>` +
      (d.repeat ? `<div class="repeat">Recite ${esc(d.repeat)}</div>` : '') +
      (d.note ? `<p class="note">${esc(d.note)}</p>` : '') +
      (d.source ? `<p class="source">${esc(d.source)}</p>` : '');
    $('#dua-pos').textContent = `${duaIndex + 1} / ${DUAS.length}`;
    $('#dua-group').textContent = d.group || 'Duas';
    $('#dua-progress').style.width = ((duaIndex + 1) / DUAS.length) * 100 + '%';
    $('#dua-stage').scrollTop = 0;
    card.classList.remove('in-left', 'in-right');
    void card.offsetWidth;
    if (dir) card.classList.add(dir > 0 ? 'in-right' : 'in-left');
    store.set('duaIndex', duaIndex);
  }

  function goDua(step) {
    duaIndex = (duaIndex + step + DUAS.length) % DUAS.length; // wraps around
    renderDua(step);
    if (!store.get('hintSeen', false)) { store.set('hintSeen', true); $('#tap-hint').classList.add('gone'); }
  }

  const stage = $('#dua-stage');
  let touch = null, swiped = false;
  stage.addEventListener('touchstart', (e) => { const t = e.touches[0]; touch = { x: t.clientX, y: t.clientY }; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (!touch) return;
    const t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true; setTimeout(() => (swiped = false), 400);
      goDua(dx < 0 ? 1 : -1);
    }
  }, { passive: true });
  stage.addEventListener('click', (e) => {
    if (swiped) return;
    const r = stage.getBoundingClientRect();
    goDua(e.clientX - r.left > r.width / 2 ? 1 : -1);
  });
  document.addEventListener('keydown', (e) => {
    if (!$('#view-duas').classList.contains('active')) return;
    if (e.key === 'ArrowRight') goDua(1);
    if (e.key === 'ArrowLeft') goDua(-1);
  });
  if (store.get('hintSeen', false)) $('#tap-hint').classList.add('gone');

  // index sheet + search
  const sheet = $('#index-sheet');
  const search = $('#search');
  const norm = (t) => String(t || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')          // latin accents
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')         // arabic harakat
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/['’ʼ`‘ʿʾ]/g, '').replace(/[-–—]/g, ' ');
  const INDEX = DUAS.map((d) => ({
    strong: norm([d.title, d.group, d.tag].join(' ')),
    weak: norm([d.when, d.translit, d.meaning, d.note, d.source, d.arabic, d.repeat].join(' '))
  }));
  const row = (d, i, sub) =>
    `<li data-i="${i}" class="${i === duaIndex ? 'cur' : ''}"><span class="n">${i + 1}</span>` +
    `<span class="t">${esc(d.title)}${sub ? `<small>${esc(d.group)}</small>` : ''}</span>` +
    `<span class="g" style="color:var(--${d.tone || 'gold'})">${esc(d.tag)}</span></li>`;

  function renderIndex() {
    const q = norm(search.value).trim();
    const terms = q.split(/\s+/).filter(Boolean).map((t) => t.replace(/s$/, '') || t); // "prophets" ~ "prophet"
    $('#search-clear').hidden = !q;
    let html = '';
    if (!terms.length) {
      let last = null;
      DUAS.forEach((d, i) => {
        if (d.group && d.group !== last) { html += `<li class="grp">${esc(d.group)}</li>`; last = d.group; }
        html += row(d, i, false);
      });
      $('#search-count').textContent = '';
    } else {
      const hits = [];
      DUAS.forEach((d, i) => {
        let score = 0;
        for (const t of terms) {
          if (INDEX[i].strong.includes(t)) score += 3;
          else if (INDEX[i].weak.includes(t)) score += 1;
          else { score = -1; break; }
        }
        if (score > 0) hits.push({ i, score });
      });
      hits.sort((x, y) => y.score - x.score || x.i - y.i);
      html = hits.map((h) => row(DUAS[h.i], h.i, true)).join('');
      $('#search-count').textContent = hits.length
        ? `${hits.length} dua${hits.length > 1 ? 's' : ''} found`
        : 'No duas found — try another word';
    }
    $('#index-list').innerHTML = html;
  }

  function openSheet(focusSearch) {
    renderIndex();
    sheet.hidden = false;
    if (focusSearch) search.focus();
    else { const c = $('#index-list .cur'); if (c) c.scrollIntoView({ block: 'center' }); }
  }
  function closeSheet() { sheet.hidden = true; search.blur(); }

  $('#btn-index').addEventListener('click', () => openSheet(false));
  $('#btn-search').addEventListener('click', () => openSheet(true));
  search.addEventListener('input', () => { renderIndex(); $('#index-list').scrollTop = 0; });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const f = $('#index-list li[data-i]'); if (f) f.click(); }
    if (e.key === 'Escape') closeSheet();
  });
  $('#search-clear').addEventListener('click', () => { search.value = ''; renderIndex(); search.focus(); });
  $('#btn-close-index').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) { duaIndex = +li.dataset.i; renderDua(1); closeSheet(); }
    else if (e.target === sheet) closeSheet();
  });

  // =========================================================
  //  TASBEEH
  // =========================================================
  let dIdx = Math.max(0, Math.min(store.get('dhikrIndex', 0), DHIKR.length - 1));
  const counts = store.get('counts', {});
  const totals = store.get('totals', {});
  const targets = store.get('targets', {});
  let today = store.get('today', { date: '', n: 0 });
  const TARGET_OPTS = [33, 34, 99, 100, 1000, 0];
  const CIRC = 2 * Math.PI * 90;
  const BEAD = 30;

  const cur = () => DHIKR[dIdx];
  const target = () => (targets[cur().id] !== undefined ? targets[cur().id] : cur().target);
  function dayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function rollDay() { if (today.date !== dayKey()) { today = { date: dayKey(), n: 0 }; } }
  function save() { store.set('counts', counts); store.set('totals', totals); store.set('targets', targets); store.set('today', today); store.set('dhikrIndex', dIdx); }

  // carousel
  const carousel = $('#dhikr-carousel');
  carousel.innerHTML = DHIKR.map((d) =>
    `<div class="dcard"><div class="dcard-in">` +
    `<div class="ar" dir="rtl" lang="ar">${esc(d.arabic)}</div>` +
    `<div class="tr">${esc(d.translit)}</div>` +
    `<div class="mn">${esc(d.meaning)}</div>` +
    (d.virtue ? `<div class="vt">${esc(d.virtue)}</div>` : '') +
    `</div></div>`).join('');
  $('#dhikr-dots').innerHTML = DHIKR.map(() => '<span></span>').join('');

  function scrollCarouselTo(i, smooth) {
    carousel.scrollTo({ left: i * carousel.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  }
  let scrollTimer;
  carousel.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const i = Math.round(carousel.scrollLeft / carousel.clientWidth);
      if (i !== dIdx && i >= 0 && i < DHIKR.length) { dIdx = i; save(); updateCounter(false); }
    }, 90);
  }, { passive: true });

  function renderStrand(c, t, animate) {
    const inner = $('#strand-inner');
    const every = t > 0 ? t : 33;
    inner.style.transition = animate ? 'transform .28s cubic-bezier(.2,.8,.2,1)' : 'none';
    inner.style.transform = `translateX(${-c * BEAD}px)`;
    let html = '';
    for (let i = Math.max(0, c - 14); i < c + 14; i++) {
      const big = (i + 1) % every === 0;
      html += `<span class="bead${i < c ? ' on' : ''}${big ? ' big' : ''}" style="left:${i * BEAD}px"></span>`;
    }
    inner.innerHTML = html;
  }

  function updateCounter(animate) {
    rollDay();
    const id = cur().id, c = counts[id] || 0, t = target();
    let inRound = c, round = 0;
    if (t > 0) {
      round = Math.floor(c / t); inRound = c % t;
      if (c > 0 && inRound === 0) { inRound = t; round -= 1; }
    }
    $('#count').textContent = inRound;
    $('#count-sub').textContent = t > 0 ? `of ${t}` + (round > 0 ? ` · round ${round + 1}` : '') : 'no limit';
    const prog = t > 0 ? inRound / t : (c % 33) / 33;
    $('#ring-fg').style.strokeDashoffset = CIRC * (1 - prog);
    $('#btn-target').textContent = 'Target ' + (t > 0 ? t : '∞');
    $('#stats').textContent = `Today ${today.n.toLocaleString()} · All-time ${(totals[id] || 0).toLocaleString()}`;
    $$('#dhikr-dots span').forEach((s, i) => s.classList.toggle('on', i === dIdx));
    renderStrand(c, t, animate);
  }

  const wrap = $('#count-wrap');
  $('#counter-area').addEventListener('click', () => {
    rollDay();
    const id = cur().id;
    counts[id] = (counts[id] || 0) + 1;
    totals[id] = (totals[id] || 0) + 1;
    today.n += 1;
    save();
    const t = target();
    const done = t > 0 && counts[id] % t === 0;
    haptic(done ? 3 : 1);
    wrap.classList.add('press'); setTimeout(() => wrap.classList.remove('press'), 90);
    if (done) { wrap.classList.add('glow'); setTimeout(() => wrap.classList.remove('glow'), 1100); }
    updateCounter(true);
  });

  $('#btn-target').addEventListener('click', () => {
    const t = target();
    const next = TARGET_OPTS[(TARGET_OPTS.indexOf(t) + 1) % TARGET_OPTS.length];
    targets[cur().id] = next === undefined ? 33 : next;
    save(); updateCounter(false);
  });

  const resetBtn = $('#btn-reset');
  let resetArmed = null;
  resetBtn.addEventListener('click', () => {
    if (resetArmed) {
      clearTimeout(resetArmed); resetArmed = null;
      counts[cur().id] = 0; save(); updateCounter(false);
      resetBtn.textContent = 'Reset'; resetBtn.classList.remove('warn');
      haptic(1);
    } else {
      resetBtn.textContent = 'Tap again'; resetBtn.classList.add('warn');
      resetArmed = setTimeout(() => { resetArmed = null; resetBtn.textContent = 'Reset'; resetBtn.classList.remove('warn'); }, 2500);
    }
  });

  // ---------- start ----------
  renderDua(0);
  showView(store.get('view', 'duas'));
  window.addEventListener('resize', () => scrollCarouselTo(dIdx, false));

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); } // new version → reload once
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    }).catch(() => {});
  }
})();
