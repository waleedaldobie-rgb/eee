async function renderCustomers(){
  const customers = await getAll('customers');
  const search = (document.getElementById('customerSearch')?.value || '').toLowerCase().trim();
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search) || 
    (c.phone||'').includes(search)
  );
  const countBadge = document.getElementById('customersCountBadge');
  if(countBadge) countBadge.textContent = filtered.length;

  const listEl = document.getElementById('customersList');
  if(!listEl) return;

  if(filtered.length===0){
    listEl.innerHTML = `<div class="empty-state" style="padding:30px 10px"><i class="fas fa-search" style="font-size:32px"></i><p style="font-size:.9rem">لا توجد نتائج</p><span class="text-xs text-slate-400">${search? 'جرب كلمة أخرى' : 'أضف عميلاً جديداً'}</span></div>`;
  } else {
    listEl.innerHTML = filtered.map(c=>{
      const initial = (c.name||'?').trim().charAt(0);
      const isSelected = c.id===selectedCustomerId;
      const hasMeasurements = c.measurements && hasAnyMeasurement(c.measurements);
      return `<div class="customer-card card p-3.5 ${isSelected?'selected':''}" onclick="selectCustomer(${c.id})">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 ${isSelected?'bg-blue-600 text-white':'bg-slate-100 text-slate-600'} rounded-xl flex items-center justify-center text-[15px] font-black shadow-sm flex-shrink-0">${initial}</div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-[13px] text-slate-800 truncate">${c.name}</h4>
            <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate"><i class="fas fa-phone text-[10px]"></i>${c.phone||'—'}</p>
          </div>
          ${hasMeasurements?'<span class="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" title="يوجد قياسات"></span>':'<span class="w-2 h-2 bg-slate-200 rounded-full flex-shrink-0" title="بدون قياسات"></span>'}
        </div>
      </div>`;
    }).join('');
  }
  if(selectedCustomerId){
    const c = customers.find(x=>x.id===selectedCustomerId);
    if(c) renderCustomerDetail(c);
  }
}

async function selectCustomer(id){
  selectedCustomerId=id;
  await renderCustomers();
  // scroll detail into view on mobile
}

