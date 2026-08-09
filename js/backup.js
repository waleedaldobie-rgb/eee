async function backupDB(){
  try{
    const data={
      customers:await getAll('customers'),
      orders:await getAll('orders'),
      fabrics:await getAll('fabrics'),
      accessories:await getAll('accessories'),
      users:await getAll('users'),
      notifications:await getAll('notifications'),
      dressTypes:await getAll('dressTypes'),
      colors:await getAll('colors'),
      backupDate:new Date().toISOString(),
      version:2
    };
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='tailor_pro_backup_'+new Date().toISOString().split('T')[0]+'.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير النسخة الاحتياطية');
  } catch(e){
    showToast('فشل التصدير','error');
  }
}
async function restoreDB(input){
  const file=input.files[0];
  if(!file) return;
  const text=await file.text();
  try{
    const data=JSON.parse(text);
    if(!data.customers||!data.orders){ showToast('ملف غير صالح','error'); return; }
    if(!confirm('سيتم استبدال جميع البيانات الحالية بالنسخة المستعادة. هل أنت متأكد؟')) return;
    const stores=['customers','orders','fabrics','accessories','users','notifications','dressTypes','colors'];
    for(const store of stores){
      const tx=db.transaction(store,'readwrite');
      const st=tx.objectStore(store);
      await new Promise((res,rej)=>{const req=st.clear();req.onsuccess=res;req.onerror=rej;});
      if(data[store] && Array.isArray(data[store])){
        for(const item of data[store]){
          await new Promise((res,rej)=>{const req=st.add(item);req.onsuccess=res;req.onerror=rej;});
        }
      }
    }
    showToast('تم استعادة البيانات بنجاح');
    renderDashboard();renderCustomers();renderOrders();renderInventory();renderReports();renderEmployees();
  } catch(e){
    console.error(e);
    showToast('خطأ في قراءة الملف','error');
  }
  input.value='';
}
function showNotifications(){
  const el = document.getElementById('recentNotifications');
  if(el){
    showPage('dashboard');
    el.scrollIntoView({behavior:'smooth', block:'center'});
    showToast('الإشعارات الحديثة — لوحة التحكم','info');
  } else {
    showToast('لا توجد إشعارات جديدة','info');
  }
}
