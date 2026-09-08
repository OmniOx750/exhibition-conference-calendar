document.addEventListener('DOMContentLoaded', function () {
  const style = document.createElement('style');
  style.textContent = `
    #dashboardView .panel{position:relative}
    #dashboardView .panel.mek-collapsed > :not(.section-head):not(.panel-header){display:none!important}
    #dashboardView .panel.mek-collapsed{padding-bottom:17px!important}
    .mek-collapse-btn{flex:0 0 auto;width:31px;height:31px;padding:0;border:1px solid rgba(63,85,120,.10);border-radius:10px;background:rgba(255,255,255,.72);color:#7d8698;display:grid;place-items:center;box-shadow:0 5px 14px rgba(46,55,87,.05);transition:.18s ease}
    .mek-collapse-btn:hover{background:#fff;color:#3973f6;transform:translateY(-1px)}
    .mek-collapse-btn span{display:block;font-size:18px;line-height:1;transform:translateY(-2px);transition:transform .18s ease}
    .mek-collapsed .mek-collapse-btn span{transform:rotate(-90deg) translateX(1px)}
  `;
  document.head.appendChild(style);

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
