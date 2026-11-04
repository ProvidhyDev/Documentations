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
  function initMermaid() {
    var nodes = Array.prototype.slice.call(doc.querySelectorAll('pre.mermaid-src'));
    if (!nodes.length) return;
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      nodes.forEach(function (n) {
        var d = doc.createElement('div');
        d.className = 'mermaid';
        d.textContent = n.textContent;
        n.parentElement.replaceWith(d);
      });
      window.mermaid.run({ querySelector: '.mermaid' }).catch(function (e) { console.error('mermaid render error', e); });
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