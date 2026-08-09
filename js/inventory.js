async function renderInventory(){
  if(invTab==='fabrics'){
    const fabrics = await getAll('fabrics');
    const colors = await getAll('colors');
    const colorMap = {};
    colors.forEach(c=> colorMap[c.name]=c.code);
    document.getElementById('inventoryContent').innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-bold text-slate-800 flex items-center gap-2"><i class="fas fa-scroll text-slate-400"></i> قائمة الأقمشة <span class="badge-count">${fabrics.length}</span></h4>
        <span class="text-xs text-slate-400">يتم احتساب المخزون بالوار</span>
      </div>
      ${fabrics.length?`
      <div class="overflow-x-auto rounded-xl border border-slate-100">
        <table>
          <thead><tr><th>#</th><th>اسم القماش</th><th>اللون</th><th>سعر الشراء</th><th>سعر البيع</th><th>الكمية</th><th>حد الأمان</th><th>إجراءات</th></tr></thead>
          <tbody>${fabrics.map((f,i)=>`<tr>
            <td class="text-slate-400 font-bold">${i+1}</td>
            <td class="font-bold text-slate-800">${f.name}</td>
            <td><span class="color-dot" style="background:${colorMap[f.color]||getColorHex(f.color)}"></span>${f.color}</td>
            <td class="text-slate-600">${formatMoney(f.buyPrice)} <span class="text-xs text-slate-400">ر.ي</span></td>
            <td class="font-bold text-slate-800">${formatMoney(f.sellPrice)} <span class="text-xs text-slate-400">ر.ي</span></td>
            <td>${ (parseFloat(f.quantity)||0) <= (parseFloat(f.minStock)||0) ? `<span class="low-stock"><i class="fas fa-triangle-exclamation ml-1"></i>${f.quantity} وار</span>` : `<span class="good-stock">${f.quantity} وار</span>`}</td>
            <td class="text-slate-500 text-sm">${f.minStock} وار</td>
            <td><div class="flex gap-1.5">
              <button onclick="editFabric(${f.id})" class="action-btn edit" title="تعديل"><i class="fas fa-pen"></i></button>
              <button onclick="deleteFabric(${f.id})" class="action-btn delete" title="حذف"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
      `:`<div class="empty-state"><i class="fas fa-scroll"></i><p>لا توجد أقمشة</p><button onclick="openFabricModal()" class="btn-primary btn-sm mt-3">إضافة قماش</button></div>`}
    `;
  } else if(invTab==='accessories'){
    const acc = await getAll('accessories');
    document.getElementById('inventoryContent').innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-bold text-slate-800 flex items-center gap-2"><i class="fas fa-screwdriver-wrench text-slate-400"></i> المستلزمات <span class="badge-count">${acc.length}</span></h4>
        <button onclick="openAccessoryModal()" class="btn-primary btn-sm"><i class="fas fa-plus"></i> إضافة مستلزم</button>
      </div>
      ${acc.length?`
        <div class="overflow-x-auto rounded-xl border border-slate-100">
          <table><thead><tr><th>#</th><th>الاسم</th><th>الكمية</th><th>حد الأمان</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>${acc.map((a,i)=>`<tr>
            <td class="text-slate-400 font-bold">${i+1}</td>
            <td class="font-bold text-slate-800">${a.name}</td>
            <td class="font-medium">${a.quantity}</td>
            <td class="text-slate-500">${a.minStock||10}</td>
            <td>${ (parseFloat(a.quantity)||0) <= (parseFloat(a.minStock)||10) ? `<span class="low-stock">منخفض</span>` : `<span class="good-stock">متوفر</span>`}</td>
            <td><div class="flex gap-1.5">
              <button onclick="editAccessory(${a.id})" class="action-btn edit"><i class="fas fa-pen"></i></button>
              <button onclick="deleteAccessory(${a.id})" class="action-btn delete"><i class="fas fa-trash"></i></button>
            </div></td>
          </tr>`).join('')}</tbody></table>
        </div>
      `:`<div class="empty-state"><i class="fas fa-box-open"></i><p>لا توجد مستلزمات</p></div>`}
    `;
  } else if(invTab==='types'){
    const types = await getAll('dressTypes');
    document.getElementById('inventoryContent').innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <div>
          <h4 class="font-bold text-slate-800 flex items-center gap-2"><i class="fas fa-shirt text-slate-400"></i> أنواع الثياب <span class="badge-count">${types.length}</span></h4>
          <p class="text-xs text-slate-400 mt-1">هذه الأنواع ستظهر تلقائياً في حقل "نوع الثوب" داخل القياسات والطلبات</p>
        </div>
        <button onclick="openDressTypeModal()" class="btn-primary btn-sm"><i class="fas fa-plus"></i> إضافة نوع</button>
      </div>
      ${types.length?`
        <div class="grid grid-cols-3 gap-4">
          ${types.map(t=>`<div class="card p-4 flex flex-col gap-3">
            <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><i class="fas fa-shirt"></i></div>
            <div>
              <h4 class="font-black text-slate-800">${t.name}</h4>
              <p class="text-sm text-slate-500 mt-1">السعر الافتراضي: <span class="font-bold text-slate-700">${formatMoney(t.defaultPrice||0)} ر.ي</span></p>
            </div>
            <div class="flex gap-2 mt-2">
              <button onclick="editDressType(${t.id})" class="btn-secondary btn-sm flex-1"><i class="fas fa-pen ml-1"></i> تعديل</button>
              <button onclick="deleteDressType(${t.id})" class="btn-danger btn-sm"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('')}
        </div>
      `:`<div class="empty-state"><i class="fas fa-shirt"></i><p>لا توجد أنواع</p><button onclick="openDressTypeModal()" class="btn-primary btn-sm mt-3">إضافة نوع</button></div>`}
    `;
  } else if(invTab==='colors'){
    const colors = await getAll('colors');
    document.getElementById('inventoryContent').innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-bold text-slate-800 flex items-center gap-2"><i class="fas fa-palette text-slate-400"></i> الألوان المتاحة <span class="badge-count">${colors.length}</span></h4>
        <button onclick="openColorModal()" class="btn-primary btn-sm"><i class="fas fa-plus"></i> إضافة لون</button>
      </div>
      ${colors.length?`<div class="grid grid-cols-4 gap-4">
        ${colors.map(c=>`<div class="card p-5 text-center">
          <div class="w-14 h-14 rounded-full mx-auto mb-3 border-2 border-slate-100 shadow-sm relative" style="background:${c.code}">
            ${c.code.toLowerCase()==='#ffffff' || c.code.toLowerCase()==='#fff' ? '<span class="absolute inset-0 rounded-full border border-slate-200"></span>':''}
          </div>
          <h4 class="font-bold text-slate-800">${c.name}</h4>
          <p class="text-xs font-mono text-slate-400 mt-1">${c.code}</p>
          <div class="flex justify-center gap-2 mt-3">
            <button onclick="editColor(${c.id})" class="action-btn edit"><i class="fas fa-pen"></i></button>
            <button onclick="deleteColor(${c.id})" class="action-btn delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>`).join('')}
      </div>`:`<div class="empty-state"><i class="fas fa-palette"></i><p>لا توجد ألوان</p></div>`}
    `;
  }
}

function switchInvTab(tab){
  invTab=tab;
  document.querySelectorAll('#inventory .tab-btn').forEach(b=>b.classList.remove('active'));
  const el = document.getElementById('tab-'+tab);
  if(el) el.classList.add('active');
  renderInventory();
}

async function populateFabricColorSelect(){
  const colors = await getAll('colors');
  const sel = document.getElementById('fabColor');
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">اختر اللون</option>' + colors.map(c=>`<option value="${c.name}">${c.name}</option>`).join('');
  if(cur) sel.value = cur;
}

function openFabricModal(){
  document.getElementById('fabricForm').reset();
  document.getElementById('fabricId').value='';
  document.getElementById('fabricModalTitle').textContent='إضافة قماش';
  populateFabricColorSelect();
  openModal('fabricModal');
}
async function editFabric(id){
  const f=await getById('fabrics',id);
  if(!f) return;
  await populateFabricColorSelect();
  document.getElementById('fabricId').value=f.id;
  document.getElementById('fabName').value=f.name;
  document.getElementById('fabColor').value=f.color;
  document.getElementById('fabBuy').value=f.buyPrice;
  document.getElementById('fabSell').value=f.sellPrice;
  document.getElementById('fabQty').value=f.quantity;
  document.getElementById('fabMin').value=f.minStock;
  document.getElementById('fabricModalTitle').textContent='تعديل قماش';
  openModal('fabricModal');
}
async function saveFabric(e){
  e.preventDefault();
  const id=document.getElementById('fabricId').value;
  const data={
    name:document.getElementById('fabName').value.trim(),
    color:document.getElementById('fabColor').value,
    buyPrice:parseFloat(document.getElementById('fabBuy').value)||0,
    sellPrice:parseFloat(document.getElementById('fabSell').value)||0,
    quantity:parseFloat(document.getElementById('fabQty').value)||0,
    minStock:parseFloat(document.getElementById('fabMin').value)||5,
    createdAt:new Date().toISOString()
  };
  if(!data.name){
    showToast('اسم القماش مطلوب','error');
    return;
  }
  if(id){
    data.id=parseInt(id);
    const existing = await getById('fabrics', parseInt(id));
    if(existing?.createdAt) data.createdAt = existing.createdAt;
    await putData('fabrics',data);
    showToast('تم تحديث القماش');
  } else {
    await addData('fabrics',data);
    showToast('تم إضافة القماش');
  }
  closeModal('fabricModal');
  renderInventory();
  renderDashboard();
}
async function deleteFabric(id){
  if(!confirm('هل أنت متأكد من حذف هذا القماش؟')) return;
  await deleteData('fabrics',id);
  showToast('تم الحذف');
  renderInventory();
}

function openAccessoryModal(){
  document.getElementById('accessoryForm').reset();
  document.getElementById('accId').value='';
  document.getElementById('accModalTitle').textContent='إضافة مستلزم';
  openModal('accessoryModal');
}
async function editAccessory(id){
  const a=await getById('accessories',id);
  if(!a) return;
  document.getElementById('accId').value=a.id;
  document.getElementById('accName').value=a.name;
  document.getElementById('accQty').value=a.quantity;
  document.getElementById('accMin').value=a.minStock||10;
  document.getElementById('accModalTitle').textContent='تعديل مستلزم';
  openModal('accessoryModal');
}
async function saveAccessory(e){
  e.preventDefault();
  const id=document.getElementById('accId').value;
  const data={
    name:document.getElementById('accName').value.trim(),
    quantity:parseFloat(document.getElementById('accQty').value)||0,
    minStock:parseFloat(document.getElementById('accMin').value)||10,
    createdAt:new Date().toISOString()
  };
  if(!data.name){
    showToast('الاسم مطلوب','error');
    return;
  }
  if(id){
    data.id=parseInt(id);
    const ex = await getById('accessories', parseInt(id));
    if(ex?.createdAt) data.createdAt = ex.createdAt;
    await putData('accessories',data);
    showToast('تم التحديث');
  } else {
    await addData('accessories',data);
    showToast('تم الإضافة');
  }
  closeModal('accessoryModal');
  renderInventory();
  renderDashboard();
}
async function deleteAccessory(id){
  if(!confirm('هل أنت متأكد؟')) return;
  await deleteData('accessories',id);
  showToast('تم الحذف');
  renderInventory();
}

function openDressTypeModal(){
  document.getElementById('dressTypeForm').reset();
  document.getElementById('dtId').value='';
  document.getElementById('dtModalTitle').textContent='إضافة نوع ثوب';
  openModal('dressTypeModal');
}
async function editDressType(id){
  const t=await getById('dressTypes',id);
  if(!t) return;
  document.getElementById('dtId').value=t.id;
  document.getElementById('dtName').value=t.name;
  document.getElementById('dtPrice').value=t.defaultPrice||0;
  document.getElementById('dtModalTitle').textContent='تعديل نوع ثوب';
  openModal('dressTypeModal');
}
async function saveDressType(e){
  e.preventDefault();
  const id=document.getElementById('dtId').value;
  const data={
    name:document.getElementById('dtName').value.trim(),
    defaultPrice:parseFloat(document.getElementById('dtPrice').value)||0,
    createdAt:new Date().toISOString()
  };
  if(!data.name){
    showToast('اسم النوع مطلوب','error');
    return;
  }
  if(id){
    data.id=parseInt(id);
    const ex = await getById('dressTypes', parseInt(id));
    if(ex?.createdAt) data.createdAt = ex.createdAt;
    await putData('dressTypes',data);
    showToast('تم التحديث');
  } else {
    await addData('dressTypes',data);
    showToast('تم الإضافة');
  }
  closeModal('dressTypeModal');
  renderInventory();
  // refresh measurements dress selects if open
  const ws = document.getElementById('measurementsWorkspace');
  if(ws && !ws.classList.contains('hidden')) populateDressTypesForMeasurements();
}
async function deleteDressType(id){
  if(!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
  await deleteData('dressTypes',id);
  showToast('تم الحذف');
  renderInventory();
}

function openColorModal(){
  document.getElementById('colorForm').reset();
  document.getElementById('colorId').value='';
  document.getElementById('colorModalTitle').textContent='إضافة لون';
  openModal('colorModal');
}
async function editColor(id){
  const c=await getById('colors',id);
  if(!c) return;
  document.getElementById('colorId').value=c.id;
  document.getElementById('colorName').value=c.name;
  document.getElementById('colorCode').value=c.code;
  document.getElementById('colorModalTitle').textContent='تعديل لون';
  openModal('colorModal');
}
async function saveColor(e){
  e.preventDefault();
  const id=document.getElementById('colorId').value;
  const data={
    name:document.getElementById('colorName').value.trim(),
    code:document.getElementById('colorCode').value,
    createdAt:new Date().toISOString()
  };
  if(!data.name){
    showToast('اسم اللون مطلوب','error');
    return;
  }
  if(id){
    data.id=parseInt(id);
    const ex = await getById('colors', parseInt(id));
    if(ex?.createdAt) data.createdAt = ex.createdAt;
    await putData('colors',data);
    showToast('تم التحديث');
  } else {
    await addData('colors',data);
    showToast('تم الإضافة');
  }
  closeModal('colorModal');
  renderInventory();
}
async function deleteColor(id){
  if(!confirm('هل أنت متأكد؟')) return;
  await deleteData('colors',id);
  showToast('تم الحذف');
  renderInventory();
}
