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
