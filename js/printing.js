async function printInvoice(orderId){
  const o = await getById('orders', orderId);
  if(!o) return;
  const customer = await getById('customers', o.customerId);
  const m = customer?.measurements || null;

  // Build HTML invoice
  const html = buildInvoiceHTML(o, customer, m, 'فاتورة');
  const preview = document.getElementById('invoicePreview');
  if(preview) preview.innerHTML = html;

  // Also generate PDF for download using jsPDF with improved layout
  try {
    const {jsPDF} = window.jspdf;
    const doc = new jsPDF({unit:'mm', format:'a4', orientation:'portrait'});
    // Use simple text rendering - Arabic may not render perfectly in jsPDF but we provide HTML print as primary
    // For now, trigger browser print of HTML
    openModal('invoiceModal');
    showToast('تم تجهيز الفاتورة للطباعة');
  } catch(e){
    openModal('invoiceModal');
  }
}

async function printQuotation(orderId){
  const o = await getById('orders', orderId);
  if(!o) return;
  const customer = await getById('customers', o.customerId);
  const html = buildInvoiceHTML(o, customer, null, 'عرض سعر');
  const preview = document.getElementById('invoicePreview');
  if(preview) preview.innerHTML = html;
  openModal('invoiceModal');
  showToast('تم تجهيز عرض السعر');
}

