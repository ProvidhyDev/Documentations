(function () {
  var doc = document;
  var saved = null;
  try { saved = localStorage.getItem('mm-theme'); } catch (e) {}
  function applyTheme(t) { doc.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('mm-theme', t); } catch (e) {} }
  applyTheme(saved === 'dark' ? 'dark' : 'light');
  var themeBtn = doc.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = doc.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(cur);
  });
  var burger = doc.getElementById('burger');
  var sb = doc.getElementById('sidebar');
  var scrim = doc.getElementById('scrim');
  function closeSb() { sb.classList.remove('open'); scrim.classList.remove('open'); }
  if (burger) burger.addEventListener('click', function () { sb.classList.toggle('open'); scrim.classList.toggle('open'); });
  if (scrim) scrim.addEventListener('click', closeSb);
  var ss = doc.getElementById('sbSearch');
  if (ss) ss.addEventListener('input', function () {
    var q = ss.value.trim().toLowerCase();
    doc.querySelectorAll('#sidebar .sb-group').forEach(function (g) {
      var any = false;
      g.querySelectorAll('.sb-item').forEach(function (el) {
        var hit = !q || el.textContent.toLowerCase().indexOf(q) !== -1;
        el.classList.toggle('hide', !hit);
        if (hit) any = true;
      });
      g.classList.toggle('hide', !any);
    });
  });
  doc.querySelectorAll('#sidebar a').forEach(function (a) { a.addEventListener('click', closeSb); });

  /* ---------------- diagrams: PNG export + click-to-enlarge modal ---------------- */
  var pageSlug = (location.pathname.split('/').pop() || 'page').replace(/\.html?$/, '');

  function diagramDims(svg) {
    var vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width && vb.height) return { w: vb.width, h: vb.height, hasVb: true };
    return { w: svg.clientWidth || 800, h: svg.clientHeight || 400, hasVb: false };
  }

  function exportPng(svg, name) {
    if (!svg) return;
    var d = diagramDims(svg);
    var clone = svg.cloneNode(true);
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', d.w);
    clone.setAttribute('height', d.h);
    var scale = Math.max(2, Math.ceil(1600 / d.w));
    var xml = new XMLSerializer().serializeToString(clone);
    var url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    var img = new Image();
    img.onload = function () {
      var c = doc.createElement('canvas');
      c.width = Math.round(d.w * scale);
      c.height = Math.round(d.h * scale);
      var ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) {
        if (!b) return;
        var a = doc.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = name + '.png';
        doc.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      }, 'image/png');
    };
    img.onerror = function () { URL.revokeObjectURL(url); console.error('PNG export failed for', name); };
    img.src = url;
  }

  var modal = null, modalZoom = 1, modalSvgOrig = null, modalName = 'diagram';
  function buildModal() {
    if (modal) return;
    modal = doc.createElement('div');
    modal.id = 'mmModal';
    modal.hidden = true;
    var p = [];
    p.push('<div class="mm-backdrop"></div>');
    p.push('<div class="mm-box" role="dialog" aria-modal="true">');
    p.push('<div class="mm-head"><span class="mm-title"></span><span class="mm-ctrls">');
    p.push('<button type="button" class="btn mm-btn" id="mmFit" title="Fit to width">Fit</button>');
    p.push('<button type="button" class="btn mm-btn" id="mmOut" title="Zoom out">&#8722;</button>');
    p.push('<button type="button" class="btn mm-btn" id="mmIn" title="Zoom in">+</button>');
    p.push('<button type="button" class="btn mm-btn" id="mmPng" title="Download as PNG">PNG</button>');
    p.push('<button type="button" class="btn icon mm-btn" id="mmClose" title="Close">&#10005;</button>');
    p.push('</span></div>');
    p.push('<div class="mm-body"></div>');
    p.push('</div>');
    modal.innerHTML = p.join('');
    doc.body.appendChild(modal);
    modal.querySelector('.mm-backdrop').addEventListener('click', closeModal);
    modal.querySelector('#mmClose').addEventListener('click', closeModal);
    modal.querySelector('#mmIn').addEventListener('click', function () { setZoom(modalZoom * 1.25); });
    modal.querySelector('#mmOut').addEventListener('click', function () { setZoom(modalZoom / 1.25); });
    modal.querySelector('#mmFit').addEventListener('click', function () { setZoom(fitZoom()); });
    modal.querySelector('#mmPng').addEventListener('click', function () { exportPng(modalSvgOrig, modalName); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }
  function setZoom(z) {
    if (!modal) return;
    modalZoom = Math.min(5, Math.max(0.3, z));
    var svg = modal.querySelector('.mm-body svg');
    if (svg) {
      var d = diagramDims(svg);
      if (d.hasVb) svg.style.width = Math.round(d.w * modalZoom) + 'px';
    }
  }
  function fitZoom() {
    var body = modal.querySelector('.mm-body');
    var svg = body ? body.querySelector('svg') : null;
    if (!svg) return 1;
    var d = diagramDims(svg);
    if (!d.hasVb) return 1;
    return Math.min(2.5, Math.max(0.3, (body.clientWidth - 24) / d.w));
  }
  function openModal(svg, title, name) {
    buildModal();
    modalSvgOrig = svg;
    modalName = name;
    modal.querySelector('.mm-title').textContent = title;
    var body = modal.querySelector('.mm-body');
    body.innerHTML = '';
    var clone = svg.cloneNode(true);
    clone.removeAttribute('style');
    clone.removeAttribute('class');
    clone.classList.add('mm-svg');
    body.appendChild(clone);
    modal.hidden = false;
    doc.body.style.overflow = 'hidden';
    setZoom(fitZoom());
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    doc.body.style.overflow = '';
  }

  function enhanceDiagrams() {
    var list = Array.prototype.slice.call(doc.querySelectorAll('div.mermaid'));
    list.forEach(function (div, i) {
      var svg = div.querySelector('svg');
      if (!svg) return;
      var wrap = div.closest('.diagram') || div;
      var sec = wrap.closest('section.sec');
      var secTitle = sec ? sec.getAttribute('data-title') : '';
      var title = (secTitle ? secTitle + ' - ' : '') + 'Figure ' + (i + 1);
      var name = pageSlug + '-fig' + (i + 1);
      if (!wrap.querySelector('.diagram-png')) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'diagram-png';
        btn.title = 'Download this diagram as PNG';
        btn.textContent = 'PNG';
        btn.addEventListener('click', function (e) { e.stopPropagation(); exportPng(svg, name); });
        wrap.appendChild(btn);
      }
      wrap.classList.add('zoomable');
      if (!wrap.getAttribute('data-mm-bound')) {
        wrap.setAttribute('data-mm-bound', '1');
        wrap.addEventListener('click', function () { openModal(svg, title, name); });
      }
    });
  }

  function initMermaid() {
    var nodes = Array.prototype.slice.call(doc.querySelectorAll('pre.mermaid-src'));
    if (!nodes.length) return;
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      nodes.forEach(function (n) {
        var d = doc.createElement('div');
        d.className = 'mermaid';
        d.textContent = n.textContent;
        n.replaceWith(d);
      });
      window.mermaid.run({ querySelector: '.mermaid' }).then(function () {
        setTimeout(enhanceDiagrams, 50);
      }).catch(function (e) { console.error('mermaid render error', e); });
    } else {
      nodes.forEach(function (n) { n.classList.add('src-fallback'); });
    }
  }
  window.addEventListener('load', function () { setTimeout(initMermaid, 250); });

  var tocLinks = Array.prototype.slice.call(doc.querySelectorAll('#toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          var a = byId[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var el = doc.getElementById(id); if (el) io.observe(el); });
  }
  var eb = doc.getElementById('exportBtn');
  if (eb) {
    var bar = doc.getElementById('exportbar');
    var cnt = doc.getElementById('exportCount');
    var boxes = Array.prototype.slice.call(doc.querySelectorAll('#main .sec input'));
    function refresh() {
      var n = boxes.length;
      var sel = boxes.filter(function (b) { return b.checked; }).length;
      cnt.textContent = sel + ' of ' + n + ' sections selected' + (sel === 0 ? ' (none = whole page)' : '');
    }
    eb.addEventListener('click', function () { doc.body.classList.add('export-mode'); bar.hidden = false; refresh(); });
    doc.getElementById('exportClose').addEventListener('click', function () { doc.body.classList.remove('export-mode'); bar.hidden = true; });
    doc.getElementById('selAll').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = true; }); refresh(); });
    doc.getElementById('selNone').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); refresh(); });
    boxes.forEach(function (b) { b.addEventListener('change', refresh); });
    doc.getElementById('exportGo').addEventListener('click', function () {
      var secs = Array.prototype.slice.call(doc.querySelectorAll('#main .sec'));
      var anySel = boxes.some(function (b) { return b.checked; });
      secs.forEach(function (s) { s.classList.remove('pdf-hide'); });
      if (anySel) secs.forEach(function (s) { var b = s.querySelector('input'); if (b && !b.checked) s.classList.add('pdf-hide'); });
      setTimeout(function () { window.print(); }, 60);
    });
    window.addEventListener('afterprint', function () {
      doc.querySelectorAll('#main .sec.pdf-hide').forEach(function (s) { s.classList.remove('pdf-hide'); });
    });
  }
})();
