// measurements.js — النظام الجديد للقياسات الأساسية
// لا يعتمد على الحقول القديمة (mLength etc. تم حذفها بالكامل)
// يخزن القياسات ككائن measurements داخل سجل العميل

let currentMeasurementCustomerId = null;

const DEFAULT_MEASUREMENTS = {
  body: { shoulderSlope: '', hip: '', chest: '', step: '' },
  jabzor: { type: '', shape: '', clearance: '' },
  lengths: { front: '', back: '' },
  hand: { type: '', measurement: '', extra: ['', '', '', '', ''] },
  neck: { measurement: '', type: '' },
  width: { measurement: '', dressTypeId: '', dressTypeName: '' }
};

function collectMeasurements() {
  return {
    body: {
      shoulderSlope: document.getElementById('m_shoulderSlope').value.trim(),
      hip: document.getElementById('m_hip').value.trim(),
      chest: document.getElementById('m_chest').value.trim(),
      step: document.getElementById('m_step').value.trim()
    },
    jabzor: {
      type: document.getElementById('m_jabzorType').value,
      shape: document.getElementById('m_jabzorShape').value,
      clearance: document.getElementById('m_clearance').value.trim()
    },
    lengths: {
      front: document.getElementById('m_frontLength').value.trim(),
      back: document.getElementById('m_backLength').value.trim()
    },
    hand: {
      type: document.getElementById('m_handType').value,
      measurement: document.getElementById('m_handMeasure').value.trim(),
      extra: [
        document.getElementById('m_hand1').value.trim(),
        document.getElementById('m_hand2').value.trim(),
        document.getElementById('m_hand3').value.trim(),
        document.getElementById('m_hand4').value.trim(),
        document.getElementById('m_hand5').value.trim()
      ]
    },
    neck: {
      measurement: document.getElementById('m_neckMeasure').value.trim(),
      type: document.getElementById('m_neckType').value
    },
    width: {
      measurement: document.getElementById('m_width').value.trim(),
      dressTypeId: document.getElementById('m_dressType').value,
      dressTypeName: document.getElementById('m_dressType').selectedOptions[0]?.textContent?.replace('— اختر','').trim() || ''
    }
  };
}

function fillMeasurements(m) {
  const src = m || DEFAULT_MEASUREMENTS;
  document.getElementById('m_shoulderSlope').value = src.body?.shoulderSlope || '';
  document.getElementById('m_hip').value = src.body?.hip || '';
  document.getElementById('m_chest').value = src.body?.chest || '';
  document.getElementById('m_step').value = src.body?.step || '';
  selectJabzorType(src.jabzor?.type || '', false);
  selectJabzorShape(src.jabzor?.shape || '', false);
  document.getElementById('m_clearance').value = src.jabzor?.clearance || '';
  document.getElementById('m_frontLength').value = src.lengths?.front || '';
  document.getElementById('m_backLength').value = src.lengths?.back || '';
  selectHandType(src.hand?.type || '', false);
  document.getElementById('m_handMeasure').value = src.hand?.measurement || '';
  const extra = src.hand?.extra || ['', '', '', '', ''];
  for (let i = 1; i <= 5; i++) document.getElementById('m_hand' + i).value = extra[i - 1] || '';
  document.getElementById('m_neckMeasure').value = src.neck?.measurement || '';
  selectNeckType(src.neck?.type || '', false);
  document.getElementById('m_width').value = src.width?.measurement || '';
  // dressType will be populated async
  if (src.width?.dressTypeId) {
    // after populating options, set value
    setTimeout(() => {
      const sel = document.getElementById('m_dressType');
      if (sel) sel.value = src.width.dressTypeId;
    }, 50);
  } else {
    const sel = document.getElementById('m_dressType');
    if (sel) sel.value = '';
  }
}

function hasAnyMeasurement(m) {
  if (!m) return false;
  const v = JSON.stringify(m);
  // check if any non-empty value exists beyond defaults
  return !(
    !m.body?.shoulderSlope && !m.body?.hip && !m.body?.chest && !m.body?.step &&
    !m.jabzor?.type && !m.jabzor?.shape && !m.jabzor?.clearance &&
    !m.lengths?.front && !m.lengths?.back &&
    !m.hand?.type && !m.hand?.measurement && !(m.hand?.extra||[]).some(x=>x) &&
    !m.neck?.measurement && !m.neck?.type &&
    !m.width?.measurement && !m.width?.dressTypeId
  );
}

function selectJabzorType(type, withFeedback=true) {
  document.getElementById('m_jabzorType').value = type;
  document.querySelectorAll('.jabzor-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === type);
  });
  if(withFeedback && type) {
    // haptic feedback could go here
  }
}

