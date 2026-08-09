// app.js — تهيئة النظام
document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    await openDB();
    await seedDemoData();
    renderDashboard();
    renderCustomers();
    renderOrders();
    renderInventory();
    renderReports();
    renderEmployees();
    console.log('TailorPro initialized');
  } catch(e){
    console.error('DB init failed', e);
    showToast('خطأ في تهيئة قاعدة البيانات','error');
  }
});

// Handle modal backdrop click to close
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')){
    e.target.classList.remove('active');
    document.body.style.overflow='';
  }
});
