function showToast(msg, type='success'){
  const t = document.getElementById('toast');
  if(!t) return;
  document.getElementById('toastMsg').textContent = msg;
  t.className = 'toast ' + type;
  const icon = t.querySelector('i');
  if(icon) icon.className = type==='success' ? 'fas fa-check-circle' : type==='error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.remove('show'), 3000);
}

function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('active');
  document.body.style.overflow = '';
}
function openModal(id){
  const el = document.getElementById(id);
  if(el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
    // focus first input
    setTimeout(()=>{
      const inp = el.querySelector('input:not([type=hidden]), select, textarea');
      if(inp) inp.focus();
    }, 100);
  }
}

function formatMoney(n){
  if(n===null || n===undefined || n==='') return '0';
  const num = Number(n);
  if(isNaN(num)) return '0';
  return num.toLocaleString('ar-SA');
}

function formatDate(d){
  if(!d) return '—';
  try{
    const date = new Date(d);
    if(isNaN(date.getTime())) return d;
    return date.toLocaleDateString('ar-SA', {year:'numeric', month:'short', day:'numeric'});
  } catch{ return d; }
}

function getStatusBadge(status){
  const map={
    new:'<span class="status-badge status-new">جديد</span>',
    processing:'<span class="status-badge status-processing">تحت التنفيذ</span>',
    ready:'<span class="status-badge status-ready">جاهز</span>',
    delivered:'<span class="status-badge status-delivered">تم التسليم</span>',
    cancelled:'<span class="status-badge status-cancelled">ملغي</span>'
  };
  return map[status] || `<span class="status-badge" style="background:#f1f5f9;color:#64748b">${status||'—'}</span>`;
}

function getColorHex(name){
  const map={
    'كحلي':'#1e3a5f','أبيض':'#f8fafc','زيتي':'#556b2f','كريمي':'#f5f5dc','أبيض طبيعي':'#faf0e6',
    'أسود':'#0f172a','رمادي':'#6b7280','بني':'#78350f','نيلي':'#1e3a8a','أحمر':'#dc2626','أزرق':'#2563eb',
    'أخضر':'#059669','أصفر':'#f59e0b','سكري':'#fef3c7','بيج':'#f5f5dc'
  };
  return map[name]||'#cbd5e1';
}

// Keyboard navigation improvements
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.active').forEach(m=> m.classList.remove('active'));
    const ws = document.getElementById('measurementsWorkspace');
    if(ws && !ws.classList.contains('hidden')) closeMeasurementsWorkspace();
    const dd = document.getElementById('actionDropdown');
    if(dd) dd.classList.add('hidden');
    document.body.style.overflow='';
  }
});

// Numeric inputs: allow only numbers and .
document.addEventListener('input', (e)=>{
  if(e.target.matches('input[type="number"]')){
    // browser handles, but we ensure Arabic numbers conversion if needed
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e)=>{
  const dd = document.getElementById('actionDropdown');
  if(dd && !e.target.closest('.action-menu-btn') && !e.target.closest('#actionDropdown')){
    dd.classList.add('hidden');
  }
});