function buildInvoiceHTML(order, customer, measurements, title){
  const num = 'ORD-' + String(order.id).padStart(4,'0');
  const date = formatDate(order.orderDate);
  const delivery = formatDate(order.deliveryDate);
  const statusMap = {new:'جديد', processing:'تحت التنفيذ', ready:'جاهز للاستلام', delivered:'تم التسليم', cancelled:'ملغي'};
  const status = statusMap[order.status] || order.status;
  
  const hasM = measurements && typeof hasAnyMeasurement==='function' && hasAnyMeasurement(measurements);
  let measurementsHTML = '';
  if(hasM){
    const body = measurements.body||{};
    const jabzor = measurements.jabzor||{};
    const lengths = measurements.lengths||{};
    const hand = measurements.hand||{};
    const neck = measurements.neck||{};
    const width = measurements.width||{};
    const jabzorTypeMap = {zip:'سحاب', buttonVisible:'زرار باين', buttonHidden:'زرار مخفي'};
    const shapeMap = {square:'مربع', triangle:'مثلث'};
    const handMap = {plain:'ساده', cuff:'كبك'};
    const neckMap = {qallabAdi:'قلاب عادي', malaki:'ملكي', faransi:'فرنسي', sadaMadawar:'سادة مدور', sadaMurabba:'سادة مربع'};
    measurementsHTML = `
      <div style="margin-top:14px; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
        <div style="background:#f8fafc; padding:10px 14px; font-weight:800; font-size:.85rem; border-bottom:1px solid #e2e8f0;"><i class="fas fa-ruler-combined" style="margin-left:6px; color:#6366f1"></i> القياسات الأساسية</div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; font-size:.82rem;">
          <div style="padding:12px; border-left:1px solid #f1f5f9;">
            <div style="font-weight:800; margin-bottom:8px; color:#0f172a;">قياسات الجسم</div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">ميلان الكتف</span><span style="font-weight:800; color:#dc2626">${body.shoulderSlope||'—'}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">الورك</span><span style="font-weight:800; color:#dc2626">${body.hip||'—'}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">الصدر</span><span style="font-weight:800; color:#dc2626">${body.chest||'—'}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0;"><span style="color:#64748b">الخطوة</span><span style="font-weight:800">${body.step||'—'}</span></div>
          </div>
          <div style="padding:12px; border-left:1px solid #f1f5f9;">
            <div style="font-weight:800; margin-bottom:8px; color:#0f172a;">الجبزور</div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">النوع</span><span style="font-weight:700">${jabzorTypeMap[jabzor.type]||'—'}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">الشكل</span><span style="font-weight:700">${shapeMap[jabzor.shape]||'—'}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0;"><span style="color:#64748b">التخاليص</span><span style="font-weight:800">${jabzor.clearance||'—'}</span></div>
            <div style="margin-top:6px; font-size:.7rem; color:#94a3b8;">التخاليص قياس مستقل</div>
          </div>
          <div style="padding:12px;">
            <div style="font-weight:800; margin-bottom:8px; color:#0f172a;">الطول و اليد و الرقبة</div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">طول أمام / خلف</span><span style="font-weight:700">${lengths.front||'—'} / ${lengths.back||'—'}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">اليد</span><span style="font-weight:700">${handMap[hand.type]||'—'}${hand.measurement? ' — '+hand.measurement:''}</span></div>
            ${hand.extra?.some(v=>v)?`<div style="font-size:.72rem; color:#64748b; padding:2px 0;">إضافي: ${hand.extra.filter(v=>v).join(' • ')}</div>`:''}
            <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #f1f5f9;"><span style="color:#64748b">الرقبة</span><span style="font-weight:700">${neck.measurement||'—'}${neck.type? ' — '+(neckMap[neck.type]||neck.type):''}</span></div>
            <div style="display:flex; justify-content:space-between; padding:4px 0;"><span style="color:#64748b">الوسع</span><span style="font-weight:800">${width.measurement||'—'}${width.dressTypeName? ' — '+width.dressTypeName:''}</span></div>
          </div>
        </div>
      </div>
    `;
  }

  return `
  <div class="invoice-paper" dir="rtl" style="font-family:'Tajawal',sans-serif">
    <div class="invoice-header">
      <div>
        <h2 style="margin:0; display:flex; align-items:center; gap:10px;"><span style="background:#2563eb; width:36px; height:36px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center;"><i class="fas fa-cut" style="font-size:16px;"></i></span> الخياط برو</h2>
        <p style="margin:6px 0 0; opacity:.7; font-size:.8rem;">نظام إدارة الخياطة — ${title}</p>
      </div>
      <div style="text-align:left; font-size:.85rem; line-height:1.6;">
        <div style="font-weight:800; font-size:1.1rem;">${title} #${num}</div>
        <div style="opacity:.8;">${date} • ${status}</div>
        <div style="margin-top:6px; background:rgba(255,255,255,.12); padding:4px 10px; border-radius:999px; font-size:.75rem; display:inline-block;">تاريخ التسليم: ${delivery}</div>
      </div>
    </div>

    <div class="invoice-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:.88rem;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px;">
          <div style="font-weight:800; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px;"><i class="fas fa-user" style="color:#94a3b8"></i> بيانات العميل</div>
          <div style="font-weight:800; font-size:.95rem;">${order.customerName|| customer?.name || '—'}</div>
          <div style="color:#64748b; margin-top:4px;"><i class="fas fa-phone" style="margin-left:6px;"></i>${order.customerPhone|| customer?.phone || '—'}</div>
          ${customer?.notes?`<div style="margin-top:8px; padding:8px; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; font-size:.8rem; color:#92400e;"><i class="fas fa-sticky-note" style="margin-left:6px;"></i>${customer.notes}</div>`:''}
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px;">
          <div style="font-weight:800; color:#0f172a; margin-bottom:8px;"><i class="fas fa-shirt" style="color:#94a3b8; margin-left:6px;"></i> تفاصيل الثوب</div>
          <div><span style="color:#64748b">النوع:</span> <span style="font-weight:700;">${order.type||'—'}</span></div>
          <div style="margin-top:4px;"><span style="color:#64748b">القماش:</span> <span style="font-weight:700;">${order.fabricName||'—'}</span> <span style="color:#94a3b8">•</span> ${order.color||'—'}</div>
          <div style="margin-top:4px;"><span style="color:#64748b">الحالة:</span> ${status}</div>
          ${order.notes?`<div style="margin-top:8px; font-size:.82rem; color:#475569; background:#fff; border:1px solid #e2e8f0; padding:8px; border-radius:8px;">ملاحظات: ${order.notes}</div>`:''}
        </div>
      </div>

      ${measurementsHTML}

      <table class="invoice-table" style="margin-top:16px;">
        <thead><tr><th style="width:50%">البيان</th><th style="width:25%">الكمية</th><th style="width:25%">المبلغ</th></tr></thead>
        <tbody>
          <tr><td>تفصيل ${order.type||'ثوب'} — ${order.fabricName||''} ${order.color||''}</td><td style="text-align:center">1</td><td style="text-align:left; font-weight:800;">${formatMoney(order.total)} ر.ي</td></tr>
        </tbody>
      </table>

      <div style="display:grid; grid-template-columns:1fr 320px; gap:16px; margin-top:16px;">
        <div style="font-size:.82rem; color:#64748b; line-height:1.7;">
          <div style="font-weight:800; color:#0f172a; margin-bottom:6px;">ملاحظات:</div>
          <ul style="margin:0; padding-right:16px;">
            <li>الرجاء إحضار الفاتورة عند الاستلام</li>
            <li>التسليم خلال المدة المحددة أعلاه</li>
            <li>شكراً لثقتكم بنا</li>
          </ul>
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f1f5f9; font-size:.88rem;"><span style="color:#64748b">الإجمالي</span><span style="font-weight:900;">${formatMoney(order.total)} ر.ي</span></div>
          <div style="display:flex; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #f1f5f9; font-size:.88rem;"><span style="color:#64748b">المدفوع (عربون)</span><span style="font-weight:700; color:#059669;">${formatMoney(order.paid)} ر.ي</span></div>
          <div style="display:flex; justify-content:space-between; padding:12px 14px; background:${order.remaining>0?'#fef2f2':'#f0fdf4'}; font-weight:900; font-size:.95rem; color:${order.remaining>0?'#dc2626':'#059669'};"><span>المتبقي</span><span>${formatMoney(order.remaining)} ر.ي</span></div>
        </div>
      </div>

      <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; font-size:.82rem; color:#64748b; border-top:1px dashed #e2e8f0; padding-top:14px;">
        <span>توقيع المحل: ___________________</span>
        <span>توقيع العميل: ___________________</span>
      </div>
    </div>

    <div class="invoice-footer">
      الخياط برو — نظام إدارة الخياطة • ${new Date().toLocaleDateString('ar-SA')} • هذه الفاتورة صادرة من نظام أوفلاين
    </div>
  </div>
  `;
}

