async function renderDashboard(){
  const orders = await getAll('orders');
  const fabrics = await getAll('fabrics');
  const accessories = await getAll('accessories');
  const notifications = await getAll('notifications');

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o=>o.orderDate===today);
  const deliveredOrders = orders.filter(o=>o.status==='delivered');
  const totalSales = deliveredOrders.reduce((s,o)=>s+(parseFloat(o.total)||0),0);
  const dueAmount = orders.filter(o=>o.remaining>0 && o.status!=='cancelled').reduce((s,o)=>s+(parseFloat(o.remaining)||0),0);
  const dueCount = orders.filter(o=>o.remaining>0 && o.status!=='cancelled').length;
  const overdue = orders.filter(o=>{
    if(!o.deliveryDate) return false;
    if(o.status==='delivered' || o.status==='cancelled') return false;
    const dl = new Date(o.deliveryDate); dl.setHours(0,0,0,0);
    const now = new Date(); now.setHours(0,0,0,0);
    return dl < now;
  }).length;

  const ready = orders.filter(o=>o.status==='ready').length;
  const processing = orders.filter(o=>o.status==='processing').length;
  const newOrders = orders.filter(o=>o.status==='new').length;
  const delivered = deliveredOrders.length;

  // Fill today
  const elToday = document.getElementById('dashTodayOrders');
  if(elToday) elToday.textContent = todayOrders.length;
  const elTodaySub = document.getElementById('dashTodaySub');
  if(elTodaySub) elTodaySub.textContent = todayOrders.length? `${todayOrders.filter(o=>o.status==='delivered').length} تم تسليمه اليوم` : 'لا يوجد طلبات اليوم';

  const elSales = document.getElementById('dashTotalSales');
  if(elSales) elSales.textContent = formatMoney(totalSales);

  const elDue = document.getElementById('dashDueAmount');
  if(elDue) elDue.textContent = formatMoney(dueAmount);
  const elDueCount = document.getElementById('dashDueCount');
  if(elDueCount) elDueCount.textContent = `${dueCount} طلب غير مسدد`;

  const elOverdue = document.getElementById('dashOverdue');
  if(elOverdue) elOverdue.textContent = overdue;

  // secondary row
  const elDelivered = document.getElementById('dashDelivered');
  if(elDelivered) elDelivered.textContent = delivered;
  const elReady = document.getElementById('dashReady');
  if(elReady) elReady.textContent = ready;
  const elProcessing = document.getElementById('dashProcessing');
  if(elProcessing) elProcessing.textContent = processing;
  const elNew = document.getElementById('dashNew');
  if(elNew) elNew.textContent = newOrders;

  // Low stock
  const lowStock = [...fabrics.filter(f=> (parseFloat(f.quantity)||0) <= (parseFloat(f.minStock)||0) ), ...accessories.filter(a=> (parseFloat(a.quantity)||0) <= (parseFloat(a.minStock)||10) )];
  const alertDiv = document.getElementById('lowStockAlert');
  const listEl = document.getElementById('lowStockList');
  if(lowStock.length>0){
    if(alertDiv) alertDiv.classList.remove('hidden');
    if(listEl) listEl.innerHTML = lowStock.slice(0,5).map(f=>`<li class="flex items-center justify-between"><span class="flex items-center gap-2"><i class="fas fa-circle text-[6px] text-amber-500"></i> ${f.name}</span><span class="text-xs font-bold">${f.quantity} / ${f.minStock||10}</span></li>`).join('') + (lowStock.length>5?`<li class="text-xs text-amber-700 font-bold mt-1">+ ${lowStock.length-5} أصناف أخرى</li>`:'');
  } else {
    if(alertDiv) alertDiv.classList.add('hidden');
  }

  // Recent 5 orders
  const recent = orders.slice().sort((a,b)=>b.id-a.id).slice(0,5);
  const recentEl = document.getElementById('recentOrdersList');
  if(recentEl){
    recentEl.innerHTML = recent.length?`<div class="overflow-x-auto"><table><thead><tr><th>رقم</th><th>العميل</th><th>النوع</th><th>المبلغ</th><th>الحالة</th></tr></thead><tbody>${recent.map(o=>`<tr><td class="font-bold text-slate-700">ORD-${String(o.id).padStart(4,'0')}</td><td><div class="font-medium text-slate-700 truncate max-w-[120px]">${o.customerName||'—'}</div><div class="text-xs text-slate-400">${formatDate(o.orderDate)}</div></td><td>${o.type||'—'}</td><td class="font-bold text-slate-800">${formatMoney(o.total)} <span class="text-xs text-slate-400">ر.ي</span></td><td>${getStatusBadge(o.status)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state" style="padding:30px"><i class="fas fa-inbox" style="font-size:36px"></i><p>لا توجد طلبات</p></div>';
  }

  // Recent notifications
  const recentNotif = notifications.slice().sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  const notifEl = document.getElementById('recentNotifications');
  if(notifEl){
    if(recentNotif.length===0){
      notifEl.innerHTML = '<div class="text-center py-8 text-slate-400 text-sm">لا توجد إشعارات</div>';
    } else {
      notifEl.innerHTML = recentNotif.map(n=>{
        const icon = n.type==='whatsapp'?'fab fa-whatsapp':'fas fa-triangle-exclamation';
        const bg = n.type==='whatsapp'?'bg-emerald-50 border border-emerald-100':'bg-amber-50 border border-amber-100';
        const iconBg = n.type==='whatsapp'?'bg-emerald-500':'bg-amber-500';
        return `<div class="flex items-start gap-3 p-3.5 ${bg} rounded-xl"><div class="w-9 h-9 ${iconBg} rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 shadow-sm"><i class="${icon}"></i></div><div class="flex-1"><p class="text-sm text-slate-700 font-medium leading-relaxed">${n.message}</p><p class="text-xs text-slate-400 mt-1">${formatDate(n.createdAt)}</p></div></div>`;
      }).join('');
    }
  }

  const unread = notifications.filter(n=>!n.isRead).length;
  const badge = document.getElementById('notifBadge');
  if(badge) badge.classList.toggle('hidden', unread===0);
}

var selectedCustomerId = null;
var currentOrderFilter = 'all';
var invTab = 'fabrics';
var reportPeriod = 'month';
