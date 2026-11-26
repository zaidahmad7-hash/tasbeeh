// ─────────────────────────────────────────────────────────────
//  LISTEN — plays duas aloud.
//  • Complete Qur'an verses: recitation by Mishary Alafasy (everyayah.com),
//    needs internet; falls back to the phone's Arabic voice.
//  • Everything else: the phone's built-in voices (works offline).
//  Modes: all (title, when, Arabic, meaning, note, source) · meaning · dua.
//  iPhone rule: sound must start inside a tap, so every start/resume
//  begins speaking synchronously in the tap handler.
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tasbeeh.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tasbeeh.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const RECITER = 'https://everyayah.com/data/Alafasy_128kbps/';
  const MODES = ['all', 'meaning', 'dua'];
  const MODE_LABEL = { all: 'Everything', meaning: 'Dua + meaning', dua: 'Dua only' };
  const SPEEDS = [0.8, 1, 1.2];
  const SILENT = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//NwwAAAAAAAAAAAAEluZm8AAAAPAAAACgAABMsAOzs7Ozs7Ozs7UVFRUVFRUVFRUWdnZ2dnZ2dnZ2d9fX19fX19fX19kpKSkpKSkpKSkqioqKioqKioqKi+vr6+vr6+vr6+1NTU1NTU1NTU1Orq6urq6urq6ur/////////////AAAAAExhdmM2MC4zMQAAAAAAAAAAAAAAACQDBgAAAAAAAATL+A9CeQAAAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NAxKQAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80LEowAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80DEpAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsSjAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//NCxKMAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

  const P = {
    queue: [], qi: 0, segs: [], si: 0, playing: false, paused: false, single: false, token: 0,
    mode: store.get('listenMode', 'all'), speed: store.get('listenSpeed', 1),
    current: null, usedReciter: false
  };
  if (!MODES.includes(P.mode)) P.mode = 'all';
  if (!SPEEDS.includes(P.speed)) P.speed = 1;

  const synth = window.speechSynthesis || null;
  const audio = new Audio();
  audio.preload = 'auto';
  let voices = [], wakeLock = null, keep = [];

  function loadVoices() { if (synth) voices = synth.getVoices() || []; }
  loadVoices();
  if (synth && 'onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;
  function pickVoice(lang) {
    loadVoices();
    const pref = lang === 'ar' ? ['ar-SA', 'ar'] : ['en-GB', 'en-IE', 'en-US', 'en-AU', 'en'];
    for (const p of pref) {
      const v = voices.find((v) => (v.lang || '').replace('_', '-').toLowerCase().startsWith(p.toLowerCase()) && v.localService !== false);
      if (v) return v;
    }
    for (const p of pref) { const v = voices.find((v) => (v.lang || '').replace('_', '-').toLowerCase().startsWith(p.toLowerCase())); if (v) return v; }
    return null;
  }
  const hasArabicVoice = () => { loadVoices(); return voices.length === 0 ? true : !!pickVoice('ar'); };

  // ---------- text clean-up for speaking ----------
  function cleanAr(t) {
    return String(t || '').replace(/﴿[^﴾]*﴾/g, ' ').replace(/[۝ۖۗۚۛۙۘ]/g, ' ')
      .replace(/\([٠-٩0-9]+\)/g, ' ').replace(/ﷺ/g, ' صلى الله عليه وسلم ').replace(/·/g, '،').replace(/\s+/g, ' ').trim();
  }
  function cleanEn(t) {
    return String(t || '')
      .replace(/Qur'an (\d+):(\d+)\s*[–-]\s*(\d+)/g, 'Quran, chapter $1, verses $2 to $3')
      .replace(/Qur'an (\d+):(\d+)/g, 'Quran, chapter $1, verse $2')
      .replace(/Qur'an (\d+)\b/g, 'Quran, chapter $1')
      .replace(/Qur'an/g, 'Quran').replace(/ﷺ/g, 'peace be upon him').replace(/\(AS\)/g, 'peace be upon him')
      .replace(/\((RA)\)/g, '').replace(/\s·\s/g, '. ').replace(/[“”]/g, '"').replace(/\s*—\s*/g, ', ').replace(/\s+/g, ' ').trim();
  }
  function chunks(t, max = 180) {
    const parts = t.match(/[^.!?؟،,;]+[.!?؟،,;]*\s*/g) || [t];
    const out = []; let cur = '';
    for (const p of parts) { if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = ''; } cur += p; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // ---------- build what to read for one dua ----------
  function buildSegs(d) {
    const m = P.mode, segs = [];
    const en = (text, seg) => { if (text) segs.push({ kind: 'tts', lang: 'en', text: cleanEn(text), seg }); };
    const ar = (arabic, translit, seg, refs) => {
      if (refs && refs.length && refs[0] !== '-') segs.push({ kind: 'audio', urls: refs.map((r) => RECITER + r + '.mp3'), ar: cleanAr(arabic), tr: translit, seg });
      else if (!refs || refs[0] !== '-') segs.push({ kind: 'tts', lang: 'ar', text: cleanAr(arabic), tr: translit, seg });
    };
    if (m === 'all') { en(d.title, 'title'); en(d.when, 'when'); }
    if (d.lines) {
      d.lines.forEach((l, i) => {
        ar(l[0], l[1], 'l' + i + 'ar', d.lineAudio ? (d.lineAudio[i] ? [d.lineAudio[i]] : null) : null);
        if (m !== 'dua') en(l[2], 'l' + i + 'mn');
      });
    } else {
      ar(d.arabic, d.translit, 'ar', d.audio || null);
      if (m !== 'dua') en(d.meaning, 'mn');
    }
    if (m === 'all') { if (d.repeat) en('Recite ' + d.repeat, 'rep'); en(d.note, 'note'); if (d.source) en('Source: ' + d.source, 'src'); }
    return segs;
  }

  // ---------- low-level players ----------
  function speak(text, lang, done) {
    if (!synth || !text) { setTimeout(done, 50); return; }
    const parts = chunks(text);
    const voice = pickVoice(lang);
    let i = 0, finished = false;
    const finish = () => { if (!finished) { finished = true; clearTimeout(dog); done(); } };
    let dog = setTimeout(finish, 4000 + text.length * 160 / P.speed);   // iPhone sometimes never fires onend
    const next = () => {
      if (finished) return;
      if (i >= parts.length) { finish(); return; }
      const u = new SpeechSynthesisUtterance(parts[i++]);
      u.lang = lang === 'ar' ? (voice ? voice.lang : 'ar-SA') : (voice ? voice.lang : 'en-GB');
      if (voice) u.voice = voice;
      u.rate = (lang === 'ar' ? 0.8 : 0.95) * P.speed;
      u.onend = next; u.onerror = next;
      keep.push(u); if (keep.length > 20) keep.shift();          // stop iOS dropping callbacks
      synth.speak(u);
    };
    next();
  }
  function playUrls(urls, done, fail) {
    if (!navigator.onLine) { fail(); return; }
    let i = 0, started = false, over = false;
    const end = (fn) => { if (over) return; over = true; clearTimeout(t); audio.onended = audio.onerror = audio.onplaying = null; fn(); };
    const t = setTimeout(() => { if (!started) end(fail); }, 9000);
    const go = () => {
      audio.onended = () => { i++; if (i < urls.length) go(); else end(done); };
      audio.onerror = () => end(started ? done : fail);
      audio.onplaying = () => { started = true; };
      audio.src = urls[i]; audio.playbackRate = 1;
      const pr = audio.play(); if (pr && pr.catch) pr.catch(() => end(started ? done : fail));
    };
    go();
  }

  // ---------- runner ----------
  function runSeg() {
    const tok = ++P.token;
    const s = P.segs[P.si];
    if (!s) { afterItem(); return; }
    highlight(s.seg);
    updateBar();
    const done = () => { if (tok !== P.token) return; P.si++; setTimeout(() => { if (tok === P.token) runSeg(); }, 220); };
    const arFallback = () => {
      if (tok !== P.token) return;
      if (hasArabicVoice()) speak(s.ar || s.text, 'ar', done); else speak(s.tr || '', 'en', done);
    };
    if (s.kind === 'audio') { P.usedReciter = true; playUrls(s.urls, done, arFallback); }
    else if (s.lang === 'ar' && !hasArabicVoice()) speak(s.tr || '', 'en', done);   // no Arabic voice: read the transliteration
    else speak(s.text, s.lang, done);
  }
  function startItem() {
    const i = P.queue[P.qi];
    if (i == null) { stop(); return; }
    P.current = i; P.segs = buildSegs(DUAS[i]); P.si = 0; P.usedReciter = false;
    if (window.MyDuasUI) window.MyDuasUI.showPlaying(i);
    runSeg();
  }
  function afterItem() {
    if (P.single) { stop(); return; }
    P.qi++;
    if (P.qi >= P.queue.length) { stop(); return; }
    setTimeout(() => { if (P.playing && !P.paused) startItem(); }, 700);
  }

  // ---------- unlock (must run inside a tap) ----------
  function unlock() {
    try { audio.src = SILENT; const pr = audio.play(); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {}
    try { if (synth) { synth.cancel(); const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } } catch (e) {}
    keepAwake();
  }
  async function keepAwake() {
    try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && P.playing) keepAwake(); });

  function silence() {
    P.token++;
    try { if (synth) synth.cancel(); } catch (e) {}
    try { audio.onended = audio.onerror = audio.onplaying = null; audio.pause(); } catch (e) {}
  }

  // ---------- highlight ----------
  function highlight(seg) {
    document.querySelectorAll('#dua-card .speaking').forEach((el) => el.classList.remove('speaking'));
    if (!seg) return;
    const el = document.querySelector(`#dua-card [data-seg="${seg}"]`);
    const reader = document.querySelector('#duas-reader');
    if (el && reader && !reader.hidden) {
      el.classList.add('speaking');
      const st = document.querySelector('#dua-stage'), r = el.getBoundingClientRect(), sr = st.getBoundingClientRect();
      if (r.top < sr.top + 10 || r.bottom > sr.bottom - 10) st.scrollTo({ top: st.scrollTop + r.top - sr.top - sr.height / 3, behavior: 'smooth' });
    }
  }

  // ---------- player bar ----------
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>'
  };
  function updateBar() {
    const bar = $('#player'); if (!bar) return;
    bar.hidden = !P.playing;
    document.querySelector('#app').classList.toggle('has-player', P.playing);
    if (!P.playing) return;
    const d = DUAS[P.current] || {};
    $('#pl-title').textContent = d.title || '';
    const pos = P.single ? '' : `${P.qi + 1} of ${P.queue.length} · `;
    const s = P.segs[P.si];
    $('#pl-sub').textContent = pos + (P.paused ? 'Paused' : (s && s.kind === 'audio' ? 'Recitation: Mishary Alafasy' : 'Phone voice'));
    $('#pl-toggle').innerHTML = P.paused ? ICON.play : ICON.pause;
    $('#pl-toggle').setAttribute('aria-label', P.paused ? 'Play' : 'Pause');
    $('#pl-mode').textContent = MODE_LABEL[P.mode];
    $('#pl-speed').textContent = (P.speed === 1 ? '1' : P.speed) + '×';
    document.querySelectorAll('#index-list li[data-i]').forEach((li) => li.classList.toggle('playing', +li.dataset.i === P.current));
  }

  // ---------- public ----------
  function start(queue, pos, single) {
    silence(); unlock();
    P.queue = queue; P.qi = pos || 0; P.single = !!single; P.playing = true; P.paused = false;
    startItem();
  }
  function stop() {
    silence();
    P.playing = false; P.paused = false; P.current = null;
    highlight(null);
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
    updateBar();
    document.querySelectorAll('#index-list li.playing').forEach((li) => li.classList.remove('playing'));
  }
  function togglePause() {
    if (!P.playing) return;
    if (P.paused) { P.paused = false; unlock(); runSeg(); }      // resume from the start of the current part
    else { P.paused = true; silence(); updateBar(); }
  }
  function next() {
    if (!P.playing) return;
    silence(); unlock(); P.paused = false;
    if (P.single || P.qi + 1 >= P.queue.length) { P.queue = [(P.current + 1) % DUAS.length]; P.qi = 0; P.single = true; }
    else P.qi++;
    startItem();
  }

  window.Player = {
    playAll(indices) { if (indices && indices.length) start(indices.slice(), 0, false); },
    playOne(i) { start([i], 0, true); },
    isPlaying: () => P.playing,
    current: () => P.current,
    // the reader moved to another dua while playing → carry on from there
    follow(i) {
      if (!P.playing) return;
      silence(); unlock(); P.paused = false;
      const pos = P.single ? -1 : P.queue.indexOf(i);
      if (pos >= 0) P.qi = pos; else { P.queue = [i]; P.qi = 0; P.single = true; }
      startItem();
    },
    stop, togglePause, next,
    _segs: (i, mode) => { const m = P.mode; if (mode) P.mode = mode; const s = buildSegs(DUAS[i]); P.mode = m; return s; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    $('#pl-toggle').addEventListener('click', togglePause);
    $('#pl-next').addEventListener('click', next);
    $('#pl-stop').addEventListener('click', stop);
    $('#pl-mode').addEventListener('click', () => {
      P.mode = MODES[(MODES.indexOf(P.mode) + 1) % MODES.length]; store.set('listenMode', P.mode); updateBar();
    });
    $('#pl-speed').addEventListener('click', () => {
      P.speed = SPEEDS[(SPEEDS.indexOf(P.speed) + 1) % SPEEDS.length]; store.set('listenSpeed', P.speed); updateBar();
    });
  });
})();