// legacy jsPDF simplified invoice (kept for compatibility)
async function legacyPrint(order){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:[80,180]});
  doc.setFillColor(37,99,235);doc.rect(0,0,80,18,'F');
  doc.setTextColor(255,255,255);doc.setFontSize(14);doc.text('الخياط برو',40,12,{align:'center'});
  doc.setTextColor(100,116,139);doc.setFontSize(8);doc.text('نظام إدارة الخياطة',40,22,{align:'center'});
  doc.setDrawColor(226,232,240);doc.line(5,26,75,26);
  doc.setTextColor(15,23,42);doc.setFontSize(10);doc.text('فاتورة طلب تفصيل',40,34,{align:'center'});
  doc.setFontSize(8);doc.setTextColor(71,85,105);
  doc.text('رقم الطلب: ORD-'+String(order.id).padStart(4,'0'),5,44);
  doc.text('العميل: '+order.customerName,5,50);
  doc.text('الجوال: '+order.customerPhone,5,56);
  doc.text('النوع: '+order.type,5,62);
  doc.text('القماش: '+(order.fabricName||'')+' - '+order.color,5,68);
  doc.text('تاريخ الطلب: '+formatDate(order.orderDate),5,74);
  doc.text('تاريخ التسليم: '+formatDate(order.deliveryDate),5,80);
  doc.setDrawColor(226,232,240);doc.line(5,86,75,86);
  doc.setFontSize(10);doc.setTextColor(15,23,42);doc.text('المبلغ الإجمالي:',5,96);doc.text(formatMoney(order.total)+' ر.ي',75,96,{align:'right'});
  doc.setTextColor(100,116,139);doc.text('العربون:',5,104);doc.text(formatMoney(order.paid)+' ر.ي',75,104,{align:'right'});
  doc.setTextColor(order.remaining>0?220:16,order.remaining>0?38:185,order.remaining>0?38:129);doc.setFontSize(11);doc.text('المتبقي:',5,114);doc.text(formatMoney(order.remaining)+' ر.ي',75,114,{align:'right'});
  doc.setDrawColor(226,232,240);doc.line(5,122,75,122);
  doc.setTextColor(148,163,184);doc.setFontSize(8);doc.text('شكراً لثقتكم بنا',40,132,{align:'center'});
  doc.save('invoice_ORD_'+String(order.id).padStart(4,'0')+'.pdf');
}