async function renderCustomerDetail(c){
  const orders = await getAll('orders');
  const custOrders = orders.filter(o=>o.customerId===c.id);
  const totalDebt = custOrders.reduce((s,o)=>s+(parseFloat(o.remaining)||0),0);
  const m = c.measurements || null;
  const summaryHtml = renderMeasurementsSummary(m);

  const detailEl = document.getElementById('customerDetail');
  if(!detailEl) return;

  detailEl.innerHTML = `
    <div class="flex justify-between items-start gap-4 mb-5 flex-wrap">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200 flex-shrink-0">${(c.name||'?').charAt(0)}</div>
        <div>
          <h3 class="text-xl font-black text-slate-900">${c.name}</h3>
          <p class="text-slate-500 mt-1 text-sm flex items-center gap-2 flex-wrap">
            <span><i class="fas fa-phone ml-1 text-slate-400"></i>${c.phone}</span>
            <span class="text-slate-200">|</span>
            <span><i class="fab fa-whatsapp text-emerald-500 ml-1"></i>واتساب</span>
            <span class="text-slate-200">|</span>
            <span class="text-xs text-slate-400">منذ ${formatDate(c.createdAt)}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        ${totalDebt>0?`<div class="px-3 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-sm border border-red-100"><i class="fas fa-circle-exclamation ml-1"></i>مديون: ${formatMoney(totalDebt)} ر.ي</div>`:''}
        <button onclick="openMeasurementsWorkspace(${c.id})" class="btn-primary"><i class="fas fa-ruler-combined"></i> ${m && hasAnyMeasurement(m) ? 'تعديل القياسات' : 'فتح القياسات'}</button>
        <button onclick="editCustomer(${c.id})" class="btn-secondary" title="تعديل بيانات العميل"><i class="fas fa-pen"></i></button>
        <button onclick="createOrderForCustomer(${c.id})" class="btn-secondary" title="طلب جديد"><i class="fas fa-plus"></i></button>
        <button onclick="deleteCustomer(${c.id})" class="btn-danger" title="حذف"><i class="fas fa-trash"></i></button>
      </div>
    </div>

    <div class="mb-6">
      <div class="flex justify-between items-center mb-3">
        <h4 class="font-black text-slate-800 flex items-center gap-2"><i class="fas fa-ruler-combined text-blue-600"></i> القياسات الأساسية</h4>
        <span class="text-xs text-slate-400">القياسات الجديدة هي المصدر الوحيد</span>
      </div>
      ${summaryHtml}
    </div>

    ${c.notes?`<div class="mb-5 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3"><i class="fas fa-sticky-note text-amber-500 mt-0.5"></i><p class="text-sm text-amber-900 leading-relaxed">${c.notes}</p></div>`:''}

    <div class="flex justify-between items-center mb-3">
      <h4 class="font-bold text-slate-800 flex items-center gap-2"><i class="fas fa-receipt text-slate-400"></i> سجل الطلبات <span class="badge-count">${custOrders.length}</span></h4>
      ${custOrders.length?`<button onclick="createOrderForCustomer(${c.id})" class="btn-ghost text-sm"><i class="fas fa-plus ml-1"></i> طلب جديد</button>`:''}
    </div>
    ${custOrders.length?`
      <div class="overflow-x-auto rounded-xl border border-slate-100">
        <table>
          <thead><tr><th>رقم</th><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الحالة</th><th>الفاتورة</th></tr></thead>
          <tbody>${custOrders.map(o=>`<tr>
            <td class="font-bold text-slate-700">ORD-${String(o.id).padStart(4,'0')}</td>
            <td class="text-sm text-slate-600">${formatDate(o.orderDate)}</td>
            <td class="font-medium text-slate-700">${o.type}</td>
            <td class="font-bold">${formatMoney(o.total)} <span class="text-xs text-slate-400">ر.ي</span></td>
            <td>${getStatusBadge(o.status)}</td>
            <td>
              <div class="flex gap-1.5">
                <button onclick="printInvoice(${o.id})" class="action-btn print" title="فاتورة"><i class="fas fa-file-pdf"></i></button>
                <button onclick="printQuotation(${o.id})" class="action-btn quote" title="عرض سعر"><i class="fas fa-file-invoice"></i></button>
              </div>
            </td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    `:`
      <div class="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <i class="fas fa-inbox text-3xl text-slate-300 mb-3 block"></i>
        <p class="font-medium text-slate-500">لا توجد طلبات سابقة</p>
        <button onclick="createOrderForCustomer(${c.id})" class="btn-primary btn-sm mt-3"><i class="fas fa-plus"></i> إنشاء أول طلب</button>
      </div>
    `}
  `;
}

function openCustomerModal(){
  document.getElementById('customerForm').reset();
  document.getElementById('customerId').value='';
  document.getElementById('customerModalTitle').textContent='إضافة عميل جديد';
  openModal('customerModal');
  setTimeout(()=>document.getElementById('custName')?.focus(),100);
}
async function editCustomer(id){
  const c=await getById('customers',id);
  if(!c) return;
  document.getElementById('customerId').value=c.id;
  document.getElementById('custName').value=c.name||'';
  document.getElementById('custPhone').value=c.phone||'';
  document.getElementById('custNotes').value=c.notes||'';
  document.getElementById('customerModalTitle').textContent='تعديل بيانات العميل';
  openModal('customerModal');
}
async function saveCustomer(e){
  if(e) e.preventDefault();
  try{
    const idEl=document.getElementById('customerId');
    const nameEl=document.getElementById('custName');
    const phoneEl=document.getElementById('custPhone');
    const notesEl=document.getElementById('custNotes');
    if(!idEl || !nameEl || !phoneEl){
      showToast('خطأ في النموذج','error');
      return;
    }
    const id=idEl.value.trim();
    const name=nameEl.value.trim();
    const phone=phoneEl.value.trim();
    if(!name || !phone){
      showToast('الاسم والجوال مطلوبان','error');
      if(!name) nameEl.focus();
      else phoneEl.focus();
      return;
    }
    const data={name, phone, notes: notesEl?notesEl.value.trim():'', createdAt:new Date().toISOString()};
    if(id){
      const existing = await getById('customers', parseInt(id));
      if(existing?.measurements) data.measurements = existing.measurements;
      if(existing?.createdAt) data.createdAt = existing.createdAt;
      data.id=parseInt(id);
      await putData('customers',data);
      showToast('تم تحديث بيانات العميل');
      selectedCustomerId = parseInt(id);
      closeModal('customerModal');
      await renderCustomers();
      renderDashboard();
      const updated = await getById('customers', parseInt(id));
      if(updated) renderCustomerDetail(updated);
    } else {
      const newId = await addData('customers',data);
      if(!newId && newId!==0) throw new Error('فشل إنشاء العميل');
      selectedCustomerId = newId;
      closeModal('customerModal');
      await renderCustomers();
      renderDashboard();
      showToast('تم إضافة العميل — الآن أدخل قياساته','success');
      setTimeout(async ()=>{
        try{ await openMeasurementsWorkspace(newId); }catch(err){ console.error(err); }
      }, 300);
    }
  } catch(err){
    console.error('saveCustomer error', err);
    showToast('حدث خطأ أثناء الحفظ: '+(err?.message||''),'error');
  }
}
async function deleteCustomer(id){
  if(!confirm('هل أنت متأكد من حذف هذا العميل وجميع طلباته؟')) return;
  await deleteData('customers',id);
  const orders=await getAll('orders');
  for(const o of orders){ if(o.customerId===id) await deleteData('orders',o.id); }
  if(selectedCustomerId===id){
    selectedCustomerId=null;
    document.getElementById('customerDetail').innerHTML='<div class="empty-state"><i class="fas fa-user-group"></i><p>اختر عميلاً من القائمة لعرض التفاصيل</p></div>';
  }
  showToast('تم حذف العميل');
  renderCustomers();
  renderDashboard();
  renderOrders();
}
async function createOrderForCustomer(cid){
  const c=await getById('customers',cid);
  if(!c) return;
  document.getElementById('orderForm').reset();
  document.getElementById('orderId').value='';
  document.getElementById('orderModalTitle').textContent='طلب تفصيل جديد';
  await populateOrderCustomers();
  await populateOrderFabrics();
  await populateOrderColors();
  await populateDressTypesForMeasurements();
  document.getElementById('orderCustomer').value=cid;
  openModal('orderModal');
  calcRemaining();
}
