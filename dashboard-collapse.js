document.addEventListener('DOMContentLoaded', function () {
  const root = document.getElementById('dashboardView');
  if (!root) return;

  root.querySelectorAll('.panel').forEach(function (panel) {
    const head = panel.querySelector(':scope > .section-head, :scope > .panel-header');
    if (!head || panel.querySelector(':scope > .mek-collapse-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mek-collapse-btn';
    btn.title = '접기 / 펼치기';
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = '<span aria-hidden="true">⌄</span>';
    head.appendChild(btn);

    btn.addEventListener('click', function () {
      const collapsed = panel.classList.toggle('mek-collapsed');
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });
  });
});
