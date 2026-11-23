/* La Traction – formulaires : validation puis préparation d'un e-mail.
   Aucun serveur : le visiteur envoie sa demande depuis sa messagerie.
   Pour brancher un vrai service (Formspree, Netlify Forms…), remplacer le bloc "mailto" ci-dessous. */
(function () {
  'use strict';
  [].forEach.call(document.querySelectorAll('form[data-mail]'), function (form) {
    var to = form.getAttribute('data-mail'),
        subject = form.getAttribute('data-subject') || 'Message depuis le site',
        sent = document.getElementById(form.getAttribute('data-sent'));

    function validField(f) {
      var el = f.querySelector('input,select,textarea'), ok = true;
      if (!el) return true;
      if (el.type === 'radio') {
        ok = !!form.querySelector('input[name="' + el.name + '"]:checked');
      } else if (el.required) {
        ok = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
      }
      f.classList.toggle('bad', !ok);
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = [].slice.call(form.querySelectorAll('.field')), allOk = true, first = null;
      fields.forEach(function (f) { if (!validField(f)) { allOk = false; first = first || f; } });
      if (!allOk) { first.querySelector('input,select,textarea').focus(); return; }

      var lines = [];
      fields.forEach(function (f) {
        var el = f.querySelector('input,select,textarea'); if (!el) return;
        var label = (f.querySelector('label,legend') || {}).textContent || el.name, val;
        if (el.type === 'radio') { var c = form.querySelector('input[name="' + el.name + '"]:checked'); val = c ? c.parentNode.textContent.trim() : ''; }
        else val = el.value.trim();
        if (val && !(el.type === 'radio' && f.querySelector('input[name="' + el.name + '"]') !== el)) lines.push(label.trim() + ' : ' + val);
      });
      var body = lines.join('\n');
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (sent) {
        sent.querySelector('pre').textContent = body;
        sent.querySelector('a').setAttribute('href', href);
        sent.querySelector('.addr').textContent = to;
        sent.classList.add('on'); form.style.display = 'none';
        sent.setAttribute('tabindex', '-1'); sent.focus();
      } else { window.location.href = href; }
    });

    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field'); if (f && f.classList.contains('bad')) validField(f);
    });
  });
})();
