// ─────────────────────────────────────────────────────────────
//  QIBLA COMPASS
//  Location → great-circle bearing to the Kaaba (true north).
//  Phone compass → heading (magnetic), corrected to true north with
//  the World Magnetic Model (vendor/geomag.js). Everything stays on
//  the phone: no location is sent anywhere.
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const KAABA = { lat: 21.422487, lon: 39.826206 };
  const ALIGN = 5; // degrees either side counts as "facing the Qibla"
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const norm360 = (a) => ((a % 360) + 360) % 360;
  const norm180 = (a) => { a = norm360(a); return a > 180 ? a - 360 : a; };

  const store = {
    get(k, d) { try { const v = localStorage.getItem('tasbeeh.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tasbeeh.' + k, JSON.stringify(v)); } catch (e) {} }
  };

  function bearingTo(lat, lon) {
    const p1 = rad(lat), p2 = rad(KAABA.lat), dl = rad(KAABA.lon - lon);
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return norm360(deg(Math.atan2(y, x)));
  }
  function distanceKm(lat, lon) {
    const p1 = rad(lat), p2 = rad(KAABA.lat), dp = p2 - p1, dl = rad(KAABA.lon - lon);
    const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ---------- state ----------
  let loc = store.get('qiblaLoc', null);   // {lat, lon, ts}
  let qibla = loc ? bearingTo(loc.lat, loc.lon) : null;
  let decl = 0;                            // magnetic declination at loc (east +)
  let heading = null;                      // smoothed true heading
  let listening = false, started = false, gotEvent = false, aligned = false;
  let noSensorTimer = null, evName = null, lowAccuracy = false;

  function updateDecl() {
    decl = (loc && window.magDeclination) ? (window.magDeclination(loc.lat, loc.lon) || 0) : 0;
  }
  updateDecl();

  // ---------- dial (built once) ----------
  function buildDial() {
    const ticks = [];
    for (let a = 0; a < 360; a += 5) {
      const long = a % 30 === 0, r1 = long ? 122 : 127, r2 = 134;
      const s = Math.sin(rad(a)), c = -Math.cos(rad(a));
      ticks.push(`<line x1="${(s * r1).toFixed(1)}" y1="${(c * r1).toFixed(1)}" x2="${(s * r2).toFixed(1)}" y2="${(c * r2).toFixed(1)}" class="${long ? 'tk tk-l' : 'tk'}"/>`);
    }
    const letters = [['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([t, a]) => {
      const s = Math.sin(rad(a)) * 104, c = -Math.cos(rad(a)) * 104;
      return `<text x="${s.toFixed(1)}" y="${c.toFixed(1)}" class="lt${t === 'N' ? ' lt-n' : ''}" transform="rotate(${a} ${s.toFixed(1)} ${c.toFixed(1)})">${t}</text>`;
    }).join('');
    $('#q-dial').innerHTML =
      `<circle r="140" class="ring"/><circle r="92" class="ring-in"/>` + ticks.join('') + letters +
      `<g id="q-kaaba-g"><line x1="0" y1="-50" x2="0" y2="-100" class="q-ray"/>` +
      `<g transform="translate(0 -116)"><rect x="-11" y="-11" width="22" height="22" rx="2" class="kb"/>` +
      `<rect x="-11" y="-5" width="22" height="4" class="kb-band"/><rect x="3" y="1" width="5" height="9" class="kb-door"/></g></g>`;
  }

  // ---------- render ----------
  function render() {
    const has = qibla != null;
    $('#q-start').hidden = started && has;
    $('#q-bearing').textContent = has ? `${Math.round(qibla)}°` : '—';
    $('#q-bearing-sub').textContent = has ? 'from North' : 'Qibla';
    if (has) {
      $('#q-kaaba-g').setAttribute('transform', `rotate(${qibla.toFixed(1)})`);
      $('#q-kaaba-g').style.display = '';
      const km = Math.round(distanceKm(loc.lat, loc.lon));
      $('#q-info').textContent = `Makkah is ${km.toLocaleString()} km away`;
    } else {
      $('#q-kaaba-g').style.display = 'none';
      $('#q-info').textContent = '';
    }

    const rot = heading == null ? 0 : -heading;
    $('#q-dial').style.transform = `rotate(${rot.toFixed(1)}deg)`;

    let status = '', ok = false;
    if (!has) status = started ? 'Finding your location…' : 'Tap below to find the Qibla';
    else if (heading == null) status = started && listening && !gotEvent ? 'Starting compass…'
      : (started ? `Face ${Math.round(qibla)}° from North (clockwise)` : 'Tap below to start the compass');
    else {
      const d = norm180(qibla - heading);
      ok = Math.abs(d) <= ALIGN;
      status = ok ? 'You are facing the Qibla' : (d > 0 ? `Turn right ${Math.round(d)}°` : `Turn left ${Math.round(-d)}°`);
    }
    if (ok && !aligned && window.MyDuasHaptic) window.MyDuasHaptic(2);
    aligned = ok;
    $('#q-status').textContent = status;
    $('#view-qibla').classList.toggle('aligned', ok);
    $('#q-warn').hidden = !lowAccuracy;
  }

  // ---------- compass ----------
  function onOrient(e) {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) {
      h = e.webkitCompassHeading;                                   // iPhone: degrees from magnetic north
      lowAccuracy = typeof e.webkitCompassAccuracy === 'number' && (e.webkitCompassAccuracy < 0 || e.webkitCompassAccuracy > 25);
    } else if ((e.absolute || evName === 'deviceorientationabsolute') && e.alpha != null) {
      const so = (screen.orientation && screen.orientation.angle) || 0;
      h = 360 - e.alpha + so;                                       // Android: alpha counter-clockwise from north
    }
    if (h == null) return;
    gotEvent = true;
    const t = norm360(h + decl);                                    // magnetic → true north
    heading = heading == null ? t : norm360(heading + norm180(t - heading) * 0.25);
    render();
  }
  function listen() {
    if (listening) return;
    evName = ('ondeviceorientationabsolute' in window) ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evName, onOrient, true);
    listening = true;
    clearTimeout(noSensorTimer);
    noSensorTimer = setTimeout(() => {
      if (!gotEvent) { $('#q-nosensor').hidden = false; render(); }
    }, 3500);
  }
  function unlisten() {
    if (!listening) return;
    window.removeEventListener(evName, onOrient, true);
    listening = false;
    clearTimeout(noSensorTimer);
  }

  // ---------- location ----------
  function locate() {
    if (!navigator.geolocation) { $('#q-error').textContent = 'Location is not available on this device.'; return; }
    $('#q-error').textContent = '';
    navigator.geolocation.getCurrentPosition((p) => {
      loc = { lat: p.coords.latitude, lon: p.coords.longitude, ts: Date.now() };
      store.set('qiblaLoc', loc);
      qibla = bearingTo(loc.lat, loc.lon);
      updateDecl();
      render();
    }, (err) => {
      $('#q-error').textContent = err.code === 1
        ? 'Location permission is off. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using. On Android: allow location for this site in Chrome.'
        : 'Could not get your location. Check that Location is on, then tap “Find Qibla” again.';
      render();
    }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 10 * 60 * 1000 });
  }

  // ---------- start (needs a tap for iPhone permission) ----------
  async function start() {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') {
          $('#q-error').textContent = 'Compass permission was declined. Close and reopen the app, then tap “Find Qibla” and choose Allow.';
        }
      }
    } catch (e) { /* older browsers: no permission needed */ }
    started = true;
    $('#q-nosensor').hidden = true;
    listen();
    locate();
    render();
  }

  // ---------- public ----------
  window.Qibla = {
    onShow() { buildOnce(); if (started) { listen(); locate(); } render(); },
    onHide() { unlisten(); }
  };
  let built = false;
  function buildOnce() {
    if (built) return; built = true;
    buildDial();
    $('#q-start').addEventListener('click', start);
    $('#q-refresh').addEventListener('click', () => { if (!started) start(); else locate(); });
  }
  // exposed for testing
  window.Qibla._bearingTo = bearingTo;
  window.Qibla._distanceKm = distanceKm;
})();
