function setReportPeriod(p){
  reportPeriod=p;
  document.querySelectorAll('#reports .tab-btn').forEach(b=>b.classList.remove('active'));
  const el = document.getElementById('rep-'+p);
  if(el) el.classList.add('active');
  renderReports();
}
async function renderReports(){
  const orders=await getAll('orders');
  const fabrics=await getAll('fabrics');
  const now=new Date();
  let filtered=orders;
  if(reportPeriod==='today'){const t=now.toISOString().split('T')[0];filtered=orders.filter(o=>o.orderDate===t);}
  else if(reportPeriod==='week'){const weekAgo=new Date(now-7*86400000).toISOString().split('T')[0];filtered=orders.filter(o=>o.orderDate>=weekAgo);}
  else if(reportPeriod==='month'){const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];filtered=orders.filter(o=>o.orderDate>=monthStart);}
  else if(reportPeriod==='year'){const yearStart=new Date(now.getFullYear(),0,1).toISOString().split('T')[0];filtered=orders.filter(o=>o.orderDate>=yearStart);}
  const delivered=filtered.filter(o=>o.status==='delivered');
  const revenue=delivered.reduce((s,o)=>s+(parseFloat(o.total)||0),0);
  const costs=delivered.reduce((s,o)=>{const f=fabrics.find(x=>x.id===o.fabricId);return s+(f?parseFloat(f.buyPrice)*3:0);},0);
  const profit=revenue-costs;
  const avg=delivered.length?revenue/delivered.length:0;
  const el1=document.getElementById('repTotalOrders'); if(el1) el1.textContent=filtered.length;
  const el2=document.getElementById('repRevenue'); if(el2) el2.textContent=formatMoney(revenue)+' ر.ي';
  const el3=document.getElementById('repCosts'); if(el3) el3.textContent=formatMoney(costs)+' ر.ي';
  const el4=document.getElementById('repProfit'); if(el4) el4.textContent=formatMoney(profit)+' ر.ي';
  const el5=document.getElementById('repAvg'); if(el5) el5.textContent=formatMoney(Math.round(avg))+' ر.ي';
  const fabricUsage={};
  delivered.forEach(o=>{
    const key=(o.fabricName||'غير محدد')+'__'+(o.color||'');
    if(!fabricUsage[key]) fabricUsage[key]={name:o.fabricName||'غير محدد',color:o.color||'—',count:0,total:0};
    fabricUsage[key].count++; fabricUsage[key].total+=(parseFloat(o.total)||0);
  });
  const sorted=Object.values(fabricUsage).sort((a,b)=>b.count-a.count);
  const topEl=document.getElementById('topFabrics');
  if(topEl){
    topEl.innerHTML=sorted.length?`
      <div class="overflow-x-auto rounded-xl border border-slate-100">
        <table><thead><tr><th>#</th><th>القماش</th><th>اللون</th><th>عدد الطلبات</th><th>إجمالي المبيعات</th></tr></thead>
        <tbody>${sorted.map((f,i)=>`<tr>
          <td class="text-slate-400 font-bold">${i+1}</td>
          <td class="font-bold text-slate-800">${f.name}</td>
          <td><span class="color-dot" style="background:${getColorHex(f.color)}"></span>${f.color}</td>
          <td><span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">${f.count} طلب</span></td>
          <td class="font-bold text-slate-800">${formatMoney(f.total)} <span class="text-xs text-slate-400 font-normal">ر.ي</span></td>
        </tr>`).join('')}</tbody></table>
      </div>
    `:'<div class="empty-state"><i class="fas fa-chart-pie"></i><p>لا توجد بيانات كافية</p></div>';
  }
}
async function exportReportPDF(){
  try{
    const{jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'l',unit:'mm',format:'a4'});
    doc.setFontSize(18);doc.text('تقرير الخياط برو',140,20,{align:'center'});
    doc.setFontSize(11);
    const orders=await getAll('orders');
    const revenue=orders.filter(o=>o.status==='delivered').reduce((s,o)=>s+(parseFloat(o.total)||0),0);
    doc.text('إجمالي الإيرادات: '+formatMoney(revenue)+' ر.ي',20,40);
    doc.text('إجمالي الطلبات: '+orders.length,20,48);
    doc.text('التاريخ: '+new Date().toLocaleDateString('ar-SA'),20,56);
    doc.save('report_'+new Date().toISOString().split('T')[0]+'.pdf');
    showToast('تم تصدير التقرير');
  } catch(e){
    showToast('تعذر تصدير PDF','error');
  }
}
