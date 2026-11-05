(() => {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  Constantes
   * ------------------------------------------------------------------ */
  const W = 1080;           // ancho del flyer (px)
  const H = 1350;           // alto del flyer (px) -> 4:5, ideal para WhatsApp
  const M = 72;             // margen
  const BALL = '#D8EE3A';   // color de la pelota (siempre amarillo-verdoso)

  const DISPLAY = '"Big Shoulders Display","Arial Narrow",Impact,sans-serif';
  const TEXT = 'Figtree,system-ui,-apple-system,"Segoe UI",sans-serif';

  // Paletas: deep = fondo oscuro / texto en tema claro, primary = acento en tema claro,
  // hi = acento en tema oscuro. Para agregar una, sumá un objeto acá.
  const PALETTES = [
    { id: 'cancha',   name: 'Cancha',   deep: '#0E2750', primary: '#1B5FD1', hi: '#D8EE3A' },
    { id: 'cesped',   name: 'Césped',   deep: '#0B3D2E', primary: '#1E9E62', hi: '#F4E94A' },
    { id: 'arcilla',  name: 'Arcilla',  deep: '#4A1C10', primary: '#D4532B', hi: '#FFD27A' },
    { id: 'violeta',  name: 'Violeta',  deep: '#26124D', primary: '#7C3AED', hi: '#E4F24A' },
    { id: 'rojo',     name: 'Rojo',     deep: '#3A0C17', primary: '#D62839', hi: '#FFC857' },
    { id: 'turquesa', name: 'Turquesa', deep: '#07343B', primary: '#0E8C99', hi: '#7CF0E0' },
    { id: 'grafito',  name: 'Grafito',  deep: '#0D1117', primary: '#16A34A', hi: '#4ADE80' }
  ];

  const PATTERNS = [
    { id: 'auto',      name: 'Auto' },
    { id: 'liso',      name: 'Liso' },
    { id: 'cancha',    name: 'Cancha' },
    { id: 'diagonales', name: 'Rayas' },
    { id: 'malla',     name: 'Malla' },
    { id: 'puntos',    name: 'Puntos' },
    { id: 'circulos',  name: 'Círculos' }
  ];

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  /* ------------------------------------------------------------------ *
   *  Colores
   * ------------------------------------------------------------------ */
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb2hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, p) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v * (1 - p) + B[i] * p)); };
  const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };

  function buildTheme(p, mode) {
    if (mode === 'dark') {
      const dark = mix(p.deep, '#000000', 0.2);
      return {
        bg: p.deep, bg2: mix(p.deep, '#000000', 0.35), panel: mix(p.deep, '#ffffff', 0.1),
        ink: '#FFFFFF', muted: mix(p.deep, '#ffffff', 0.68), line: 'rgba(255,255,255,.17)',
        accent: p.hi, onAccent: dark, ball: BALL, onBall: dark
      };
    }
    return {
      bg: mix(p.deep, '#ffffff', 0.94), bg2: mix(p.deep, '#ffffff', 0.86), panel: '#FFFFFF',
      ink: p.deep, muted: mix(p.deep, '#ffffff', 0.35), line: rgba(p.deep, 0.17),
      accent: p.primary, onAccent: '#FFFFFF', ball: BALL, onBall: p.deep
    };
  }

  /* ------------------------------------------------------------------ *
   *  Estado y DOM
   * ------------------------------------------------------------------ */
  const state = { theme: 'dark', palette: 'cancha', pattern: 'auto', logo: null, logoData: null, blobs: {} };
  const tstate = { theme: 'dark', palette: 'cancha', pattern: 'auto', blobs: {} };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const form = $('#form');
  const contactsEl = $('#contacts');
  const addContactBtn = $('#add-contact');
  const categoriasEl = $('#categorias');
  const addCategoriaBtn = $('#add-categoria');
  const logoInput = $('#logo');
  const logoChip = $('#logo-chip');
  const logoPreview = $('#logo-preview');
  const gallery = $('#gallery');
  const emptyEl = $('#empty');
  const missingEl = $('#missing');
  const toastEl = $('#toast');

  const tform = $('#t-form');
  const tGallery = $('#t-gallery');
  const tEmptyEl = $('#t-empty');
  const tMissingEl = $('#t-missing');

  const getPalette = (st = state) => PALETTES.find(p => p.id === st.palette) || PALETTES[0];
  const getTheme = (st = state) => buildTheme(getPalette(st), st.theme);

  const fontsReady = Promise.all([
    document.fonts.load('900 80px "Big Shoulders Display"'),
    document.fonts.load('800 80px "Big Shoulders Display"'),
    document.fonts.load('600 30px Figtree'),
    document.fonts.load('700 30px Figtree')
  ]).catch(() => {});

  /* ------------------------------------------------------------------ *
   *  Contactos (hasta 3)
   * ------------------------------------------------------------------ */
  function addContact() {
    if (contactsEl.children.length >= 3) return;
    const row = document.createElement('div');
    row.className = 'contact-row';
    row.innerHTML =
      '<input type="text" name="cNombre" maxlength="30" placeholder="Nombre del contacto">' +
      '<input type="tel" name="cTel" maxlength="22" placeholder="Teléfono del contacto" inputmode="tel">' +
      '<button type="button" class="rm" aria-label="Quitar contacto">×</button>';
    row.querySelector('.rm').addEventListener('click', () => {
      row.remove();
      refreshContacts();
      schedule();
    });
    contactsEl.appendChild(row);
    refreshContacts();
  }

  function refreshContacts() {
    [...contactsEl.children].forEach((row, i) => {
      row.querySelector('[name=cNombre]').setAttribute('aria-label', `Nombre del contacto ${i + 1}`);
      row.querySelector('[name=cTel]').setAttribute('aria-label', `Teléfono del contacto ${i + 1}`);
      const rm = row.querySelector('.rm');
      rm.classList.toggle('placeholder', i === 0);
      rm.tabIndex = i === 0 ? -1 : 0;
    });
    addContactBtn.disabled = contactsEl.children.length >= 3;
  }

  /* ------------------------------------------------------------------ *
   *  Categorías (hasta 3 torneos en simultáneo)
   * ------------------------------------------------------------------ */
  function addCategoria() {
    if (categoriasEl.children.length >= 3) return;
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML =
      '<input type="text" name="cat" maxlength="40" placeholder="Categoría del torneo">' +
      '<button type="button" class="rm" aria-label="Quitar categoría">×</button>';
    row.querySelector('.rm').addEventListener('click', () => {
      row.remove();
      refreshCategorias();
      schedule();
    });
    categoriasEl.appendChild(row);
    refreshCategorias();
  }

  function refreshCategorias() {
    [...categoriasEl.children].forEach((row, i) => {
      row.querySelector('[name=cat]').setAttribute('aria-label', `Categoría ${i + 1}`);
      const rm = row.querySelector('.rm');
      rm.classList.toggle('placeholder', i === 0);
      rm.tabIndex = i === 0 ? -1 : 0;
    });
    addCategoriaBtn.disabled = categoriasEl.children.length >= 3;
  }

  /* ------------------------------------------------------------------ *
   *  Lectura y validación de datos
   * ------------------------------------------------------------------ */
  function readData() {
    const v = n => form.elements[n].value.trim();
    const rows = [...contactsEl.children].map(r => ({
      nombre: r.querySelector('[name=cNombre]').value.trim(),
      tel: r.querySelector('[name=cTel]').value.trim()
    }));
    const completos = rows.filter(c => c.nombre && c.tel);
    const parciales = rows.filter(c => (c.nombre || c.tel) && !(c.nombre && c.tel));

    const categorias = [...categoriasEl.querySelectorAll('[name=cat]')].map(i => i.value.trim()).filter(Boolean);
    const digits = v('inscripcion').replace(/\D/g, '');
    const data = {
      complejo: v('complejo'),
      logo: state.logo,
      categorias,
      torneoLabel: categorias.length > 1 ? 'Torneos de pádel' : 'Torneo de pádel',
      inicio: v('inicio'),
      hora: v('hora'),
      fin: v('fin'),
      inscripcion: digits ? '$' + digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '',
      premio: v('premio'),
      contactos: completos
    };

    const missing = [];
    if (!data.complejo) missing.push('Nombre del complejo');
    if (!categorias.length) missing.push('Categoría del torneo');
    if (!data.inicio) missing.push('Fecha de inicio');
    if (data.inicio && data.fin && data.fin < data.inicio) missing.push('La fecha de fin no puede ser anterior a la de inicio');
    if (!completos.length) missing.push('Al menos un contacto con nombre y teléfono');
    else if (parciales.length) missing.push('Completá nombre y teléfono en cada contacto (o quitalo)');
    return { data, missing };
  }

  /* ------------------------------------------------------------------ *
   *  Fechas
   * ------------------------------------------------------------------ */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const isRange = (s, e) => e && e.getTime() !== s.getTime();

  function dateInfo(d) {
    const s = parseDate(d.inicio);
    const e = d.fin ? parseDate(d.fin) : null;
    const hora = d.hora ? `${d.hora} hs` : '';
    if (!isRange(s, e)) {
      const dia = cap(DIAS[s.getDay()]);
      return {
        big: `${s.getDate()} ${MESES_C[s.getMonth()]}`.toUpperCase(),
        small: [dia, hora].filter(Boolean).join(' · '),
        label: dia, hora
      };
    }
    const same = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const big = (same
      ? `${s.getDate()} al ${e.getDate()} ${MESES_C[e.getMonth()]}`
      : `${s.getDate()} ${MESES_C[s.getMonth()]} al ${e.getDate()} ${MESES_C[e.getMonth()]}`).toUpperCase();
    const dias = `${cap(DIAS[s.getDay()])} a ${DIAS[e.getDay()]}`;
    return {
      big,
      small: [dias, hora ? `Inicio ${hora}` : ''].filter(Boolean).join(' · '),
      label: 'Fechas', hora
    };
  }

  // Datos para el modelo "Calendario"
  function calInfo(d) {
    const s = parseDate(d.inicio);
    const e = d.fin ? parseDate(d.fin) : null;
    if (!isRange(s, e)) {
      return { month: MESES[s.getMonth()].toUpperCase(), days: String(s.getDate()), dia: cap(DIAS[s.getDay()]) };
    }
    const same = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    return {
      month: same ? MESES[s.getMonth()].toUpperCase() : `${MESES_C[s.getMonth()]} - ${MESES_C[e.getMonth()]}`.toUpperCase(),
      days: `${s.getDate()}-${e.getDate()}`,
      dia: `${cap(DIAS[s.getDay()])} a ${DIAS[e.getDay()]}`
    };
  }

  /* ------------------------------------------------------------------ *
   *  Helpers de dibujo
   * ------------------------------------------------------------------ */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Fondos decorativos. k = factor de grosor (para miniaturas).
  function drawPattern(ctx, t, kind, k = 1) {
    if (!kind || kind === 'liso') return;
    ctx.save();
    ctx.strokeStyle = t.line;
    ctx.fillStyle = t.line;
    ctx.setLineDash([]);

    if (kind === 'cancha') {
      const mid = H / 2;
      ctx.lineWidth = 4 * k;
      ctx.strokeRect(40, 40, W - 80, H - 80);
      ctx.beginPath();
      ctx.moveTo(40, mid - 440); ctx.lineTo(W - 40, mid - 440);
      ctx.moveTo(40, mid + 440); ctx.lineTo(W - 40, mid + 440);
      ctx.moveTo(W / 2, mid - 440); ctx.lineTo(W / 2, mid + 440);
      ctx.stroke();
      ctx.lineWidth = 8 * k;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.moveTo(40, mid); ctx.lineTo(W - 40, mid);
      ctx.stroke();
    } else if (kind === 'diagonales') {
      ctx.lineWidth = 3 * k;
      for (let i = -H; i < W; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, H); ctx.lineTo(i + H, 0);
        ctx.stroke();
      }
    } else if (kind === 'malla') {
      // Malla de las paredes de una cancha de pádel
      ctx.lineWidth = 2 * k;
      for (let i = -H; i < W; i += 72) {
        ctx.beginPath();
        ctx.moveTo(i, H); ctx.lineTo(i + H, 0);
        ctx.moveTo(i, 0); ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    } else if (kind === 'puntos') {
      for (let y = 40; y < H; y += 54) {
        for (let x = 40; x < W; x += 54) {
          ctx.beginPath();
          ctx.arc(x, y, 3.5 * k, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (kind === 'circulos') {
      ctx.lineWidth = 3 * k;
      for (let r = 140; r < 2000; r += 110) {
        ctx.beginPath();
        ctx.arc(W, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function bgFill(ctx, t, pattern, k = 1) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, t.bg);
    g.addColorStop(1, t.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawPattern(ctx, t, pattern, k);
  }

  // Parte el texto en líneas (con ctx.font ya definido). Si excede maxLines, corta con "…".
  function wrapLines(ctx, text, maxW, maxLines) {
    const words = text.split(/\s+/).filter(Boolean);
    const out = [];
    let cur = '';
    for (const w of words) {
      const tt = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(tt).width > maxW) { out.push(cur); cur = w; } else { cur = tt; }
    }
    if (cur) out.push(cur);
    if (maxLines && out.length > maxLines) {
      const keep = out.slice(0, maxLines - 1);
      let last = out.slice(maxLines - 1).join(' ');
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      keep.push(last + '…');
      return keep;
    }
    return out;
  }

  // Achica la fuente hasta que el texto entre en una línea. Deja ctx.font configurado.
  function fitLine(ctx, text, maxW, size, min, weight, family) {
    for (; size > min; size -= 2) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxW) return size;
    }
    ctx.font = `${weight} ${min}px ${family}`;
    return min;
  }

  function layoutHeadline(ctx, input, { maxW, max, min, lines = 2, maxH = 0, weight = 900 }) {
    const list = Array.isArray(input) ? input : [input];

    // Varias categorías: una por línea, todas del mismo tamaño.
    if (list.length > 1) {
      const items = list.map(x => x.toUpperCase());
      let size = Math.min(max, 150);
      for (;;) {
        ctx.font = `${weight} ${size}px ${DISPLAY}`;
        const wide = items.every(l => ctx.measureText(l).width <= maxW);
        const h = size * 0.78 + (items.length - 1) * size * 0.98;
        if ((wide && (!maxH || h <= maxH)) || size <= 40) break;
        size -= 4;
      }
      const lh = size * 0.98;
      return { ls: items, size, lh, weight, height: size * 0.78 + (items.length - 1) * lh };
    }

    const up = list[0].toUpperCase();
    let size = max;
    let ls;
    for (;;) {
      ctx.font = `${weight} ${size}px ${DISPLAY}`;
      ls = wrapLines(ctx, up, maxW);
      const h = size * 0.78 + (Math.max(ls.length, 1) - 1) * size * 0.9;
      const ok = ls.length <= lines && ls.every(l => ctx.measureText(l).width <= maxW) && (!maxH || h <= maxH);
      if (ok || size <= min) break;
      size -= 4;
    }
    if (ls.length > lines) ls = wrapLines(ctx, up, maxW, lines);
    const lh = size * 0.9;
    return { ls, size, lh, weight, height: size * 0.78 + (ls.length - 1) * lh };
  }

  // Dibuja el titular con su borde superior en y. Devuelve el y inferior.
  function drawHeadline(ctx, L, x, y, align, color) {
    ctx.font = `${L.weight} ${L.size}px ${DISPLAY}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    L.ls.forEach((l, i) => ctx.fillText(l, x, y + L.size * 0.78 + i * L.lh));
    return y + L.height;
  }

  function drawLogo(ctx, img, cx, cy, d, t) {
    const r = d / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.clip();
    const inner = d * 0.7;
    const iw = img.naturalWidth || img.width || inner;
    const ih = img.naturalHeight || img.height || inner;
    const s = Math.min(inner / iw, inner / ih);
    ctx.drawImage(img, cx - (iw * s) / 2, cy - (ih * s) / 2, iw * s, ih * s);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }

  // Ajusta el nombre del complejo: hasta 2 líneas, lo más grande posible.
  function fitName(ctx, name, maxW, size) {
    let s = size, lines;
    for (;;) {
      ctx.font = `700 ${s}px ${TEXT}`;
      lines = wrapLines(ctx, name, maxW);
      if ((lines.length <= 2 && lines.every(l => ctx.measureText(l).width <= maxW)) || s <= 36) break;
      s -= 2;
    }
    if (lines.length > 2) lines = wrapLines(ctx, name, maxW, 2);
    return { lines, size: s, lh: s * 1.12 };
  }

  // Encabezado: logo (o pin de ubicación) + nombre del complejo, una sola vez y en grande.
  function header(ctx, d, t, cy, size, color, nameSize = 72, pinColor) {
    let tx = M;
    if (d.logo) {
      drawLogo(ctx, d.logo, M + size / 2, cy, size, t);
      tx = M + size + 28;
    } else {
      const ph = nameSize * 0.95;
      drawPin(ctx, M, cy - ph / 2, ph, pinColor || t.accent);
      tx = M + ph * 0.7 + 20;
    }
    const N = fitName(ctx, d.complejo, W - M - tx, nameSize);
    ctx.fillStyle = color || t.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const top = cy - (N.lines.length * N.lh) / 2;
    N.lines.forEach((l, i) => ctx.fillText(l, tx, top + i * N.lh + N.size * 0.82));
  }

  // Igual que header, pero centrado. Devuelve el y inferior.
  function centerName(ctx, d, t, { cx, y, maxW, nameSize, logoSize }) {
    if (d.logo) {
      drawLogo(ctx, d.logo, cx, y + logoSize / 2, logoSize, t);
      y += logoSize + 20;
    } else {
      const ph = nameSize * 0.9;
      drawPin(ctx, cx - ph * 0.35, y, ph, t.accent);
      y += ph + 12;
    }
    const N = fitName(ctx, d.complejo, maxW, nameSize);
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    N.lines.forEach((l, i) => ctx.fillText(l, cx, y + N.size * 0.82 + i * N.lh));
    return y + N.lines.length * N.lh;
  }

  function pill(ctx, t, text, x, y, align) {
    ctx.font = `700 30px ${TEXT}`;
    const w = ctx.measureText(text).width + 80;
    const h = 56;
    const px = align === 'center' ? x - w / 2 : x;
    roundRect(ctx, px, y, w, h, 28);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = t.line;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 32, y + h / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = t.ball;
    ctx.fill();
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, px + 54, y + 37);
    return y + h;
  }

  // Ícono de ubicación (pin)
  const PIN = new Path2D('M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z');
  function drawPin(ctx, x, y, h, color) {
    const s = h / 20;
    ctx.save();
    ctx.translate(x - 5 * s, y - 2 * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    ctx.fill(PIN, 'evenodd');
    ctx.restore();
  }

  // Nota "Inscripción abierta" con línea a los costados. y = borde superior (alto 46).
  function drawNote(ctx, t, { y, align = 'left', x0 = M, x1 = W - M }) {
    const text = 'Inscripción abierta';
    ctx.font = `700 30px ${TEXT}`;
    const w = ctx.measureText(text).width + 76;
    const h = 46;
    const px = align === 'center' ? (x0 + x1) / 2 - w / 2 : x0;
    ctx.save();
    ctx.strokeStyle = t.line;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (align === 'center') {
      ctx.moveTo(x0, y + h / 2); ctx.lineTo(px - 20, y + h / 2);
    }
    ctx.moveTo(px + w + 20, y + h / 2); ctx.lineTo(x1, y + h / 2);
    ctx.stroke();
    ctx.restore();
    roundRect(ctx, px, y, w, h, 23);
    ctx.fillStyle = t.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 30, y + h / 2, 8, 0, Math.PI * 2);
    ctx.fillStyle = t.onAccent;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, px + 48, y + h / 2 + 10);
  }

  // Inscripción y premio en columnas. y = línea base de las etiquetas.
  function infoCols(ctx, t, d, { x, w, y, align = 'left', priceSize = 88 }) {
    const items = [];
    if (d.inscripcion) items.push({ label: 'Inscripción', value: d.inscripcion, price: true });
    if (d.premio) items.push({ label: 'Premio', value: d.premio });
    if (!items.length) return;
    const gap = 40;
    const cw = (w - gap * (items.length - 1)) / items.length;
    items.forEach((it, i) => {
      const cx0 = x + i * (cw + gap);
      const ax = align === 'center' ? cx0 + cw / 2 : cx0;
      ctx.textAlign = align;
      ctx.textBaseline = 'alphabetic';
      ctx.font = `600 28px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(it.label, ax, y);
      ctx.fillStyle = t.ink;
      if (it.price) {
        const s = fitLine(ctx, it.value, cw, priceSize, 40, 800, DISPLAY);
        ctx.fillText(it.value, ax, y + 18 + s * 0.78);
      } else {
        ctx.font = `700 36px ${TEXT}`;
        wrapLines(ctx, it.value, cw, 2).forEach((l, k) => ctx.fillText(l, ax, y + 48 + k * 44));
      }
    });
  }

  // Contactos en columnas (1 a 3). Alto aproximado: 100 px.
  function drawContacts(ctx, t, contactos, { x, y, w, align = 'left' }) {
    const n = contactos.length;
    const gap = 24;
    const cw = (w - gap * (n - 1)) / n;
    contactos.forEach((c, i) => {
      const cx = align === 'center' ? x + i * (cw + gap) + cw / 2 : x + i * (cw + gap);
      ctx.textAlign = align;
      ctx.textBaseline = 'alphabetic';
      fitLine(ctx, c.nombre, cw, 34, 22, 700, TEXT);
      ctx.fillStyle = t.muted;
      ctx.fillText(c.nombre, cx, y + 32);
      fitLine(ctx, c.tel, cw, 58, 28, 800, DISPLAY);
      ctx.fillStyle = t.ink;
      ctx.fillText(c.tel, cx, y + 92);
    });
  }

  function drawBall(ctx, t, cx, cy, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = t.ball;
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = Math.max(8, r * 0.05);
    ctx.beginPath();
    ctx.arc(cx - r * 1.3, cy, r * 1.0, -1.0, 1.0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 1.3, cy, r * 1.0, Math.PI - 1.0, Math.PI + 1.0);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.stroke();
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 1: Banda — categoría gigante y fecha en una banda de color
   * ------------------------------------------------------------------ */
  function tplBanda(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    header(ctx, d, t, 150, 120, null, 72);
    pill(ctx, t, d.torneoLabel, M, 290, 'left');

    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 210, min: 100, maxH: 270 });
    const blockH = L.height + 40 + 14;
    const top = 370 + (330 - blockH) / 2;
    const bottom = drawHeadline(ctx, L, M, top, 'left', t.ink);
    roundRect(ctx, M, bottom + 40, 170, 14, 7);
    ctx.fillStyle = t.accent;
    ctx.fill();

    // Banda de fecha
    const info = dateInfo(d);
    const bandY = 735, bandH = 175;
    roundRect(ctx, M, bandY, W - 2 * M, bandH, 28);
    ctx.fillStyle = t.accent;
    ctx.fill();
    const bigSize = fitLine(ctx, info.big, W - 2 * M - 80, 130, 50, 900, DISPLAY);
    const smallH = info.small ? 18 + 26 : 0;
    const contentH = bigSize * 0.78 + smallH;
    const by = bandY + (bandH - contentH) / 2 + bigSize * 0.78;
    ctx.fillStyle = t.onAccent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(info.big, M + 40, by);
    if (info.small) {
      ctx.font = `700 34px ${TEXT}`;
      ctx.fillText(info.small, M + 40, by + 18 + 28);
    }

    infoCols(ctx, t, d, { x: M, w: W - 2 * M, y: 1006, priceSize: 88 });

    drawNote(ctx, t, { y: 1136 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1202, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 2: Marcador — tabla estilo scoreboard
   * ------------------------------------------------------------------ */
  function tplMarcador(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);

    ctx.fillStyle = t.bg2;
    ctx.fillRect(0, 0, W, 200);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, 200, W, 8);
    header(ctx, d, t, 102, 112, null, 58);

    let y = pill(ctx, t, d.torneoLabel, M, 250, 'left');
    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 170, min: 90, maxH: 260 });
    y = drawHeadline(ctx, L, M, y + 34, 'left', t.ink);

    const info = dateInfo(d);
    const rows = [{ label: info.label, value: info.big, w: 1 }];
    if (info.hora) rows.push({ label: 'Hora', value: info.hora, w: 1 });
    if (d.inscripcion) rows.push({ label: 'Inscripción', value: d.inscripcion, w: 1 });
    if (d.premio) rows.push({ label: 'Premio', value: d.premio, w: 1.5, wrap: true });

    const footTop = 1110;
    const tableTop = y + 50;
    const avail = footTop - 40 - tableTop;
    const totalW = rows.reduce((a, r) => a + r.w, 0);
    const unit = Math.min(150, avail / totalW);
    const tableH = unit * totalW;
    const labelW = 300;

    ctx.save();
    roundRect(ctx, M, tableTop, W - 2 * M, tableH, 26);
    ctx.clip();
    let ry = tableTop;
    rows.forEach((r, i) => {
      const h = unit * r.w;
      ctx.fillStyle = t.accent;
      ctx.fillRect(M, ry, labelW, h);
      ctx.fillStyle = t.panel;
      ctx.fillRect(M + labelW, ry, W - 2 * M - labelW, h);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      let lx = M + 28;
      let lmax = labelW - 56;
      if (r.pin) {
        const ph = Math.min(40, h * 0.5);
        drawPin(ctx, lx, ry + h / 2 - ph / 2, ph, t.onAccent);
        lx += ph * 0.7 + 12;
        lmax -= ph * 0.7 + 12;
      }
      fitLine(ctx, r.label.toUpperCase(), lmax, Math.min(46, h * 0.5), 18, 800, DISPLAY);
      ctx.fillStyle = t.onAccent;
      ctx.fillText(r.label.toUpperCase(), lx, ry + h / 2 + 2);

      const vx = M + labelW + 36;
      const vw = W - 2 * M - labelW - 72;
      ctx.fillStyle = t.ink;
      if (r.wrap) {
        const fs = Math.max(24, Math.min(40, h * 0.3));
        ctx.font = `700 ${fs}px ${TEXT}`;
        const ls = wrapLines(ctx, r.value, vw, 2);
        const lh = fs * 1.25;
        ls.forEach((l, k) => ctx.fillText(l, vx, ry + h / 2 - (ls.length * lh) / 2 + lh / 2 + k * lh));
      } else {
        fitLine(ctx, r.value, vw, Math.min(92, h * 0.72), 26, 800, DISPLAY);
        ctx.fillText(r.value, vx, ry + h / 2 + 2);
      }
      if (i > 0) {
        ctx.fillStyle = t.bg;
        ctx.fillRect(M, ry, W - 2 * M, 4);
      }
      ry += h;
    });
    ctx.restore();

    ctx.fillStyle = t.bg2;
    ctx.fillRect(0, footTop, W, H - footTop);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, footTop, W, 8);
    drawNote(ctx, t, { y: 1130 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1200, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 3: Pelota — la fecha dentro de una pelota, composición centrada
   * ------------------------------------------------------------------ */
  function tplPelota(ctx, d, t, pattern) {
    const g = ctx.createRadialGradient(W / 2, H * 0.55, 60, W / 2, H * 0.55, 960);
    g.addColorStop(0, t.panel);
    g.addColorStop(1, t.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawPattern(ctx, t, pattern);

    let y = centerName(ctx, d, t, { cx: W / 2, y: 56, maxW: W - 2 * M, nameSize: 66, logoSize: 100 }) + 8;

    ctx.font = `600 32px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.fillText(d.torneoLabel, W / 2, y + 28);
    y += 42;

    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 200, min: 90, maxH: 300 });
    y = drawHeadline(ctx, L, W / 2, y, 'center', t.ink) + 44;

    // Alto del bloque inscripción / premio / dirección
    let premioLines = [];
    let infoH = 0;
    if (d.inscripcion) infoH += 72;
    if (d.premio) {
      ctx.font = `600 34px ${TEXT}`;
      premioLines = wrapLines(ctx, 'Premio: ' + d.premio, W - 2 * M - 80, 2);
      infoH += (infoH ? 10 : 0) + premioLines.length * 42;
    }
    
    const contactsTop = 1194;
    const noteTop = contactsTop - 58;
    const spaceBottom = noteTop - 22 - infoH - 24;
    const R = Math.max(110, Math.min(240, (spaceBottom - y) / 2));
    const cy = y + R;
    drawBall(ctx, t, W / 2, cy, R);

    const info = dateInfo(d);
    const bigSize = fitLine(ctx, info.big, R * 2 * 0.8, Math.round(R * 0.62), 34, 900, DISPLAY);
    const smallSize = Math.max(20, Math.round(R * 0.14));
    const smallH = info.small ? 14 + smallSize * 0.8 : 0;
    const contentH = bigSize * 0.78 + smallH;
    const baseY = cy - contentH / 2 + bigSize * 0.78;
    ctx.fillStyle = t.onBall;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(info.big, W / 2, baseY);
    if (info.small) {
      fitLine(ctx, info.small, R * 2 * 0.8, smallSize, 14, 700, TEXT);
      ctx.fillText(info.small, W / 2, baseY + 14 + smallSize * 0.8);
    }

    let iy = cy + R + 30;
    if (d.inscripcion) {
      ctx.font = `600 34px ${TEXT}`;
      const lw = ctx.measureText('Inscripción').width;
      const vs = fitLine(ctx, d.inscripcion, 420, 68, 36, 800, DISPLAY);
      const vw = ctx.measureText(d.inscripcion).width;
      const startX = W / 2 - (lw + 18 + vw) / 2;
      ctx.textAlign = 'left';
      ctx.font = `600 34px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText('Inscripción', startX, iy + 50);
      ctx.font = `800 ${vs}px ${DISPLAY}`;
      ctx.fillStyle = t.ink;
      ctx.fillText(d.inscripcion, startX + lw + 18, iy + 52);
      iy += 72 + 10;
    }
    if (premioLines.length) {
      ctx.font = `600 34px ${TEXT}`;
      ctx.fillStyle = t.ink;
      ctx.textAlign = 'center';
      premioLines.forEach((l, k) => ctx.fillText(l, W / 2, iy + 30 + k * 42));
      iy += premioLines.length * 42 + 10;
    }

    drawNote(ctx, t, { y: noteTop, align: 'center' });
    drawContacts(ctx, t, d.contactos, { x: M, y: contactsTop, w: W - 2 * M, align: 'center' });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 4: Afiche — bloque diagonal de color con el título
   * ------------------------------------------------------------------ */
  function tplAfiche(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);

    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 650); ctx.lineTo(0, 760);
    ctx.closePath();
    ctx.fillStyle = t.accent;
    ctx.fill();

    header(ctx, d, t, 150, 120, t.onAccent, 72, t.onAccent);

    ctx.font = `700 34px ${TEXT}`;
    ctx.fillStyle = t.onAccent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(d.torneoLabel, M, 306);

    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 230, min: 90, maxH: 260 });
    drawHeadline(ctx, L, M, 336, 'left', t.onAccent);

    // Pelota decorativa debajo del corte
    drawBall(ctx, t, W - 150, 850, 96);

    const info = dateInfo(d);
    const bs = fitLine(ctx, info.big, 640, 118, 50, 900, DISPLAY);
    ctx.fillStyle = t.ink;
    ctx.textAlign = 'left';
    ctx.fillText(info.big, M, 760 + 30 + bs * 0.78);
    if (info.small) {
      ctx.font = `700 34px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(info.small, M, 760 + 30 + bs * 0.78 + 50);
    }

    infoCols(ctx, t, d, { x: M, w: W - 2 * M, y: 1000, priceSize: 84 });
    drawNote(ctx, t, { y: 1138 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1204, w: W - 2 * M });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 5: Ticket — entrada con muescas y línea de corte
   * ------------------------------------------------------------------ */
  function ticketPath(ctx, x, y, w, h, r, ny, nr) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, ny - nr);
    ctx.arc(x + w, ny, nr, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, ny + nr);
    ctx.arc(x, ny, nr, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function tplTicket(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);

    const x = 60, y = 60, w = W - 120, h = 1230, ny = 640, nr = 36;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    ticketPath(ctx, x, y, w, h, 40, ny, nr);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ticketPath(ctx, x, y, w, h, 40, ny, nr);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(x, y, w, 18);
    ctx.restore();

    const cx = W / 2;
    let yy = centerName(ctx, d, t, { cx, y: y + 54, maxW: w - 120, nameSize: 58, logoSize: 104 }) + 6;
    ctx.font = `600 30px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.fillText(d.torneoLabel, cx, yy + 30);
    yy += 50;

    const L = layoutHeadline(ctx, d.categorias, { maxW: w - 120, max: 170, min: 80, maxH: ny - 44 - yy });
    drawHeadline(ctx, L, cx, yy, 'center', t.ink);

    // Línea de corte
    ctx.save();
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.beginPath();
    ctx.moveTo(x + nr + 16, ny); ctx.lineTo(x + w - nr - 16, ny);
    ctx.stroke();
    ctx.restore();

    const info = dateInfo(d);
    const bs = fitLine(ctx, info.big, w - 120, 136, 54, 900, DISPLAY);
    ctx.fillStyle = t.accent;
    ctx.textAlign = 'center';
    ctx.fillText(info.big, cx, ny + 46 + bs * 0.78);
    if (info.small) {
      ctx.font = `700 34px ${TEXT}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(info.small, cx, ny + 46 + bs * 0.78 + 50);
    }

    infoCols(ctx, t, d, { x: x + 60, w: w - 120, y: 922, align: 'center', priceSize: 84 });
    drawNote(ctx, t, { y: 1084, align: 'center', x0: x + 60, x1: x + w - 60 });
    drawContacts(ctx, t, d.contactos, { x: x + 60, y: 1146, w: w - 120, align: 'center' });
  }

  /* ------------------------------------------------------------------ *
   *  Modelo 6: Calendario — hoja de almanaque con el día en grande
   * ------------------------------------------------------------------ */
  function tplCalendario(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    header(ctx, d, t, 140, 112, null, 66);

    ctx.font = `600 30px ${TEXT}`;
    ctx.fillStyle = t.muted;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(d.torneoLabel, M, 276);
    const L = layoutHeadline(ctx, d.categorias, { maxW: W - 2 * M, max: 190, min: 90, maxH: 240 });
    drawHeadline(ctx, L, M, 298, 'left', t.ink);

    // Hoja de calendario
    const c = calInfo(d);
    const cx0 = M, cy0 = 580, cw = 470, ch = 470, band = 112;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, cx0, cy0, cw, ch, 30);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, cx0, cy0, cw, ch, 30);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(cx0, cy0, cw, band);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const ms = fitLine(ctx, c.month, cw - 80, 70, 30, 800, DISPLAY);
    ctx.fillStyle = t.onAccent;
    ctx.fillText(c.month, cx0 + cw / 2, cy0 + band / 2 + ms * 0.39);

    const ds = fitLine(ctx, c.days, cw - 60, 260, 70, 900, DISPLAY);
    const areaTop = cy0 + band, areaBottom = cy0 + ch - 70;
    ctx.fillStyle = t.ink;
    ctx.fillText(c.days, cx0 + cw / 2, (areaTop + areaBottom) / 2 + ds * 0.39);
    fitLine(ctx, c.dia, cw - 60, 36, 22, 700, TEXT);
    ctx.fillStyle = t.muted;
    ctx.fillText(c.dia, cx0 + cw / 2, cy0 + ch - 26);

    // Argollas
    [cx0 + 120, cx0 + cw - 142].forEach(rx => {
      roundRect(ctx, rx, cy0 - 22, 22, 58, 11);
      ctx.fillStyle = t.ink;
      ctx.fill();
    });

    // Columna derecha: hora, inscripción, premio
    const colX = cx0 + cw + 50, colW = W - M - colX;
    const blocks = [];
    const info = dateInfo(d);
    if (info.hora) blocks.push({ label: 'Hora', value: info.hora, kind: 'big' });
    if (d.inscripcion) blocks.push({ label: 'Inscripción', value: d.inscripcion, kind: 'big' });
    if (d.premio) blocks.push({ label: 'Premio', value: d.premio, kind: 'text' });

    if (!blocks.length) {
      drawBall(ctx, t, colX + colW / 2, cy0 + ch / 2, Math.min(colW / 2, 190));
    } else {
      let by = cy0 + 18;
      blocks.forEach(b => {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font = `600 28px ${TEXT}`;
        ctx.fillStyle = t.muted;
        ctx.fillText(b.label, colX, by + 24);
        ctx.fillStyle = t.ink;
        if (b.kind === 'big') {
          const s = fitLine(ctx, b.value, colW, 84, 36, 800, DISPLAY);
          ctx.fillText(b.value, colX, by + 24 + 16 + s * 0.78);
          by += 24 + 16 + s * 0.78 + 36;
        } else {
          ctx.font = `700 34px ${TEXT}`;
          const ls = wrapLines(ctx, b.value, colW, 3);
          ls.forEach((l, k) => ctx.fillText(l, colX, by + 24 + 44 + k * 42));
          by += 24 + 44 + (ls.length - 1) * 42 + 30;
        }
      });
    }

    drawNote(ctx, t, { y: 1110 });
    drawContacts(ctx, t, d.contactos, { x: M, y: 1170, w: W - 2 * M });
  }

  const TEMPLATES = [
    { key: 'banda',      label: 'Banda',      draw: tplBanda,      pattern: 'cancha' },
    { key: 'marcador',   label: 'Marcador',   draw: tplMarcador,   pattern: 'diagonales' },
    { key: 'pelota',     label: 'Pelota',     draw: tplPelota,     pattern: 'circulos' },
    { key: 'afiche',     label: 'Afiche',     draw: tplAfiche,     pattern: 'malla' },
    { key: 'ticket',     label: 'Ticket',     draw: tplTicket,     pattern: 'puntos' },
    { key: 'calendario', label: 'Calendario', draw: tplCalendario, pattern: 'liso' }
  ];

  /* ------------------------------------------------------------------ *
   *  Recordatorio de turnos — datos, íconos y helpers de dibujo
   * ------------------------------------------------------------------ */
  const FRASE = '¡Nos vemos en la cancha!';
  const CREDITO = 'Desarrollado por Federico Olego';

  const todayISO = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  };

  function turnoInfo(d) {
    const s = parseDate(d.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diff = Math.round((s - hoy) / 86400000);
    const dia = cap(DIAS[s.getDay()]);
    return {
      dia,
      num: String(s.getDate()),
      mes: MESES[s.getMonth()],
      largo: `${dia} ${s.getDate()} de ${MESES[s.getMonth()]}`,
      rel: diff === 0 ? 'HOY' : diff === 1 ? 'MAÑANA' : '',
      hora: d.hora,
      horaTxt: `${d.hora} hs`,
      cancha: /^\d+$/.test(d.cancha) ? `Cancha ${d.cancha}` : d.cancha
    };
  }

  function turnoRows(d, info) {
    const rows = [
      { icon: 'calendar', key: 'Fecha', val: info.largo, badge: info.rel },
      { icon: 'clock', key: 'Hora', val: info.horaTxt },
      { icon: 'pin', key: 'Lugar', val: d.lugar }
    ];
    if (info.cancha) rows.push({ icon: 'court', key: 'Cancha', val: info.cancha });
    return rows;
  }

  function txt(ctx, s, x, y, font, color, align = 'left') {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
  }

  // Íconos de línea. (cx, cy) = centro, s = tamaño del cuadrado que ocupan.
  function drawIcon(ctx, kind, cx, cy, s, color) {
    const h = s / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s * 0.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    if (kind === 'calendar') {
      roundRect(ctx, cx - h, cy - h + s * 0.1, s, s * 0.9, s * 0.14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - h, cy - s * 0.1); ctx.lineTo(cx + h, cy - s * 0.1);
      ctx.moveTo(cx - s * 0.25, cy - h); ctx.lineTo(cx - s * 0.25, cy - h + s * 0.2);
      ctx.moveTo(cx + s * 0.25, cy - h); ctx.lineTo(cx + s * 0.25, cy - h + s * 0.2);
      ctx.stroke();
    } else if (kind === 'clock') {
      ctx.beginPath();
      ctx.arc(cx, cy, h, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.28); ctx.lineTo(cx, cy); ctx.lineTo(cx + s * 0.2, cy + s * 0.12);
      ctx.stroke();
    } else if (kind === 'pin') {
      drawPin(ctx, cx - s * 0.35, cy - h, s, color);
    } else if (kind === 'court') {
      roundRect(ctx, cx - s * 0.38, cy - h, s * 0.76, s, s * 0.06);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.38, cy); ctx.lineTo(cx + s * 0.38, cy);
      ctx.moveTo(cx - s * 0.38, cy - s * 0.3); ctx.lineTo(cx + s * 0.38, cy - s * 0.3);
      ctx.moveTo(cx - s * 0.38, cy + s * 0.3); ctx.lineTo(cx + s * 0.38, cy + s * 0.3);
      ctx.moveTo(cx, cy - s * 0.3); ctx.lineTo(cx, cy + s * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCheck(ctx, cx, cy, r, fill, mark) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = mark;
    ctx.lineWidth = r * 0.28;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.42, cy + r * 0.02);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.36);
    ctx.lineTo(cx + r * 0.44, cy - r * 0.3);
    ctx.stroke();
    ctx.restore();
  }

  // Cartelito "Confirmado" con tilde. y = borde superior. Devuelve el y inferior.
  function confirmPill(ctx, t, x, y, align = 'left') {
    ctx.font = `700 30px ${TEXT}`;
    const tw = ctx.measureText('Confirmado').width;
    const w = tw + 98, h = 56;
    const px = align === 'center' ? x - w / 2 : x;
    roundRect(ctx, px, y, w, h, h / 2);
    ctx.fillStyle = t.accent;
    ctx.fill();
    drawCheck(ctx, px + 36, y + h / 2, 18, t.onAccent, t.accent);
    txt(ctx, 'Confirmado', px + 68, y + 38, `700 30px ${TEXT}`, t.onAccent);
    return y + h;
  }

  // Cartelito HOY / MAÑANA. cy = centro vertical. Devuelve el ancho.
  function badgeWidth(ctx, text) {
    ctx.font = `800 34px ${DISPLAY}`;
    return ctx.measureText(text).width + 36;
  }
  function drawBadge(ctx, t, text, x, cy) {
    const w = badgeWidth(ctx, text);
    roundRect(ctx, x, cy - 27, w, 54, 14);
    ctx.fillStyle = t.accent;
    ctx.fill();
    txt(ctx, text, x + 18, cy + 12, `800 34px ${DISPLAY}`, t.onAccent);
    return w;
  }

  // Tamaño de la fecha larga (deja ctx.font configurado). Sirve para medir y para dibujar.
  function dateFit(ctx, info, maxW, size) {
    const bw = info.rel ? badgeWidth(ctx, info.rel) + 24 : 0;
    const s = fitLine(ctx, info.largo, maxW - bw, size, 40, 800, DISPLAY);
    return { s, tw: ctx.measureText(info.largo).width, bw, h: s * 0.92 };
  }

  // Fecha larga en grande, con el cartelito HOY/MAÑANA al lado. y = borde superior. Devuelve el y inferior.
  function dateLine(ctx, t, info, { x, y, maxW, size = 92, align = 'left', color }) {
    const f = dateFit(ctx, info, maxW, size);
    const sx = align === 'center' ? x - (f.tw + f.bw) / 2 : x;
    txt(ctx, info.largo, sx, y + f.s * 0.78, `800 ${f.s}px ${DISPLAY}`, color || t.ink);
    if (info.rel) drawBadge(ctx, t, info.rel, sx + f.tw + 24, y + f.s * 0.78 - f.s * 0.36);
    return y + f.h;
  }

  // Apila bloques ({h, draw(y)}) desde y. Si sobra lugar hasta yMax, lo reparte entre los bloques.
  function flowBlocks(blocks, y, yMax, gap, extraMax = 40) {
    const natural = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);
    const extra = Math.max(0, Math.min(extraMax, (yMax - y - natural) / Math.max(1, blocks.length - 1)));
    const g = gap + extra;
    blocks.forEach(b => { b.draw(y); y += b.h + g; });
    return y - g;
  }

  // Texto de una línea con ícono. Modo display = tipografía grande (para el lugar); se achica hasta entrar en 2 líneas.
  function fitInfo(ctx, text, maxW, size, display) {
    const fam = display ? DISPLAY : TEXT, fw = display ? 800 : 700;
    const k = display ? 1.04 : 1.22, ik = display ? 0.92 : 1.05, gap = 20;
    let s = size, lines;
    for (;;) {
      ctx.font = `${fw} ${s}px ${fam}`;
      lines = wrapLines(ctx, text, maxW - s * ik - gap);
      const ok = lines.length <= 2 && lines.every(l => ctx.measureText(l).width <= maxW - s * ik - gap);
      if (!display || ok || s <= 44) break;
      s -= 4;
    }
    if (lines.length > 2) lines = wrapLines(ctx, text, maxW - s * ik - gap, 2);
    return { lines, s, fam, fw, lh: s * k, iconS: s * ik, gap, base: display ? 0.8 : 0.9 };
  }

  // Línea con ícono + texto (hasta 2 líneas). y = borde superior. Devuelve el y inferior.
  function infoLine(ctx, t, icon, text, { x, y, maxW, align = 'left', size = 44, display = false }) {
    const f = fitInfo(ctx, text, maxW, size, display);
    const lw = Math.max(...f.lines.map(l => ctx.measureText(l).width));
    const total = f.iconS + f.gap + lw;
    const sx = align === 'center' ? x - total / 2 : x;
    const blockH = f.lines.length * f.lh;
    drawIcon(ctx, icon, sx + f.iconS / 2, y + blockH / 2, f.iconS * 0.86, t.accent);
    f.lines.forEach((l, i) => txt(ctx, l, sx + f.iconS + f.gap, y + f.s * f.base + i * f.lh, `${f.fw} ${f.s}px ${f.fam}`, t.ink));
    return y + blockH;
  }
  function infoLineHeight(ctx, text, { maxW, size = 44, display = false }) {
    const f = fitInfo(ctx, text, maxW, size, display);
    return f.lines.length * f.lh;
  }

  // Jugadores como "chips" en filas.
  function chipRows(ctx, list, w) {
    ctx.font = `700 34px ${TEXT}`;
    const gap = 14;
    const rows = [];
    let row = [], rw = 0;
    list.forEach(n => {
      const it = { n, w: ctx.measureText(n).width + 56 };
      const add = (row.length ? gap : 0) + it.w;
      if (row.length && rw + add > w) { rows.push({ row, rw }); row = [it]; rw = it.w; } else { row.push(it); rw += add; }
    });
    if (row.length) rows.push({ row, rw });
    return rows;
  }
  const CHIP_H = 64, CHIP_GAP = 14;
  function playersHeight(ctx, list, w, label = true) {
    if (!list.length) return 0;
    return (label ? 46 : 0) + chipRows(ctx, list, w).length * (CHIP_H + CHIP_GAP) - CHIP_GAP;
  }
  function drawPlayers(ctx, t, list, { x, y, w, align = 'left', label = true }) {
    if (!list.length) return y;
    let yy = y;
    if (label) {
      txt(ctx, 'Jugadores', align === 'center' ? x + w / 2 : x, yy + 26, `600 28px ${TEXT}`, t.muted, align);
      yy += 46;
    }
    chipRows(ctx, list, w).forEach(r => {
      let px = align === 'center' ? x + (w - r.rw) / 2 : x;
      r.row.forEach(it => {
        roundRect(ctx, px, yy, it.w, CHIP_H, CHIP_H / 2);
        ctx.fillStyle = t.panel;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = t.line;
        ctx.stroke();
        txt(ctx, it.n, px + 28, yy + 44, `700 34px ${TEXT}`, t.ink);
        px += it.w + CHIP_GAP;
      });
      yy += CHIP_H + CHIP_GAP;
    });
    return yy - CHIP_GAP;
  }

  function turnoFooter(ctx, t, cx = W / 2, y = 1236, color) {
    txt(ctx, FRASE, cx, y, `700 42px ${TEXT}`, color || t.ink, 'center');
    txt(ctx, `🎾 ${CREDITO} 🎾`, cx, y + 56, `700 30px ${TEXT}`, t.muted, 'center');
  }

  // Hora en grande + "HS". Busca el mayor tamaño (<= maxS) que entra en maxW.
  function heroTime(ctx, hora, maxW, maxS, minS = 100, gap = 24) {
    let S = maxS, tw = 0, hs = 0, hw = 0;
    for (; S > minS; S -= 4) {
      ctx.font = `900 ${S}px ${DISPLAY}`;
      tw = ctx.measureText(hora).width;
      hs = Math.round(S * 0.26);
      ctx.font = `800 ${hs}px ${DISPLAY}`;
      hw = ctx.measureText('HS').width;
      if (tw + gap + hw <= maxW) break;
    }
    return { S, tw, hs, hw, gap };
  }

  /* ------------------------------------------------------------------ *
   *  Turno · Modelo 1: Tarjeta — filas con íconos en un panel
   * ------------------------------------------------------------------ */
  function turnoTarjeta(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    const info = turnoInfo(d);
    const rows = turnoRows(d, info).map(r => ({ ...r, big: r.key !== 'Cancha' }));
    const px = M, pw = W - 2 * M, inner = pw - 80;
    const headH = 190, padB = 36;
    const playersH = d.jugadores.length ? 30 + playersHeight(ctx, d.jugadores, inner) : 0;
    const base = rows.reduce((a, r) => a + (r.big ? 165 : 124), 0);
    const k = Math.max(1, Math.min(1.2, (1110 - headH - playersH - padB) / base));
    rows.forEach(r => { r.h = (r.big ? 165 : 124) * k; });
    const ph = headH + rows.reduce((a, r) => a + r.h, 0) + playersH + padB;
    const y0 = 70 + Math.max(0, (1110 - ph) / 2);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    roundRect(ctx, px, y0, pw, ph, 40);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, px, y0, pw, ph, 40);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(px, y0, pw, headH);
    ctx.restore();

    const ts = fitLine(ctx, 'TURNO DE PÁDEL', inner, 88, 50, 900, DISPLAY);
    txt(ctx, 'TURNO DE PÁDEL', W / 2, y0 + 32 + ts * 0.78, `900 ${ts}px ${DISPLAY}`, t.onAccent, 'center');
    ctx.font = `700 34px ${TEXT}`;
    const cw = ctx.measureText('Confirmado').width + 54;
    const cx0 = W / 2 - cw / 2, cyc = y0 + headH - 44;
    drawCheck(ctx, cx0 + 20, cyc, 20, t.onAccent, t.accent);
    txt(ctx, 'Confirmado', cx0 + 54, cyc + 12, `700 34px ${TEXT}`, t.onAccent);

    let ry = y0 + headH;
    rows.forEach((r, i) => {
      const mid = ry + r.h / 2;
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(px + 40, ry); ctx.lineTo(px + pw - 40, ry);
        ctx.lineWidth = 3;
        ctx.strokeStyle = t.line;
        ctx.stroke();
      }
      const ir = r.big ? 52 : 40;
      ctx.beginPath();
      ctx.arc(px + 40 + ir, mid, ir, 0, Math.PI * 2);
      ctx.fillStyle = t.bg2;
      ctx.fill();
      drawIcon(ctx, r.icon, px + 40 + ir, mid, ir * 0.95, t.accent);

      const tx = px + 40 + ir * 2 + 28;
      const vs0 = r.big ? 88 : 56;
      const bw = r.badge ? badgeWidth(ctx, r.badge) + 20 : 0;
      const vs = fitLine(ctx, r.val, px + pw - 40 - tx - bw, vs0, 36, 800, DISPLAY);
      const vw = ctx.measureText(r.val).width;
      const total = 18 + 12 + vs * 0.78;
      const kb = mid - total / 2 + 18;
      txt(ctx, r.key.toUpperCase(), tx, kb, `700 ${r.big ? 24 : 22}px ${TEXT}`, t.muted);
      const vb = kb + 12 + vs * 0.78;
      txt(ctx, r.val, tx, vb, `800 ${vs}px ${DISPLAY}`, t.ink);
      if (r.badge) drawBadge(ctx, t, r.badge, tx + vw + 20, vb - vs * 0.36);
      ry += r.h;
    });

    if (d.jugadores.length) {
      ctx.beginPath();
      ctx.moveTo(px + 40, ry + 10); ctx.lineTo(px + pw - 40, ry + 10);
      ctx.lineWidth = 3;
      ctx.strokeStyle = t.line;
      ctx.stroke();
      drawPlayers(ctx, t, d.jugadores, { x: px + 40, y: ry + 30, w: inner });
    }
    turnoFooter(ctx, t);
  }

  /* ------------------------------------------------------------------ *
   *  Turno · Modelo 2: Hora — la hora en gigante
   * ------------------------------------------------------------------ */
  function turnoHora(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    const info = turnoInfo(d);
    const maxW = W - 2 * M;
    const blocks = [
      { h: dateFit(ctx, info, maxW, 100).h, draw: y => dateLine(ctx, t, info, { x: M, y, maxW, size: 100 }) },
      { h: infoLineHeight(ctx, d.lugar, { maxW, size: 80, display: true }), draw: y => infoLine(ctx, t, 'pin', d.lugar, { x: M, y, maxW, size: 80, display: true }) }
    ];
    if (info.cancha) blocks.push({ h: infoLineHeight(ctx, info.cancha, { maxW, size: 44 }), draw: y => infoLine(ctx, t, 'court', info.cancha, { x: M, y, maxW, size: 44 }) });
    if (d.jugadores.length) blocks.push({ h: playersHeight(ctx, d.jugadores, maxW), draw: y => drawPlayers(ctx, t, d.jugadores, { x: M, y, w: maxW }) });
    const gap = 34, tail = 40 + 14 + 52;
    const natural = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);

    // La hora se achica si el resto no entra; si sobra lugar, baja un poco todo el bloque.
    const top0 = 290;
    let hero = heroTime(ctx, info.hora, maxW, 460, 100, 26);
    const over = top0 + hero.S * 0.78 + tail + natural - 1160;
    if (over > 0) hero = heroTime(ctx, info.hora, maxW, Math.max(150, hero.S - Math.ceil(over / 0.78)), 100, 26);
    const off = over < 0 ? Math.min(140, -over * 0.4) : 0;

    confirmPill(ctx, t, M, 96, 'left');
    txt(ctx, 'TURNO DE PÁDEL', M, 250 + off, `800 62px ${DISPLAY}`, t.muted);
    const base = top0 + off + hero.S * 0.78;
    txt(ctx, info.hora, M, base, `900 ${hero.S}px ${DISPLAY}`, t.ink);
    txt(ctx, 'HS', M + hero.tw + hero.gap, base, `800 ${hero.hs}px ${DISPLAY}`, t.accent);
    roundRect(ctx, M, base + 40, 170, 14, 7);
    ctx.fillStyle = t.accent;
    ctx.fill();

    flowBlocks(blocks, base + tail, 1160, gap, 44);
    turnoFooter(ctx, t);
  }

  /* ------------------------------------------------------------------ *
   *  Turno · Modelo 3: Pelota — la hora dentro de la pelota
   * ------------------------------------------------------------------ */
  function turnoPelota(ctx, d, t, pattern) {
    const g = ctx.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, 960);
    g.addColorStop(0, t.panel);
    g.addColorStop(1, t.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    drawPattern(ctx, t, pattern);

    const info = turnoInfo(d);
    const maxW = W - 2 * M;
    confirmPill(ctx, t, W / 2, 90, 'center');
    const ts = fitLine(ctx, 'TURNO DE PÁDEL', maxW, 84, 50, 900, DISPLAY);
    txt(ctx, 'TURNO DE PÁDEL', W / 2, 90 + 56 + 26 + ts * 0.78, `900 ${ts}px ${DISPLAY}`, t.ink, 'center');
    const top = 90 + 56 + 26 + ts * 0.92 + 30;

    const dFit = dateFit(ctx, info, maxW, 112);
    const blocks = [
      { h: infoLineHeight(ctx, d.lugar, { maxW, size: 76, display: true }), draw: y => infoLine(ctx, t, 'pin', d.lugar, { x: W / 2, y, maxW, size: 76, display: true, align: 'center' }) }
    ];
    if (info.cancha) blocks.push({ h: infoLineHeight(ctx, info.cancha, { maxW, size: 42 }), draw: y => infoLine(ctx, t, 'court', info.cancha, { x: W / 2, y, maxW, size: 42, align: 'center' }) });
    if (d.jugadores.length) blocks.push({ h: playersHeight(ctx, d.jugadores, maxW), draw: y => drawPlayers(ctx, t, d.jugadores, { x: M, y, w: maxW, align: 'center' }) });
    const gap = 24;
    const below = 36 + dFit.h + gap + blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);
    const R = Math.max(110, Math.min(300, (1160 - top - below - 30) / 2));
    const cy = top + R;
    drawBall(ctx, t, W / 2, cy, R);

    const bs = fitLine(ctx, info.hora, R * 1.55, Math.round(R * 0.82), 40, 900, DISPLAY);
    const hs = Math.round(R * 0.2);
    const blockH = bs * 0.78 + 14 + hs;
    const base = cy - blockH / 2 + bs * 0.78;
    txt(ctx, info.hora, W / 2, base, `900 ${bs}px ${DISPLAY}`, t.onBall, 'center');
    txt(ctx, 'HS', W / 2, base + 14 + hs * 0.9, `800 ${hs}px ${DISPLAY}`, t.onBall, 'center');

    let y = cy + R + 36;
    y = dateLine(ctx, t, info, { x: W / 2, y, maxW, size: 112, align: 'center' });
    flowBlocks(blocks, y + gap, 1160, gap, 30);
    turnoFooter(ctx, t);
  }

  /* ------------------------------------------------------------------ *
   *  Turno · Modelo 4: Cancha — la cancha vista desde arriba
   * ------------------------------------------------------------------ */
  function drawCourt(ctx, t, x, y, w, h, label) {
    ctx.save();
    roundRect(ctx, x, y, w, h, 22);
    ctx.fillStyle = rgba(t.accent, 0.14);
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = t.accent;
    ctx.stroke();

    const cx = x + w / 2, cy = y + h / 2;
    const sv = w * 0.3475;
    ctx.lineWidth = 5;
    ctx.strokeStyle = rgba(t.accent, 0.75);
    ctx.beginPath();
    ctx.moveTo(cx - sv, y); ctx.lineTo(cx - sv, y + h);
    ctx.moveTo(cx + sv, y); ctx.lineTo(cx + sv, y + h);
    ctx.moveTo(cx - sv, cy); ctx.lineTo(cx + sv, cy);
    ctx.stroke();

    // Red
    ctx.lineWidth = 10;
    ctx.strokeStyle = t.ink;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(cx, y - 14); ctx.lineTo(cx, y + h + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    if (label) {
      const fs = fitLine(ctx, label, w * 0.52, 78, 36, 900, DISPLAY);
      const lw = ctx.measureText(label).width + 70;
      const lh = fs * 0.78 + 50;
      roundRect(ctx, cx - lw / 2, cy - lh / 2, lw, lh, 22);
      ctx.fillStyle = t.accent;
      ctx.fill();
      txt(ctx, label, cx, cy + fs * 0.39, `900 ${fs}px ${DISPLAY}`, t.onAccent, 'center');
    } else {
      drawBall(ctx, t, cx, cy, Math.min(56, h * 0.16));
    }
  }

  function turnoCancha(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    const info = turnoInfo(d);
    const maxW = W - 2 * M;
    confirmPill(ctx, t, M, 90, 'left');
    const ts = fitLine(ctx, 'TURNO DE PÁDEL', maxW, 80, 50, 900, DISPLAY);
    txt(ctx, 'TURNO DE PÁDEL', M, 90 + 56 + 24 + ts * 0.78, `900 ${ts}px ${DISPLAY}`, t.ink);
    const top = 90 + 56 + 24 + ts * 0.92 + 40;

    const blocks = [
      { h: dateFit(ctx, info, maxW, 108).h, draw: y => dateLine(ctx, t, info, { x: M, y, maxW, size: 108 }) },
      {
        h: 92,
        draw: y => {
          drawIcon(ctx, 'clock', M + 32, y + 44, 56, t.accent);
          txt(ctx, info.horaTxt, M + 32 + 56, y + 74, `800 104px ${DISPLAY}`, t.ink);
        }
      },
      { h: infoLineHeight(ctx, d.lugar, { maxW, size: 76, display: true }), draw: y => infoLine(ctx, t, 'pin', d.lugar, { x: M, y, maxW, size: 76, display: true }) }
    ];
    if (d.jugadores.length) blocks.push({ h: playersHeight(ctx, d.jugadores, maxW), draw: y => drawPlayers(ctx, t, d.jugadores, { x: M, y, w: maxW }) });
    const gap = 26;
    const natural = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);

    const ch = Math.max(200, Math.min(468, 1140 - top - 14 - 34 - natural));
    const cw = ch * 2;
    drawCourt(ctx, t, (W - cw) / 2, top + 14, cw, ch, info.cancha);
    flowBlocks(blocks, top + 14 + ch + 34, 1150, gap, 30);
    turnoFooter(ctx, t);
  }

  /* ------------------------------------------------------------------ *
   *  Turno · Modelo 5: Ticket — entrada con muescas y línea de corte
   * ------------------------------------------------------------------ */
  function turnoTicket(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    const info = turnoInfo(d);
    const x = 60, w = W - 120, nr = 36, cx = W / 2, inner = w - 120;

    const blocks = [
      { h: dateFit(ctx, info, inner, 104).h, draw: yy => dateLine(ctx, t, info, { x: cx, y: yy, maxW: inner, size: 104, align: 'center' }) },
      { h: infoLineHeight(ctx, d.lugar, { maxW: inner, size: 72, display: true }), draw: yy => infoLine(ctx, t, 'pin', d.lugar, { x: cx, y: yy, maxW: inner, size: 72, display: true, align: 'center' }) }
    ];
    if (info.cancha) blocks.push({ h: infoLineHeight(ctx, info.cancha, { maxW: inner, size: 42 }), draw: yy => infoLine(ctx, t, 'court', info.cancha, { x: cx, y: yy, maxW: inner, size: 42, align: 'center' }) });
    if (d.jugadores.length) blocks.push({ h: playersHeight(ctx, d.jugadores, inner), draw: yy => drawPlayers(ctx, t, d.jugadores, { x: x + 60, y: yy, w: inner, align: 'center' }) });
    const gap = 22;
    const natural = blocks.reduce((a, b) => a + b.h, 0) + gap * (blocks.length - 1);

    // Alto del ticket según el contenido: parte de arriba (hasta el corte) + talón (datos y pie)
    const stub = 50 + natural + 40 + 140;
    const topPart = Math.max(470, Math.min(580, 1230 - stub));
    const h = topPart + stub;
    const y = 60 + (1230 - h) / 2;
    const ny = y + topPart;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.28)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    ticketPath(ctx, x, y, w, h, 40, ny, nr);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ticketPath(ctx, x, y, w, h, 40, ny, nr);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(x, y, w, 18);
    ctx.restore();

    confirmPill(ctx, t, cx, y + 60, 'center');
    const ts = fitLine(ctx, 'TURNO DE PÁDEL', inner, 72, 44, 900, DISPLAY);
    txt(ctx, 'TURNO DE PÁDEL', cx, y + 60 + 56 + 26 + ts * 0.78, `900 ${ts}px ${DISPLAY}`, t.ink, 'center');
    const topY = y + 60 + 56 + 26 + ts * 0.92 + 26;

    // Hora grande entre el título y la línea de corte
    const avail = ny - 56 - topY;
    const hero = heroTime(ctx, info.hora, inner, Math.min(330, Math.floor(avail / 0.78)), 90, 20);
    const total = hero.tw + hero.gap + hero.hw;
    const base = topY + (avail - hero.S * 0.78) / 2 + hero.S * 0.78;
    txt(ctx, info.hora, cx - total / 2, base, `900 ${hero.S}px ${DISPLAY}`, t.accent);
    txt(ctx, 'HS', cx - total / 2 + hero.tw + hero.gap, base, `800 ${hero.hs}px ${DISPLAY}`, t.muted);

    ctx.save();
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = t.line;
    ctx.beginPath();
    ctx.moveTo(x + nr + 16, ny); ctx.lineTo(x + w - nr - 16, ny);
    ctx.stroke();
    ctx.restore();

    flowBlocks(blocks, ny + 50, y + h - 140 - 20, gap, 30);
    turnoFooter(ctx, t, cx, y + h - 74);
  }

  /* ------------------------------------------------------------------ *
   *  Turno · Modelo 6: Calendario — hoja de almanaque con el día en grande
   * ------------------------------------------------------------------ */
  function turnoCalendario(ctx, d, t, pattern) {
    bgFill(ctx, t, pattern);
    const info = turnoInfo(d);
    confirmPill(ctx, t, M, 96, 'left');
    const ts = fitLine(ctx, 'TURNO DE PÁDEL', W - 2 * M, 80, 50, 900, DISPLAY);
    txt(ctx, 'TURNO DE PÁDEL', M, 96 + 56 + 26 + ts * 0.78, `900 ${ts}px ${DISPLAY}`, t.ink);

    const cw = 470, ch = 470, band = 112;
    const playersBlock = d.jugadores.length ? 70 + playersHeight(ctx, d.jugadores, W - 2 * M) : 0;
    const free = 1160 - 330 - ch - playersBlock;
    const cx0 = M, cy0 = 330 + Math.max(0, Math.min(170, free * 0.45));
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.25)';
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, cx0, cy0, cw, ch, 30);
    ctx.fillStyle = t.panel;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, cx0, cy0, cw, ch, 30);
    ctx.clip();
    ctx.fillStyle = t.accent;
    ctx.fillRect(cx0, cy0, cw, band);
    ctx.restore();

    const month = info.mes.toUpperCase();
    const ms = fitLine(ctx, month, cw - 230, 70, 30, 800, DISPLAY);
    txt(ctx, month, cx0 + cw / 2, cy0 + band / 2 + ms * 0.39, `800 ${ms}px ${DISPLAY}`, t.onAccent, 'center');
    const ds = fitLine(ctx, info.num, cw - 60, 260, 70, 900, DISPLAY);
    const areaTop = cy0 + band, areaBottom = cy0 + ch - 70;
    txt(ctx, info.num, cx0 + cw / 2, (areaTop + areaBottom) / 2 + ds * 0.39, `900 ${ds}px ${DISPLAY}`, t.ink, 'center');
    const wk = fitLine(ctx, info.dia, cw - 60, 40, 22, 700, TEXT);
    txt(ctx, info.dia, cx0 + cw / 2, cy0 + ch - 26, `700 ${wk}px ${TEXT}`, t.muted, 'center');

    [cx0 + 62, cx0 + cw - 84].forEach(rx => {
      roundRect(ctx, rx, cy0 - 22, 22, 58, 11);
      ctx.fillStyle = t.ink;
      ctx.fill();
    });

    // Cartelito HOY / MAÑANA pegado a la hoja
    if (info.rel) {
      const bw = badgeWidth(ctx, info.rel);
      ctx.save();
      ctx.translate(cx0 + cw - 40, cy0 + ch - 6);
      ctx.rotate(-0.1);
      drawBadge(ctx, t, info.rel, -bw / 2, 0);
      ctx.restore();
    }

    // Columna derecha: hora, lugar, cancha
    const colX = cx0 + cw + 50, colW = W - M - colX;
    let by = cy0 + 6;
    const blocks = [
      { label: 'Hora', value: info.horaTxt, big: true },
      { label: 'Lugar', value: d.lugar }
    ];
    if (info.cancha) blocks.push({ label: 'Cancha', value: info.cancha });
    blocks.forEach(b => {
      txt(ctx, b.label, colX, by + 24, `600 28px ${TEXT}`, t.muted);
      if (b.big) {
        const s = fitLine(ctx, b.value, colW, 112, 40, 900, DISPLAY);
        txt(ctx, b.value, colX, by + 24 + 18 + s * 0.78, `900 ${s}px ${DISPLAY}`, t.ink);
        by += 24 + 18 + s * 0.78 + 40;
      } else if (b.label === 'Lugar') {
        let fs = 72, ls;
        for (;; fs -= 4) {
          ctx.font = `800 ${fs}px ${DISPLAY}`;
          ls = wrapLines(ctx, b.value, colW);
          if ((ls.length <= 3 && ls.every(l => ctx.measureText(l).width <= colW)) || fs <= 40) break;
        }
        if (ls.length > 3) ls = wrapLines(ctx, b.value, colW, 3);
        ls.forEach((l, k) => txt(ctx, l, colX, by + 24 + 14 + fs * 0.78 + k * fs * 1.04, `800 ${fs}px ${DISPLAY}`, t.ink));
        by += 24 + 14 + fs * 0.78 + (ls.length - 1) * fs * 1.04 + 40;
      } else {
        ctx.font = `700 38px ${TEXT}`;
        const ls = wrapLines(ctx, b.value, colW, 3);
        ls.forEach((l, k) => txt(ctx, l, colX, by + 24 + 46 + k * 46, `700 38px ${TEXT}`, t.ink));
        by += 24 + 46 + (ls.length - 1) * 46 + 36;
      }
    });

    if (d.jugadores.length) drawPlayers(ctx, t, d.jugadores, { x: M, y: Math.max(cy0 + ch + 70, by + 20), w: W - 2 * M });
    turnoFooter(ctx, t);
  }

  const TURNO_TEMPLATES = [
    { key: 'tarjeta',    label: 'Tarjeta',    draw: turnoTarjeta,    pattern: 'cancha' },
    { key: 'hora',       label: 'Hora',       draw: turnoHora,       pattern: 'diagonales' },
    { key: 'pelota',     label: 'Pelota',     draw: turnoPelota,     pattern: 'circulos' },
    { key: 'cancha',     label: 'Cancha',     draw: turnoCancha,     pattern: 'liso' },
    { key: 'ticket',     label: 'Ticket',     draw: turnoTicket,     pattern: 'puntos' },
    { key: 'calendario', label: 'Calendario', draw: turnoCalendario, pattern: 'malla' }
  ];


  /* ------------------------------------------------------------------ *
   *  UI de paleta / fondo / galería
   * ------------------------------------------------------------------ */
  const DL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>';
  const WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#wa-glyph"/></svg>';

  function buildGallery(list, container, scope) {
    const what = scope === 'turno' ? 'recordatorio de turno' : 'flyer';
    list.forEach(tpl => {
      const fig = document.createElement('figure');
      fig.className = 'flyer';
      fig.dataset.template = tpl.key;
      fig.innerHTML =
        `<canvas width="${W}" height="${H}" role="img" aria-label="Modelo ${tpl.label} del ${what}"></canvas>` +
        '<div class="bar">' +
        `<span class="name">${tpl.label}</span>` +
        '<div class="actions">' +
        `<button type="button" class="fab" data-action="download" aria-label="Descargar ${what} ${tpl.label}">${DL_ICON}</button>` +
        `<button type="button" class="fab wa" data-action="share" aria-label="Compartir ${what} ${tpl.label} por WhatsApp">${WA_ICON}</button>` +
        '</div></div>';
      container.appendChild(fig);
    });
  }

  // Barra de tema / paleta / fondo. Cada pestaña monta la suya con su propio estado (st).
  function mountToolbar(root, id, st, storageKey, noun, onChange) {
    root.innerHTML =
      `<div class="tool"><span class="label" id="${id}-theme-label">Tema ${noun}</span>` +
      `<div class="segmented" role="group" aria-labelledby="${id}-theme-label">` +
      '<button type="button" data-opt-theme="dark" aria-pressed="true">Oscuro</button>' +
      '<button type="button" data-opt-theme="light" aria-pressed="false">Claro</button></div></div>' +
      `<div class="tool"><span class="label" id="${id}-palette-label">Paleta: <strong data-palette-name></strong></span>` +
      `<div class="palettes" role="group" aria-labelledby="${id}-palette-label"></div></div>` +
      `<div class="tool"><span class="label" id="${id}-pattern-label">Fondo</span>` +
      `<div class="patterns" role="group" aria-labelledby="${id}-pattern-label"></div></div>`;

    const pBox = $('.palettes', root);
    PALETTES.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.dataset.palette = p.id;
      b.title = p.name;
      b.setAttribute('aria-label', `Paleta ${p.name}`);
      b.style.setProperty('--c1', p.deep);
      b.style.setProperty('--c2', p.primary);
      b.style.setProperty('--c3', p.hi);
      pBox.appendChild(b);
    });

    const fBox = $('.patterns', root);
    PATTERNS.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pat';
      b.dataset.pattern = p.id;
      b.setAttribute('aria-label', p.id === 'auto' ? 'Fondo automático según el modelo' : `Fondo ${p.name}`);
      b.innerHTML = (p.id === 'auto'
        ? '<span class="thumb-auto">Auto</span>'
        : `<canvas width="108" height="135" data-pattern="${p.id}"></canvas>`) + `<span>${p.name}</span>`;
      fBox.appendChild(b);
    });

    function sync() {
      $$('[data-opt-theme]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.optTheme === st.theme)));
      $$('.swatch', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.palette === st.palette)));
      $$('.pat', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pattern === st.pattern)));
      $('[data-palette-name]', root).textContent = getPalette(st).name;
      const t = getTheme(st);
      $$('.pat canvas', root).forEach(c => {
        const ctx = c.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.scale(c.width / W, c.width / W);
        bgFill(ctx, t, c.dataset.pattern, 2.6);
      });
    }

    root.addEventListener('click', e => {
      const th = e.target.closest('[data-opt-theme]');
      const pa = e.target.closest('[data-palette]');
      const pt = e.target.closest('[data-pattern]');
      if (th) st.theme = th.dataset.optTheme;
      else if (pa) st.palette = pa.dataset.palette;
      else if (pt) st.pattern = pt.dataset.pattern;
      else return;
      saveOpts(st, storageKey);
      sync();
      onChange();
    });

    sync();
    return { sync };
  }

  function saveOpts(st, key) {
    try { localStorage.setItem(key, JSON.stringify({ theme: st.theme, palette: st.palette, pattern: st.pattern })); } catch (e) { /* sin storage */ }
  }
  function loadOpts(st, key) {
    try {
      const o = JSON.parse(localStorage.getItem(key));
      if (!o) return;
      if (o.theme === 'dark' || o.theme === 'light') st.theme = o.theme;
      if (PALETTES.some(p => p.id === o.palette)) st.palette = o.palette;
      if (PATTERNS.some(p => p.id === o.pattern)) st.pattern = o.pattern;
    } catch (e) { /* sin storage */ }
  }

  /* ------------------------------------------------------------------ *
   *  Perfil guardado en el navegador (complejo, logo y contactos)
   * ------------------------------------------------------------------ */
  const PROFILE_KEY = 'flyer-perfil';

  function saveProfile() {
    try {
      const contactos = [...contactsEl.children].map(r => ({
        nombre: r.querySelector('[name=cNombre]').value,
        tel: r.querySelector('[name=cTel]').value
      }));
      localStorage.setItem(PROFILE_KEY, JSON.stringify({
        complejo: form.elements.complejo.value,
        logo: state.logoData,
        contactos
      }));
    } catch (e) { /* sin storage o cuota llena: la app sigue funcionando */ }
  }

  function loadProfile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch (e) { /* ignorar */ }
    if (!p) return;
    if (typeof p.complejo === 'string') form.elements.complejo.value = p.complejo;
    if (Array.isArray(p.contactos) && p.contactos.length) {
      const list = p.contactos.slice(0, 3);
      while (contactsEl.children.length < list.length) addContact();
      list.forEach((c, i) => {
        const row = contactsEl.children[i];
        row.querySelector('[name=cNombre]').value = c.nombre || '';
        row.querySelector('[name=cTel]').value = c.tel || '';
      });
    }
    if (typeof p.logo === 'string' && p.logo.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => {
        state.logo = img;
        state.logoData = p.logo;
        logoPreview.src = p.logo;
        logoChip.hidden = false;
        render();
      };
      img.src = p.logo;
    }
  }

  // Reduce el logo para que ocupe poco en localStorage.
  function logoToDataURL(img) {
    try {
      const iw = img.naturalWidth || img.width || 300;
      const ih = img.naturalHeight || img.height || 300;
      const sc = Math.min(1, 512 / Math.max(iw, ih));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(iw * sc));
      c.height = Math.max(1, Math.round(ih * sc));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    } catch (e) {
      return null;
    }
  }

  function clearProfile() {
    try { localStorage.removeItem(PROFILE_KEY); } catch (e) { /* ignorar */ }
    form.elements.complejo.value = '';
    [...contactsEl.children].slice(1).forEach(r => r.remove());
    const first = contactsEl.children[0];
    first.querySelector('[name=cNombre]').value = '';
    first.querySelector('[name=cTel]').value = '';
    refreshContacts();
    state.logo = null;
    state.logoData = null;
    logoInput.value = '';
    logoChip.hidden = true;
    render();
    toast('Borramos los datos guardados de este navegador.');
  }

  /* ------------------------------------------------------------------ *
   *  Render
   * ------------------------------------------------------------------ */
  async function render() {
    await fontsReady;
    const { data, missing } = readData();

    if (missing.length) {
      missingEl.innerHTML = missing.map(m => `<li>${m}</li>`).join('');
      emptyEl.hidden = false;
      gallery.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    gallery.hidden = false;

    const theme = getTheme();
    for (const tpl of TEMPLATES) {
      const canvas = $(`.flyer[data-template="${tpl.key}"] canvas`);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      tpl.draw(ctx, data, theme, state.pattern === 'auto' ? tpl.pattern : state.pattern);
      state.blobs[tpl.key] = null;
      canvas.toBlob(b => { state.blobs[tpl.key] = b; }, 'image/png');
    }
  }

  let timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => { saveProfile(); render(); }, 120);
  }

  /* ------------------------------------------------------------------ *
   *  Recordatorio de turnos: lectura, datos guardados y render
   * ------------------------------------------------------------------ */
  const TURNO_PROFILE_KEY = 'turno-perfil';
  const JUGADORES = ['j1', 'j2', 'j3', 'j4'];

  function readTurno() {
    const v = n => tform.elements[n].value.trim();
    const data = {
      fecha: v('fecha'),
      hora: v('hora'),
      lugar: v('lugar'),
      cancha: v('cancha'),
      jugadores: JUGADORES.map(v).filter(Boolean)
    };
    const missing = [];
    if (!data.fecha) missing.push('Fecha del turno');
    if (!data.hora) missing.push('Hora del turno');
    if (!data.lugar) missing.push('Lugar');
    return { data, missing };
  }

  function saveTurnoProfile() {
    try {
      localStorage.setItem(TURNO_PROFILE_KEY, JSON.stringify({
        lugar: tform.elements.lugar.value,
        cancha: tform.elements.cancha.value,
        jugadores: JUGADORES.map(n => tform.elements[n].value)
      }));
    } catch (e) { /* sin storage */ }
  }

  function loadTurnoProfile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(TURNO_PROFILE_KEY)); } catch (e) { /* ignorar */ }
    if (!p) return;
    if (typeof p.lugar === 'string') tform.elements.lugar.value = p.lugar;
    if (typeof p.cancha === 'string') tform.elements.cancha.value = p.cancha;
    if (Array.isArray(p.jugadores)) {
      JUGADORES.forEach((n, i) => { if (typeof p.jugadores[i] === 'string') tform.elements[n].value = p.jugadores[i]; });
    }
  }

  function clearTurnoProfile() {
    try { localStorage.removeItem(TURNO_PROFILE_KEY); } catch (e) { /* ignorar */ }
    ['lugar', 'cancha', ...JUGADORES].forEach(n => { tform.elements[n].value = ''; });
    renderTurno();
    toast('Borramos los datos guardados de este navegador.');
  }

  async function renderTurno() {
    await fontsReady;
    const { data, missing } = readTurno();

    if (missing.length) {
      tMissingEl.innerHTML = missing.map(m => `<li>${m}</li>`).join('');
      tEmptyEl.hidden = false;
      tGallery.hidden = true;
      return;
    }
    tEmptyEl.hidden = true;
    tGallery.hidden = false;

    const theme = getTheme(tstate);
    for (const tpl of TURNO_TEMPLATES) {
      const canvas = $(`.flyer[data-template="${tpl.key}"] canvas`, tGallery);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      tpl.draw(ctx, data, theme, tstate.pattern === 'auto' ? tpl.pattern : tstate.pattern);
      tstate.blobs[tpl.key] = null;
      canvas.toBlob(b => { tstate.blobs[tpl.key] = b; }, 'image/png');
    }
  }

  let tTimer = null;
  function scheduleTurno() {
    clearTimeout(tTimer);
    tTimer = setTimeout(() => { saveTurnoProfile(); renderTurno(); }, 120);
  }

  /* ------------------------------------------------------------------ *
   *  Compartir / descargar
   * ------------------------------------------------------------------ */
  function slug(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const toBlob = canvas => new Promise(res => canvas.toBlob(res, 'image/png'));

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function getImage(scope, key) {
    const turno = scope === 'turno';
    const box = turno ? tGallery : gallery;
    const st = turno ? tstate : state;
    const canvas = $(`.flyer[data-template="${key}"] canvas`, box);
    const blob = st.blobs[key] || await toBlob(canvas);
    let name;
    if (turno) {
      name = `turno-padel-${key}-${readTurno().data.fecha || 'proximo'}.png`;
    } else {
      const { data } = readData();
      name = `flyer-${key}-${slug(data.categorias[0]) || 'torneo'}.png`;
    }
    return { blob, name };
  }

  async function shareImage(scope, key) {
    const { blob, name } = await getImage(scope, key);
    const file = new File([blob], name, { type: 'image/png' });

    // Móvil: selector nativo (WhatsApp incluido) con SOLO la imagen: sin texto ni título.
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Escritorio: descarga la imagen, la copia al portapapeles (si el navegador deja)
    // y abre WhatsApp Web sin texto, para pegarla (Ctrl+V) o adjuntarla en el chat.
    download(blob, name);
    let copiada = false;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copiada = true;
      }
    } catch (_) { /* sin permiso: queda la descarga */ }
    window.open('https://web.whatsapp.com/', '_blank', 'noopener');
    toast(copiada
      ? 'Descargamos la imagen y la copiamos: pegala en el chat de WhatsApp.'
      : 'Descargamos la imagen. Adjuntala en el chat de WhatsApp.');
  }

  async function downloadImage(scope, key) {
    const { blob, name } = await getImage(scope, key);
    download(blob, name);
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4200);
  }

  /* ------------------------------------------------------------------ *
   *  Tema de la app (compartido con el sitio de proyectos: clave "theme")
   * ------------------------------------------------------------------ */
  function initAppTheme() {
    const root = document.documentElement;
    const btn = $('#app-theme');
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
    } catch (e) { /* sin storage */ }
    const sync = () => { btn.textContent = root.getAttribute('data-theme') === 'dark' ? '🌙' : '☀️'; };
    sync();
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* sin storage */ }
      sync();
    });
  }

  /* ------------------------------------------------------------------ *
   *  Eventos
   * ------------------------------------------------------------------ */
  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  form.addEventListener('submit', e => e.preventDefault());

  form.elements.inscripcion.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  addContactBtn.addEventListener('click', () => { addContact(); schedule(); });
  addCategoriaBtn.addEventListener('click', () => { addCategoria(); schedule(); });

  logoInput.addEventListener('change', () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.logo = img;
      state.logoData = logoToDataURL(img);
      logoPreview.src = url;
      logoChip.hidden = false;
      saveProfile();
      render();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      logoInput.value = '';
      toast('No pudimos leer esa imagen. Probá con un PNG o JPG.');
    };
    img.src = url;
  });

  $('#logo-remove').addEventListener('click', () => {
    state.logo = null;
    state.logoData = null;
    logoInput.value = '';
    logoChip.hidden = true;
    saveProfile();
    render();
  });

  $('#clear-saved').addEventListener('click', clearProfile);

  tform.addEventListener('input', scheduleTurno);
  tform.addEventListener('change', scheduleTurno);
  tform.addEventListener('submit', e => e.preventDefault());
  $('#t-clear').addEventListener('click', clearTurnoProfile);

  function onGalleryClick(scope) {
    return e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const key = btn.closest('.flyer').dataset.template;
      if (btn.dataset.action === 'share') shareImage(scope, key);
      else downloadImage(scope, key);
    };
  }
  gallery.addEventListener('click', onGalleryClick('flyer'));
  tGallery.addEventListener('click', onGalleryClick('turno'));

  /* ------------------------------------------------------------------ *
   *  Pestañas y ayuda
   * ------------------------------------------------------------------ */
  const TABS = ['flyers', 'turnos'];

  function selectTab(id, focus) {
    TABS.forEach(k => {
      const on = k === id;
      const tab = $(`#tab-${k}`);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      $(`#panel-${k}`).hidden = !on;
    });
    try { localStorage.setItem('app-tab', id); } catch (e) { /* sin storage */ }
    // El link #turnos / #flyers abre esa pestaña directo (sirve para redirecciones y para compartir)
    if (window.location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    if (focus) $(`#tab-${id}`).focus();
  }

  // Header y pie son fijos: se miden para dejar el contenido libre (variables CSS --head-h y --foot-h)
  function initChrome() {
    const root = document.documentElement;
    const head = $('.app-head'), foot = $('.app-foot');
    const set = () => {
      root.style.setProperty('--head-h', head.offsetHeight + 'px');
      root.style.setProperty('--foot-h', foot.offsetHeight + 'px');
    };
    set();
    if (window.ResizeObserver) { const ro = new ResizeObserver(set); ro.observe(head); ro.observe(foot); }
    window.addEventListener('resize', set);
  }

  function initTabs() {
    let saved = null;
    try { saved = localStorage.getItem('app-tab'); } catch (e) { /* sin storage */ }
    const fromLink = window.location.hash.slice(1);
    selectTab(TABS.includes(fromLink) ? fromLink : TABS.includes(saved) ? saved : 'flyers');
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.slice(1);
      if (TABS.includes(h)) selectTab(h);
    });
    const bar = $('.tabs');
    bar.addEventListener('click', e => {
      const b = e.target.closest('[role=tab]');
      if (b) selectTab(b.dataset.tab);
    });
    bar.addEventListener('keydown', e => {
      const i = TABS.indexOf(document.activeElement && document.activeElement.dataset.tab);
      if (i < 0) return;
      let n = -1;
      if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
      else if (e.key === 'ArrowLeft') n = (i + TABS.length - 1) % TABS.length;
      else if (e.key === 'Home') n = 0;
      else if (e.key === 'End') n = TABS.length - 1;
      if (n < 0) return;
      e.preventDefault();
      selectTab(TABS[n], true);
    });
  }

  function initHelp() {
    const dlg = $('#help');
    $('#help-btn').addEventListener('click', () => {
      const current = $('.tabs [aria-selected=true]');
      const active = current ? current.dataset.tab : 'flyers';
      $$('#help details[data-help]').forEach(d => { d.open = d.dataset.help === active; });
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    });
    $('#help-close').addEventListener('click', () => dlg.close());
    // Un clic en el fondo oscuro (fuera de la caja) cierra la ayuda
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  }

  /* ------------------------------------------------------------------ *
   *  Versión y aviso de actualización
   *  version.js (cargado antes que este archivo) define la versión que está corriendo;
   *  version.json es la que está publicada. Si el build es distinto, se avisa.
   * ------------------------------------------------------------------ */
  const APP = window.APP_INFO || { version: '0.0.0', build: 'dev', fecha: '' };
  const REVISAR_CADA_MS = 5 * 60 * 1000;
  let avisoEl = null;
  let versionCerrada = null; // "Más tarde" oculta el cartel hasta que salga otra versión

  function showVersion() {
    const el = $('#app-version');
    if (!el) return;
    el.textContent = `v${APP.version}`;
    if (APP.fecha) {
      const f = new Date(APP.fecha).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
      });
      el.title = `Build ${APP.build} · ${f}`;
    } else {
      el.title = `Build ${APP.build}`;
    }
  }

  // version.json publicado (sin caché). null si no se pudo leer (sin conexión, local, etc.)
  async function versionPublicada() {
    try {
      const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return null;
      const v = await r.json();
      return v && v.build ? { version: String(v.version || ''), build: String(v.build) } : null;
    } catch (_) {
      return null;
    }
  }

  // Recarga trayendo la versión nueva: ?v=<build> saltea la caché del index.html
  // (GitHub Pages lo cachea unos minutos).
  function recargar(build) {
    const url = new URL(window.location.href);
    url.searchParams.set('v', build || String(Date.now()));
    window.location.replace(url.toString());
  }

  function mostrarAviso(nueva) {
    if (avisoEl) avisoEl.remove();
    avisoEl = document.createElement('div');
    avisoEl.className = 'update-banner';
    avisoEl.setAttribute('role', 'status');
    avisoEl.setAttribute('aria-live', 'polite');

    const msg = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `Hay una versión nueva${nueva.version ? ` (v${nueva.version})` : ''}.`;
    msg.append(strong, ' Actualizá para ver los últimos cambios. Los datos que no se guardan solos (categorías, fechas, premio) se pierden.');

    const ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'btn primary';
    ok.textContent = 'Actualizar';
    ok.addEventListener('click', () => recargar(nueva.build));

    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'update-close';
    later.setAttribute('aria-label', 'Más tarde');
    later.title = 'Más tarde';
    later.textContent = '✕';
    later.addEventListener('click', () => {
      versionCerrada = nueva.build;
      avisoEl.remove();
      avisoEl = null;
    });

    avisoEl.append(msg, ok, later);
    document.body.appendChild(avisoEl);
  }

  async function revisarVersion() {
    if (document.visibilityState !== 'visible') return;
    const v = await versionPublicada();
    if (!v || v.build === APP.build || v.build === versionCerrada) return;
    mostrarAviso(v);
  }

  function initVersion() {
    showVersion();
    revisarVersion();
    setInterval(revisarVersion, REVISAR_CADA_MS);
    document.addEventListener('visibilitychange', revisarVersion);
    window.addEventListener('online', revisarVersion);
  }

  /* ------------------------------------------------------------------ *
   *  Init
   * ------------------------------------------------------------------ */
  initChrome();
  initAppTheme();
  initVersion();
  initTabs();
  initHelp();

  loadOpts(state, 'flyer-opts');
  buildGallery(TEMPLATES, gallery, 'flyer');
  mountToolbar($('#flyer-toolbar'), 'fl', state, 'flyer-opts', 'del flyer', render);
  addCategoria();
  addContact();
  loadProfile();
  render();

  loadOpts(tstate, 'turno-opts');
  buildGallery(TURNO_TEMPLATES, tGallery, 'turno');
  mountToolbar($('#t-toolbar'), 'tu', tstate, 'turno-opts', 'de la imagen', renderTurno);
  const fechaEl = tform.elements.fecha;
  fechaEl.min = todayISO();
  fechaEl.value = todayISO();
  loadTurnoProfile();
  renderTurno();
})();
