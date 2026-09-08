document.addEventListener('DOMContentLoaded', function () {
  const style = document.createElement('style');
  style.textContent = `
    #dashboardView .panel{position:relative}
    #dashboardView .panel.mek-collapsed > :not(.section-head):not(.panel-header):not(.mek-collapse-toggle){display:none!important}
    #dashboardView .panel.mek-collapsed{padding-bottom:17px!important}
  `;
  document.head.appendChild(style);

  const root = document.getElementById('dashboardView');
  if (!root) return;

  root.querySelectorAll('.panel').forEach(function (panel, index) {
    const head = panel.querySelector(':scope > .section-head, :scope > .panel-header');
    if (!head || panel.dataset.mekCollapseReady === '1') return;
    panel.dataset.mekCollapseReady = '1';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mek-collapse-toggle';
    btn.title = '영역 접기';
    btn.setAttribute('aria-expanded', 'true');
    btn.innerHTML = '<span class="mek-toggle-symbol" aria-hidden="true">−</span><span class="mek-toggle-label">접기</span>';
    head.insertAdjacentElement('afterend', btn);

    const storageKey = 'mek-dashboard-collapse:' + (head.querySelector('h2')?.textContent.trim() || index);
    const saved = sessionStorage.getItem(storageKey) === '1';
    if (saved) setCollapsed(true);

    btn.addEventListener('click', function () {
      setCollapsed(!panel.classList.contains('mek-collapsed'));
    });

    function setCollapsed(collapsed) {
      panel.classList.toggle('mek-collapsed', collapsed);
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.title = collapsed ? '영역 펼치기' : '영역 접기';
      btn.querySelector('.mek-toggle-symbol').textContent = collapsed ? '+' : '−';
      btn.querySelector('.mek-toggle-label').textContent = collapsed ? '펼치기' : '접기';
      sessionStorage.setItem(storageKey, collapsed ? '1' : '0');
    }
  });
});