function selectJabzorShape(shape, withFeedback=true) {
  document.getElementById('m_jabzorShape').value = shape;
  document.querySelectorAll('.jabzor-shape-btn').forEach(btn => {
    const isSquare = btn.id === 'jabzor_shape_square';
    const isTriangle = btn.id === 'jabzor_shape_triangle';
    btn.classList.toggle('active', (isSquare && shape==='square') || (isTriangle && shape==='triangle'));
  });
}

function selectHandType(type, withFeedback=true) {
  document.getElementById('m_handType').value = type;
  document.querySelectorAll('.hand-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'hand_' + type);
  });
  const group = document.getElementById('handMeasurementGroup');
  if (type) {
    group.classList.remove('hidden');
  } else {
    group.classList.add('hidden');
  }
}

function selectNeckType(type, withFeedback=true) {
  document.getElementById('m_neckType').value = type;
  document.querySelectorAll('.neck-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'neck_' + type);
  });
}

async function populateDressTypesForMeasurements() {
  const sel = document.getElementById('m_dressType');
  if (!sel) return;
  const types = await getAll('dressTypes');
  const current = sel.value;
  sel.innerHTML = '<option value="">— اختر نوع الثوب</option>' + types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  if (current) sel.value = current;
  // also populate orderType select if exists
  const orderType = document.getElementById('orderType');
  if (orderType) {
    const oc = orderType.value;
    orderType.innerHTML = '<option value="">اختر النوع</option>' + types.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
    if (oc) orderType.value = oc;
  }
  // also populate fab colors? handled elsewhere
}

async function openMeasurementsWorkspace(customerId) {
  const customer = await getById('customers', customerId);
  if (!customer) return;
  currentMeasurementCustomerId = customerId;
  document.getElementById('measurementsCustomerName').textContent = 'العميل: ' + customer.name;
  document.getElementById('mWorkspaceName').textContent = customer.name;
  document.getElementById('mWorkspacePhone').textContent = customer.phone;
  document.getElementById('mWorkspaceInitial').textContent = customer.name.charAt(0);
  await populateDressTypesForMeasurements();
  fillMeasurements(customer.measurements || DEFAULT_MEASUREMENTS);
  document.getElementById('measurementsWorkspace').classList.remove('hidden');
  document.getElementById('customersLayout').classList.add('hidden');
  // ensure dressType set after population
  if (customer.measurements?.width?.dressTypeId) {
    document.getElementById('m_dressType').value = customer.measurements.width.dressTypeId;
  }
  // focus first field
  setTimeout(() => document.getElementById('m_shoulderSlope')?.focus(), 100);
}

function closeMeasurementsWorkspace() {
  document.getElementById('measurementsWorkspace').classList.add('hidden');
  document.getElementById('customersLayout').classList.remove('hidden');
  currentMeasurementCustomerId = null;
}

async function saveMeasurementsWorkspace() {
  if (!currentMeasurementCustomerId) return;
  const customer = await getById('customers', currentMeasurementCustomerId);
  if (!customer) return;
  const measurements = collectMeasurements();
  // keep dressTypeName updated
  const dtSel = document.getElementById('m_dressType');
  const dtName = dtSel.selectedOptions[0]?.textContent || '';
  measurements.width.dressTypeName = measurements.width.dressTypeId ? dtName : '';
  customer.measurements = measurements;
  await putData('customers', customer);
  showToast('تم حفظ القياسات بنجاح');
  closeMeasurementsWorkspace();
  // re-render detail
  renderCustomerDetail(customer);
  renderCustomers();
}

