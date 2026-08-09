function showPage(pageId){
  // hide measurements workspace when switching
  const ws = document.getElementById('measurementsWorkspace');
  if(ws) ws.classList.add('hidden');
  const layout = document.getElementById('customersLayout');
  if(layout) layout.classList.remove('hidden');

  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if(target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const nav = document.getElementById('nav-'+pageId);
  if(nav) nav.classList.add('active');

  const titles={
    dashboard:'لوحة التحكم',
    customers:'العملاء والمقاسات',
    orders:'الطلبات والفواتير',
    inventory:'المخزون',
    reports:'التقارير والأرباح'
  };
  const subtitles={
    dashboard:'نظرة شاملة على أداء المحل',
    customers:'إدارة بيانات العملاء وقياساتهم الجديدة',
    orders:'متابعة طلبات التفصيل وإدارة المدفوعات',
    inventory:'تتبع كميات الأقمشة وأنواع الثياب والألوان',
    reports:'تحليل أداء المحل والمبيعات والأرباح'
  };
  const titleEl = document.getElementById('page-title');
  if(titleEl) titleEl.textContent = titles[pageId] || pageId;
  const subEl = document.getElementById('page-subtitle');
  if(subEl) subEl.textContent = subtitles[pageId] || '';

  // render
  if(pageId==='dashboard') renderDashboard();
  if(pageId==='customers') renderCustomers();
  if(pageId==='orders') renderOrders();
  if(pageId==='inventory') renderInventory();
  if(pageId==='reports') renderReports();

  // close any dropdown/modal
  const dd = document.getElementById('actionDropdown');
  if(dd) dd.classList.add('hidden');
  window.scrollTo({top:0, behavior:'smooth'});
}
