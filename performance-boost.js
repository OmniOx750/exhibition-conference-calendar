/* MEKICS exhibition frontend performance boost */
(() => {
  if (typeof renderAll !== 'function' || typeof switchView !== 'function') return;

  function renderActiveView() {
    const id = document.querySelector('.view.active')?.id || 'dashboardView';
    if (id === 'dashboardView') renderDashboard();
    else if (id === 'eventsView') renderEvents();
    else if (id === 'followupView') renderLeads();
    else if (id === 'insightView') renderInsightSelection();
  }

  renderAll = function () {
    populateEventSelects();
    renderActiveView();
  };

  const baseSwitchView = switchView;
  switchView = function (id) {
    baseSwitchView(id);
    renderActiveView();
  };

  document.documentElement.classList.add('mek-performance-mode');
})();