// helper to render measurements summary in customer detail
function renderMeasurementsSummary(m) {
  if (!hasAnyMeasurement(m)) {
    return `<div class="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
      <div class="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-3 shadow-sm"><i class="fas fa-ruler-combined text-xl"></i></div>
      <p class="font-bold text-slate-500">لا توجد قياسات محفوظة</p>
      <p class="text-xs text-slate-400 mt-1">اضغط على "فتح القياسات" لإدخال القياسات الجديدة</p>
    </div>`;
  }
  const body = m.body || {};
  const jabzor = m.jabzor || {};
  const lengths = m.lengths || {};
  const hand = m.hand || {};
  const neck = m.neck || {};
  const width = m.width || {};
  const jabzorTypeMap = {zip:'سحاب', buttonVisible:'زرار باين', buttonHidden:'زرار مخفي'};
  const jabzorShapeMap = {square:'مربع', triangle:'مثلث'};
  const handTypeMap = {plain:'ساده', cuff:'كبك'};
  const neckTypeMap = {qallabAdi:'قلاب عادي', malaki:'ملكي', faransi:'فرنسي', sadaMadawar:'سادة مدور', sadaMurabba:'سادة مربع'};
  return `
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <h5 class="font-black text-slate-800 text-sm mb-3 flex items-center gap-2"><i class="fas fa-person text-blue-600"></i> قياسات الجسم</h5>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">ميلان الكتف</span><span class="font-bold text-red-600">${body.shoulderSlope||'—'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">الورك</span><span class="font-bold text-red-600">${body.hip||'—'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">الصدر</span><span class="font-bold text-red-600">${body.chest||'—'}</span></div>
        <div class="flex justify-between border-t pt-2 mt-2"><span class="text-slate-500">الخطوة</span><span class="font-bold">${body.step||'—'}</span></div>
      </div>
    </div>
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <h5 class="font-black text-slate-800 text-sm mb-3 flex items-center gap-2"><i class="fas fa-shirt text-blue-600"></i> الجبزور</h5>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">النوع</span><span class="font-bold">${jabzorTypeMap[jabzor.type]||'—'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">الشكل</span><span class="font-bold">${jabzorShapeMap[jabzor.shape]||'—'}</span></div>
        <div class="flex justify-between border-t pt-2 mt-2"><span class="text-slate-500">التخاليص</span><span class="font-bold">${jabzor.clearance||'—'}</span></div>
        <p class="text-xs text-slate-400 mt-1">التخاليص قياس مستقل</p>
      </div>
    </div>
    <div class="bg-white border border-slate-200 rounded-xl p-4">
      <h5 class="font-black text-slate-800 text-sm mb-3 flex items-center gap-2"><i class="fas fa-ruler-vertical text-blue-600"></i> الطول واليد والرقبة</h5>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">طول أمام / خلف</span><span class="font-bold">${lengths.front||'—'} / ${lengths.back||'—'}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">اليد</span><span class="font-bold">${handTypeMap[hand.type]||'—'} ${hand.measurement? '— '+hand.measurement:''}</span></div>
        ${hand.extra?.some(v=>v)?`<div class="text-xs text-slate-500">إضافي: ${hand.extra.filter(v=>v).join(' • ')}</div>`:''}
        <div class="flex justify-between"><span class="text-slate-500">الرقبة</span><span class="font-bold">${neck.measurement||'—'} ${neck.type? '— '+(neckTypeMap[neck.type]||neck.type):''}</span></div>
        <div class="flex justify-between border-t pt-2 mt-2"><span class="text-slate-500">الوسع</span><span class="font-bold">${width.measurement||'—'} ${width.dressTypeName? '— '+width.dressTypeName:''}</span></div>
      </div>
    </div>
  </div>`;
}

// ==================== NEW PAGE: جدول القياسات — 3 Column Exact Layout ====================
// All IDs with prefix mp_ belong to the new full-screen page #measurements
// Pocket is included, neck is synced between CENTER and RIGHT

// Extend default to include pocket
if (!DEFAULT_MEASUREMENTS.pocket) DEFAULT_MEASUREMENTS.pocket = { type: '' };
if (!DEFAULT_MEASUREMENTS.neck) DEFAULT_MEASUREMENTS.neck = { measurement: '', type: '' };

function hasAnyMeasurementNew(m){
  if(!m) return false;
  return !(
    !m.body?.shoulderSlope && !m.body?.hip && !m.body?.chest && !m.body?.step &&
    !m.jabzor?.type && !m.jabzor?.shape && !m.jabzor?.clearance &&
    !m.lengths?.front && !m.lengths?.back &&
    !m.hand?.type && !m.hand?.measurement && !(m.hand?.extra||[]).some(x=>x) &&
    !m.neck?.measurement && !m.neck?.type &&
    !m.width?.measurement && !m.width?.dressTypeId &&
    !m.pocket?.type
  );
}

