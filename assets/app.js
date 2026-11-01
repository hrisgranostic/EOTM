/* ==========================================================================
   Employee of the Month — Granostic Center · Frontend (vanilla JS)
   ========================================================================== */
(function () {
  'use strict';

  const CFG = window.EOM_CONFIG || {};
  const LIB = {
    jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
    xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    qr: 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
  };
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const STATUS_LABEL = {
    DRAFT: ['Persiapan', 'mute'],
    DIBUKA: ['Penilaian dibuka', 'ok'],
    DITUTUP: ['Finalisasi HR', 'warn'],
    MENUNGGU_PENGESAHAN: ['Menunggu pengesahan', 'gold'],
    DISAHKAN: ['Disahkan', 'gold'],
    DIUMUMKAN: ['Diumumkan', 'ok']
  };
  const PERAN_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN_HR: 'Admin HR', PENILAI: 'Penilai', DIREKSI: 'Direksi', KARYAWAN: 'Karyawan' };
  const LEVEL_LABEL = { SPV: 'SPV', STAF: 'Staf', TIDAK_DINILAI: 'Tidak dinilai' };

  /* ------------------------------------------------------------------ util */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n, d = 2) => (n === null || n === undefined || n === '' || isNaN(n)) ? '–'
    : Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  const labelPid = (pid) => { if (!pid) return ''; const [y, m] = pid.split('-'); return BULAN[Number(m) - 1] + ' ' + y; };
  const geserPid = (pid, d) => { let [y, m] = pid.split('-').map(Number); m += d; while (m > 12) { m -= 12; y++; } while (m < 1) { m += 12; y--; } return y + '-' + String(m).padStart(2, '0'); };
  const store = {
    get(k) { try { return localStorage.getItem('eom.' + k); } catch (e) { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem('eom.' + k) : localStorage.setItem('eom.' + k, v); } catch (e) { /* abaikan */ } }
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const loaded = {};
  function loadScript(key) {
    if (loaded[key]) return loaded[key];
    loaded[key] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = LIB[key]; s.onload = res;
      s.onerror = () => { loaded[key] = null; rej(new Error('Gagal memuat pustaka ' + key + '. Periksa koneksi internet.')); };
      document.head.appendChild(s);
    });
    return loaded[key];
  }

  const ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    book: '<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 15H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    badge: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'
  };
  const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;
  const MARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';

  /* ------------------------------------------------------------------ state */
  const S = { token: store.get('token'), user: null, boot: null, pid: store.get('pid') };
  const can = (...r) => !!S.user && r.some((x) => S.user.peran.includes(x));
  const SA = 'SUPER_ADMIN', HR = 'ADMIN_HR', PEN = 'PENILAI', DIR = 'DIREKSI', KAR = 'KARYAWAN';
  const isKaryawanSaja = () => !!S.user && S.user.peran.length === 1 && S.user.peran[0] === KAR;
  const homeHash = () => (isKaryawanSaja() ? '#/nilai-saya' : '#/beranda');

  /* ------------------------------------------------------------------ ui helpers */
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), type === 'err' ? 7000 : 4000);
  }
  let busyCount = 0;
  function busy(on, text) {
    busyCount = Math.max(0, busyCount + (on ? 1 : -1));
    $('#busy').hidden = busyCount === 0;
    if (on && text) $('#busy-text').textContent = text;
  }
  async function withBusy(text, fn) {
    busy(true, text);
    try { return await fn(); } finally { busy(false); }
  }

  /** Modal generik. Mengembalikan Promise berisi nilai dari tombol yang diklik. */
  function modal({ title, body, buttons = [{ label: 'Tutup', value: null, cls: 'ghost' }], wide = false, onOpen }) {
    return new Promise((resolve) => {
      const d = $('#modal');
      d.className = 'modal' + (wide ? ' wide' : '');
      d.innerHTML = `<div class="modal-head"><h3>${esc(title)}</h3><button class="x" type="button" aria-label="Tutup">×</button></div>
        <div class="modal-body">${body}</div>
        <div class="modal-foot">${buttons.map((b, i) => `<button type="button" class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>`;
      let done = false;
      const finish = async (val, btn) => {
        if (done) return;
        if (btn && btn.validate) {
          const ok = await btn.validate(d);
          if (!ok) return;
        }
        done = true;
        const data = btn && btn.collect ? btn.collect(d) : val;
        d.close();
        resolve(data);
      };
      d.querySelector('.x').onclick = () => finish(null);
      d.oncancel = (e) => { e.preventDefault(); finish(null); };
      $$('.modal-foot .btn', d).forEach((el) => { el.onclick = () => { const b = buttons[Number(el.dataset.i)]; finish(b.value, b); }; });
      d.showModal();
      if (onOpen) onOpen(d);
      const f = d.querySelector('input:not([type=hidden]),select,textarea');
      if (f) f.focus();
    });
  }
  const confirmBox = (title, html, okLabel = 'Lanjutkan', cls = '') =>
    modal({ title, body: html, buttons: [{ label: 'Batal', value: false, cls: 'ghost' }, { label: okLabel, value: true, cls }] });
  async function askReason(title, html, okLabel) {
    return modal({
      title, body: `${html || ''}<label class="field" style="margin-top:12px"><span>Alasan</span><textarea class="input" id="m-alasan" maxlength="300" required></textarea></label>`,
      buttons: [{ label: 'Batal', value: null, cls: 'ghost' }, {
        label: okLabel || 'Simpan', cls: 'danger',
        validate: (d) => { const v = $('#m-alasan', d).value.trim(); if (!v) { toast('Alasan wajib diisi.', 'err'); return false; } return true; },
        collect: (d) => $('#m-alasan', d).value.trim()
      }]
    });
  }
  function errorListHtml(list, max = 50) {
    if (!list || !list.length) return '';
    return `<ul class="errlist">${list.slice(0, max).map((e) => `<li>Baris ${esc(e.baris)}${e.nik ? ' (NIK ' + esc(e.nik) + ')' : ''}: ${esc(e.pesan)}</li>`).join('')}${list.length > max ? `<li>… dan ${list.length - max} lainnya</li>` : ''}</ul>`;
  }
  const statusPill = (st) => { const s = STATUS_LABEL[st] || [st || '-', 'mute']; return `<span class="pill ${s[1]}">${esc(s[0])}</span>`; };
  const nilaiPill = (st) => st === 'SUBMIT' ? '<span class="pill ok">Terkirim</span>' : st === 'DRAFT' ? '<span class="pill warn">Draf</span>' : '<span class="pill mute">Belum</span>';

  /* ------------------------------------------------------------------ API */
  class ApiError extends Error {}
  async function api(action, payload = {}, opt = {}) {
    if (!CFG.API_URL || /GANTI_DENGAN/.test(CFG.API_URL)) throw new ApiError('API_URL belum diatur di assets/config.js.');
    const body = JSON.stringify(Object.assign({ action, token: S.token }, payload));
    let lastErr;
    const tries = opt.retry === false ? 1 : 2;
    for (let i = 0; i < tries; i++) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), opt.timeout || 90000);
      try {
        const res = await fetch(CFG.API_URL, { method: 'POST', body, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctl.signal, redirect: 'follow' });
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        if (!j.ok) {
          if (j.error === 'SESI_HABIS') { logoutLocal('Sesi Anda berakhir, silakan masuk lagi.'); throw new ApiError('Sesi berakhir.'); }
          if (j.error === 'WAJIB_GANTI_PASSWORD') { await forceChangePassword(); throw new ApiError('Silakan ulangi setelah mengganti password.'); }
          throw new ApiError(j.error || 'Permintaan gagal.');
        }
        return j.data;
      } catch (e) {
        clearTimeout(timer);
        if (e instanceof ApiError) throw e;
        lastErr = e;
        // hanya ulangi untuk aksi baca (aman diulang)
        if (opt.write) break;
        await new Promise((r) => setTimeout(r, 800));
      }
    }
    throw new ApiError(lastErr && lastErr.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.');
  }
  const write = (action, payload) => api(action, payload, { write: true, retry: false });

  /* ------------------------------------------------------------------ auth */
  function logoutLocal(msg) {
    S.token = null; S.user = null; S.boot = null;
    store.set('token', null);
    renderLogin(msg);
  }

  function renderLogin(msg) {
    document.title = 'Masuk · Employee of the Month';
    $('#app').innerHTML = `
      <div class="login">
        <div class="login-art" aria-hidden="true">
          <div class="quote">Apresiasi untuk dedikasi, kinerja, dan kontribusi terbaik setiap bulan.<small>${esc('PT Persada Medika Utama · Granostic Center')}</small></div>
        </div>
        <div class="login-form">
          <div class="brand"><div class="mark">${MARK}</div><div class="brand-name">Granostic Center<small>PT Persada Medika Utama</small></div></div>
          <h1>Employee of the Month</h1>
          <p class="lead">Masuk dengan akun yang diberikan HR.</p>
          <form id="f-login" novalidate>
            ${msg ? `<div class="note warn">${esc(msg)}</div>` : ''}
            <label class="field"><span>Email atau NIK</span><input class="input" type="text" name="email" autocomplete="username" autocapitalize="off" spellcheck="false" required value="${esc(store.get('lastEmail') || '')}"><small>Pimpinan & HR memakai email. Karyawan memakai NIK.</small></label>
            <label class="field"><span>Password</span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
            <button class="btn block" type="submit">Masuk</button>
            <p class="small muted">Lupa password? Hubungi Super Admin HR untuk reset.</p>
          </form>
        </div>
      </div>`;
    const f = $('#f-login');
    (f.email.value ? f.password : f.email).focus();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const email = f.email.value.trim(), password = f.password.value;
      if (!email || !password) return toast('Email/NIK dan password wajib diisi.', 'err');
      const btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Memeriksa…';
      try {
        const r = await write('login', { email, password });
        S.token = r.token; store.set('token', r.token); store.set('lastEmail', email);
        S.user = r.user;
        if (r.user.wajibGantiPassword) await forceChangePassword();
        await start();
      } catch (err) {
        toast(err.message, 'err');
        btn.disabled = false; btn.textContent = 'Masuk';
      }
    };
  }

  async function changePasswordDialog(forced) {
    const res = await modal({
      title: forced ? 'Ganti password sebelum melanjutkan' : 'Ganti password',
      body: `${forced ? '<div class="note warn" style="margin-bottom:14px">Anda masih memakai password sementara. Buat password baru dulu.</div>' : ''}
        <div class="stack">
          <label class="field"><span>Password lama / sementara</span><input class="input" type="password" id="pw-old" autocomplete="current-password"></label>
          <label class="field"><span>Password baru</span><input class="input" type="password" id="pw-new" autocomplete="new-password"><small>Minimal 8 karakter, kombinasi huruf dan angka.</small></label>
          <label class="field"><span>Ulangi password baru</span><input class="input" type="password" id="pw-new2" autocomplete="new-password"></label>
        </div>`,
      buttons: [
        ...(forced ? [{ label: 'Keluar', value: 'logout', cls: 'ghost' }] : [{ label: 'Batal', value: null, cls: 'ghost' }]),
        {
          label: 'Simpan password', value: 'ok',
          validate: async (d) => {
            const o = $('#pw-old', d).value, n = $('#pw-new', d).value, n2 = $('#pw-new2', d).value;
            if (n !== n2) { toast('Ulangan password baru tidak sama.', 'err'); return false; }
            try { await write('gantiPassword', { passwordLama: o, passwordBaru: n }); return true; } catch (e) { toast(e.message, 'err'); return false; }
          }
        }]
    });
    if (res === 'logout') { try { await write('logout'); } catch (e) { /* abaikan */ } logoutLocal(); return false; }
    if (res === 'ok') { toast('Password berhasil diganti.', 'ok'); if (S.user) S.user.wajibGantiPassword = false; return true; }
    return false;
  }
  let forcing = null;
  function forceChangePassword() {
    if (!forcing) forcing = (async () => { let ok = false; while (!ok && S.token) ok = await changePasswordDialog(true); forcing = null; })();
    return forcing;
  }

  /* ------------------------------------------------------------------ boot */
  async function start() {
    const vm = location.hash.match(/^#\/verifikasi\/([A-Za-z0-9]+)(?:\/(\d))?/);
    if (vm) return renderVerifikasi(vm[1], vm[2]);
    if (!S.token) return renderLogin();
    try {
      S.boot = await api('bootstrap');
      S.user = S.boot.user;
      if (S.user.wajibGantiPassword) { await forceChangePassword(); if (!S.token) return; S.boot = await api('bootstrap'); S.user = S.boot.user; }
    } catch (e) {
      if (S.token) $('#app').innerHTML = `<div class="boot-splash"><p>${esc(e.message)}</p><button class="btn" id="retry">Coba lagi</button></div>`;
      const r = $('#retry'); if (r) r.onclick = start;
      return;
    }
    pickDefaultPid();
    renderShell();
    route();
  }

  function pickDefaultPid() {
    const list = S.boot.periode || [];
    const t = S.boot.hariIni;
    const nowPid = t.y + '-' + String(t.m).padStart(2, '0');
    if (S.pid && list.some((p) => p.PeriodeID === S.pid)) return;
    const cur = list.find((p) => p.PeriodeID === nowPid);
    S.pid = cur ? cur.PeriodeID : (list[0] ? list[0].PeriodeID : null);
    store.set('pid', S.pid);
  }
  const curPeriode = () => (S.boot.periode || []).find((p) => p.PeriodeID === S.pid) || null;
  async function refreshBoot() {
    S.boot = await api('bootstrap');
    S.user = S.boot.user;
    pickDefaultPid();
    renderPeriodPicker();
  }

  /* ------------------------------------------------------------------ shell */
  const NAV = [
    { href: '#/beranda', label: 'Beranda', icon: 'home', roles: [SA, HR, PEN, DIR] },
    { href: '#/nilai-saya', label: 'Nilai saya', icon: 'me', roles: [KAR], also: () => !!(S.boot && S.boot.dinilai) },
    { group: 'Penilaian' },
    { href: '#/penilaian', label: 'Isi penilaian', icon: 'pen', roles: [PEN, SA] },
    { href: '#/kehadiran', label: 'Data kehadiran', icon: 'clock', roles: [SA, HR] },
    { href: '#/hasil', label: 'Hasil & ranking', icon: 'chart', roles: [SA, HR, DIR] },
    { href: '#/pemenang', label: 'Pemenang', icon: 'star', roles: [SA, HR, DIR] },
    { href: '#/riwayat', label: 'Riwayat', icon: 'book', roles: [SA, HR, DIR] },
    { group: 'Pengelolaan' },
    { href: '#/karyawan', label: 'Master karyawan', icon: 'users', roles: [SA, HR] },
    { href: '#/jabatan', label: 'Master jabatan', icon: 'badge', roles: [SA, HR] },
    { href: '#/pengguna', label: 'Pengguna & akses', icon: 'key', roles: [SA] },
    { href: '#/pengaturan', label: 'Pengaturan', icon: 'gear', roles: [SA] },
    { href: '#/log', label: 'Log aktivitas', icon: 'list', roles: [SA] }
  ];

  const navAllowed = (n) => can(...n.roles) || (n.also && n.also());

  function renderShell() {
    const items = [];
    let pendingGroup = null;
    NAV.forEach((n) => {
      if (n.group) { pendingGroup = n.group; return; }
      if (!navAllowed(n)) return;
      if (pendingGroup) { items.push(`<div class="nav-group">${esc(pendingGroup)}</div>`); pendingGroup = null; }
      items.push(`<a href="${n.href}" data-nav="${n.href}">${ico(n.icon)}<span>${esc(n.label)}</span></a>`);
    });
    $('#app').innerHTML = `
      <div class="shell" id="shell">
        <aside class="side" aria-label="Navigasi utama">
          <div class="brand"><div class="mark">${MARK}</div><div class="brand-name">Employee of the Month<small>Granostic Center</small></div></div>
          <nav class="nav">${items.join('')}</nav>
          <div class="side-foot">
            <div class="who">${esc(S.user.nama || S.user.email)}</div>
            <div class="role">${S.user.peran.map((p) => esc(PERAN_LABEL[p] || p)).join(', ')}</div>
            <div class="acts"><button type="button" id="btn-pwd">Ganti password</button><button type="button" id="btn-logout">Keluar</button></div>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <button class="btn ghost sm burger" id="burger" aria-label="Buka menu">${ico('menu')}</button>
            <div class="period-pick" id="period-pick"></div>
          </header>
          <main class="content" id="main" tabindex="-1"></main>
        </div>
      </div>`;
    $('#burger').onclick = () => $('#shell').classList.toggle('nav-open');
    $('.side').addEventListener('click', (e) => { if (e.target.closest('a')) $('#shell').classList.remove('nav-open'); });
    $('#shell').addEventListener('click', (e) => { if (e.target.id === 'shell') $('#shell').classList.remove('nav-open'); });
    $('#btn-logout').onclick = async () => { try { await write('logout'); } catch (e) { /* abaikan */ } logoutLocal(); };
    $('#btn-pwd').onclick = () => changePasswordDialog(false);
    renderPeriodPicker();
  }

  function renderPeriodPicker() {
    const el = $('#period-pick');
    if (!el) return;
    if (isKaryawanSaja()) { el.innerHTML = ''; return; }
    const list = S.boot.periode || [];
    if (!list.length) { el.innerHTML = '<span class="muted small">Belum ada periode</span>'; return; }
    el.innerHTML = `<label for="sel-pid">Periode</label><select class="input" id="sel-pid" style="width:auto;min-height:36px">${list.map((p) =>
      `<option value="${esc(p.PeriodeID)}" ${p.PeriodeID === S.pid ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}</select>`;
    $('#sel-pid').onchange = (e) => { S.pid = e.target.value; store.set('pid', S.pid); route(); };
  }

  /* ------------------------------------------------------------------ router */
  const ROUTES = {
    beranda: pageBeranda, 'nilai-saya': pageNilaiSaya, penilaian: pagePenilaian, kehadiran: pageKehadiran, hasil: pageHasil, pemenang: pagePemenang,
    riwayat: pageRiwayat, karyawan: pageKaryawan, jabatan: pageJabatan, pengguna: pagePengguna, pengaturan: pagePengaturan, log: pageLog
  };
  let leaveGuard = null;
  window.addEventListener('beforeunload', (e) => { if (leaveGuard && leaveGuard()) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('hashchange', () => { if (/^#\/verifikasi\//.test(location.hash)) start(); else if (S.user && !$('#main')) start(); else route(); });

  async function route() {
    if (!S.user || !$('#main')) return;
    if (leaveGuard && leaveGuard() && !window.confirm('Ada perubahan yang belum disimpan. Tinggalkan halaman?')) {
      history.replaceState(null, '', route.last || homeHash());
      return;
    }
    leaveGuard = null;
    const h = location.hash.replace(/^#\/?/, '') || homeHash().slice(2);
    const [name, ...args] = h.split('/').map(decodeURIComponent);
    const nav = NAV.find((n) => n.href === '#/' + name);
    if (!ROUTES[name] || (nav && !navAllowed(nav))) { location.hash = homeHash(); return; }
    route.last = location.hash;
    $$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === '#/' + name));
    const main = $('#main');
    main.innerHTML = '<div class="empty"><div class="spinner" style="margin:0 auto"></div></div>';
    document.title = (nav ? nav.label : 'Employee of the Month') + ' · EOM Granostic';
    try {
      await ROUTES[name](main, ...args);
    } catch (e) {
      main.innerHTML = `<div class="panel"><div class="empty"><h3>Halaman gagal dimuat</h3><p>${esc(e.message)}</p><button class="btn" id="reload">Muat ulang</button></div></div>`;
      $('#reload').onclick = route;
    }
    main.focus({ preventScroll: true });
  }

  function noPeriodHtml() {
    return `<div class="panel"><div class="empty"><h3>Belum ada periode</h3><p>${can(SA) ? 'Buat periode penilaian pertama dari Beranda.' : 'HR belum membuka periode penilaian.'}</p></div></div>`;
  }

  /* ================================================================== BERANDA */
  async function pageBeranda(main) {
    const p = curPeriode();
    if (!p) {
      main.innerHTML = `<div class="page-head"><div><h1>Selamat datang, ${esc((S.user.nama || '').split(' ')[0] || '')}</h1><p class="sub">Belum ada periode penilaian.</p></div></div>
        ${can(SA) ? createPeriodPanel() : noPeriodHtml()}`;
      bindCreatePeriod(main);
      return;
    }
    const d = await api('dashboard', { pid: S.pid });
    const per = d.periode;
    const j = S.boot.jadwal;
    const next = geserPid(per.PeriodeID, 1);
    const steps = [
      ['Persiapan', 'Master & kehadiran'],
      ['Penilaian', `${j.buka}–${j.tutup} ${BULAN[Number(per.PeriodeID.slice(5)) - 1]}`],
      ['Finalisasi HR', `mulai ${j.hitung} ${BULAN[Number(per.PeriodeID.slice(5)) - 1]}`],
      ['Pengesahan', 'Direksi memilih'],
      ['Pengumuman', 'Email ke pemenang'],
      ['Penyerahan', `${j.penyerahan} ${labelPid(next)}`]
    ];
    const idx = { DRAFT: 0, DIBUKA: 1, DITUTUP: 2, MENUNGGU_PENGESAHAN: 3, DISAHKAN: 4, DIUMUMKAN: 5 }[per.Status] ?? 0;
    const fillPct = (idx / (steps.length - 1)) * 100;

    let html = `
      <section class="hero">
        <div class="hero-top">
          <h1>${esc(per.label)}</h1>
          <div>${statusPill(per.Status)}</div>
          <div class="acts" id="hero-acts"></div>
        </div>
        <ol class="ribbon" style="--fill-v:${fillPct}%">
          <span class="fill" style="width:calc(${fillPct}% - ${fillPct ? 16 : 0}px)"></span>
          ${steps.map((s, i) => `<li class="${i < idx ? 'done' : i === idx ? 'now' : ''}"><span class="dot"></span><div><div class="lbl">${esc(s[0])}</div><div class="when">${esc(s[1])}</div></div></li>`).join('')}
        </ol>
      </section>`;

    if (d.pemenang && (per.Status === 'DISAHKAN' || per.Status === 'DIUMUMKAN')) html += winnersHtml(d.pemenang);

    if (d.tugasSaya && can(PEN)) {
      const t = d.tugasSaya;
      const pct = t.total ? Math.round((t.selesai / t.total) * 100) : 0;
      html += `<div class="panel"><div class="panel-head"><div class="grow"><h2>Tugas penilaian Anda</h2>
        <p class="hint" style="margin:0">${t.total ? `${t.selesai} dari ${t.total} karyawan sudah selesai dinilai (PA + Grooming).` : 'Belum ada karyawan yang ditugaskan ke Anda.'}</p></div>
        ${t.total && (per.Status === 'DIBUKA' || (t.susulan && t.susulan.aktif && per.Status === 'DITUTUP')) ? `<a class="btn" href="#/penilaian">${t.selesai < t.total ? 'Lanjutkan menilai' : 'Lihat penilaian'}</a>` : ''}</div>
        ${t.total ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
        ${per.Status === 'DRAFT' ? '<p class="small muted" style="margin-top:10px">Penilaian belum dibuka.</p>' : ''}
        ${t.susulan && t.susulan.aktif && per.Status === 'DITUTUP' ? `<div class="note warn" style="margin-top:12px"><p><b>Akses susulan aktif</b> sampai ${esc(t.susulan.berlakuSampaiTeks)} WIB. <a href="#/penilaian">Lengkapi penilaian sekarang</a>.</p></div>`
          : ['DITUTUP', 'MENUNGGU_PENGESAHAN', 'DISAHKAN', 'DIUMUMKAN'].includes(per.Status) ? '<p class="small muted" style="margin-top:10px">Masa pengisian sudah ditutup.</p>' : ''}</div>`;
    }

    if (can(DIR) && per.Status === 'MENUNGGU_PENGESAHAN') {
      html += `<div class="panel" style="border-color:var(--gold)"><div class="panel-head"><div class="grow"><h2>Kandidat menunggu pengesahan Anda</h2>
        <p class="hint" style="margin:0">HR sudah mengajukan ${(d.kandidat || []).length} kandidat. Pilih satu pemenang level SPV dan satu level Staf.</p></div>
        <a class="btn gold" href="#/pemenang">Pilih & sahkan pemenang</a></div></div>`;
    }

    if (d.progres) html += progressHtml(d.progres, per);
    if (can(SA, HR)) html += '<div id="kesiapan-ringkas"></div>';
    main.innerHTML = html;
    if (can(SA, HR)) api('cekKesiapan').then((r) => {
      const el = $('#kesiapan-ringkas', main); if (!el) return;
      const bad = r.hasil.filter((x) => x.status === 'error' || x.status === 'warn');
      if (!bad.length) return;
      el.innerHTML = `<div class="panel"><div class="panel-head"><div class="grow"><h2>Perlu diperiksa</h2><p class="hint" style="margin:0">${bad.length} hal bisa membuat penilaian atau email gagal.</p></div>${can(SA) ? '<a class="btn ghost sm" href="#/pengaturan">Lihat semua</a>' : ''}</div>${kesiapanHtml(r, true)}</div>`;
    }).catch(() => {});
    renderHeroActions(per, d.progres);
    bindProgress(main, per);
  }

  function winnersHtml(w) {
    const card = (lv, x) => x ? `<div class="winner"><div><div class="lv">Employee of the Month · ${lv}</div><h3>${esc(x.Nama)}</h3>
      <div class="meta">${esc(x.Jabatan)} — ${esc(x.Divisi)}</div>${x.Hadiah ? `<div class="meta" style="margin-top:8px;color:#f3e8d3">${esc(x.Hadiah)}</div>` : ''}</div>
      ${x.Total != null ? `<div class="score">${num(x.Total)}<small>total nilai</small></div>` : ''}</div>` : '';
    return `<div class="winners" style="margin-bottom:18px">${card('Level SPV', w.SPV)}${card('Level Staf', w.STAF)}</div>`;
  }

  function progressHtml(pr, per) {
    const rows = pr.penilai.map((x) => {
      const pct = x.total ? Math.round((x.selesai / x.total) * 100) : 0;
      return `<tr><td><div class="name">${esc(x.nama)}</div><div class="sub">${esc(x.email)}${x.terdaftar ? '' : ' · <span style="color:var(--danger)">belum terdaftar sebagai pengguna</span>'}</div></td>
        <td style="min-width:160px"><div class="bar ${pct === 100 ? 'gold' : ''}"><i style="width:${pct}%"></i></div></td>
        <td class="num nowrap">${x.selesai} / ${x.total}</td>
        <td class="right">${progressAction(x, per)}</td></tr>`;
    }).join('');
    return `<div class="panel">
      <div class="panel-head"><div class="grow"><h2>Progres pengisian</h2><p class="hint" style="margin:0">Data lengkap = PA terkirim, Grooming terkirim, dan kehadiran terisi.</p></div></div>
      <div class="grid-3" style="margin-bottom:18px">
        <div class="stat"><b>${pr.lengkap} <span class="muted" style="font-size:16px;font-weight:500">/ ${pr.total}</span></b><span>Karyawan datanya lengkap</span></div>
        <div class="stat"><b>${pr.kehadiranTerisi} <span class="muted" style="font-size:16px;font-weight:500">/ ${pr.total}</span></b><span>Kehadiran terisi</span></div>
        <div class="stat"><b>${pr.penilai.filter((x) => x.selesai === x.total).length} <span class="muted" style="font-size:16px;font-weight:500">/ ${pr.penilai.length}</span></b><span>Penilai selesai</span></div>
      </div>
      ${pr.tanpaPenilai.length ? `<div class="note warn" style="margin-bottom:14px"><p><b>${pr.tanpaPenilai.length} karyawan belum punya penilai:</b> ${pr.tanpaPenilai.slice(0, 8).map((k) => esc(k.Nama)).join(', ')}${pr.tanpaPenilai.length > 8 ? '…' : ''}. Lengkapi kolom email penilai di <a href="#/karyawan">master karyawan</a>.</p></div>` : ''}
      ${pr.penilai.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Penilai</th><th>Progres</th><th class="num">Selesai</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Belum ada karyawan yang dinilai. Isi master karyawan dulu.</p>'}
    </div>`;
  }

  function progressAction(x, per) {
    if (!x.belum.length) return '<span class="pill ok">Selesai</span>';
    if (per.Status === 'DIBUKA' && can(SA, HR)) return `<button class="btn ghost sm" data-remind="${esc(x.email)}">${ico('mail')}Ingatkan</button>`;
    if (x.susulan) return x.susulan.aktif ? `<span class="pill gold">Susulan s/d ${esc(x.susulan.berlakuSampaiTeks)}</span>` : `<span class="pill mute">Susulan berakhir ${esc(x.susulan.berlakuSampaiTeks)}</span>`;
    if (per.Status === 'DITUTUP' && can(SA)) return `<button class="btn ghost sm" data-susulan="${esc(x.email)}" data-nama="${esc(x.nama)}" data-belum="${x.belum.length}">Buka akses susulan</button>`;
    return '';
  }

  function bindProgress(main, per) {
    $$('[data-susulan]', main).forEach((b) => b.onclick = async () => {
      const v = await modal({
        title: 'Buka akses susulan',
        body: `<p><b>${esc(b.dataset.nama)}</b> masih punya <b>${esc(b.dataset.belum)}</b> karyawan yang belum selesai dinilai. Akses susulan membuka kembali pengisian <b>hanya untuk penilai ini</b> dan <b>hanya bisa diberikan 1x</b> per periode.</p>
          <div class="grid-2" style="margin-top:14px"><label class="field"><span>Lama akses</span><select class="input" id="ss-hari"><option value="1">1 hari (24 jam)</option><option value="2">2 hari</option><option value="3">3 hari</option></select></label>
          <label class="field"><span>Alasan (opsional)</span><input class="input" id="ss-alasan" maxlength="300" placeholder="mis. cuti saat masa pengisian"></label></div>
          <p class="small muted" style="margin-top:12px">Penilai menerima email berisi batas waktu. Setelah waktunya habis, akses tertutup otomatis. Hitung ulang hasil setelah penilai selesai.</p>`,
        buttons: [{ label: 'Batal', value: null, cls: 'ghost' }, { label: 'Buka akses susulan', cls: 'gold', collect: (d) => ({ hari: Number($('#ss-hari', d).value), alasan: $('#ss-alasan', d).value.trim() }) }]
      });
      if (!v) return;
      try {
        const r = await withBusy('Membuka akses…', () => write('beriSusulan', { pid: per.PeriodeID, email: b.dataset.susulan, hari: v.hari, alasan: v.alasan }));
        toast('Akses susulan dibuka s/d ' + r.berlakuSampaiTeks + '.', 'ok'); route();
      } catch (e) { toast(e.message, 'err'); }
    });
    $$('[data-remind]', main).forEach((b) => b.onclick = async () => {
      const email = b.dataset.remind;
      try {
        const r = await withBusy('Mengirim pengingat…', () => write('kirimPengingat', { pid: per.PeriodeID, email }));
        toast(r.terkirim ? 'Pengingat terkirim ke ' + email : 'Gagal: ' + (r.detail[0] ? r.detail[0].status : 'tidak ada yang dikirim'), r.terkirim ? 'ok' : 'err');
      } catch (e) { toast(e.message, 'err'); }
    });
  }

  function renderHeroActions(per, pr) {
    const el = $('#hero-acts');
    if (!el || !can(SA, HR)) return;
    const b = [];
    const isSA = can(SA);
    if (per.Status === 'DRAFT' && isSA) b.push(['buka', 'Buka penilaian', '']);
    if (per.Status === 'DIBUKA') {
      b.push(['remindAll', 'Ingatkan semua', 'ghost']);
      b.push(['hitung', 'Hitung sementara', 'ghost']);
      if (isSA) b.push(['tutup', 'Tutup penilaian', '']);
    }
    if (per.Status === 'DITUTUP') {
      if (isSA) b.push(['buka', 'Buka kembali', 'ghost']);
      b.push(['hitung', 'Hitung ulang', 'ghost']);
      if (isSA) b.push(['ajukan', 'Ajukan ke Direksi', 'gold']);
    }
    if (per.Status === 'MENUNGGU_PENGESAHAN' && isSA) b.push(['tarik', 'Tarik pengajuan', 'danger']);
    if (['DISAHKAN', 'DIUMUMKAN'].includes(per.Status)) b.push(['goWin', 'Lihat pemenang', 'ghost']);
    el.innerHTML = b.map((x) => `<button class="btn ${x[2]}" data-act="${x[0]}">${esc(x[1])}</button>`).join('');
    $$('[data-act]', el).forEach((btn) => btn.onclick = () => periodAction(btn.dataset.act, per, pr));
  }

  async function periodAction(act, per, pr) {
    const pid = per.PeriodeID;
    try {
      if (act === 'goWin') { location.hash = '#/pemenang'; return; }
      if (act === 'hitung') {
        await withBusy('Menghitung nilai…', () => write('hitung', { pid }));
        toast('Perhitungan selesai.', 'ok'); location.hash = '#/hasil'; return;
      }
      if (act === 'remindAll') {
        if (!await confirmBox('Kirim pengingat', '<p>Kirim email pengingat ke semua penilai yang belum selesai (dan ke HR bila kehadiran belum lengkap)?</p>', 'Kirim pengingat')) return;
        const akhir = false;
        const r = await withBusy('Mengirim pengingat…', () => write('kirimPengingat', { pid, akhir }));
        toast(`${r.terkirim} email terkirim${r.gagal ? ', ' + r.gagal + ' gagal' : ''}.`, r.gagal ? 'err' : 'ok');
        return;
      }
      let payload = { pid, ke: act };
      if (act === 'buka' && per.Status === 'DITUTUP') {
        const a = await askReason('Buka kembali penilaian', '<p>Penilai bisa mengubah nilai lagi. Hasil perhitungan harus dihitung ulang setelahnya.</p>', 'Buka kembali');
        if (!a) return; payload.alasan = a;
      } else if (act === 'buka') {
        if (!await confirmBox('Buka penilaian', `<p>Penilai bisa mulai mengisi penilaian ${esc(per.label)}.</p>`, 'Buka penilaian')) return;
      } else if (act === 'tutup') {
        const belum = pr ? pr.belumLengkap : 0;
        if (!await confirmBox('Tutup penilaian', `<p>Penilai tidak bisa mengubah nilai lagi.${belum ? ` <b>${belum} karyawan</b> datanya belum lengkap dan tidak akan masuk ranking.` : ''}</p>`, 'Tutup penilaian', 'danger')) return;
      } else if (act === 'tarik') {
        const a = await askReason('Tarik pengajuan', '<p>Pengajuan ke Direksi dibatalkan dan data bisa diperbaiki lagi.</p>', 'Tarik pengajuan');
        if (!a) return; payload.alasan = a;
      } else if (act === 'ajukan') {
        if (!await confirmBox('Ajukan ke Direksi', '<p>Sistem menghitung ulang nilai, mengunci data, lalu mengirim email ke Direksi untuk memilih & mengesahkan pemenang.</p>', 'Ajukan ke Direksi', 'gold')) return;
      }
      let r = await withBusy('Memproses…', () => write('ubahStatusPeriode', payload));
      if (r.perluKonfirmasi) {
        if (!await confirmBox('Data belum lengkap', `<p>${esc(r.pesan)}</p>`, 'Tetap ajukan', 'gold')) return;
        payload.paksa = true;
        r = await withBusy('Memproses…', () => write('ubahStatusPeriode', payload));
      }
      toast('Status periode diperbarui.', 'ok');
      await refreshBoot();
      route();
    } catch (e) { toast(e.message, 'err'); }
  }

  function createPeriodPanel() {
    const t = S.boot.hariIni;
    const def = t.y + '-' + String(t.m).padStart(2, '0');
    return `<div class="panel" id="create-period"><h2>Buat periode penilaian</h2>
      <p class="hint">Periode biasanya dibuat & dibuka otomatis tiap tanggal ${S.boot.jadwal.buka}. Buat manual bila perlu lebih awal.</p>
      <div class="row"><input class="input" type="month" id="np-pid" value="${def}" style="width:auto">
      <label class="check"><input type="checkbox" id="np-open"> Langsung buka penilaian</label>
      <button class="btn" id="np-go">Buat periode</button></div></div>`;
  }
  function bindCreatePeriod(main) {
    const b = $('#np-go', main);
    if (!b) return;
    b.onclick = async () => {
      const pid = $('#np-pid', main).value;
      if (!pid) return toast('Pilih bulan.', 'err');
      try {
        await withBusy('Membuat periode…', () => write('buatPeriode', { pid, langsungBuka: $('#np-open', main).checked }));
        S.pid = pid; store.set('pid', pid);
        await refreshBoot(); toast('Periode ' + labelPid(pid) + ' dibuat.', 'ok'); route();
      } catch (e) { toast(e.message, 'err'); }
    };
  }

  /* ================================================================== PENILAIAN */
  async function pagePenilaian(main, nik) {
    if (!S.pid) { main.innerHTML = noPeriodHtml(); return; }
    if (nik) return pageFormPenilaian(main, nik);
    const semua = can(SA) && store.get('pnl.semua') === '1';
    const r = await api('daftarDinilai', { pid: S.pid, semua });
    const per = r.periode;
    const list = r.daftar;
    const selesai = list.filter((x) => x.statusPA === 'SUBMIT' && x.statusGR === 'SUBMIT').length;
    let rows = '', lastDiv = null;
    list.forEach((x) => {
      if (x.Divisi !== lastDiv) { rows += `<tr class="group"><td colspan="5">${esc(x.Divisi || '(tanpa divisi)')}</td></tr>`; lastDiv = x.Divisi; }
      rows += `<tr class="row-link" data-nik="${esc(x.NIK)}" tabindex="0">
        <td><div class="name">${esc(x.Nama)}</div><div class="sub">${esc(x.Jabatan)} · NIK ${esc(x.NIK)}${semua ? ' · penilai ' + esc(x.EmailPenilai || '-') : ''}</div></td>
        <td><span class="tag">${esc(LEVEL_LABEL[x.Level] || x.Level)}</span></td>
        <td>${nilaiPill(x.statusPA)}${x.totalPA != null ? ` <span class="small muted">${x.totalPA}/150</span>` : ''}</td>
        <td>${nilaiPill(x.statusGR)}${x.totalGR != null ? ` <span class="small muted">${x.totalGR}/100</span>` : ''}</td>
        <td class="right"><span class="linkbtn">${x.statusPA === 'SUBMIT' && x.statusGR === 'SUBMIT' ? 'Lihat' : 'Nilai'}</span></td></tr>`;
    });
    main.innerHTML = `
      <div class="page-head"><div><h1>Isi penilaian</h1><p class="sub">${esc(per.label)} · ${selesai} dari ${list.length} selesai</p></div>
        <div class="actions">${can(SA) ? `<label class="check small"><input type="checkbox" id="chk-semua" ${semua ? 'checked' : ''}> Tampilkan semua karyawan (Super Admin)</label>` : ''}</div></div>
      ${per.Status === 'DRAFT' ? '<div class="note warn" style="margin-bottom:16px"><p>Penilaian periode ini belum dibuka. Anda bisa melihat daftar, tapi belum bisa mengisi.</p></div>' : ''}
      ${r.susulan && r.susulan.aktif && per.Status === 'DITUTUP' ? `<div class="note warn" style="margin-bottom:16px"><p><b>Akses susulan aktif</b> sampai ${esc(r.susulan.berlakuSampaiTeks)} WIB (hanya diberikan 1x). Lengkapi penilaian yang belum selesai sebelum batas waktu.</p></div>`
        : !['DRAFT', 'DIBUKA'].includes(per.Status) ? `<div class="note" style="margin-bottom:16px"><p>Masa pengisian sudah ditutup. Penilaian hanya bisa dilihat${can(SA) && per.Status === 'DITUTUP' ? ' (Super Admin masih bisa koreksi selama status Finalisasi HR)' : ''}.</p></div>` : ''}
      <div class="legend"><span><b>PA</b> Performance Appraisal — 30 butir, bobot ${S.boot.bobot.pa}%</span><span><b>Grooming</b> — 20 butir, bobot ${S.boot.bobot.grooming}%</span></div>
      ${list.length ? `<div class="table-wrap emp-list"><table class="t"><thead><tr><th>Karyawan</th><th>Level</th><th>Performance Appraisal</th><th>Grooming</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<div class="panel"><div class="empty"><h3>Tidak ada karyawan untuk dinilai</h3><p>Belum ada karyawan yang ditugaskan ke akun Anda. Hubungi HR bila ini keliru.</p></div></div>`}`;
    const go = (tr) => { location.hash = '#/penilaian/' + encodeURIComponent(tr.dataset.nik); };
    $$('tr[data-nik]', main).forEach((tr) => { tr.onclick = () => go(tr); tr.onkeydown = (e) => { if (e.key === 'Enter') go(tr); }; });
    const c = $('#chk-semua', main);
    if (c) c.onchange = () => { store.set('pnl.semua', c.checked ? '1' : '0'); route(); };
  }

  async function pageFormPenilaian(main, nik) {
    const r = await api('ambilPenilaian', { pid: S.pid, nik });
    const K = S.boot.kriteria;
    const emp = r.karyawan;
    const editable = r.bisaUbah;
    const state = { tab: store.get('pnl.tab') === 'GR' ? 'GR' : 'PA', dirty: { PA: false, GR: false } };
    const mk = (jenis) => {
      const src = r[jenis] || {};
      const prefix = jenis === 'PA' ? 'P' : 'G';
      const n = K[jenis].area.reduce((s, a) => s + a.item.length, 0);
      const skor = {};
      for (let i = 1; i <= n; i++) { const k = prefix + String(i).padStart(2, '0'); skor[k] = src[k] ?? null; }
      const cat = jenis === 'PA' ? [1, 2, 3, 4, 5].map((i) => src['Evaluasi' + i] || '') : [1, 2, 3].map((i) => src['Catatan' + i] || '');
      // pulihkan draf lokal yang belum tersimpan
      const lk = `draft.${S.pid}.${nik}.${jenis}`;
      let local = null; try { local = JSON.parse(store.get(lk) || 'null'); } catch (e) { local = null; }
      return { skor, cat, status: src.Status || 'BELUM', n, prefix, localKey: lk, restored: local && src.Status !== 'SUBMIT' && local.t > (Date.parse((src.UpdatedAt || '').replace(' ', 'T')) || 0) ? local : null };
    };
    const F = { PA: mk('PA'), GR: mk('GR') };
    ['PA', 'GR'].forEach((j) => { if (F[j].restored) { Object.assign(F[j].skor, F[j].restored.skor); F[j].cat = F[j].restored.cat; state.dirty[j] = true; } });
    leaveGuard = () => editable && (state.dirty.PA || state.dirty.GR);
    const saveLocal = debounce((j) => store.set(F[j].localKey, JSON.stringify({ t: Date.now(), skor: F[j].skor, cat: F[j].cat })), 400);

    function calc(j) {
      let total = 0, filled = 0;
      Object.values(F[j].skor).forEach((v) => { if (v) { total += Number(v); filled++; } });
      const tbl = K[j].kategori;
      let kat = '';
      if (filled === F[j].n) for (const [lim, lab] of tbl) { if (total <= lim) { kat = lab; break; } }
      const bobot = j === 'PA' ? S.boot.bobot.pa : S.boot.bobot.grooming;
      return { total, filled, kat, weighted: total / K[j].maks * 100 * bobot / 100 };
    }

    function render() {
      const j = state.tab;
      const f = F[j];
      const k = K[j];
      let no = 0;
      const areas = k.area.map((a) => {
        let sum = 0;
        const items = a.item.map((txt) => {
          no++;
          const key = f.prefix + String(no).padStart(2, '0');
          const v = f.skor[key];
          if (v) sum += Number(v);
          return `<div class="item" data-key="${key}"><span class="no">${no}</span><span>${esc(txt)}</span>
            <span class="scale" role="radiogroup" aria-label="Nilai butir ${no}">${k.skala.map((s) =>
              `<button type="button" data-v="${s.nilai}" aria-pressed="${Number(v) === s.nilai}" title="${esc(s.label)}" ${editable ? '' : 'disabled'}>${s.nilai}</button>`).join('')}</span></div>`;
        }).join('');
        return `<section class="area"><div class="area-head"><h3>${esc(a.nama)}</h3><span class="sum" data-sum="${a.kode}">${sum} / ${a.item.length * 5}</span></div>${items}</section>`;
      }).join('');
      const catLabel = j === 'PA' ? 'Performance evaluation — area yang harus diperbaiki/ditingkatkan dan targetnya' : 'Catatan grooming';
      const c = calc(j);
      main.innerHTML = `
        <div class="form-head">
          <a class="btn ghost sm" href="#/penilaian">Kembali</a>
          <div class="who"><h1>${esc(emp.Nama)}</h1><p>${esc(emp.Jabatan)} · ${esc(emp.Divisi)} · NIK ${esc(emp.NIK)} · ${esc(r.periode.label)}</p></div>
        </div>
        ${!editable ? '<div class="note" style="margin-bottom:16px"><p>Penilaian ini hanya bisa dilihat (periode tidak dalam masa pengisian).</p></div>' : ''}
        ${editable && r.periode.Status === 'DITUTUP' && r.susulan && r.susulan.aktif ? `<div class="note warn" style="margin-bottom:16px"><p>Anda mengisi lewat <b>akses susulan</b> — berlaku sampai ${esc(r.susulan.berlakuSampaiTeks)} WIB.</p></div>` : ''}
        ${F[j].restored ? '<div class="note warn" style="margin-bottom:16px"><p>Isian yang belum tersimpan dari perangkat ini dipulihkan. Klik <b>Simpan draf</b> atau <b>Kirim</b> untuk menyimpannya ke server.</p></div>' : ''}
        <div class="tabs" role="tablist">
          ${['PA', 'GR'].map((t) => `<button role="tab" data-tab="${t}" aria-selected="${t === j}">${t === 'PA' ? 'Performance Appraisal' : 'Grooming'} <span class="count">${nilaiStatusText(F[t].status, state.dirty[t])}</span></button>`).join('')}
        </div>
        <div class="legend">${k.skala.map((s) => `<span><b>${s.nilai}</b> ${esc(s.label)}</span>`).join('')}</div>
        ${areas}
        <section class="area"><div class="area-head"><h3>${esc(catLabel)}</h3><span class="muted small">opsional</span></div>
          <div style="padding:14px 20px" class="stack">${f.cat.map((v, i) => `<label class="row" style="flex-wrap:nowrap"><span class="muted" style="width:20px">${i + 1}.</span><input class="input" data-cat="${i}" maxlength="300" value="${esc(v)}" ${editable ? '' : 'disabled'}></label>`).join('')}</div></section>
        <div class="sticky-foot">
          <div class="score"><span class="muted small">Terisi</span> <b id="sf-filled">${c.filled}/${f.n}</b></div>
          <div class="score"><span class="muted small">Total</span> <b id="sf-total">${c.total}</b><span class="muted"> / ${k.maks}</span></div>
          <div class="score"><span class="muted small">Kategori</span> <b id="sf-kat" style="font-size:16px">${esc(c.kat || '–')}</b></div>
          <div class="score"><span class="muted small">Skor ${j === 'PA' ? S.boot.bobot.pa : S.boot.bobot.grooming}%</span> <b id="sf-w">${num(c.weighted)}</b></div>
          ${editable ? `<div class="acts">${f.status !== 'SUBMIT' ? '<button class="btn ghost" id="btn-draft">Simpan draf</button>' : ''}
            <button class="btn ${f.status === 'SUBMIT' ? '' : 'gold'}" id="btn-kirim">${f.status === 'SUBMIT' ? 'Simpan perubahan' : 'Kirim penilaian ' + (j === 'PA' ? 'PA' : 'Grooming')}</button></div>` : ''}
        </div>`;
      bind();
    }

    function nilaiStatusText(st, dirty) {
      if (dirty) return '· belum disimpan';
      return st === 'SUBMIT' ? '· terkirim' : st === 'DRAFT' ? '· draf' : '· belum';
    }

    function updateFoot() {
      const j = state.tab, c = calc(j);
      $('#sf-filled').textContent = `${c.filled}/${F[j].n}`;
      $('#sf-total').textContent = c.total;
      $('#sf-kat').textContent = c.kat || '–';
      $('#sf-w').textContent = num(c.weighted);
      K[j].area.forEach((a, ai) => {
        let start = 1 + K[j].area.slice(0, ai).reduce((s, x) => s + x.item.length, 0);
        let sum = 0;
        for (let i = 0; i < a.item.length; i++) sum += Number(F[j].skor[F[j].prefix + String(start + i).padStart(2, '0')] || 0);
        const el = $(`[data-sum="${a.kode}"]`); if (el) el.textContent = `${sum} / ${a.item.length * 5}`;
      });
    }

    function markDirty() {
      const j = state.tab;
      if (!state.dirty[j]) {
        state.dirty[j] = true;
        const tab = $(`[data-tab="${j}"] .count`); if (tab) tab.textContent = nilaiStatusText(F[j].status, true);
      }
      saveLocal(j);
    }

    function bind() {
      $$('[data-tab]', main).forEach((b) => b.onclick = () => { state.tab = b.dataset.tab; store.set('pnl.tab', state.tab); render(); window.scrollTo({ top: 0 }); });
      if (!editable) return;
      $$('.item', main).forEach((it) => {
        it.querySelector('.scale').addEventListener('click', (e) => {
          const b = e.target.closest('button'); if (!b) return;
          const key = it.dataset.key;
          F[state.tab].skor[key] = Number(b.dataset.v);
          $$('button', it).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          it.classList.remove('missing');
          markDirty(); updateFoot();
        });
      });
      $$('[data-cat]', main).forEach((inp) => inp.oninput = () => { F[state.tab].cat[Number(inp.dataset.cat)] = inp.value; markDirty(); });
      const bd = $('#btn-draft', main); if (bd) bd.onclick = () => save(false);
      $('#btn-kirim', main).onclick = () => save(true);
    }

    async function save(kirim) {
      const j = state.tab, f = F[j];
      if (kirim || f.status === 'SUBMIT') {
        const kosong = Object.keys(f.skor).filter((k) => !f.skor[k]);
        if (kosong.length) {
          kosong.forEach((k) => { const el = $(`.item[data-key="${k}"]`); if (el) el.classList.add('missing'); });
          const first = $(`.item[data-key="${kosong[0]}"]`); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast(`Masih ada ${kosong.length} butir yang belum dinilai (ditandai merah).`, 'err');
          return;
        }
        if (f.status !== 'SUBMIT') {
          const c = calc(j);
          const ok = await confirmBox('Kirim penilaian', `<p>Kirim penilaian ${j === 'PA' ? 'Performance Appraisal' : 'Grooming'} untuk <b>${esc(emp.Nama)}</b>?</p>
            <dl class="kv"><dt>Total</dt><dd>${c.total} / ${K[j].maks}</dd><dt>Kategori</dt><dd>${esc(c.kat)}</dd></dl>
            <p class="small muted" style="margin-top:12px">Anda masih bisa mengubahnya selama masa pengisian dibuka.</p>`, 'Kirim');
          if (!ok) return;
        }
      }
      try {
        const res = await withBusy('Menyimpan…', () => write('simpanPenilaian', { pid: S.pid, nik, jenis: j, skor: f.skor, catatan: f.cat, kirim }));
        f.status = res.status; state.dirty[j] = false; f.restored = null;
        store.set(f.localKey, null);
        toast(res.status === 'SUBMIT' ? `Penilaian ${j === 'PA' ? 'PA' : 'Grooming'} tersimpan & terkirim.` : 'Draf tersimpan.', 'ok');
        if (res.status === 'SUBMIT' && j === 'PA' && F.GR.status !== 'SUBMIT') { state.tab = 'GR'; store.set('pnl.tab', 'GR'); window.scrollTo({ top: 0 }); }
        else if (res.status === 'SUBMIT' && F.PA.status === 'SUBMIT' && F.GR.status === 'SUBMIT') {
          render();
          return nextEmployee();
        }
        render();
      } catch (e) { toast(e.message, 'err'); }
    }

    async function nextEmployee() {
      try {
        const d = await api('daftarDinilai', { pid: S.pid, semua: can(SA) && store.get('pnl.semua') === '1' });
        const next = d.daftar.find((x) => x.NIK !== nik && !(x.statusPA === 'SUBMIT' && x.statusGR === 'SUBMIT'));
        const go = await modal({
          title: 'Penilaian lengkap', body: `<p><b>${esc(emp.Nama)}</b> sudah selesai dinilai (PA + Grooming).</p>${next ? `<p>Berikutnya: <b>${esc(next.Nama)}</b> (${esc(next.Divisi)}).</p>` : '<p>Semua karyawan Anda sudah dinilai. Terima kasih!</p>'}`,
          buttons: next ? [{ label: 'Kembali ke daftar', value: 'list', cls: 'ghost' }, { label: 'Nilai berikutnya', value: 'next' }] : [{ label: 'Kembali ke daftar', value: 'list' }]
        });
        if (go === 'next') { store.set('pnl.tab', 'PA'); location.hash = '#/penilaian/' + encodeURIComponent(next.NIK); }
        else if (go === 'list') location.hash = '#/penilaian';
      } catch (e) { /* abaikan */ }
    }

    render();
  }

  /* ================================================================== KEHADIRAN */
  const normHead = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9<>]/g, '');
  function headerAlias() {
    const m = { nik: 'NIK', cutikhusus: 'CutiKhusus', cutikhususyt: 'CutiKhusus', keterangancutikhusus: 'KetCutiKhusus', ketcutikhusus: 'KetCutiKhusus', ketcuti: 'KetCutiKhusus' };
    S.boot.komponenKehadiran.forEach((k) => { m[normHead(k.kode)] = k.kode; m[normHead(k.label)] = k.kode; });
    Object.assign(m, {
      izintanpaketerangan: 'IzinTK', izintk: 'IzinTK', alpha: 'IzinTK', izinnonsakit: 'IzinNonSakit', kekuranganjamkerja: 'KurangJam',
      izinsakitnonskd: 'SakitNonSKD', sakitnonskd: 'SakitNonSKD', 'terlambat>10menit': 'TelatLebih10', terlambatlebih10menit: 'TelatLebih10',
      izinpulangcepat: 'PulangCepat', pulangcepat: 'PulangCepat', 'terlambat<10menit': 'TelatKurang10', terlambatkurang10menit: 'TelatKurang10',
      izinsakitskd: 'SakitSKD', sakitskd: 'SakitSKD'
    });
    return m;
  }

  async function readSheetRows(file, requiredKey) {
    await loadScript('xlsx');
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: 'array' });
    for (const name of wb.SheetNames) {
      const aoa = window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' });
      const hi = aoa.findIndex((r) => r.some((c) => normHead(c) === normHead(requiredKey)));
      if (hi < 0) continue;
      return { header: aoa[hi], rows: aoa.slice(hi + 1).map((r, i) => ({ r, line: hi + i + 2 })).filter((x) => x.r.some((c) => String(c).trim() !== '')) };
    }
    throw new Error(`Kolom "${requiredKey}" tidak ditemukan di file. Pakai template yang disediakan.`);
  }

  async function downloadXlsx(filename, sheets) {
    await loadScript('xlsx');
    const wb = window.XLSX.utils.book_new();
    sheets.forEach((s) => {
      const ws = window.XLSX.utils.aoa_to_sheet(s.rows);
      ws['!cols'] = (s.widths || s.rows[0].map(() => 16)).map((w) => ({ wch: w }));
      window.XLSX.utils.book_append_sheet(wb, ws, s.name);
    });
    window.XLSX.writeFile(wb, filename);
  }

  async function pageKehadiran(main) {
    if (!S.pid) { main.innerHTML = noPeriodHtml(); return; }
    const r = await api('ambilKehadiran', { pid: S.pid });
    const komp = S.boot.komponenKehadiran;
    const bobotKh = S.boot.bobot.kehadiran;
    const editable = r.bisaUbah;
    const rows = r.baris.map((b) => {
      const d = b.data || {};
      const o = { NIK: b.NIK, Nama: b.Nama, Jabatan: b.Jabatan, Divisi: b.Divisi, ada: !!b.data, dirty: false, CutiKhusus: !!d.CutiKhusus, KetCutiKhusus: d.KetCutiKhusus || '' };
      komp.forEach((k) => { o[k.kode] = d[k.kode] ?? (b.data ? 0 : ''); });
      return o;
    });
    const byNik = Object.fromEntries(rows.map((x) => [x.NIK, x]));
    leaveGuard = () => rows.some((x) => x.dirty);
    const nilai = (o) => { let p = 0; komp.forEach((k) => { p += (Number(o[k.kode]) || 0) * k.bobot; }); return Math.max(0, 100 - p); };
    const terisi = rows.filter((x) => x.ada).length;

    let body = '', lastDiv = null;
    rows.forEach((o) => {
      if (o.Divisi !== lastDiv) { body += `<tr class="group"><td colspan="${komp.length + 4}">${esc(o.Divisi || '(tanpa divisi)')}</td></tr>`; lastDiv = o.Divisi; }
      body += `<tr data-nik="${esc(o.NIK)}"><td style="min-width:200px"><div class="name">${esc(o.Nama)}</div><div class="sub">${esc(o.Jabatan)} · ${esc(o.NIK)}${o.ada ? '' : ' · <span style="color:var(--warn)">belum diisi</span>'}</div></td>
        ${komp.map((k) => `<td class="ctr"><input class="input num" type="number" min="0" max="99" step="1" inputmode="numeric" data-f="${k.kode}" value="${esc(o[k.kode])}" aria-label="${esc(k.label)} ${esc(o.Nama)}" ${editable ? '' : 'disabled'}></td>`).join('')}
        <td class="ctr"><input type="checkbox" data-f="CutiKhusus" ${o.CutiKhusus ? 'checked' : ''} aria-label="Cuti khusus ${esc(o.Nama)}" ${editable ? '' : 'disabled'} style="width:17px;height:17px;accent-color:var(--teal)"></td>
        <td class="num total-cell" data-out="nilai">${o.ada || o.dirty ? nilai(o) : '–'}</td>
        <td class="num" data-out="skor">${o.ada || o.dirty ? num(nilai(o) * bobotKh / 100) : '–'}</td></tr>`;
    });

    main.innerHTML = `
      <div class="page-head"><div><h1>Data kehadiran</h1><p class="sub">${esc(r.periode.label)} · ${terisi} dari ${rows.length} karyawan terisi</p></div>
        <div class="actions">
          <button class="btn ghost" id="kh-tpl">${ico('download')}Unduh template</button>
          ${editable ? `<button class="btn ghost" id="kh-imp">${ico('upload')}Impor Excel</button><input type="file" id="kh-file" accept=".xlsx,.xls,.csv" hidden>
          <button class="btn" id="kh-save" disabled>Simpan perubahan</button>` : ''}
        </div></div>
      ${!editable ? '<div class="note" style="margin-bottom:16px"><p>Data kehadiran periode ini sudah terkunci karena sudah diajukan/disahkan.</p></div>' : ''}
      <div class="note" style="margin-bottom:16px"><p>Isi <b>jumlah kejadian</b> per karyawan. Nilai = 100 − total pengurang (${komp.map((k) => esc(k.label) + ' −' + k.bobot).join(', ')}). Skor = nilai × ${bobotKh}%. Centang <b>Cuti khusus</b> bila karyawan menjalani cuti khusus — ia tidak diikutkan pemilihan periode ini (SPO).</p></div>
      ${rows.length ? `<div class="table-wrap" style="max-height:70vh"><table class="t"><thead><tr><th>Karyawan</th>${komp.map((k) => `<th class="ctr" title="${esc(k.label)} (−${k.bobot})" style="white-space:normal;min-width:76px;font-size:11.5px">${esc(k.label)}<br><span style="color:var(--danger)">−${k.bobot}</span></th>`).join('')}<th class="ctr" style="font-size:11.5px">Cuti khusus</th><th class="num">Nilai</th><th class="num">Skor ${bobotKh}%</th></tr></thead><tbody>${body}</tbody></table></div>`
        : '<div class="panel"><div class="empty"><h3>Belum ada karyawan</h3><p>Isi master karyawan (level SPV/Staf, status aktif) terlebih dahulu.</p></div></div>'}`;

    const saveBtn = $('#kh-save', main);
    const refreshSave = () => { if (saveBtn) { const n = rows.filter((x) => x.dirty).length; saveBtn.disabled = !n; saveBtn.textContent = n ? `Simpan perubahan (${n})` : 'Simpan perubahan'; } };
    $$('tr[data-nik]', main).forEach((tr) => {
      const o = byNik[tr.dataset.nik];
      tr.addEventListener('input', (e) => {
        const f = e.target.dataset.f; if (!f) return;
        if (f === 'CutiKhusus') o.CutiKhusus = e.target.checked;
        else {
          let v = e.target.value === '' ? '' : Math.max(0, Math.min(99, Math.floor(Number(e.target.value) || 0)));
          if (String(v) !== e.target.value && e.target.value !== '') e.target.value = v;
          o[f] = v;
        }
        if (f === 'CutiKhusus' && o.CutiKhusus && !o.KetCutiKhusus) {
          const ket = window.prompt('Keterangan cuti khusus (opsional), mis. cuti melahirkan:') || '';
          o.KetCutiKhusus = ket.slice(0, 200);
        }
        o.dirty = true; tr.classList.add('dirty');
        komp.forEach((k) => { if (o[k.kode] === '') o[k.kode] = 0; });
        $('[data-out="nilai"]', tr).textContent = nilai(o);
        $('[data-out="skor"]', tr).textContent = num(nilai(o) * bobotKh / 100);
        refreshSave();
      });
    });

    async function kirim(list, impor) {
      const payload = list.map((o, i) => { const x = { NIK: o.NIK, CutiKhusus: o.CutiKhusus, KetCutiKhusus: o.KetCutiKhusus, _baris: o._baris || i + 1 }; komp.forEach((k) => { x[k.kode] = o[k.kode] === '' ? 0 : o[k.kode]; }); return x; });
      let res = await withBusy('Menyimpan kehadiran…', () => write('simpanKehadiran', { pid: S.pid, baris: payload, impor }));
      if (res.perluKonfirmasi) {
        const ok = await confirmBox('Ada baris bermasalah', `<p>${res.galat.length} baris tidak bisa disimpan:</p>${errorListHtml(res.galat)}<p style="margin-top:12px">Simpan baris lain yang valid (${payload.length - res.galat.length}) dan lewati yang bermasalah?</p>`, 'Simpan yang valid');
        if (!ok) return null;
        res = await withBusy('Menyimpan kehadiran…', () => write('simpanKehadiran', { pid: S.pid, baris: payload, impor, abaikanGalat: true }));
      }
      return res;
    }

    if (saveBtn) saveBtn.onclick = async () => {
      try {
        const res = await kirim(rows.filter((x) => x.dirty), false);
        if (!res) return;
        rows.forEach((x) => { x.dirty = false; });
        toast(`${res.tersimpan} baris kehadiran tersimpan.`, 'ok');
        route();
      } catch (e) { toast(e.message, 'err'); }
    };

    $('#kh-tpl', main).onclick = () => downloadXlsx(`Template Kehadiran ${labelPid(S.pid)}.xlsx`, [{
      name: 'Kehadiran',
      rows: [['NIK', 'Nama', 'Divisi', ...komp.map((k) => k.label), 'Cuti khusus (Y/T)', 'Keterangan cuti khusus']]
        .concat(rows.map((o) => [o.NIK, o.Nama, o.Divisi, ...komp.map((k) => o[k.kode] === '' ? 0 : o[k.kode]), o.CutiKhusus ? 'Y' : 'T', o.KetCutiKhusus])),
      widths: [12, 30, 12, ...komp.map(() => 14), 16, 28]
    }, { name: 'Petunjuk', rows: [['Petunjuk pengisian'], ['Isi jumlah KEJADIAN (bilangan bulat ≥ 0) pada setiap kolom pengurang.'], ['Kolom Nama & Divisi hanya informasi; sistem mencocokkan berdasarkan NIK.'], ['Cuti khusus: isi Y bila karyawan menjalani cuti khusus (tidak ikut pemilihan), selain itu T.'], ['Bobot pengurang: ' + komp.map((k) => k.label + ' = ' + k.bobot).join('; ')]], widths: [100] }]).catch((e) => toast(e.message, 'err'));

    const imp = $('#kh-imp', main);
    if (imp) {
      imp.onclick = () => $('#kh-file', main).click();
      $('#kh-file', main).onchange = async (e) => {
        const file = e.target.files[0]; e.target.value = '';
        if (!file) return;
        try {
          const { header, rows: data } = await withBusy('Membaca file…', () => readSheetRows(file, 'NIK'));
          const alias = headerAlias();
          const map = header.map((h) => alias[normHead(h)] || null);
          if (map.filter(Boolean).length < 2) throw new Error('Kolom di file tidak dikenali. Gunakan template dari tombol "Unduh template".');
          const list = data.map(({ r, line }) => { const o = { _baris: line, CutiKhusus: false, KetCutiKhusus: '' }; map.forEach((f, i) => { if (f) o[f] = f === 'CutiKhusus' ? /^(y|ya|yes|1|true)$/i.test(String(r[i]).trim()) : String(r[i]).trim(); }); komp.forEach((k) => { if (o[k.kode] === undefined || o[k.kode] === '') o[k.kode] = 0; }); return o; });
          const ok = await confirmBox('Impor kehadiran', `<p>${list.length} baris ditemukan di <b>${esc(file.name)}</b>. Kolom terbaca: ${[...new Set(map.filter(Boolean))].map((x) => `<span class="tag">${esc(x)}</span>`).join(' ')}</p><p>Data yang sudah ada untuk NIK yang sama akan ditimpa.</p>`, 'Impor');
          if (!ok) return;
          const res = await kirim(list, true);
          if (!res) return;
          toast(`${res.tersimpan} baris diimpor${res.galat.length ? ', ' + res.galat.length + ' dilewati' : ''}.`, 'ok');
          rows.forEach((x) => { x.dirty = false; });
          route();
        } catch (err) { toast(err.message, 'err'); }
      };
    }
  }

  /* ================================================================== HASIL */
  async function pageHasil(main) {
    if (!S.pid) { main.innerHTML = noPeriodHtml(); return; }
    let r = await api('hasil', { pid: S.pid });
    const tabKey = 'hasil.tab';
    let tab = store.get(tabKey) || 'SPV';
    let div = '';

    function render() {
      const per = r.periode;
      const bisaHitung = can(SA, HR) && ['DIBUKA', 'DITUTUP'].includes(per.Status);
      const bisaKecuali = can(SA) && ['DIBUKA', 'DITUTUP'].includes(per.Status);
      const rows = r.hasil;
      const divisi = [...new Set(rows.map((x) => x.Divisi))].sort();
      const lv = (l) => rows.filter((x) => x.Level === l && x.Layak);
      const tl = rows.filter((x) => !x.Layak);
      const cnt = { SPV: lv('SPV').length, STAF: lv('STAF').length, TL: tl.length };
      let list = tab === 'TL' ? tl : lv(tab).sort((a, b) => a.PeringkatLevel - b.PeringkatLevel);
      if (div) list = list.filter((x) => x.Divisi === div);
      const b = S.boot.bobot;
      const body = list.map((x) => `<tr class="${x.Kandidat ? 'is-candidate' : ''}">
        ${tab !== 'TL' ? `<td class="num" style="width:56px"><b>${x.PeringkatLevel}</b></td>` : ''}
        <td><div class="name"><a href="#/riwayat/${encodeURIComponent(x.NIK)}" style="color:inherit;text-decoration:none">${esc(x.Nama)}</a></div><div class="sub">${esc(x.Jabatan)} · ${esc(x.Divisi)}</div></td>
        <td class="num">${num(x.SkorKehadiran)}<div class="sub">${x.NilaiKehadiran ?? '–'}/100</div></td>
        <td class="num">${num(x.SkorPA)}<div class="sub">${x.TotalPA ?? '–'}/150</div></td>
        <td class="num">${num(x.SkorGrooming)}<div class="sub">${x.TotalGrooming ?? '–'}/100</div></td>
        <td class="num total-cell">${num(x.Total)}</td>
        ${tab !== 'TL' ? `<td>${x.Kandidat ? `<span class="pill gold">Kandidat · #${x.PeringkatDivisi} divisi</span>` : `<span class="small muted">#${x.PeringkatDivisi} divisi</span>`}${x.MenangTerakhir ? `<div class="sub">Pernah menang ${esc(labelPid(x.MenangTerakhir))}</div>` : ''}</td>` : `<td class="small">${esc(x.Alasan)}</td>`}
        ${bisaKecuali ? `<td class="right">${tab === 'TL' && /Dikecualikan/.test(x.Alasan) ? `<button class="btn ghost sm" data-unex="${esc(x.NIK)}">Batalkan</button>` : tab !== 'TL' ? `<button class="btn ghost sm" data-ex="${esc(x.NIK)}" data-nama="${esc(x.Nama)}">Kecualikan</button>` : ''}</td>` : ''}
      </tr>`).join('');
      main.innerHTML = `
        <div class="page-head"><div><h1>Hasil & ranking</h1><p class="sub">${esc(per.label)} · ${statusPill(per.Status)} ${per.DihitungAt ? `· dihitung ${esc(per.DihitungAt)}` : ''}</p></div>
          <div class="actions">${rows.length ? `<button class="btn ghost" id="h-exp">${ico('download')}Ekspor Excel</button>` : ''}${bisaHitung ? `<button class="btn" id="h-calc">${ico('refresh')}${per.DihitungAt ? 'Hitung ulang' : 'Hitung sekarang'}</button>` : ''}</div></div>
        ${per.HasilKedaluwarsa ? '<div class="note warn" style="margin-bottom:16px"><p>Ada perubahan data setelah perhitungan terakhir. Klik <b>Hitung ulang</b> agar ranking terbaru.</p></div>' : ''}
        ${per.Status === 'DIBUKA' && rows.length ? '<div class="note" style="margin-bottom:16px"><p>Ini hasil <b>sementara</b> — penilaian masih dibuka.</p></div>' : ''}
        ${!rows.length ? `<div class="panel"><div class="empty"><h3>Belum dihitung</h3><p>${bisaHitung ? 'Klik Hitung sekarang setelah data penilaian & kehadiran masuk.' : 'Hasil akan muncul setelah HR menghitung nilai.'}</p></div></div>` : `
        <div class="row" style="justify-content:space-between;margin-bottom:4px">
          <div class="tabs" role="tablist" style="margin-bottom:0;flex:1">${[['SPV', 'Level SPV'], ['STAF', 'Level Staf'], ['TL', 'Belum layak']].map(([k, l]) => `<button role="tab" data-t="${k}" aria-selected="${tab === k}">${l}<span class="count">${cnt[k]}</span></button>`).join('')}</div>
          <select class="input" id="h-div" style="width:auto;min-height:36px"><option value="">Semua divisi</option>${divisi.map((d) => `<option ${d === div ? 'selected' : ''}>${esc(d)}</option>`).join('')}</select>
        </div>
        <p class="small muted" style="margin:10px 0">Bobot: Kehadiran ${b.kehadiran}% · PA ${b.pa}% · Grooming ${b.grooming}%. Urutan bila total sama: PA, lalu kehadiran, lalu grooming. Baris bergaris emas = kandidat.</p>
        <div class="table-wrap"><table class="t"><thead><tr>${tab !== 'TL' ? '<th class="num">#</th>' : ''}<th>Karyawan</th><th class="num">Kehadiran ${b.kehadiran}%</th><th class="num">PA ${b.pa}%</th><th class="num">Grooming ${b.grooming}%</th><th class="num">Total</th><th>${tab === 'TL' ? 'Alasan' : 'Status'}</th>${bisaKecuali ? '<th></th>' : ''}</tr></thead>
        <tbody>${body || `<tr><td colspan="9" class="empty">Tidak ada data.</td></tr>`}</tbody></table></div>`}`;
      $$('[data-t]', main).forEach((x) => x.onclick = () => { tab = x.dataset.t; store.set(tabKey, tab); render(); });
      const sd = $('#h-div', main); if (sd) sd.onchange = () => { div = sd.value; render(); };
      const hc = $('#h-calc', main); if (hc) hc.onclick = async () => { try { r = await withBusy('Menghitung…', () => write('hitung', { pid: S.pid })); toast('Perhitungan selesai.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); } };
      const he = $('#h-exp', main); if (he) he.onclick = () => exportHasil(r).catch((e) => toast(e.message, 'err'));
      $$('[data-ex]', main).forEach((x) => x.onclick = async () => {
        const a = await askReason('Kecualikan dari pemilihan', `<p><b>${esc(x.dataset.nama)}</b> tidak akan masuk ranking & kandidat periode ini.</p>`, 'Kecualikan');
        if (!a) return;
        try { r = await withBusy('Memproses…', () => write('kecualikan', { pid: S.pid, nik: x.dataset.ex, kecualikan: true, alasan: a })); toast('Dikecualikan & ranking dihitung ulang.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
      });
      $$('[data-unex]', main).forEach((x) => x.onclick = async () => {
        try { r = await withBusy('Memproses…', () => write('kecualikan', { pid: S.pid, nik: x.dataset.unex, kecualikan: false })); toast('Pengecualian dibatalkan.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
      });
    }
    render();
  }

  async function exportHasil(r) {
    const b = S.boot.bobot;
    const head = ['Level', 'Peringkat', 'Divisi', 'Peringkat divisi', 'Kandidat', 'NIK', 'Nama', 'Jabatan', 'Nilai kehadiran', 'Total PA (/150)', 'Total grooming (/100)',
      `Kehadiran ${b.kehadiran}%`, `PA ${b.pa}%`, `Grooming ${b.grooming}%`, 'Total', 'Layak', 'Alasan'];
    const rows = r.hasil.slice().sort((a, c) => (a.Level + String(a.PeringkatLevel || 999).padStart(3, '0')).localeCompare(c.Level + String(c.PeringkatLevel || 999).padStart(3, '0')))
      .map((x) => [x.Level, x.PeringkatLevel || '', x.Divisi, x.PeringkatDivisi || '', x.Kandidat ? 'Ya' : '', x.NIK, x.Nama, x.Jabatan, x.NilaiKehadiran, x.TotalPA, x.TotalGrooming,
        Number((x.SkorKehadiran || 0).toFixed(2)), Number((x.SkorPA || 0).toFixed(2)), Number((x.SkorGrooming || 0).toFixed(2)), Number((x.Total || 0).toFixed(2)), x.Layak ? 'Ya' : 'Tidak', x.Alasan]);
    await downloadXlsx(`Rekap EOM ${r.periode.label}.xlsx`, [{ name: 'Rekap', rows: [[`Rekapitulasi Employee of the Month — ${r.periode.label}`], [], head, ...rows], widths: [8, 10, 12, 10, 9, 10, 30, 22, 10, 10, 10, 12, 10, 12, 10, 8, 40] }]);
  }

  /* ================================================================== SERTIFIKAT */
  let bgImg = null;
  function loadBg() {
    if (bgImg) return bgImg;
    bgImg = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { bgImg = null; rej(new Error('Gambar sertifikat gagal dimuat.')); }; i.src = 'assets/sertifikat-bg.jpg'; });
    return bgImg;
  }
  const verifyUrl = (kode, i) => location.origin + location.pathname + '#/verifikasi/' + kode + '/' + i;
  function drawQr(g, text, x, y, size) {
    const q = window.qrcode(0, 'M');
    q.addData(text); q.make();
    const n = q.getModuleCount();
    const pad = 6;
    g.fillStyle = '#ffffff';
    g.fillRect(x - pad, y - pad, size + pad * 2, size + pad * 2);
    const cell = size / n;
    g.fillStyle = '#16303f';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) g.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
  }
  async function drawCertificate(nama, pid, kode) {
    const [img] = await Promise.all([loadBg(), loadScript('qr')]);
    await Promise.all([
      document.fonts.load('italic 600 64px "Cormorant Garamond"'),
      document.fonts.load('500 26px "Plus Jakarta Sans"'),
      document.fonts.load('600 26px "Plus Jakarta Sans"')
    ]).catch(() => null);
    const W = 1448, H = 1086, SC = 2;
    const c = document.createElement('canvas');
    c.width = W * SC; c.height = H * SC;
    const g = c.getContext('2d');
    g.scale(SC, SC);
    g.drawImage(img, 0, 0, W, H);
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    // Nama
    let size = 70;
    g.fillStyle = '#1d3346';
    const fit = () => { g.font = `italic 600 ${size}px "Cormorant Garamond", Georgia, serif`; return g.measureText(nama).width; };
    while (fit() > 700 && size > 36) size -= 2;
    g.fillText(nama, 730, 528);
    // Bulan
    g.font = '500 27px "Plus Jakarta Sans", Arial, sans-serif';
    g.fillStyle = '#1d3346';
    g.fillText(labelPid(pid), 810, 735);
    // Penandatangan: tanda tangan digital berupa QR code (tautan verifikasi keaslian)
    const s = S.boot.sertifikat;
    [[s.ttd1Nama, s.ttd1Jabatan, 545, 1], [s.ttd2Nama, s.ttd2Jabatan, 915, 2]].forEach(([n, j, x, i]) => {
      const qs = 84;
      drawQr(g, verifyUrl(kode || 'PRATINJAU', i), x - qs / 2, 866, qs);
      g.font = '600 20px "Plus Jakarta Sans", Arial, sans-serif';
      g.fillStyle = '#1d3346';
      let fs = 20;
      while (g.measureText(n).width > 330 && fs > 14) { fs--; g.font = `600 ${fs}px "Plus Jakarta Sans", Arial, sans-serif`; }
      g.fillText(n, x, 980);
      g.strokeStyle = '#c49a4a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - 160, 989); g.lineTo(x + 160, 989); g.stroke();
      g.font = '500 17px "Plus Jakarta Sans", Arial, sans-serif';
      g.fillStyle = '#1f4f5c';
      const label = String(j || '').toUpperCase();
      if ('letterSpacing' in g) { g.letterSpacing = '2px'; g.fillText(label, x, 1015); g.letterSpacing = '0px'; }
      else g.fillText(label.split('').join('\u200A'), x, 1015);
    });
    return c;
  }
  async function certificatePdf(nama, pid, kode) {
    const [canvas] = await Promise.all([drawCertificate(nama, pid, kode), loadScript('jspdf')]);
    const { jsPDF } = window.jspdf;
    const w = 297, h = w * 1086 / 1448;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [w, h], compress: true });
    doc.setProperties({ title: `Sertifikat Employee of the Month ${labelPid(pid)} - ${nama}`, author: 'PT Persada Medika Utama' });
    doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h, undefined, 'FAST');
    return { base64: doc.output('datauristring').split(',')[1], canvas, doc };
  }
  async function previewCertificate(nama, pid, kode) {
    try {
      const c = await withBusy('Menyiapkan pratinjau…', () => drawCertificate(nama, pid, kode));
      const url = c.toDataURL('image/jpeg', 0.85);
      const v = await modal({ title: 'Pratinjau sertifikat', wide: true, body: `<img class="cert-preview" src="${url}" alt="Pratinjau sertifikat untuk ${esc(nama)}">`, buttons: [{ label: 'Unduh PDF', value: 'pdf', cls: 'ghost' }, { label: 'Tutup', value: null }] });
      if (v === 'pdf') { const r = await withBusy('Membuat PDF…', () => certificatePdf(nama, pid, kode)); r.doc.save(`Sertifikat EOM ${labelPid(pid)} - ${nama}.pdf`); }
    } catch (e) { toast(e.message, 'err'); }
  }

  /* ================================================================== PEMENANG */
  async function pagePemenang(main) {
    if (!S.pid) { main.innerHTML = noPeriodHtml(); return; }
    const r = await api('hasil', { pid: S.pid });
    const per = r.periode;
    const st = per.Status;
    const head = `<div class="page-head"><div><h1>Pengesahan pemenang</h1><p class="sub">${esc(per.label)} · ${statusPill(st)}</p></div></div>`;
    if (['DRAFT', 'DIBUKA', 'DITUTUP'].includes(st)) {
      main.innerHTML = head + `<div class="panel"><div class="empty"><h3>Belum diajukan ke Direksi</h3><p>${can(SA) ? 'Setelah data final, klik <b>Ajukan ke Direksi</b> di Beranda.' : 'HR sedang menyiapkan hasil penilaian. Anda akan menerima email saat kandidat siap disahkan.'}</p></div></div>`;
      return;
    }
    if (st === 'MENUNGGU_PENGESAHAN') return renderSahkan(main, r, head);
    return renderPemenang(main, r, head);
  }

  function candCard(x, name, checked, readonly) {
    const b = S.boot.bobot;
    const comp = (l, v, max) => `<div class="comp"><span class="muted">${l}</span><div class="bar"><i style="width:${Math.min(100, (v / max) * 100)}%"></i></div><span>${num(v)}</span></div>`;
    return `<label class="cand${readonly ? ' ro' : ''}">${readonly ? '' : `<input type="radio" name="${name}" value="${esc(x.NIK)}" ${checked ? 'checked' : ''}>`}
      <div class="rank">${readonly ? '' : '<span class="check-mark" aria-hidden="true"></span>'}Peringkat ${x.PeringkatLevel} · ${esc(x.Divisi)}</div>
      <span class="total">${num(x.Total)}</span>
      <h4>${esc(x.Nama)}</h4><div class="meta">${esc(x.Jabatan)}${x.MenangTerakhir ? ` · pernah menang ${esc(labelPid(x.MenangTerakhir))}` : ''}</div>
      ${comp('Kehadiran', x.SkorKehadiran, b.kehadiran)}${comp('PA', x.SkorPA, b.pa)}${comp('Grooming', x.SkorGrooming, b.grooming)}</label>`;
  }

  function renderSahkan(main, r, head) {
    const per = r.periode;
    const kand = (lv) => r.hasil.filter((x) => x.Level === lv && x.Kandidat).sort((a, b) => a.PeringkatLevel - b.PeringkatLevel);
    const spv = kand('SPV'), staf = kand('STAF');
    const isDir = can(DIR);
    const hadiahOpt = (sel) => `<option value="">— pilih hadiah (opsional) —</option>` + r.hadiah.map((h) => `<option value="${esc(h.Kode)}" ${sel === h.Kode ? 'selected' : ''}>${esc(h.Nama)}</option>`).join('');
    const sec = (lv, list, nm, hid) => `<section class="panel"><div class="panel-head"><div class="grow"><h2>Level ${lv}</h2><p class="hint" style="margin:0">${list.length} kandidat, diurutkan dari nilai tertinggi.</p></div>
      ${isDir && list.length ? `<label class="field" style="min-width:280px;max-width:420px;flex:1"><span>Hadiah</span><select class="input" id="${hid}">${hadiahOpt('')}</select></label>` : ''}</div>
      ${list.length ? `<div class="cand-grid">${list.map((x, i) => candCard(x, nm, isDir && i === 0, !isDir)).join('')}</div>` : '<p class="muted">Tidak ada kandidat layak di level ini.</p>'}</section>`;
    main.innerHTML = head + `
      ${isDir ? `<div class="note" style="margin-bottom:18px"><p>Pilih satu pemenang untuk tiap level. Kandidat teratas sudah terpilih sebagai saran sistem — Anda bebas memilih kandidat lain. Setelah disahkan, sertifikat dibuat otomatis${S.boot.modeKirim === 'OTOMATIS' ? ' dan email ucapan langsung dikirim ke pemenang' : ' dan HR akan mengirim email ucapan ke pemenang'}.</p></div>`
        : `<div class="note warn" style="margin-bottom:18px"><p>Menunggu Direksi (${esc(S.boot.sertifikat.ttd1Nama)} atau ${esc(S.boot.sertifikat.ttd2Nama)}) memilih & mengesahkan pemenang. Diajukan ${esc(per.DiajukanAt || '')}.</p></div>`}
      ${sec('SPV', spv, 'win-spv', 'hd-spv')}
      ${sec('Staf', staf, 'win-staf', 'hd-staf')}
      ${isDir ? `<div class="panel"><label class="field"><span>Catatan pengesahan (opsional)</span><textarea class="input" id="sah-cat" maxlength="500"></textarea></label>
        <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn ghost" id="sah-prev">Pratinjau sertifikat</button><button class="btn gold" id="sah-go">Sahkan pemenang</button></div></div>` : ''}`;
    if (!isDir) return;
    const pick = (nm) => { const el = $(`input[name="${nm}"]:checked`, main); return el ? el.value : ''; };
    const nameOf = (nik) => (r.hasil.find((x) => x.NIK === nik) || {}).Nama || '';
    $('#sah-prev', main).onclick = async () => {
      const a = pick('win-spv') || pick('win-staf');
      if (!a) return toast('Pilih kandidat dulu.', 'err');
      previewCertificate(nameOf(a), per.PeriodeID);
    };
    $('#sah-go', main).onclick = async () => {
      const spvNik = pick('win-spv'), stafNik = pick('win-staf');
      if (spv.length && !spvNik) return toast('Pilih pemenang level SPV.', 'err');
      if (staf.length && !stafNik) return toast('Pilih pemenang level Staf.', 'err');
      const hs = $('#hd-spv', main), ht = $('#hd-staf', main);
      const hName = (sel) => sel && sel.value ? sel.options[sel.selectedIndex].text : '–';
      const ok = await confirmBox('Sahkan pemenang', `<p>Pemenang Employee of the Month <b>${esc(per.label)}</b>:</p>
        <dl class="kv">${spvNik ? `<dt>Level SPV</dt><dd>${esc(nameOf(spvNik))}<div class="small muted" style="font-weight:400">Hadiah: ${esc(hName(hs))}</div></dd>` : ''}${stafNik ? `<dt>Level Staf</dt><dd>${esc(nameOf(stafNik))}<div class="small muted" style="font-weight:400">Hadiah: ${esc(hName(ht))}</div></dd>` : ''}</dl>
        <p class="small muted" style="margin-top:12px">Keputusan dicatat atas nama ${esc(S.user.nama)}.</p>`, 'Sahkan', 'gold');
      if (!ok) return;
      try {
        const res = await withBusy('Mengesahkan…', () => write('sahkan', { pid: per.PeriodeID, spv: spvNik, staf: stafNik, hadiahSpv: hs ? hs.value : '', hadiahStaf: ht ? ht.value : '', catatan: $('#sah-cat', main).value }));
        toast('Pemenang disahkan.', 'ok');
        await withBusy('Membuat sertifikat ber-QR…', async () => {
          for (const lv of ['SPV', 'STAF']) {
            const w = res.pemenang[lv];
            if (!w) continue;
            const pdf = await certificatePdf(w.Nama, per.PeriodeID, w.KodeVerifikasi);
            const sv = await write('simpanSertifikat', { pid: per.PeriodeID, level: lv, pdf: pdf.base64 });
            if (sv.kirim && sv.kirim.semuaTerkirim) toast('Email ucapan sudah dikirim ke pemenang.', 'ok');
            if (sv.kirim && sv.kirim.gagal) toast('Email pemenang belum terkirim: ' + sv.kirim.gagal, 'err');
          }
        }).catch((e) => toast('Sertifikat gagal dibuat (' + e.message + '). Super Admin bisa klik "Buat ulang" di halaman Pemenang.', 'err'));
        await refreshBoot(); route();
      } catch (e) { toast(e.message, 'err'); }
    };
  }

  function renderPemenang(main, r, head) {
    const per = r.periode;
    const w = r.pemenang || {};
    const isSA = can(SA);
    const ccList = null;
    const checks = [];
    ['SPV', 'STAF'].forEach((lv) => {
      const x = w[lv]; if (!x) return;
      const lbl = lv === 'SPV' ? 'SPV' : 'Staf';
      checks.push([!!x.Email, `Email ${esc(x.Nama)} ${x.Email ? `(${esc(x.Email)})` : 'belum diisi di master karyawan'}`]);
      checks.push([!!per['Sertifikat' + (lv === 'SPV' ? 'SPV' : 'Staf')], `Sertifikat ${lbl} ${per['Sertifikat' + (lv === 'SPV' ? 'SPV' : 'Staf')] ? 'tersimpan di Drive' : 'belum dibuat'}`]);
    });
    const siap = checks.every((c) => c[0]);
    main.innerHTML = head + winnersHtml(w) + `
      <div class="grid-2">
        <section class="panel"><h2>Pengesahan</h2>
          <dl class="kv" style="margin-top:12px"><dt>Disahkan oleh</dt><dd>${esc(per.DisahkanOlehNama || per.DisahkanOleh || '–')}</dd><dt>Waktu</dt><dd>${esc(per.DisahkanAt || '–')}</dd>
          ${per.CatatanPengesahan ? `<dt>Catatan</dt><dd style="font-weight:400">${esc(per.CatatanPengesahan)}</dd>` : ''}
          <dt>Email pemenang</dt><dd>${per.Status === 'DIUMUMKAN' ? `Terkirim ${esc(per.DikirimAt)}` : 'Belum dikirim'}</dd></dl>
          ${per.Status === 'DISAHKAN' && (can(DIR) || isSA) ? '<div class="row" style="margin-top:16px"><button class="btn danger sm" id="btn-batal">Batalkan pengesahan</button></div>' : ''}
        </section>
        <section class="panel"><h2>Sertifikat</h2><p class="hint">Tanda tangan QR ${esc(S.boot.sertifikat.ttd1Nama)} dan ${esc(S.boot.sertifikat.ttd2Nama)}. Pindai QR untuk memastikan keaslian.</p>
          <div class="stack">${['SPV', 'STAF'].filter((lv) => w[lv]).map((lv) => `<div class="row" style="justify-content:space-between"><div><div class="name" style="font-weight:600">${esc(w[lv].Nama)}</div><div class="small muted">Level ${lv === 'SPV' ? 'SPV' : 'Staf'}</div></div>
            <div class="row">${w[lv].KodeVerifikasi ? `<a class="btn ghost sm" href="#/verifikasi/${esc(w[lv].KodeVerifikasi)}/1" target="_blank" rel="noopener">Cek verifikasi</a>` : ''}<button class="btn ghost sm" data-prev="${lv}">Pratinjau</button>${isSA || can(DIR) ? `<button class="btn ghost sm" data-regen="${lv}">Buat ulang</button>` : ''}</div></div>`).join('')}</div>
        </section>
      </div>
      ${isSA ? `<section class="panel" style="margin-top:18px"><div class="panel-head"><div class="grow"><h2>Kirim ke pemenang</h2><p class="hint" style="margin:0">Email ucapan + sertifikat PDF ke pemenang, CC manajemen (atur di Pengaturan). Mode saat ini: <b>${esc(S.boot.modeKirim)}</b>.</p></div>
        ${per.Status === 'DISAHKAN' ? `<button class="btn gold" id="btn-send" ${siap ? '' : 'disabled'}>${ico('mail')}Kirim ke pemenang</button>` : `<button class="btn ghost" id="btn-resend">${ico('mail')}Kirim ulang</button>`}</div>
        <ul class="checklist">${checks.map((c) => `<li class="${c[0] ? '' : 'no'}"><span class="ic">${c[0] ? '✓' : '!'}</span><span>${c[1]}</span></li>`).join('')}</ul></section>` : ''}`;
    void ccList;
    $$('[data-prev]', main).forEach((b) => b.onclick = () => previewCertificate(w[b.dataset.prev].Nama, per.PeriodeID, w[b.dataset.prev].KodeVerifikasi));
    $$('[data-regen]', main).forEach((b) => b.onclick = async () => {
      const lv = b.dataset.regen;
      try {
        await withBusy('Membuat sertifikat…', async () => {
          const pdf = await certificatePdf(w[lv].Nama, per.PeriodeID, w[lv].KodeVerifikasi);
          await write('simpanSertifikat', { pid: per.PeriodeID, level: lv, pdf: pdf.base64 });
        });
        toast('Sertifikat disimpan.', 'ok'); await refreshBoot(); route();
      } catch (e) { toast(e.message, 'err'); }
    });
    const bb = $('#btn-batal', main);
    if (bb) bb.onclick = async () => {
      const a = await askReason('Batalkan pengesahan', '<p>Status kembali ke <b>Menunggu pengesahan</b> dan Direksi perlu memilih ulang.</p>', 'Batalkan pengesahan');
      if (!a) return;
      try { await withBusy('Memproses…', () => write('batalSahkan', { pid: per.PeriodeID, alasan: a })); toast('Pengesahan dibatalkan.', 'ok'); await refreshBoot(); route(); } catch (e) { toast(e.message, 'err'); }
    };
    const send = async (ulang) => {
      const names = ['SPV', 'STAF'].filter((lv) => w[lv]).map((lv) => `<li>${esc(w[lv].Nama)} — ${esc(w[lv].Email)}</li>`).join('');
      if (!await confirmBox(ulang ? 'Kirim ulang email pemenang' : 'Kirim ke pemenang', `<p>Email ucapan + sertifikat akan dikirim ke:</p><ul>${names}</ul><p class="small muted">CC: email manajemen di Pengaturan.</p>`, ulang ? 'Kirim ulang' : 'Kirim sekarang', 'gold')) return;
      try {
        const res = await withBusy('Mengirim email…', () => write('kirimPemenang', { pid: per.PeriodeID, ulang }));
        const bad = res.hasil.filter((h) => h.status !== 'TERKIRIM');
        if (bad.length) toast('Sebagian gagal: ' + bad.map((h) => h.nama + ' (' + h.status + ')').join('; '), 'err');
        else toast('Email pemenang terkirim.', 'ok');
        await refreshBoot(); route();
      } catch (e) { toast(e.message, 'err'); }
    };
    const bs = $('#btn-send', main); if (bs) bs.onclick = () => send(false);
    const br = $('#btn-resend', main); if (br) br.onclick = () => send(true);
  }

  /* ================================================================== RIWAYAT */
  async function pageRiwayat(main, nik) {
    if (nik) return pageRiwayatKaryawan(main, nik);
    const list = await api('riwayat');
    main.innerHTML = `<div class="page-head"><div><h1>Riwayat</h1><p class="sub">Semua periode beserta pemenangnya. Klik periode untuk membuka hasil lengkapnya.</p></div>
      <div class="actions"><input class="input" id="rw-q" placeholder="Cari karyawan (nama/NIK)…" style="width:260px"></div></div>
      <div id="rw-search"></div>
      ${list.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Periode</th><th>Status</th><th>Pemenang SPV</th><th>Pemenang Staf</th><th class="num">Dinilai</th></tr></thead><tbody>
      ${list.map((p) => `<tr class="row-link" data-pid="${esc(p.PeriodeID)}" tabindex="0"><td><span class="serif" style="font-size:20px;font-weight:600;color:var(--ink)">${esc(p.label)}</span></td><td>${statusPill(p.Status)}</td>
        <td>${p.pemenang.SPV ? `<div class="name">${esc(p.pemenang.SPV.Nama)}</div><div class="sub">${esc(p.pemenang.SPV.Divisi)}</div>` : '<span class="muted">–</span>'}</td>
        <td>${p.pemenang.STAF ? `<div class="name">${esc(p.pemenang.STAF.Nama)}</div><div class="sub">${esc(p.pemenang.STAF.Divisi)}</div>` : '<span class="muted">–</span>'}</td>
        <td class="num">${p.jumlahDinilai}</td></tr>`).join('')}</tbody></table></div>` : '<div class="panel"><div class="empty"><h3>Belum ada riwayat</h3></div></div>'}`;
    $$('tr[data-pid]', main).forEach((tr) => { const go = () => { S.pid = tr.dataset.pid; store.set('pid', S.pid); renderPeriodPicker(); location.hash = '#/hasil'; }; tr.onclick = go; tr.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
    let emps = null;
    $('#rw-q', main).oninput = debounce(async (e) => {
      const q = e.target.value.trim().toLowerCase();
      const box = $('#rw-search', main);
      if (q.length < 2) { box.innerHTML = ''; return; }
      if (!emps) {
        try { emps = can(SA, HR) ? await api('daftarKaryawan') : null; } catch (er) { emps = null; }
      }
      let found = [];
      if (emps) found = emps.filter((k) => (k.Nama + ' ' + k.NIK).toLowerCase().includes(q)).slice(0, 8);
      else {
        // Direksi: cari dari hasil periode yang tersedia
        const seen = {};
        for (const p of S.boot.periode.slice(0, 6)) {
          try { const h = await api('hasil', { pid: p.PeriodeID }); h.hasil.forEach((x) => { if (!seen[x.NIK] && (x.Nama + ' ' + x.NIK).toLowerCase().includes(q)) { seen[x.NIK] = 1; found.push(x); } }); } catch (er) { /* lewati */ }
        }
        found = found.slice(0, 8);
      }
      box.innerHTML = found.length ? `<div class="panel" style="margin-bottom:18px"><div class="stack">${found.map((k) => `<a href="#/riwayat/${encodeURIComponent(k.NIK)}" class="row" style="text-decoration:none;justify-content:space-between"><span><b style="color:var(--ink)">${esc(k.Nama)}</b> <span class="muted small">${esc(k.Jabatan)} · ${esc(k.Divisi)}</span></span><span class="linkbtn">Lihat riwayat</span></a>`).join('')}</div></div>` : '<p class="muted small" style="margin-bottom:16px">Tidak ditemukan.</p>';
    }, 350);
  }

  async function pageRiwayatKaryawan(main, nik) {
    const r = await api('riwayatKaryawan', { nik });
    const k = r.karyawan;
    const rows = r.riwayat;
    const pts = rows.slice().reverse();
    const W = 640, H = 160, pad = 28;
    const chart = pts.length > 1 ? (() => {
      const xs = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1);
      const ys = (v) => H - pad - ((v - 50) / 50) * (H - pad * 2);
      const line = pts.map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(Math.max(50, p.Total || 0)).toFixed(1)}`).join(' ');
      return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto" role="img" aria-label="Grafik total nilai per periode">
        ${[50, 75, 100].map((v) => `<line x1="${pad}" x2="${W - pad}" y1="${ys(v)}" y2="${ys(v)}" stroke="#e6efef"/><text x="4" y="${ys(v) + 4}" font-size="11" fill="#5d7a7e">${v}</text>`).join('')}
        <path d="${line}" fill="none" stroke="#157b82" stroke-width="2.5"/>
        ${pts.map((p, i) => `<circle cx="${xs(i)}" cy="${ys(Math.max(50, p.Total || 0))}" r="${p.Menang ? 6 : 4}" fill="${p.Menang ? '#b8893a' : '#157b82'}"><title>${esc(p.label)}: ${num(p.Total)}</title></circle>
          <text x="${xs(i)}" y="${H - 6}" font-size="11" text-anchor="middle" fill="#5d7a7e">${esc(p.label.slice(0, 3))} ${esc(p.label.slice(-2))}</text>`).join('')}
      </svg>`;
    })() : '';
    main.innerHTML = `<div class="page-head"><div><h1>${esc(k.Nama)}</h1><p class="sub">${esc(k.Jabatan)} · ${esc(k.Divisi)} · NIK ${esc(k.NIK)} · ${esc(LEVEL_LABEL[k.Level] || k.Level)}</p></div>
      <div class="actions"><a class="btn ghost" href="#/riwayat">Kembali</a></div></div>
      ${chart ? `<div class="panel" style="margin-bottom:18px"><h2>Total nilai per periode</h2><p class="hint">Titik emas = periode saat menjadi Employee of the Month.</p>${chart}</div>` : ''}
      ${rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Periode</th><th class="num">Kehadiran</th><th class="num">PA</th><th class="num">Grooming</th><th class="num">Total</th><th class="num">Peringkat level</th><th>Keterangan</th></tr></thead><tbody>
      ${rows.map((x) => `<tr><td><b>${esc(x.label)}</b></td><td class="num">${num(x.SkorKehadiran)}</td><td class="num">${num(x.SkorPA)}</td><td class="num">${num(x.SkorGrooming)}</td><td class="num total-cell">${num(x.Total)}</td>
        <td class="num">${x.PeringkatLevel || '–'}</td><td>${x.Menang ? '<span class="pill gold">Employee of the Month</span>' : x.Kandidat ? '<span class="pill">Kandidat</span>' : x.Layak ? '' : `<span class="small muted">${esc(x.Alasan)}</span>`}</td></tr>`).join('')}</tbody></table></div>`
        : '<div class="panel"><div class="empty"><h3>Belum ada riwayat nilai</h3></div></div>'}`;
  }

  /* ================================================================== MASTER KARYAWAN */
  const KAR_COLS = [
    ['NIK', 'NIK', 'Nomor induk karyawan (unik)'],
    ['Nama', 'Nama', 'Nama lengkap sesuai sertifikat'],
    ['Jabatan', 'Jabatan', 'mis. Koord. GA, HR Staff'],
    ['Level', 'Level', 'SPV (termasuk Ast. SPV) / STAF / TIDAK_DINILAI'],
    ['Divisi', 'Divisi', 'Kode/nama divisi, mis. HGI, LAB, KLINIK'],
    ['Email', 'Email karyawan', 'Untuk kirim ucapan & sertifikat bila menang'],
    ['EmailPenilai', 'Email penilai', 'Email akun pimpinan yang menilai (harus terdaftar sebagai Penilai)'],
    ['Status', 'Status', 'AKTIF / NONAKTIF'],
    ['TglMasuk', 'Tanggal masuk', 'Opsional, format YYYY-MM-DD'],
    ['Catatan', 'Catatan', 'Opsional']
  ];

  async function pageKaryawan(main) {
    let [list, mj] = await Promise.all([api('daftarKaryawan'), api('daftarJabatan')]);
    let q = '', fl = '';
    function render() {
      let rows = list;
      if (q) rows = rows.filter((k) => (k.Nama + ' ' + k.NIK + ' ' + k.Jabatan + ' ' + k.Divisi).toLowerCase().includes(q));
      if (fl === 'warn') rows = rows.filter((k) => k.Status === 'AKTIF' && k.Level !== 'TIDAK_DINILAI' && (!k.PenilaiValid || !k.Email));
      else if (fl) rows = rows.filter((k) => k.Level === fl);
      const warn = list.filter((k) => k.Status === 'AKTIF' && k.Level !== 'TIDAK_DINILAI' && (!k.PenilaiValid || !k.Email)).length;
      main.innerHTML = `<div class="page-head"><div><h1>Master karyawan</h1><p class="sub">${list.length} karyawan · ${list.filter((k) => k.Status === 'AKTIF' && k.Level !== 'TIDAK_DINILAI').length} aktif dinilai</p></div>
        <div class="actions">${can(SA) ? `<button class="btn ghost" id="k-akun">${ico('key')}Buat akun karyawan</button>` : ''}<button class="btn ghost" id="k-tpl">${ico('download')}Unduh template</button><button class="btn ghost" id="k-imp">${ico('upload')}Impor Excel</button><input type="file" id="k-file" accept=".xlsx,.xls,.csv" hidden><button class="btn" id="k-add">Tambah karyawan</button></div></div>
        ${warn ? `<div class="note warn" style="margin-bottom:16px"><p><b>${warn} karyawan</b> belum punya penilai yang valid atau email kosong. <button class="linkbtn" id="k-showwarn">Tampilkan</button></p></div>` : ''}
        <div class="row" style="margin-bottom:14px"><input class="input" id="k-q" placeholder="Cari nama, NIK, jabatan, divisi…" value="${esc(q)}" style="max-width:340px">
          <select class="input" id="k-fl" style="width:auto"><option value="">Semua level</option><option value="SPV" ${fl === 'SPV' ? 'selected' : ''}>SPV</option><option value="STAF" ${fl === 'STAF' ? 'selected' : ''}>Staf</option><option value="TIDAK_DINILAI" ${fl === 'TIDAK_DINILAI' ? 'selected' : ''}>Tidak dinilai</option><option value="warn" ${fl === 'warn' ? 'selected' : ''}>Perlu dilengkapi</option></select></div>
        ${rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Karyawan</th><th>Level</th><th>Divisi</th><th>Penilai</th><th>Email</th><th>Status</th><th>Akun login</th><th></th></tr></thead><tbody>
        ${rows.map((k) => `<tr><td><div class="name">${esc(k.Nama)}</div><div class="sub">${esc(k.Jabatan)} · ${esc(k.NIK)}</div></td><td><span class="tag">${esc(LEVEL_LABEL[k.Level] || k.Level)}</span></td><td>${esc(k.Divisi)}</td>
          <td>${k.EmailPenilai ? `<div>${esc(k.NamaPenilai || k.EmailPenilai)}</div>${k.PenilaiValid ? '' : '<div class="sub" style="color:var(--danger)">belum terdaftar sebagai penilai</div>'}` : (k.Level === 'TIDAK_DINILAI' ? '<span class="muted">–</span>' : '<span style="color:var(--danger)">belum diisi</span>')}</td>
          <td class="small">${k.Email ? esc(k.Email) : '<span class="muted">–</span>'}</td><td>${k.Status === 'AKTIF' ? '<span class="pill ok">Aktif</span>' : '<span class="pill mute">Nonaktif</span>'}</td>
          <td>${k.Level === 'TIDAK_DINILAI' ? '<span class="muted">–</span>' : k.Akun === 'AKTIF' ? `<span class="pill ok">Aktif</span><div class="sub">${esc(k.AkunLoginTerakhir || 'belum login')}</div>` : k.Akun === 'SEMENTARA' ? '<span class="pill warn">Password sementara</span>' : '<span class="pill mute">Belum ada</span>'}</td>
          <td class="right nowrap"><button class="btn ghost sm" data-edit="${esc(k.NIK)}">Ubah</button>${can(SA) && k.Level !== 'TIDAK_DINILAI' && k.Status === 'AKTIF' ? ` <button class="btn ghost sm" data-akun="${esc(k.NIK)}" data-nama="${esc(k.Nama)}">${k.Akun ? 'Reset password' : 'Buat akun'}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="panel"><div class="empty"><h3>${list.length ? 'Tidak ada yang cocok' : 'Belum ada data karyawan'}</h3><p>${list.length ? 'Ubah kata kunci pencarian.' : 'Unduh template, isi data karyawan, lalu impor. Atau tambah satu per satu.'}</p></div></div>`}`;
      const qi = $('#k-q', main); qi.oninput = debounce(() => { q = qi.value.trim().toLowerCase(); render(); $('#k-q', main).focus(); const v = $('#k-q', main); v.setSelectionRange(v.value.length, v.value.length); }, 250);
      $('#k-fl', main).onchange = (e) => { fl = e.target.value; render(); };
      const sw = $('#k-showwarn', main); if (sw) sw.onclick = () => { fl = 'warn'; render(); };
      $('#k-add', main).onclick = () => editKaryawan(null);
      const ka = $('#k-akun', main);
      if (ka) ka.onclick = async () => {
        const belum = list.filter((x) => x.Status === 'AKTIF' && x.Level !== 'TIDAK_DINILAI' && !x.Akun).length;
        if (!belum) return toast('Semua karyawan yang dinilai sudah punya akun. Pakai tombol Reset password per karyawan bila perlu.', '');
        const v = await modal({
          title: 'Buat akun karyawan',
          body: `<p>Buat akun login (NIK + password sementara) untuk <b>${belum} karyawan</b> yang belum punya akun. Karyawan hanya bisa melihat nilainya sendiri.</p>
            <label class="check" style="margin-top:12px"><input type="checkbox" id="ka-mail"> Kirim password lewat email (bagi yang punya email)</label>
            <p class="small muted" style="margin-top:8px">Kuota email Gmail terbatas (±100 penerima/hari). Setelah selesai Anda bisa mengunduh daftar NIK + password sementara (Excel) untuk dibagikan.</p>`,
          buttons: [{ label: 'Batal', value: null, cls: 'ghost' }, { label: 'Buat akun', collect: (d) => ({ kirimEmail: $('#ka-mail', d).checked }) }]
        });
        if (!v) return;
        try { const r = await withBusy('Membuat akun…', () => write('buatAkunKaryawan', v)); await showAkun(r.hasil); list = await api('daftarKaryawan'); render(); } catch (e) { toast(e.message, 'err'); }
      };
      $$('[data-akun]', main).forEach((bt) => bt.onclick = async () => {
        if (!await confirmBox('Akun karyawan', `<p>Buat password sementara baru untuk <b>${esc(bt.dataset.nama)}</b> (NIK ${esc(bt.dataset.akun)})? Sesi login lamanya akan diakhiri.</p>`, 'Buat password')) return;
        try { const r = await withBusy('Memproses…', () => write('buatAkunKaryawan', { nik: bt.dataset.akun, kirimEmail: true })); await showAkun(r.hasil); list = await api('daftarKaryawan'); render(); } catch (e) { toast(e.message, 'err'); }
      });
      $$('[data-edit]', main).forEach((b) => b.onclick = () => editKaryawan(list.find((k) => k.NIK === b.dataset.edit)));
      $('#k-tpl', main).onclick = () => downloadXlsx('Template Master Karyawan EOM.xlsx', [
        { name: 'Karyawan', rows: [KAR_COLS.map((c) => c[0])].concat(list.length ? list.map((k) => KAR_COLS.map((c) => k[c[0]] || '')) : [['220051', 'Freddy Agustinus, S.Ars', 'Koord. GA', 'SPV', 'HGI', 'freddy@contoh.com', 'deiky@contoh.com', 'AKTIF', '', '']]), widths: [12, 30, 22, 14, 10, 28, 28, 10, 12, 20] },
        { name: 'Petunjuk', rows: [['Kolom', 'Keterangan']].concat(KAR_COLS.map((c) => [c[0], c[2]])), widths: [16, 80] }
      ]).catch((e) => toast(e.message, 'err'));
      $('#k-imp', main).onclick = () => $('#k-file', main).click();
      $('#k-file', main).onchange = async (e) => {
        const file = e.target.files[0]; e.target.value = '';
        if (!file) return;
        try {
          const { header, rows: data } = await withBusy('Membaca file…', () => readSheetRows(file, 'NIK'));
          const alias = {}; KAR_COLS.forEach((c) => { alias[normHead(c[0])] = c[0]; alias[normHead(c[1])] = c[0]; });
          Object.assign(alias, { emailatasan: 'EmailPenilai', penilai: 'EmailPenilai', departemen: 'Divisi', dept: 'Divisi', namakaryawan: 'Nama' });
          const map = header.map((h) => alias[normHead(h)] || null);
          if (!map.includes('NIK') || !map.includes('Nama')) throw new Error('Kolom NIK dan Nama wajib ada.');
          const baris = data.map(({ r, line }) => { const o = { _baris: line }; map.forEach((f, i) => { if (f) o[f] = String(r[i]).trim(); }); return o; });
          if (!await confirmBox('Impor karyawan', `<p>${baris.length} baris dari <b>${esc(file.name)}</b>. Data dengan NIK yang sama akan diperbarui.</p>`, 'Impor')) return;
          let res = await withBusy('Mengimpor…', () => write('simpanKaryawan', { baris, impor: true }));
          if (res.perluKonfirmasi) {
            if (!await confirmBox('Ada baris bermasalah', `<p>${res.galat.length} baris tidak valid:</p>${errorListHtml(res.galat)}<p style="margin-top:12px">Impor baris lain yang valid?</p>`, 'Impor yang valid')) return;
            res = await withBusy('Mengimpor…', () => write('simpanKaryawan', { baris, impor: true, abaikanGalat: true }));
          }
          await modal({ title: 'Impor selesai', body: `<p><b>${res.tersimpan}</b> karyawan tersimpan${res.galat.length ? `, ${res.galat.length} dilewati` : ''}.</p>${res.peringatan.length ? `<div class="note warn"><p>Perlu dilengkapi (${res.peringatan.length}):</p>${errorListHtml(res.peringatan)}</div>` : ''}` });
          list = await api('daftarKaryawan'); await refreshBoot(); render();
        } catch (err) { toast(err.message, 'err'); }
      };
    }
    async function showAkun(rows) {
      const v = await modal({
        title: `${rows.length} akun karyawan siap`, wide: rows.length > 1,
        body: `<p>Karyawan login di aplikasi memakai <b>NIK</b> dan password sementara di bawah, lalu wajib menggantinya. Simpan/bagikan sekarang — password tidak bisa dilihat lagi.</p>
          <div class="table-wrap" style="max-height:320px;margin-top:12px"><table class="t"><thead><tr><th>NIK</th><th>Nama</th><th>Divisi</th><th>Password sementara</th><th>Email</th></tr></thead><tbody>
          ${rows.map((x) => `<tr><td>${esc(x.NIK)}</td><td>${esc(x.Nama)}</td><td>${esc(x.Divisi)}</td><td><code style="font-size:14px;font-weight:700;user-select:all">${esc(x.passwordSementara)}</code></td><td class="small">${esc(x.email)}</td></tr>`).join('')}</tbody></table></div>`,
        buttons: [{ label: 'Unduh Excel', value: 'xls', cls: 'ghost' }, { label: 'Selesai', value: null }]
      });
      if (v === 'xls') {
        await downloadXlsx('Akun Karyawan EOM.xlsx', [{ name: 'Akun', rows: [['NIK (login)', 'Nama', 'Divisi', 'Password sementara', 'Link aplikasi']].concat(rows.map((x) => [x.NIK, x.Nama, x.Divisi, x.passwordSementara, location.origin + location.pathname])), widths: [14, 32, 12, 20, 40] }]).catch((e) => toast(e.message, 'err'));
        return showAkun(rows);
      }
    }
    async function editKaryawan(k) {
      const isNew = !k; k = k || { Status: 'AKTIF', Level: '', Jabatan: '', Divisi: '', EmailPenilai: '' };
      const jabAktif = mj.jabatan.filter((j) => j.Aktif || j.Nama === k.Jabatan);
      const pakaiMaster = jabAktif.length > 0;
      const jabLuar = k.Jabatan && !mj.jabatan.some((j) => j.Nama.toLowerCase() === String(k.Jabatan).toLowerCase());
      const divs = [...new Set([...(mj.divisi || []), ...(S.boot.divisi || [])])].sort();
      const penilai = mj.penilai;
      const penLuar = k.EmailPenilai && !penilai.some((p) => p.email === String(k.EmailPenilai).toLowerCase());
      const optPenilai = (sel) => `<option value="">— belum ada —</option>` + penilai.map((p) => `<option value="${esc(p.email)}" ${p.email === String(sel || '').toLowerCase() ? 'selected' : ''}>${esc(p.nama)}${p.jabatan ? ' · ' + esc(p.jabatan) : ''}</option>`).join('')
        + (penLuar ? `<option value="${esc(k.EmailPenilai)}" selected>${esc(k.EmailPenilai)} (belum terdaftar)</option>` : '');
      const jabField = pakaiMaster
        ? `<select class="input" id="e-Jabatan"><option value="">— pilih jabatan —</option>${jabAktif.map((j) => `<option value="${esc(j.Nama)}" ${j.Nama === k.Jabatan ? 'selected' : ''}>${esc(j.Nama)} · ${esc(j.Divisi)}</option>`).join('')}${jabLuar ? `<option value="${esc(k.Jabatan)}" selected>${esc(k.Jabatan)} (belum ada di master)</option>` : ''}</select><small>Divisi, level & penilai terisi otomatis dari master jabatan. ${can(SA) ? '<a href="#/jabatan">Kelola jabatan</a>' : ''}</small>`
        : `<input class="input" id="e-Jabatan" value="${esc(k.Jabatan || '')}"><small>Master jabatan belum diisi${can(SA) ? ' — <a href="#/jabatan">isi di sini</a>' : ''}.</small>`;
      const v = await modal({
        title: isNew ? 'Tambah karyawan' : 'Ubah karyawan',
        body: `<div class="grid-2">
          <label class="field"><span>NIK</span><input class="input" id="e-NIK" value="${esc(k.NIK || '')}" ${isNew ? '' : 'readonly'}></label>
          <label class="field"><span>Nama lengkap</span><input class="input" id="e-Nama" value="${esc(k.Nama || '')}"><small>Ditulis seperti di sertifikat (gelar ikut).</small></label>
          <label class="field"><span>Jabatan</span>${jabField}</label>
          <label class="field"><span>Divisi</span><input class="input" id="e-Divisi" list="dl-div" value="${esc(k.Divisi || '')}"><datalist id="dl-div">${divs.map((d) => `<option value="${esc(d)}">`).join('')}</datalist></label>
          <label class="field"><span>Level</span><select class="input" id="e-Level"><option value="">— pilih —</option>${['SPV', 'STAF', 'TIDAK_DINILAI'].map((l) => `<option value="${l}" ${k.Level === l ? 'selected' : ''}>${LEVEL_LABEL[l]}</option>`).join('')}</select><small>SPV termasuk Ast. SPV. Manager/KaDept = tidak dinilai.</small></label>
          <label class="field"><span>Penilai (atasan langsung)</span><select class="input" id="e-EmailPenilai">${optPenilai(k.EmailPenilai)}</select></label>
          <label class="field"><span>Email karyawan</span><input class="input" type="email" id="e-Email" value="${esc(k.Email || '')}"><small>Untuk email ucapan & sertifikat bila menang.</small></label>
          <label class="field"><span>Status</span><select class="input" id="e-Status"><option ${k.Status === 'AKTIF' ? 'selected' : ''}>AKTIF</option><option ${k.Status === 'NONAKTIF' ? 'selected' : ''}>NONAKTIF</option></select></label>
          <label class="field"><span>Tanggal masuk</span><input class="input" type="date" id="e-TglMasuk" value="${esc(k.TglMasuk || '')}"></label>
          <label class="field"><span>Catatan</span><input class="input" id="e-Catatan" value="${esc(k.Catatan || '')}"></label></div>`,
        onOpen: (d) => {
          const js = $('#e-Jabatan', d);
          if (!pakaiMaster) return;
          js.onchange = () => {
            const j = mj.jabatan.find((x) => x.Nama === js.value);
            if (!j) return;
            $('#e-Divisi', d).value = j.Divisi;
            $('#e-Level', d).value = j.Level;
            if (j.EmailPenilai) $('#e-EmailPenilai', d).value = j.EmailPenilai;
            if (j.Level === 'TIDAK_DINILAI') $('#e-EmailPenilai', d).value = '';
          };
        },
        buttons: [{ label: 'Batal', value: null, cls: 'ghost' }, {
          label: 'Simpan', value: 'ok', validate: async (d) => {
            const o = {}; KAR_COLS.forEach((c) => { const el = $('#e-' + c[0], d); if (el) o[c[0]] = el.value.trim(); });
            if (!o.NIK || !o.Nama) { toast('NIK dan nama wajib diisi.', 'err'); return false; }
            if (!o.Jabatan) { toast('Pilih jabatan.', 'err'); return false; }
            if (!o.Level) { toast('Pilih level.', 'err'); return false; }
            if (isNew && list.some((x) => x.NIK === o.NIK)) { toast('NIK ' + o.NIK + ' sudah terdaftar (' + list.find((x) => x.NIK === o.NIK).Nama + ').', 'err'); return false; }
            try {
              const res = await write('simpanKaryawan', { baris: [o] });
              if (res.galat.length) { toast(res.galat[0].pesan, 'err'); return false; }
              if (res.peringatan.length) toast('Tersimpan. Catatan: ' + res.peringatan.map((p) => p.pesan).join('; '), '');
              return true;
            } catch (e) { toast(e.message, 'err'); return false; }
          }
        }]
      });
      if (v === 'ok') { toast('Data karyawan tersimpan.', 'ok'); list = await api('daftarKaryawan'); await refreshBoot(); render(); }
    }
    render();
  }

  /* ================================================================== MASTER JABATAN */
  async function pageJabatan(main) {
    let d = await api('daftarJabatan');
    const isSA = can(SA);
    let q = '';
    function render() {
      let rows = d.jabatan;
      if (q) rows = rows.filter((j) => (j.Nama + ' ' + j.Divisi + ' ' + j.NamaPenilai).toLowerCase().includes(q));
      let body = '', lastDiv = null;
      rows.forEach((j) => {
        if (j.Divisi !== lastDiv) { body += `<tr class="group"><td colspan="6">${esc(j.Divisi)}</td></tr>`; lastDiv = j.Divisi; }
        body += `<tr${j.Aktif ? '' : ' class="muted"'}><td><div class="name">${esc(j.Nama)}</div></td><td><span class="tag">${esc(LEVEL_LABEL[j.Level] || j.Level)}</span></td>
          <td>${j.Level === 'TIDAK_DINILAI' ? '<span class="muted">–</span>' : j.EmailPenilai ? `<div>${esc(j.NamaPenilai || j.EmailPenilai)}</div><div class="sub">${esc(j.EmailPenilai)}</div>` : '<span style="color:var(--warn)">belum diatur</span>'}</td>
          <td class="num">${j.KaryawanAktif}${j.JumlahKaryawan > j.KaryawanAktif ? `<div class="sub">+${j.JumlahKaryawan - j.KaryawanAktif} nonaktif</div>` : ''}</td>
          <td>${j.Aktif ? '<span class="pill ok">Aktif</span>' : '<span class="pill mute">Nonaktif</span>'}</td>
          <td class="right nowrap">${isSA ? `<button class="btn ghost sm" data-edit="${esc(j.Nama)}">Ubah</button>${j.JumlahKaryawan ? '' : ` <button class="btn danger sm" data-del="${esc(j.Nama)}">Hapus</button>`}` : ''}</td></tr>`;
      });
      main.innerHTML = `<div class="page-head"><div><h1>Master jabatan</h1><p class="sub">${d.jabatan.length} jabatan · dipakai saat menambah karyawan agar divisi, level & penilai selalu konsisten.</p></div>
        ${isSA ? `<div class="actions"><button class="btn ghost" id="j-auto">${ico('refresh')}Ambil dari data karyawan</button><button class="btn" id="j-add">Tambah jabatan</button></div>` : ''}</div>
        ${!isSA ? '<div class="note" style="margin-bottom:16px"><p>Hanya Super Admin yang bisa mengubah master jabatan.</p></div>' : ''}
        <div class="row" style="margin-bottom:14px"><input class="input" id="j-q" placeholder="Cari jabatan, divisi, penilai…" value="${esc(q)}" style="max-width:340px"></div>
        ${rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Jabatan</th><th>Level</th><th>Penilai default</th><th class="num">Karyawan</th><th>Status</th><th></th></tr></thead><tbody>${body}</tbody></table></div>`
          : `<div class="panel"><div class="empty"><h3>${d.jabatan.length ? 'Tidak ada yang cocok' : 'Belum ada jabatan'}</h3><p>${d.jabatan.length ? 'Ubah kata kunci pencarian.' : 'Klik "Ambil dari data karyawan" untuk membentuk daftar jabatan otomatis dari master karyawan, atau tambah satu per satu.'}</p></div></div>`}`;
      const qi = $('#j-q', main); qi.oninput = debounce(() => { q = qi.value.trim().toLowerCase(); render(); const x = $('#j-q', main); x.focus(); x.setSelectionRange(x.value.length, x.value.length); }, 250);
      if (!isSA) return;
      $('#j-add', main).onclick = () => edit(null);
      $('#j-auto', main).onclick = async () => {
        if (!await confirmBox('Ambil dari data karyawan', '<p>Sistem membuat jabatan dari kolom jabatan di master karyawan yang belum ada di daftar ini. Divisi, level & penilai diambil dari yang paling banyak dipakai. Jabatan yang sudah ada tidak diubah.</p>', 'Ambil sekarang')) return;
        try { d = await withBusy('Memproses…', () => write('jabatanDariKaryawan')); toast(d.ditambah + ' jabatan ditambahkan.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
      };
      $$('[data-edit]', main).forEach((b) => b.onclick = () => edit(d.jabatan.find((j) => j.Nama === b.dataset.edit)));
      $$('[data-del]', main).forEach((b) => b.onclick = async () => {
        if (!await confirmBox('Hapus jabatan', `<p>Hapus jabatan <b>${esc(b.dataset.del)}</b>?</p>`, 'Hapus', 'danger')) return;
        try { d = await withBusy('Menghapus…', () => write('hapusJabatan', { nama: b.dataset.del })); toast('Jabatan dihapus.', 'ok'); render(); } catch (e) { toast(e.message, 'err'); }
      });
    }
    async function edit(j) {
      const isNew = !j; j = j || { Nama: '', Divisi: '', Level: 'STAF', EmailPenilai: '', Aktif: true, JumlahKaryawan: 0 };
      const v = await modal({
        title: isNew ? 'Tambah jabatan' : 'Ubah jabatan',
        body: `<div class="grid-2">
          <label class="field"><span>Nama jabatan</span><input class="input" id="j-Nama" maxlength="100" value="${esc(j.Nama)}"><small>Harus unik, mis. "Analis Lab", "Admin Klinik".</small></label>
          <label class="field"><span>Divisi</span><input class="input" id="j-Divisi" list="dl-jdiv" value="${esc(j.Divisi)}"><datalist id="dl-jdiv">${d.divisi.map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
          <label class="field"><span>Level</span><select class="input" id="j-Level">${['SPV', 'STAF', 'TIDAK_DINILAI'].map((l) => `<option value="${l}" ${j.Level === l ? 'selected' : ''}>${LEVEL_LABEL[l]}</option>`).join('')}</select><small>SPV termasuk Ast. SPV. Manager/KaDept = tidak dinilai.</small></label>
          <label class="field"><span>Penilai default (atasan)</span><select class="input" id="j-Penilai"><option value="">— belum ada —</option>${d.penilai.map((p) => `<option value="${esc(p.email)}" ${p.email === String(j.EmailPenilai || '').toLowerCase() ? 'selected' : ''}>${esc(p.nama)}${p.jabatan ? ' · ' + esc(p.jabatan) : ''}</option>`).join('')}</select><small>Hanya pengguna berperan Penilai.</small></label></div>
          <label class="check" style="margin-top:14px"><input type="checkbox" id="j-Aktif" ${j.Aktif ? 'checked' : ''}> Jabatan aktif (muncul di pilihan saat tambah karyawan)</label>
          ${!isNew && j.JumlahKaryawan ? `<div class="note" style="margin-top:14px"><label class="check"><input type="checkbox" id="j-terapkan"> Terapkan divisi, level & penilai ini ke <b>${j.JumlahKaryawan} karyawan</b> berjabatan ini</label><p class="small muted" style="margin:6px 0 0 25px">Mengganti nama jabatan selalu ikut memperbarui karyawannya.</p></div>` : ''}`,
        buttons: [{ label: 'Batal', value: null, cls: 'ghost' }, {
          label: 'Simpan', value: 'ok', validate: async (m) => {
            const o = { Nama: $('#j-Nama', m).value.trim(), NamaLama: isNew ? '' : j.Nama, Divisi: $('#j-Divisi', m).value.trim(), Level: $('#j-Level', m).value, EmailPenilai: $('#j-Penilai', m).value, Aktif: $('#j-Aktif', m).checked };
            if (!o.Nama || !o.Divisi) { toast('Nama jabatan dan divisi wajib diisi.', 'err'); return false; }
            const t = $('#j-terapkan', m);
            try {
              d = await write('simpanJabatan', { jabatan: o, terapkan: !!(t && t.checked) });
              const info = [d.diganti ? `nama diganti di ${d.diganti} karyawan` : '', d.diterapkan ? `diterapkan ke ${d.diterapkan} karyawan` : ''].filter(Boolean).join(', ');
              toast('Jabatan tersimpan' + (info ? ' — ' + info : '') + '.', 'ok');
              return true;
            } catch (e) { toast(e.message, 'err'); return false; }
          }
        }]
      });
      if (v === 'ok') { await refreshBoot(); render(); }
    }
    render();
  }

  function kesiapanHtml(r, ringkas) {
    const ic = { error: ['!', 'var(--danger)'], warn: ['!', 'var(--gold)'], info: ['i', 'var(--teal-2)'], ok: ['✓', 'var(--ok)'] };
    const list = ringkas ? r.hasil.filter((x) => x.status === 'error' || x.status === 'warn') : r.hasil;
    return `<ul class="checklist">${list.map((x) => `<li><span class="ic" style="background:${ic[x.status][1]}">${ic[x.status][0]}</span><div style="min-width:0;flex:1">
      <b>${esc(x.judul)}</b>${x.jumlah ? ` <span class="tag">${x.jumlah}</span>` : ''} <span class="muted">— ${esc(x.detail)}</span>${x.tautan && x.status !== 'ok' && x.status !== 'info' ? ` <a href="${esc(x.tautan)}">Perbaiki</a>` : ''}
      ${x.daftar.length && x.status !== 'ok' ? `<details style="margin-top:4px"><summary class="small muted" style="cursor:pointer">Lihat daftar</summary><div class="small" style="margin-top:4px">${x.daftar.map(esc).join(' · ')}${x.jumlah > x.daftar.length ? ' …' : ''}</div></details>` : ''}</div></li>`).join('')}</ul>`;
  }

  /* ================================================================== PENGGUNA */
  async function pagePengguna(main) {
    let list = await api('daftarPengguna');
    function render() {
      main.innerHTML = `<div class="page-head"><div><h1>Pengguna & akses</h1><p class="sub">Akun untuk penilai, HR, dan Direksi. Password sementara dikirim via email saat akun dibuat.</p></div>
        <div class="actions"><button class="btn" id="u-add">Tambah pengguna</button></div></div>
        <div class="note" style="margin-bottom:16px"><p><b>Super Admin</b>: semua menu · <b>Admin HR</b>: kehadiran, master karyawan, hitung & progres · <b>Penilai</b>: isi PA & Grooming untuk karyawan yang menunjuk email-nya · <b>Direksi</b>: lihat hasil & sahkan pemenang. Satu akun boleh punya lebih dari satu peran. Karyawan yang dinilai login dengan <b>NIK</b> — akunnya dibuat dari menu Master karyawan.</p></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>Pengguna</th><th>Peran</th><th>Login terakhir</th><th>Status</th><th></th></tr></thead><tbody>
        ${list.map((u) => `<tr><td><div class="name">${esc(u.Nama)}</div><div class="sub">${esc(u.Email)}${u.Jabatan ? ' · ' + esc(u.Jabatan) : ''}</div></td>
          <td>${u.Peran.map((p) => `<span class="tag">${esc(PERAN_LABEL[p] || p)}</span>`).join(' ')}</td>
          <td class="small">${esc(u.LoginTerakhir || '–')}${u.WajibGantiPassword ? '<div class="sub">masih password sementara</div>' : ''}</td>
          <td>${u.Aktif ? '<span class="pill ok">Aktif</span>' : '<span class="pill mute">Nonaktif</span>'}</td>
          <td class="right nowrap"><button class="btn ghost sm" data-edit="${esc(u.Email)}">Ubah</button> <button class="btn ghost sm" data-reset="${esc(u.Email)}">Reset password</button></td></tr>`).join('')}</tbody></table></div>`;
      $('#u-add', main).onclick = () => edit(null);
      $$('[data-edit]', main).forEach((b) => b.onclick = () => edit(list.find((u) => u.Email === b.dataset.edit)));
      $$('[data-reset]', main).forEach((b) => b.onclick = async () => {
        if (!await confirmBox('Reset password', `<p>Buat password sementara baru untuk <b>${esc(b.dataset.reset)}</b>? Password baru dikirim ke email tersebut dan ditampilkan di sini.</p>`, 'Reset password', 'danger')) return;
        try { const r = await withBusy('Memproses…', () => write('resetPassword', { email: b.dataset.reset })); await modal({ title: 'Password sementara', body: `<p>Berikan ke ${esc(b.dataset.reset)} bila email tidak masuk:</p><div class="pwd-box">${esc(r.passwordSementara)}</div>` }); list = await api('daftarPengguna'); render(); } catch (e) { toast(e.message, 'err'); }
      });
    }
    async function edit(u) {
      const isNew = !u; u = u || { Peran: ['PENILAI'], Aktif: true };
      let result = null;
      const v = await modal({
        title: isNew ? 'Tambah pengguna' : 'Ubah pengguna',
        body: `<div class="grid-2">
          <label class="field"><span>Email (untuk login)</span><input class="input" type="email" id="u-Email" value="${esc(u.Email || '')}" ${isNew ? '' : 'readonly'}></label>
          <label class="field"><span>Nama</span><input class="input" id="u-Nama" value="${esc(u.Nama || '')}"></label>
          <label class="field"><span>NIK</span><input class="input" id="u-NIK" value="${esc(u.NIK || '')}"><small>Agar sistem tidak memintanya menilai diri sendiri.</small></label>
          <label class="field"><span>Jabatan</span><input class="input" id="u-Jabatan" value="${esc(u.Jabatan || '')}"></label></div>
          <fieldset style="border:0;padding:0;margin:16px 0 0"><legend class="field" style="font-weight:600;font-size:13.5px;color:var(--ink);margin-bottom:8px">Peran</legend>
          <div class="row">${Object.keys(PERAN_LABEL).map((p) => `<label class="check"><input type="checkbox" value="${p}" data-role ${u.Peran.includes(p) ? 'checked' : ''}> ${PERAN_LABEL[p]}</label>`).join('')}</div></fieldset>
          <label class="check" style="margin-top:14px"><input type="checkbox" id="u-Aktif" ${u.Aktif ? 'checked' : ''}> Akun aktif</label>`,
        buttons: [{ label: 'Batal', value: null, cls: 'ghost' }, {
          label: 'Simpan', value: 'ok', validate: async (d) => {
            const o = { Email: $('#u-Email', d).value.trim(), Nama: $('#u-Nama', d).value.trim(), NIK: $('#u-NIK', d).value.trim(), Jabatan: $('#u-Jabatan', d).value.trim(), Peran: $$('[data-role]:checked', d).map((x) => x.value), Aktif: $('#u-Aktif', d).checked };
            try {
              const r = await write('simpanPengguna', { pengguna: o });
              if (r.galat.length) { toast(r.galat[0].pesan, 'err'); return false; }
              result = r.hasil[0]; return true;
            } catch (e) { toast(e.message, 'err'); return false; }
          }
        }]
      });
      if (v !== 'ok') return;
      if (result && result.passwordSementara) await modal({ title: 'Akun dibuat', body: `<p>Password sementara sudah dikirim ke <b>${esc(result.Email)}</b>. Simpan juga di sini bila email tidak masuk:</p><div class="pwd-box">${esc(result.passwordSementara)}</div>` });
      else toast('Pengguna tersimpan.', 'ok');
      list = await api('daftarPengguna'); render();
    }
    render();
  }

  /* ================================================================== PENGATURAN */
  async function pagePengaturan(main) {
    const r = await api('ambilPengaturan');
    const v = Object.fromEntries(r.nilai.map((x) => [x.kunci, x.nilai]));
    const hadiah = (S.boot.hadiah || []).map((h) => Object.assign({}, h));
    const f = (k, label, help, type = 'text', extra = '') => `<label class="field"><span>${esc(label)}</span><input class="input" ${type === 'number' ? 'type="number" inputmode="numeric"' : `type="${type}"`} data-k="${k}" value="${esc(v[k] ?? '')}" ${extra}>${help ? `<small>${esc(help)}</small>` : ''}</label>`;
    main.innerHTML = `<div class="page-head"><div><h1>Pengaturan</h1><p class="sub">Jadwal, email, kandidat, bobot nilai, dan sertifikat.</p></div>
      <div class="actions"><button class="btn" id="set-save">Simpan pengaturan</button></div></div>
      <div class="note ${r.pemicuTerpasang ? '' : 'warn'}" style="margin-bottom:18px"><p>${r.pemicuTerpasang ? 'Pemicu harian aktif (setiap pukul 07.00 WIB): buka periode, kirim pengingat, tutup & hitung otomatis.' : '<b>Pemicu harian belum terpasang.</b> Jalankan fungsi <code>setup()</code> atau <code>pasangPemicu()</code> dari editor Apps Script.'} Sisa kuota email hari ini: <b>${r.kuotaEmail}</b>.</p></div>
      <section class="panel" id="kesiapan"><div class="panel-head"><div class="grow"><h2>Cek kesiapan sistem</h2><p class="hint" style="margin:0">Memeriksa data yang bisa membuat penilaian atau email gagal.</p></div>
        <button class="btn ghost sm" id="cek-ulang">${ico('refresh')}Periksa ulang</button><button class="btn sm" id="bk-now">${ico('shield')}Backup sekarang</button></div><div id="cek-isi"><div class="spinner"></div></div></section>
      <section class="panel"><h2>Jadwal bulanan</h2><p class="hint">Sesuai SPO: penilaian tgl 21–25, perhitungan HR mulai tgl 26, penyerahan tgl 15 bulan berikutnya.</p>
        <div class="grid-3">${f('TGL_BUKA', 'Tanggal dibuka', 'Periode dibuat & dibuka otomatis', 'number', 'min="1" max="28"')}${f('TGL_TUTUP', 'Batas akhir pengisian', 'Hari peringatan terakhir', 'number', 'min="1" max="28"')}${f('TGL_HITUNG', 'Tanggal ditutup & dihitung', 'Otomatis pukul 07.00', 'number', 'min="1" max="28"')}
        ${f('TGL_PENYERAHAN', 'Tanggal penyerahan', 'Bulan berikutnya, tercantum di email pemenang', 'number', 'min="1" max="28"')}${f('HARI_PENGINGAT', 'Tanggal kirim pengingat', 'Pisahkan dengan koma, mis. 21,24,25')}
        <div class="stack" style="align-content:start;padding-top:24px"><label class="check"><input type="checkbox" data-k="AUTO_BUKA" ${v.AUTO_BUKA === 'Y' ? 'checked' : ''}> Buka periode otomatis</label><label class="check"><input type="checkbox" data-k="AUTO_TUTUP" ${v.AUTO_TUTUP === 'Y' ? 'checked' : ''}> Tutup & hitung otomatis</label></div></div></section>
      <section class="panel"><h2>Email pemenang</h2><p class="hint">Email ucapan + sertifikat dikirim ke pemenang dengan CC ke manajemen.</p>
        <div class="grid-2"><label class="field"><span>Mode pengiriman</span><select class="input" data-k="MODE_KIRIM"><option value="MANUAL" ${v.MODE_KIRIM === 'MANUAL' ? 'selected' : ''}>Manual — Super Admin klik "Kirim ke pemenang"</option><option value="OTOMATIS" ${v.MODE_KIRIM === 'OTOMATIS' ? 'selected' : ''}>Otomatis — langsung terkirim begitu disahkan</option></select></label>
        <label class="field"><span>CC manajemen</span><textarea class="input" data-k="CC_MANAJEMEN" placeholder="email1@..., email2@...">${esc(v.CC_MANAJEMEN || '')}</textarea><small>Pisahkan dengan koma.</small></label>
        ${f('NAMA_PENGIRIM', 'Nama pengirim', '')}${f('EMAIL_ALIAS', 'Alamat pengirim (Send As)', 'Kosongkan bila tidak memakai alias Gmail', 'email')}
        ${f('APP_URL', 'Link aplikasi', 'URL GitHub Pages; dipakai untuk tombol di email', 'url')}</div></section>
      <section class="panel"><h2>Kandidat & bobot</h2>
        <div class="grid-3">${f('JUMLAH_BACKUP', 'Jumlah backup disimpan', 'Backup otomatis tiap tanggal 1; yang lebih lama dibuang', 'number', 'min="3" max="60"')}${f('KANDIDAT_SPV_PER_DIV', 'Kandidat SPV per divisi', '', 'number', 'min="0" max="12"')}${f('KANDIDAT_STAF_PER_DIV', 'Kandidat Staf per divisi', '', 'number', 'min="0" max="12"')}${f('JEDA_MENANG_BULAN', 'Jeda menang lagi (bulan)', '0 = boleh menang berturut-turut', 'number', 'min="0" max="12"')}
        ${f('BOBOT_KEHADIRAN', 'Bobot kehadiran (%)', '', 'number')}${f('BOBOT_PA', 'Bobot Performance Appraisal (%)', '', 'number')}${f('BOBOT_GROOMING', 'Bobot grooming (%)', 'Total ketiganya harus 100', 'number')}</div></section>
      <section class="panel"><h2>Pengurang kehadiran</h2><p class="hint">Nilai kehadiran = 100 − Σ(jumlah kejadian × bobot). Perubahan berlaku untuk perhitungan berikutnya.</p>
        <div class="grid-3">${r.komponen.map((k) => `<label class="field"><span>${esc(k.label)}</span><input class="input" type="number" min="0" max="100" step="0.5" data-bp="${k.kode}" value="${esc(r.bobotPengurang[k.kode])}"></label>`).join('')}</div></section>
      <section class="panel"><h2>Penandatangan sertifikat</h2>
        <div class="grid-2">${f('TTD1_NAMA', 'Penandatangan kiri — nama', '')}${f('TTD1_JABATAN', 'Penandatangan kiri — jabatan', '')}${f('TTD2_NAMA', 'Penandatangan kanan — nama', '')}${f('TTD2_JABATAN', 'Penandatangan kanan — jabatan', '')}</div>
        <div class="row" style="margin-top:14px"><button class="btn ghost sm" id="set-prev">Pratinjau sertifikat</button></div></section>
      <section class="panel"><div class="panel-head"><div class="grow"><h2>Opsi hadiah</h2><p class="hint" style="margin:0">Dipilih Direksi saat pengesahan. Hadiah nonaktif tidak muncul di pilihan.</p></div><button class="btn ghost sm" id="hd-add">Tambah opsi</button><button class="btn sm" id="hd-save">Simpan opsi hadiah</button></div>
        <div class="stack" id="hd-list"></div></section>`;
    const muatCek = async () => {
      const box = $('#cek-isi', main); if (!box) return;
      box.innerHTML = '<div class="spinner"></div>';
      try { box.innerHTML = kesiapanHtml(await api('cekKesiapan'), false); } catch (e) { box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
    };
    muatCek();
    $('#cek-ulang', main).onclick = muatCek;
    $('#bk-now', main).onclick = async () => {
      try { const b = await withBusy('Membuat backup…', () => write('backupSekarang')); toast('Backup tersimpan: ' + b.nama, 'ok'); muatCek(); } catch (e) { toast(e.message, 'err'); }
    };
    const renderHadiah = () => {
      $('#hd-list', main).innerHTML = hadiah.map((h, i) => `<div class="row" style="flex-wrap:nowrap"><span class="tag" style="min-width:76px;text-align:center">${esc(h.Kode)}</span><input class="input" data-hn="${i}" value="${esc(h.Nama)}"><label class="check small nowrap"><input type="checkbox" data-ha="${i}" ${h.Aktif ? 'checked' : ''}> Aktif</label></div>`).join('');
      $$('[data-hn]', main).forEach((x) => x.oninput = () => { hadiah[Number(x.dataset.hn)].Nama = x.value; });
      $$('[data-ha]', main).forEach((x) => x.onchange = () => { hadiah[Number(x.dataset.ha)].Aktif = x.checked; });
    };
    renderHadiah();
    $('#hd-add', main).onclick = () => { hadiah.push({ Kode: 'OPSI-' + String(hadiah.length + 1).padStart(2, '0'), Nama: '', Aktif: true }); renderHadiah(); };
    $('#hd-save', main).onclick = async () => {
      try { const res = await withBusy('Menyimpan…', () => write('simpanHadiah', { hadiah })); S.boot.hadiah = res; toast('Opsi hadiah tersimpan.', 'ok'); } catch (e) { toast(e.message, 'err'); }
    };
    $('#set-prev', main).onclick = () => {
      S.boot.sertifikat = { ttd1Nama: $('[data-k="TTD1_NAMA"]', main).value, ttd1Jabatan: $('[data-k="TTD1_JABATAN"]', main).value, ttd2Nama: $('[data-k="TTD2_NAMA"]', main).value, ttd2Jabatan: $('[data-k="TTD2_JABATAN"]', main).value };
      previewCertificate('Nama Karyawan', S.pid || (S.boot.hariIni.y + '-' + String(S.boot.hariIni.m).padStart(2, '0')));
    };
    $('#set-save', main).onclick = async () => {
      const nilai = {};
      $$('[data-k]', main).forEach((el) => { nilai[el.dataset.k] = el.type === 'checkbox' ? (el.checked ? 'Y' : 'T') : el.value.trim(); });
      const bobotPengurang = {}; $$('[data-bp]', main).forEach((el) => { bobotPengurang[el.dataset.bp] = Number(el.value); });
      try { await withBusy('Menyimpan…', () => write('simpanPengaturan', { nilai, bobotPengurang })); await refreshBoot(); toast('Pengaturan tersimpan.', 'ok'); route(); } catch (e) { toast(e.message, 'err'); }
    };
  }

  /* ================================================================== LOG */
  async function pageLog(main) {
    let jenis = 'aktivitas';
    async function render() {
      const rows = await api('log', { jenis: jenis === 'email' ? 'email' : '', batas: 400 });
      main.innerHTML = `<div class="page-head"><div><h1>Log aktivitas</h1><p class="sub">400 catatan terakhir.</p></div></div>
        <div class="tabs">${[['aktivitas', 'Aktivitas'], ['email', 'Email']].map(([k, l]) => `<button data-j="${k}" aria-selected="${jenis === k}">${l}</button>`).join('')}</div>
        <div class="table-wrap"><table class="t"><thead><tr>${jenis === 'email' ? '<th>Waktu</th><th>Jenis</th><th>Kepada</th><th>Subjek</th><th>Status</th>' : '<th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Periode</th><th>Detail</th>'}</tr></thead><tbody>
        ${rows.map((x) => jenis === 'email'
          ? `<tr><td class="nowrap small">${esc(x.Waktu)}</td><td class="small">${esc(x.Jenis)}</td><td class="small">${esc(x.Kepada)}${x.CC ? `<div class="sub">CC ${esc(x.CC)}</div>` : ''}</td><td class="small">${esc(x.Subjek)}</td><td>${x.Status === 'TERKIRIM' ? '<span class="pill ok">Terkirim</span>' : `<span class="pill danger">Gagal</span><div class="sub">${esc(x.Keterangan)}</div>`}</td></tr>`
          : `<tr><td class="nowrap small">${esc(x.Waktu)}</td><td class="small">${esc(x.Email)}</td><td><span class="tag">${esc(x.Aksi)}</span></td><td class="small">${esc(labelPid(x.PeriodeID))}</td><td class="small" style="max-width:420px;word-break:break-word">${esc(x.Detail)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">Belum ada catatan.</td></tr>'}</tbody></table></div>`;
      $$('[data-j]', main).forEach((b) => b.onclick = () => { jenis = b.dataset.j; render().catch((e) => toast(e.message, 'err')); });
    }
    await render();
  }

  /* ================================================================== VERIFIKASI (publik) */
  async function renderVerifikasi(kode, idx) {
    document.title = 'Verifikasi sertifikat · Employee of the Month';
    $('#app').innerHTML = '<div class="boot-splash"><div class="spinner" aria-hidden="true"></div><p>Memeriksa sertifikat…</p></div>';
    let r;
    try { r = await api('verifikasi', { kode }); } catch (e) { r = { error: e.message }; }
    const back = `<p class="small muted" style="margin-top:22px"><a href="${esc(location.pathname)}#/">Masuk ke aplikasi</a></p>`;
    let inner;
    if (r && r.valid) {
      const signer = r.penandatangan[Number(idx) - 1];
      inner = `<div class="verify-badge ok" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
        <p class="verify-k">Sertifikat sah</p>
        <h1>${esc(r.nama)}</h1>
        <p class="verify-sub">Employee of the Month · Level ${esc(r.level)} · ${esc(r.periode)}</p>
        <dl class="kv" style="text-align:left;margin-top:22px">
          <dt>Jabatan</dt><dd>${esc(r.jabatan)} — ${esc(r.divisi)}</dd>
          <dt>Disahkan oleh</dt><dd>${esc(r.disahkanOleh)}<div class="small muted" style="font-weight:400">${esc(r.disahkanAt)}</div></dd>
          <dt>Penandatangan</dt><dd>${r.penandatangan.map((p, i) => `<div style="margin-bottom:6px">${esc(p.nama)}${signer && i === Number(idx) - 1 ? ' <span class="pill ok" style="margin-left:4px">QR yang dipindai</span>' : ''}<div class="small muted" style="font-weight:400">${esc(p.jabatan)}</div></div>`).join('')}</dd>
          <dt>Kode verifikasi</dt><dd style="letter-spacing:1px">${esc(r.kode)}</dd>
        </dl>`;
    } else {
      inner = `<div class="verify-badge bad" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M7 7l10 10M17 7 7 17"/></svg></div>
        <p class="verify-k" style="color:var(--danger)">Sertifikat tidak dikenal</p>
        <h1>Kode ${esc(kode)} tidak terdaftar</h1>
        <p class="verify-sub">${r && r.error ? esc(r.error) : 'Sertifikat ini tidak tercatat sebagai Employee of the Month yang sah, atau pengesahannya sudah dibatalkan. Hubungi HR PT Persada Medika Utama untuk konfirmasi.'}</p>`;
    }
    $('#app').innerHTML = `<div class="verify"><div class="verify-card">
      <div class="brand" style="display:flex;gap:10px;align-items:center;justify-content:center;margin-bottom:26px"><div class="mark">${MARK}</div><div class="brand-name" style="text-align:left">Granostic Center<small>PT Persada Medika Utama</small></div></div>
      ${inner}${back}</div></div>`;
  }

  /* ================================================================== NILAI SAYA */
  async function pageNilaiSaya(main) {
    const r = await api('nilaiSaya');
    const K = S.boot.kriteria;
    const k = r.karyawan;
    const b = r.bobot;
    const list = r.periode;
    const withData = list.filter((x) => x.kehadiran || x.PA || x.GR);
    let sel = store.get('ns.pid');
    if (sel !== 'semua' && !list.some((x) => x.PeriodeID === sel)) sel = withData[0] ? withData[0].PeriodeID : (list[0] ? list[0].PeriodeID : 'semua');

    const statusOf = (x) => x.menang ? `<span class="pill gold">Employee of the Month</span>` : x.final ? '<span class="pill ok">Final</span>' : '<span class="pill warn">Sementara</span>';
    const dots = (v) => `<span class="dots" aria-label="Nilai ${v || 0} dari 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${v >= i ? 'on' : ''}"></i>`).join('')}</span>`;

    function itemsHtml(jenis, data) {
      const crit = K[jenis];
      const pre = jenis === 'PA' ? 'P' : 'G';
      let no = 0;
      return crit.area.map((a) => {
        let sum = 0;
        const rows = a.item.map((t) => {
          no++;
          const v = Number(data.item[pre + String(no).padStart(2, '0')] || 0);
          sum += v;
          const lab = (crit.skala.find((x) => x.nilai === v) || {}).label || '';
          return `<div class="item ro"><span class="no">${no}</span><span>${esc(t)}</span><span class="nowrap">${dots(v)} <b class="iv">${v}</b><span class="small muted il">${esc(lab)}</span></span></div>`;
        }).join('');
        return `<section class="area"><div class="area-head"><h3>${esc(a.nama)}</h3><span class="sum">${sum} / ${a.item.length * 5}</span></div>${rows}</section>`;
      }).join('');
    }

    function compCard(title, bobot, skor, sub, empty) {
      return `<div class="comp-card"><div class="muted small">${esc(title)} · bobot ${bobot}%</div>
        ${skor === null ? `<div class="cc-empty">${esc(empty)}</div>` : `<b>${num(skor)}</b><div class="bar"><i style="width:${Math.min(100, skor / bobot * 100)}%"></i></div><div class="small muted" style="margin-top:6px">${sub}</div>`}</div>`;
    }

    function render() {
      const opts = `<option value="semua" ${sel === 'semua' ? 'selected' : ''}>Semua bulan</option>` + list.map((x) => `<option value="${esc(x.PeriodeID)}" ${x.PeriodeID === sel ? 'selected' : ''}>${esc(x.label)}</option>`).join('');
      let body = '';
      if (!list.length) body = '<div class="panel"><div class="empty"><h3>Belum ada periode penilaian</h3><p>Nilai Anda akan muncul di sini setelah penilai mengirim penilaian.</p></div></div>';
      else if (sel === 'semua') {
        const pts = list.filter((x) => x.lengkap).slice().reverse();
        const W = 680, H = 190, pad = 32;
        const lo = Math.max(0, Math.floor((Math.min(...pts.map((p) => p.total), 100) - 5) / 10) * 10);
        const chart = pts.length > 1 ? (() => {
          const xs = (i) => pad + (i * (W - pad * 2)) / (pts.length - 1);
          const ys = (v) => H - pad - ((v - lo) / (100 - lo)) * (H - pad * 2);
          return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Grafik total nilai per bulan">
            ${[lo, (lo + 100) / 2, 100].map((v) => `<line x1="${pad}" x2="${W - pad}" y1="${ys(v)}" y2="${ys(v)}" stroke="#e6efef"/><text x="2" y="${ys(v) + 4}" font-size="11" fill="#5d7a7e">${Math.round(v)}</text>`).join('')}
            <path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(p.total).toFixed(1)}`).join(' ')}" fill="none" stroke="#157b82" stroke-width="2.5"/>
            ${pts.map((p, i) => `<circle cx="${xs(i)}" cy="${ys(p.total)}" r="${p.menang ? 6.5 : 4.5}" fill="${p.menang ? '#b8893a' : '#157b82'}"><title>${esc(p.label)}: ${num(p.total)}</title></circle>
              <text x="${xs(i)}" y="${ys(p.total) - 12}" font-size="11.5" font-weight="600" text-anchor="middle" fill="#0f3e44">${num(p.total)}</text>
              <text x="${xs(i)}" y="${H - 8}" font-size="11" text-anchor="middle" fill="#5d7a7e">${esc(p.label.slice(0, 3))} ${esc(p.label.slice(-2))}</text>`).join('')}
          </svg>`;
        })() : '<p class="muted small">Grafik muncul setelah ada minimal dua bulan dengan nilai lengkap.</p>';
        body = `<div class="panel"><h2>Perkembangan total nilai</h2><p class="hint">Titik emas = bulan Anda terpilih sebagai Employee of the Month.</p>${chart}</div>
          <div class="table-wrap" style="margin-top:18px"><table class="t"><thead><tr><th>Bulan</th><th class="num">Kehadiran ${b.kehadiran}%</th><th class="num">PA ${b.pa}%</th><th class="num">Grooming ${b.grooming}%</th><th class="num">Total</th><th>Status</th></tr></thead><tbody>
          ${list.map((x) => `<tr class="row-link" data-pid="${esc(x.PeriodeID)}" tabindex="0"><td><b>${esc(x.label)}</b></td><td class="num">${x.kehadiran ? num(x.kehadiran.skor) : '–'}</td><td class="num">${x.PA ? num(x.PA.skor) : '–'}</td><td class="num">${x.GR ? num(x.GR.skor) : '–'}</td>
            <td class="num total-cell">${x.lengkap ? num(x.total) : '<span class="muted" style="font-weight:400">belum lengkap</span>'}</td><td>${statusOf(x)}</td></tr>`).join('')}</tbody></table></div>`;
      } else {
        const x = list.find((y) => y.PeriodeID === sel);
        const kh = x.kehadiran;
        body = `
          <section class="hero my-hero">
            <div class="my-total"><span class="muted small">Total nilai ${esc(x.label)}</span><b>${x.kehadiran || x.PA || x.GR ? num(x.total) : '–'}</b><span class="muted">dari 100</span></div>
            <div class="my-state">${statusOf(x)}<p class="small muted" style="margin:8px 0 0">${x.menang ? `Selamat! Anda terpilih sebagai Employee of the Month level ${x.menang === 'SPV' ? 'SPV' : 'Staf'}.` : x.final ? 'Nilai sudah final (disahkan Direksi).' : x.lengkap ? 'Semua komponen sudah masuk. Nilai bisa berubah sampai disahkan Direksi.' : 'Sebagian komponen belum masuk. Nilai bertambah saat penilai/HR mengirim data.'}</p></div>
            <div class="my-comps">
              ${compCard('Kehadiran', b.kehadiran, kh ? kh.skor : null, kh ? `Nilai ${num(kh.nilai, 0)}/100${kh.cutiKhusus ? ' · cuti khusus' : ''}` : '', 'Belum diinput HR')}
              ${compCard('Performance Appraisal', b.pa, x.PA ? x.PA.skor : null, x.PA ? `${x.PA.total}/150 · ${esc(x.PA.kategori)}` : '', 'Belum dikirim penilai')}
              ${compCard('Grooming', b.grooming, x.GR ? x.GR.skor : null, x.GR ? `${x.GR.total}/100 · ${esc(x.GR.kategori)}` : '', 'Belum dikirim penilai')}
            </div>
          </section>
          ${kh ? `<section class="panel"><h2>Rincian kehadiran</h2><p class="hint">Nilai = 100 − jumlah kejadian × bobot pengurang.${kh.cutiKhusus ? ` Tercatat cuti khusus${kh.ketCutiKhusus ? ' (' + esc(kh.ketCutiKhusus) + ')' : ''} — tidak diikutkan pemilihan bulan ini.` : ''}</p>
            <div class="table-wrap"><table class="t"><thead><tr><th>Komponen</th><th class="num">Jumlah</th><th class="num">Bobot</th><th class="num">Pengurang</th></tr></thead><tbody>
            ${kh.rinci.map((c) => `<tr${c.jumlah ? '' : ' class="muted"'}><td>${esc(c.label)}</td><td class="num">${c.jumlah}</td><td class="num">−${c.bobot}</td><td class="num">${c.jumlah ? '−' + (c.jumlah * c.bobot) : '0'}</td></tr>`).join('')}
            <tr><td><b>Nilai kehadiran</b></td><td></td><td></td><td class="num total-cell">${num(kh.nilai, 0)}</td></tr></tbody></table></div></section>` : ''}
          ${x.PA ? `<section style="margin-top:18px"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="font-size:17px">Performance Appraisal</h2><span class="small muted">Penilai: ${esc(x.PA.penilai || '-')} · dikirim ${esc(x.PA.dikirim || '')}</span></div>
            ${x.PA.catatan.length ? `<div class="note warn" style="margin-bottom:14px"><p><b>Area yang perlu ditingkatkan:</b></p><ol style="margin:4px 0 0;padding-left:18px">${x.PA.catatan.map((c) => `<li>${esc(c)}</li>`).join('')}</ol></div>` : ''}
            ${itemsHtml('PA', x.PA)}</section>` : ''}
          ${x.GR ? `<section style="margin-top:18px"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h2 style="font-size:17px">Grooming</h2><span class="small muted">Penilai: ${esc(x.GR.penilai || '-')} · dikirim ${esc(x.GR.dikirim || '')}</span></div>
            ${x.GR.catatan.length ? `<div class="note" style="margin-bottom:14px"><p><b>Catatan penilai:</b></p><ol style="margin:4px 0 0;padding-left:18px">${x.GR.catatan.map((c) => `<li>${esc(c)}</li>`).join('')}</ol></div>` : ''}
            ${itemsHtml('GR', x.GR)}</section>` : ''}`;
      }
      main.innerHTML = `<div class="page-head"><div><h1>Nilai saya</h1><p class="sub">${esc(k.Nama)} · ${esc(k.Jabatan)} · ${esc(k.Divisi)}</p></div>
        <div class="actions"><label class="field" style="min-width:200px"><span>Bulan</span><select class="input" id="ns-sel">${opts}</select></label></div></div>${body}`;
      $('#ns-sel', main).onchange = (e) => { sel = e.target.value; store.set('ns.pid', sel); render(); };
      $$('tr[data-pid]', main).forEach((tr) => { const go = () => { sel = tr.dataset.pid; store.set('ns.pid', sel); render(); window.scrollTo({ top: 0 }); }; tr.onclick = go; tr.onkeydown = (e) => { if (e.key === 'Enter') go(); }; });
    }
    render();
  }

  /* ------------------------------------------------------------------ go */
  window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
  start();
})();
