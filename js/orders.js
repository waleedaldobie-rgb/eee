let dropdownOrderId = null;

async function renderOrders(){
  const orders = await getAll('orders');
  const search = (document.getElementById('orderSearch')?.value || '').toLowerCase().trim();
  let filtered = orders.filter(o=>{
    const oid='ORD-'+String(o.id).padStart(4,'0');
    return oid.toLowerCase().includes(search) ||
           (o.customerName||'').toLowerCase().includes(search) ||
           (o.customerPhone||'').includes(search) ||
           (o.type||'').toLowerCase().includes(search);
  });
  if(currentOrderFilter!=='all') filtered = filtered.filter(o=>o.status===currentOrderFilter);
  // sort newest first
  filtered.sort((a,b)=> (b.id||0)-(a.id||0));

  const el = document.getElementById('ordersTable');
  if(!el) return;

  if(filtered.length===0){
    el.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i><p>لا توجد طلبات</p><span class="text-xs text-slate-400">${search||currentOrderFilter!=='all'?'جرّب بحث أو فلتر آخر':'أضف أول طلب'}</span></div>`;
    return;
  }

  el.innerHTML = `<div class="overflow-x-auto"><table>
    <thead><tr>
      <th>رقم الطلب</th>
      <th>العميل</th>
      <th>تفاصيل الثوب</th>
      <th>تاريخ التسليم</th>
      <th>الحساب</th>
      <th>الحالة</th>
      <th>إجراءات</th>
    </tr></thead>
    <tbody>
      ${filtered.map(o=>{
        const isOverdue = o.deliveryDate && new Date(o.deliveryDate) < new Date().setHours(0,0,0,0) && o.status!=='delivered' && o.status!=='cancelled';
        return `<tr>
          <td><div class="font-black text-slate-900">ORD-${String(o.id).padStart(4,'0')}</div><div class="text-xs text-slate-400">${formatDate(o.orderDate)}</div></td>
          <td>
            <div class="font-bold text-slate-800">${o.customerName||'—'}</div>
            <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><i class="fas fa-phone text-[10px]"></i> ${o.customerPhone||'—'}</div>
          </td>
          <td>
            <div class="font-bold text-slate-800">${o.type||'—'}</div>
            <div class="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span class="inline-flex items-center gap-1"><span class="color-dot" style="background:${getColorHex(o.color)}"></span>${o.color||'—'}</span>
              <span class="text-slate-300">•</span>
              <span>${o.fabricName||'—'}</span>
            </div>
          </td>
          <td>
            <div class="text-sm font-medium ${isOverdue?'text-red-600': 'text-slate-700'}">${formatDate(o.deliveryDate)}</div>
            ${isOverdue?'<span class="text-xs font-bold text-red-500"><i class="fas fa-triangle-exclamation ml-1"></i>متأخر</span>':`<span class="text-xs text-slate-400">${getDeliveryStatus(o.deliveryDate, o.status)}</span>`}
          </td>
          <td>
            <div class="account-cell">
              <span class="account-total">${formatMoney(o.total)} <span class="text-xs font-normal text-slate-400">ر.ي</span></span>
              <span class="account-paid">مدفوع: ${formatMoney(o.paid)}</span>
              <span class="account-remaining ${o.remaining>0?'due':'paid'}">متبقي: ${formatMoney(o.remaining)}</span>
            </div>
          </td>
          <td>${getStatusBadge(o.status)}</td>
          <td><div class="flex gap-1.5 flex-wrap"><button onclick="editOrder(${o.id})" class="action-btn edit" title="تعديل"><i class="fas fa-pen"></i></button>${o.remaining>0?`<button onclick="openPaymentModal(${o.id})" class="action-btn pay" title="تسجيل دفعة"><i class="fas fa-dollar-sign"></i></button>`:''}<button onclick="printInvoice(${o.id})" class="action-btn print" title="فاتورة"><i class="fas fa-file-pdf"></i></button><button onclick="printQuotation(${o.id})" class="action-btn quote" title="عرض سعر"><i class="fas fa-file-invoice"></i></button><button onclick="deleteOrder(${o.id})" class="action-btn delete" title="حذف"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

function getDeliveryStatus(dateStr, status){
  if(!dateStr) return '—';
  if(status==='delivered') return 'تم التسليم';
  if(status==='cancelled') return 'ملغي';
  const d = new Date(dateStr);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.ceil((d - now)/86400000);
  if(diff===0) return 'اليوم';
  if(diff===1) return 'غداً';
  if(diff>0) return `بعد ${diff} أيام`;
  return `متأخر ${Math.abs(diff)} أيام`;
}

function toggleOrderMenu(event, orderId){
  event.stopPropagation();
  dropdownOrderId = orderId;
  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  const dd = document.getElementById('actionDropdown');
  dd.style.top = (rect.bottom + 8) + 'px';
  dd.style.left = 'auto';
  dd.style.right = (window.innerWidth - rect.right) + 'px';
  dd.classList.remove('hidden');
}

async function dropdownAction(action){
  const id = dropdownOrderId;
  document.getElementById('actionDropdown').classList.add('hidden');
  if(!id) return;
  if(action==='view'){
    const o = await getById('orders', id);
    if(o) editOrder(id);
  } else if(action==='edit'){
    editOrder(id);
  } else if(action==='print'){
    printInvoice(id);
  } else if(action==='delete'){
    deleteOrder(id);
  }
}

function filterOrders(status){
  currentOrderFilter=status;
  document.querySelectorAll('#orders .filter-btn').forEach(b=>b.classList.toggle('active', b.dataset.filter===status));
  renderOrders();
}

async function populateOrderCustomers(){
  const customers = await getAll('customers');
  const sel = document.getElementById('orderCustomer');
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">اختر العميل</option>' + customers.map(c=>`<option value="${c.id}">${c.name} - ${c.phone}</option>`).join('');
  if(cur) sel.value = cur;
}

async function populateOrderFabrics(){
  const fabrics = await getAll('fabrics');
  const sel = document.getElementById('orderFabric');
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">اختر القماش</option>' + fabrics.map(f=>`<option value="${f.id}" data-price="${f.sellPrice}">${f.name} (${f.color}) - ${f.sellPrice} ر.ي/وار</option>`).join('');
  if(cur) sel.value = cur;
}

async function populateOrderColors(){
  const colors = await getAll('colors');
  const sel = document.getElementById('orderColor');
  if(!sel) return;
  const cur = sel.value;
  // if it's a select, populate; if it's input, keep as is? In new design it's select
  if(sel.tagName==='SELECT'){
    sel.innerHTML = '<option value="">اختر اللون</option>' + colors.map(c=>`<option value="${c.name}" data-code="${c.code}">${c.name}</option>`).join('');
    if(cur) sel.value = cur;
  }
}

async function openOrderModal(){
  document.getElementById('orderForm').reset();
  document.getElementById('orderId').value='';
  document.getElementById('orderModalTitle').textContent='طلب تفصيل جديد';
  await populateOrderCustomers();
  await populateOrderFabrics();
  await populateOrderColors();
  await populateDressTypesForMeasurements();
  openModal('orderModal');
  calcRemaining();
}

function calcRemaining(){
  const total = parseFloat(document.getElementById('orderTotal')?.value)||0;
  const paid = parseFloat(document.getElementById('orderPaid')?.value)||0;
  const rem = total - paid;
  const el = document.getElementById('orderRemaining');
  if(!el) return;
  el.value = formatMoney(rem)+' ر.ي';
  el.className = 'form-input font-bold ' + (rem>0 ? 'bg-red-50 text-red-600 border-red-200' : rem<0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200');
}

function updateOrderPrice(){
  const sel = document.getElementById('orderFabric');
  if(!sel) return;
  const opt = sel.options[sel.selectedIndex];
  if(opt && opt.dataset.price){
    const price = parseFloat(opt.dataset.price)||0;
    // only auto-fill if empty or previous was auto
    const totalEl = document.getElementById('orderTotal');
    if(!totalEl.value || totalEl.dataset.auto==='1'){
      totalEl.value = price;
      totalEl.dataset.auto='1';
    }
    calcRemaining();
  }
}

async function saveOrder(e){
  e.preventDefault();
  const id = document.getElementById('orderId').value;
  const customerId = parseInt(document.getElementById('orderCustomer').value);
  if(!customerId){
    showToast('اختر العميل','error');
    return;
  }
  const customers = await getAll('customers');
  const customer = customers.find(c=>c.id===customerId);
  const fabricId = parseInt(document.getElementById('orderFabric').value);
  if(!fabricId){
    showToast('اختر القماش','error');
    return;
  }
  const fabrics = await getAll('fabrics');
  const fabric = fabrics.find(f=>f.id===fabricId);
  const total = parseFloat(document.getElementById('orderTotal').value)||0;
  const paid = parseFloat(document.getElementById('orderPaid').value)||0;
  if(total<=0){
    showToast('المبلغ الإجمالي يجب أن يكون أكبر من صفر','error');
    return;
  }
  if(paid>total){
    showToast('العربون أكبر من الإجمالي','error');
    return;
  }
  const data = {
    customerId: customerId,
    customerName: customer?customer.name:'',
    customerPhone: customer?customer.phone:'',
    type: document.getElementById('orderType').value,
    fabricId: fabricId,
    fabricName: fabric?fabric.name:'',
    color: document.getElementById('orderColor').value,
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: document.getElementById('orderDelivery').value,
    total: total,
    paid: paid,
    remaining: total - paid,
    status: document.getElementById('orderStatus').value,
    notes: document.getElementById('orderNotes').value,
    createdAt: new Date().toISOString()
  };
  if(!data.type){
    showToast('اختر نوع الثوب','error');
    return;
  }
  if(!data.deliveryDate){
    showToast('حدد تاريخ التسليم','error');
    return;
  }
  if(id){
    data.id = parseInt(id);
    // preserve createdAt if editing
    const existing = await getById('orders', parseInt(id));
    if(existing?.createdAt) data.createdAt = existing.createdAt;
    await putData('orders', data);
    showToast('تم تحديث الطلب');
  } else {
    await addData('orders', data);
    showToast('تم إضافة الطلب بنجاح');
  }
  closeModal('orderModal');
  renderOrders();
  renderDashboard();
  // also refresh customer detail if selected
  if(selectedCustomerId) {
    const c = await getById('customers', selectedCustomerId);
    if(c) renderCustomerDetail(c);
  }
}

async function editOrder(id){
  const o = await getById('orders', id);
  if(!o) return;
  document.getElementById('orderId').value = o.id;
  await populateOrderCustomers();
  await populateOrderFabrics();
  await populateOrderColors();
  await populateDressTypesForMeasurements();
  document.getElementById('orderCustomer').value = o.customerId;
  document.getElementById('orderType').value = o.type;
  document.getElementById('orderFabric').value = o.fabricId||'';
  document.getElementById('orderColor').value = o.color;
  document.getElementById('orderDelivery').value = o.deliveryDate;
  document.getElementById('orderTotal').value = o.total;
  document.getElementById('orderPaid').value = o.paid;
  calcRemaining();
  document.getElementById('orderStatus').value = o.status;
  document.getElementById('orderNotes').value = o.notes||'';
  document.getElementById('orderModalTitle').textContent='تعديل طلب';
  openModal('orderModal');
}

async function deleteOrder(id){
  if(!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
  await deleteData('orders', id);
  showToast('تم حذف الطلب');
  renderOrders();
  renderDashboard();
}

async function openPaymentModal(id){
  const o = await getById('orders', id);
  if(!o) return;
  document.getElementById('paymentOrderId').value = id;
  document.getElementById('paymentRemaining').value = formatMoney(o.remaining)+' ر.ي';
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentAmount').max = o.remaining;
  openModal('paymentModal');
}

async function savePayment(e){
  e.preventDefault();
  const id = parseInt(document.getElementById('paymentOrderId').value);
  const amount = parseFloat(document.getElementById('paymentAmount').value)||0;
  const o = await getById('orders', id);
  if(!o) return;
  if(amount<=0){
    showToast('أدخل مبلغ صحيح','error');
    return;
  }
  if(amount > o.remaining){
    showToast('مبلغ الدفعة أكبر من المتبقي','error');
    return;
  }
  o.paid += amount;
  o.remaining -= amount;
  if(o.remaining<=0 && o.status!=='delivered') o.status='ready';
  await putData('orders', o);
  showToast('تم تسجيل الدفعة بنجاح');
  closeModal('paymentModal');
  renderOrders();
  renderDashboard();
  if(selectedCustomerId){
    const c = await getById('customers', selectedCustomerId);
    if(c) renderCustomerDetail(c);
  }
}