// Collect from new page
function collectMeasurementsPage(){
  return {
    body: {
      shoulderSlope: document.getElementById('mp_shoulderSlope')?.value.trim() || '',
      hip: document.getElementById('mp_hip')?.value.trim() || '',
      chest: document.getElementById('mp_chest')?.value.trim() || '',
      step: document.getElementById('mp_step')?.value.trim() || ''
    },
    jabzor: {
      type: document.getElementById('mp_jabzorType')?.value || '',
      shape: document.getElementById('mp_jabzorShape')?.value || '',
      clearance: document.getElementById('mp_clearance')?.value.trim() || ''
    },
    lengths: {
      front: document.getElementById('mp_frontLength')?.value.trim() || '',
      back: document.getElementById('mp_backLength')?.value.trim() || ''
    },
    hand: {
      type: document.getElementById('mp_handType')?.value || '',
      measurement: document.getElementById('mp_handMeasure')?.value.trim() || '',
      extra: [
        document.getElementById('mp_hand1')?.value.trim() || '',
        document.getElementById('mp_hand2')?.value.trim() || '',
        document.getElementById('mp_hand3')?.value.trim() || '',
        document.getElementById('mp_hand4')?.value.trim() || '',
        document.getElementById('mp_hand5')?.value.trim() || ''
      ]
    },
    neck: {
      measurement: document.getElementById('mp_neckMeasure')?.value.trim() || document.getElementById('mp_neckMeasureRight')?.value.trim() || '',
      type: document.getElementById('mp_neckType')?.value || ''
    },
    width: {
      measurement: document.getElementById('mp_width')?.value.trim() || '',
      dressTypeId: document.getElementById('mp_dressType')?.value || '',
      dressTypeName: document.getElementById('mp_dressType')?.selectedOptions[0]?.textContent?.replace('— اختر','').trim() || ''
    },
    pocket: {
      type: document.getElementById('mp_pocket')?.value || ''
    }
  };
}

function fillMeasurementsPage(m){
  const src = m || DEFAULT_MEASUREMENTS;
  const set = (id, val)=>{ const el=document.getElementById(id); if(el) el.value=val||''; };
  set('mp_shoulderSlope', src.body?.shoulderSlope);
  set('mp_hip', src.body?.hip);
  set('mp_chest', src.body?.chest);
  set('mp_step', src.body?.step);
  selectMpJabzor(src.jabzor?.type || '', false);
  selectMpJabzorShape(src.jabzor?.shape || '', false);
  set('mp_clearance', src.jabzor?.clearance);
  set('mp_frontLength', src.lengths?.front);
  set('mp_backLength', src.lengths?.back);
  selectMpHand(src.hand?.type || '', false);
  set('mp_handMeasure', src.hand?.measurement);
  const extra = src.hand?.extra || ['','','','',''];
  for(let i=1;i<=5;i++) set('mp_hand'+i, extra[i-1]);
  // neck - both fields synced
  set('mp_neckMeasure', src.neck?.measurement);
  set('mp_neckMeasureRight', src.neck?.measurement);
  selectMpNeck(src.neck?.type || '', false);
  set('mp_width', src.width?.measurement);
  selectMpPocket(src.pocket?.type || '', false);
  // dress type
  if(src.width?.dressTypeId){
    setTimeout(()=>{ const sel=document.getElementById('mp_dressType'); if(sel) sel.value=src.width.dressTypeId; }, 60);
  } else {
    const sel=document.getElementById('mp_dressType'); if(sel) sel.value='';
  }
}

// Visual selectors for new page
function selectMpJabzor(type){
  const el=document.getElementById('mp_jabzorType'); if(el) el.value=type||'';
  document.querySelectorAll('#mp_jabzorGrid .m-visual-card').forEach(c=> c.classList.toggle('active', c.dataset.value===type));
}
function selectMpJabzorShape(shape){
  const el=document.getElementById('mp_jabzorShape'); if(el) el.value=shape||'';
  document.querySelectorAll('#mp_jabzorShapeGrid .m-visual-card').forEach(c=> c.classList.toggle('active', c.dataset.value===shape));
}
function selectMpNeck(type){
  const el=document.getElementById('mp_neckType'); if(el) el.value=type||'';
  // Center visual cards
  document.querySelectorAll('#mp_neckQallabGrid .m-visual-card, #mp_neckSadaGrid .m-visual-card').forEach(c=> c.classList.toggle('active', c.dataset.value===type));
  // Right small buttons
  document.querySelectorAll('#mp_neckRightGrid .neck-type-btn').forEach(b=> b.classList.toggle('active', b.dataset.value===type));
}
function syncNeckMeasure(val, fromRight=false){
  const left=document.getElementById('mp_neckMeasure');
  const right=document.getElementById('mp_neckMeasureRight');
  if(fromRight){
    if(left) left.value=val;
  } else {
    if(right) right.value=val;
  }
}
function selectMpPocket(type){
  const el=document.getElementById('mp_pocket'); if(el) el.value=type||'';
  document.querySelectorAll('#mp_pocketGrid .m-visual-card').forEach(c=> c.classList.toggle('active', c.dataset.value===type));
}
function selectMpHand(type){
  const el=document.getElementById('mp_handType'); if(el) el.value=type||'';
  document.querySelectorAll('#mp_hand_plain, #mp_hand_cuff').forEach(b=> b.classList.remove('active'));
  const target=document.getElementById('mp_hand_'+type); if(target) target.classList.add('active');
  const group=document.getElementById('mp_handGroup');
  if(type){ if(group) group.classList.remove('hidden'); } else { if(group) group.classList.add('hidden'); }
}

