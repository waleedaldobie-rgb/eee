// app.js — تهيئة النظام
document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    await openDB();
    await seedDemoData();
    // تنظيف فوري للأسماء القديمة في حال كانت موجودة (للمستخدمين الحاليين)
    try{ await cleanupLegacyNames(); } catch(e){ console.warn('cleanup failed', e); }
    renderDashboard();
    renderCustomers();
    renderOrders();
    renderInventory();
    renderReports();
    console.log('TailorPro initialized');
  } catch(e){
    console.error('DB init failed', e);
    showToast('خطأ في تهيئة قاعدة البيانات','error');
  }
});

async function cleanupLegacyNames(){
  const customers=await getAll('customers');
  for(const c of customers){
    let changed=false;
    if(c.name && c.name.includes('علي بن مسعد')){ c.name='عميل تجريبي 1'; changed=true; }
    if(c.name && c.name.includes('علي الصيادي')){ c.name=c.name.replace('علي الصيادي','المدير العام'); changed=true; }
    if(changed) await putData('customers', c);
  }
  const users=await getAll('users');
  for(const u of users){
    if(u.name && u.name.includes('علي الصيادي')){ u.name='المدير العام'; await putData('users', u); }
  }
  const orders=await getAll('orders');
  for(const o of orders){
    if(o.customerName && o.customerName.includes('علي بن مسعد')){ o.customerName='عميل تجريبي 1'; await putData('orders', o); }
  }
  const notifs=await getAll('notifications');
  for(const n of notifs){
    if(n.message && n.message.includes('علي بن مسعد')){ n.message=n.message.replace('علي بن مسعد','عميل تجريبي 1'); await putData('notifications', n); }
  }
}

// Handle modal backdrop click to close
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')){
    e.target.classList.remove('active');
    document.body.style.overflow='';
  }
});