// Populate selects for new page
async function populateMpDressTypes(){
  const sel=document.getElementById('mp_dressType');
  if(!sel) return;
  const types=await getAll('dressTypes');
  const cur=sel.value;
  sel.innerHTML='<option value="">— اختر نوع الثوب</option>'+types.map(t=> `<option value="${t.id}">${t.name}</option>`).join('');
  if(cur) sel.value=cur;
}
async function populateMeasurementsCustomerSelect(){
  const sel=document.getElementById('measurementsCustomerSelect');
  if(!sel) return;
  const customers=await getAll('customers');
  const cur=sel.value;
  sel.innerHTML='<option value="">اختر العميل</option>'+customers.map(c=> `<option value="${c.id}">${c.name} — ${c.phone}</option>`).join('');
  if(cur) sel.value=cur;
  // also populate top bar if needed
}

// Render the new measurements page
async function renderMeasurementsPage(){
  await populateMeasurementsCustomerSelect();
  await populateMpDressTypes();
  // if a customer is already selected, load it, otherwise try selectedCustomerId
  const sel=document.getElementById('measurementsCustomerSelect');
  let cid = sel?.value ? parseInt(sel.value) : selectedCustomerId;
  if(cid){
    if(sel) sel.value=cid;
    const c=await getById('customers', cid);
    if(c) fillMeasurementsPage(c.measurements || DEFAULT_MEASUREMENTS);
  } else {
    fillMeasurementsPage(DEFAULT_MEASUREMENTS);
  }
}

async function loadMeasurementsForSelectedCustomer(){
  const sel=document.getElementById('measurementsCustomerSelect');
  const cid=sel?.value ? parseInt(sel.value) : null;
  if(!cid){
    fillMeasurementsPage(DEFAULT_MEASUREMENTS);
    return;
  }
  selectedCustomerId=cid;
  const c=await getById('customers', cid);
  if(c) fillMeasurementsPage(c.measurements || DEFAULT_MEASUREMENTS);
  // also update customers page selection
  renderCustomers();
}

async function saveMeasurementsPage(){
  const sel=document.getElementById('measurementsCustomerSelect');
  const cid=sel?.value ? parseInt(sel.value) : selectedCustomerId;
  if(!cid){
    showToast('اختر العميل أولاً','error');
    if(sel) sel.focus();
    return;
  }
  const customer=await getById('customers', cid);
  if(!customer){ showToast('العميل غير موجود','error'); return; }
  const m=collectMeasurementsPage();
  // ensure dressTypeName
  const dtSel=document.getElementById('mp_dressType');
  if(dtSel) m.width.dressTypeName = m.width.dressTypeId ? (dtSel.selectedOptions[0]?.textContent.trim()||'') : '';
  // Basic validation: at least one red field should be filled? Not required, just warn if all empty
  if(!hasAnyMeasurementNew(m)){
    if(!confirm('لم تدخل أي قياس، هل تريد الحفظ فارغاً؟')) return;
  }
  customer.measurements=m;
  // also sync to old structure for backward compatibility (copy to same object)
  // old workspace uses same measurements object, so it will be synced automatically
  await putData('customers', customer);
  showToast('تم حفظ جدول القياسات');
  renderCustomers();
  if(selectedCustomerId===cid) renderCustomerDetail(customer);
}

// Helper to open measurements page for a specific customer from customers detail
async function openMeasurementsPageForCustomer(cid){
  selectedCustomerId=cid;
  showPage('measurements');
  // wait for page to render
  setTimeout(async ()=>{
    const sel=document.getElementById('measurementsCustomerSelect');
    if(sel) sel.value=cid;
    const c=await getById('customers', cid);
    if(c) fillMeasurementsPage(c.measurements || DEFAULT_MEASUREMENTS);
  }, 100);
}

// Make old workspace open redirect to new page (to satisfy no-modal requirement)
const _oldOpenWorkspace = typeof openMeasurementsWorkspace==='function' ? openMeasurementsWorkspace : null;
async function openMeasurementsWorkspaceCompat(cid){
  // Redirect to new page instead of modal
  return openMeasurementsPageForCustomer(cid);
}
if(typeof openMeasurementsWorkspace!=='undefined'){
  // Override to use new page
  openMeasurementsWorkspace = openMeasurementsPageForCustomer;
}

