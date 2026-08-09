const DB_NAME='TailorProDB',DB_VERSION=4;
let db;
function openDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{ db=request.result; resolve(db); }
    request.onupgradeneeded=(event)=>{
      const database=event.target.result;
      const stores=['customers','orders','fabrics','accessories','users','notifications','dressTypes','colors'];
      stores.forEach(store=>{
        if(!database.objectStoreNames.contains(store)){
          database.createObjectStore(store,{keyPath:'id',autoIncrement:true});
        }
      });
      // Migration: remove legacy flat measurement fields (old system used flat keys inside customer)
      // New system uses customer.measurements object — keep it.
      if(event.oldVersion<4 && database.objectStoreNames.contains('customers')){
        try{
          const store=event.currentTarget.transaction.objectStore('customers');
          const cursorRequest=store.openCursor();
          const legacyKeys=[
            'length','shoulder','chest','waist','sleeveLength','wrist','neck','arm',
            'frontLength','backLength','step','clearance','handType','handMeasurements','neckType','dressType','jabzorType',
            'mLength','mShoulder','mChest','mWaist','mSleeve','mWrist','mNeck','mArm',
            'shoulderSlope','hip','jabzor','jabzorShape','clearanceValue','hand','neckTypeValue','widthValue'
          ];
          cursorRequest.onsuccess=(cursorEvent)=>{
            const cursor=cursorEvent.target.result;
            if(!cursor) return;
            const customer=cursor.value;
            let changed=false;
            legacyKeys.forEach(key=>{ if(key in customer){ delete customer[key]; changed=true; } });
            // Also ensure measurements is an object if exists, otherwise leave undefined
            if(changed) cursor.update(customer);
            cursor.continue();
          };
        } catch(e){ console.warn('migration failed', e); }
      }
    };
  });
}

async function addData(store,data){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite'),st=tx.objectStore(store),req=st.add(data);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
async function putData(store,data){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite'),st=tx.objectStore(store),req=st.put(data);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
async function getAll(store){return new Promise((res,rej)=>{const tx=db.transaction(store,'readonly'),st=tx.objectStore(store),req=st.getAll();req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
async function getById(store,id){return new Promise((res,rej)=>{const tx=db.transaction(store,'readonly'),st=tx.objectStore(store),req=st.get(id);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
async function deleteData(store,id){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite'),st=tx.objectStore(store),req=st.delete(id);req.onsuccess=()=>res();req.onerror=()=>rej(req.error)})}

async function seedDemoData(){
const customers=await getAll('customers');
if(customers.length>0) return;
await addData('customers',{name:'علي بن مسعد بن علي الصيادي',phone:'775292792',notes:'يفضل أن يكون الكتف واسع',createdAt:new Date().toISOString()});
await addData('customers',{name:'خالد الشمري',phone:'0567890123',notes:'',createdAt:new Date().toISOString()});
await addData('customers',{name:'سلطان الحربي',phone:'0543210987',notes:'',createdAt:new Date().toISOString()});
await addData('customers',{name:'محمد العتيبي',phone:'0501234567',notes:'',createdAt:new Date().toISOString()});
await addData('fabrics',{name:'سلك كوري فاخر',color:'كريمي',buyPrice:35,sellPrice:60,quantity:66,minStock:10,createdAt:new Date().toISOString()});
await addData('fabrics',{name:'سلك ياباني ممتاز',color:'أبيض',buyPrice:45,sellPrice:75,quantity:50,minStock:15,createdAt:new Date().toISOString()});
await addData('fabrics',{name:'قطن طبيعي 100%',color:'أبيض طبيعي',buyPrice:60,sellPrice:110,quantity:1.5,minStock:15,createdAt:new Date().toISOString()});
await addData('accessories',{name:'أزرار ثياب بيضاء بلاستيك',quantity:15,minStock:20,createdAt:new Date().toISOString()});
await addData('accessories',{name:'سحابات مخفية 25سم',quantity:8,minStock:10,createdAt:new Date().toISOString()});
await addData('users',{name:'علي الصيادي (المدير)',username:'admin',password:'admin123',role:'admin',createdAt:new Date().toISOString()});
await addData('users',{name:'أحمد (الموظف)',username:'employee',password:'emp123',role:'employee',createdAt:new Date().toISOString()});
const now=new Date().toISOString().split('T')[0];
const delivery=new Date(Date.now()+10*86400000).toISOString().split('T')[0];
await addData('orders',{customerId:1,customerName:'علي بن مسعد بن علي الصيادي',customerPhone:'775292792',type:'ثوب إماراتي',fabricId:1,fabricName:'سلك كوري فاخر',color:'كحلي',orderDate:now,deliveryDate:delivery,total:15000,paid:12000,remaining:3000,status:'delivered',notes:'مطرز طبيعي %100',createdAt:new Date().toISOString()});
await addData('orders',{customerId:2,customerName:'خالد الشمري',customerPhone:'0567890123',type:'ثوب مطرز',fabricId:1,fabricName:'سلك كوري فاخر',color:'كحلي',orderDate:now,deliveryDate:delivery,total:23000,paid:23000,remaining:0,status:'delivered',notes:'',createdAt:new Date().toISOString()});
await addData('orders',{customerId:4,customerName:'محمد العتيبي',customerPhone:'0501234567',type:'ثوب قطري',fabricId:1,fabricName:'سلك كوري فاخر',color:'زيتي',orderDate:now,deliveryDate:delivery,total:19000,paid:0,remaining:19000,status:'delivered',notes:'',createdAt:new Date().toISOString()});
await addData('orders',{customerId:3,customerName:'سلطان الحربي',customerPhone:'0543210987',type:'ثوب سعودي كلاسيك',fabricId:1,fabricName:'سلك كوري فاخر',color:'زيتي',orderDate:now,deliveryDate:delivery,total:12000,paid:0,remaining:12000,status:'delivered',notes:'',createdAt:new Date().toISOString()});
await addData('orders',{customerId:1,customerName:'علي بن مسعد بن علي الصيادي',customerPhone:'775292792',type:'ثوب سعودي كلاسيك',fabricId:1,fabricName:'سلك كوري فاخر',color:'كحلي',orderDate:now,deliveryDate:delivery,total:12000,paid:12000,remaining:0,status:'delivered',notes:'',createdAt:new Date().toISOString()});
await addData('notifications',{type:'whatsapp',message:'تم تجهيز طلب ORD-0001 للعميل علي بن مسعد',createdAt:new Date().toISOString(),isRead:false});
await addData('notifications',{type:'whatsapp',message:'تم تجهيز طلب ORD-0002 للعميل خالد الشمري',createdAt:new Date().toISOString(),isRead:false});
await addData('notifications',{type:'stock',message:'تنبيه: مخزون قماش قطن طبيعي 100% منخفض جداً (1.50 وار)',createdAt:new Date().toISOString(),isRead:false});
await addData('dressTypes',{name:'ثوب إماراتي',defaultPrice:15000,createdAt:new Date().toISOString()});
await addData('dressTypes',{name:'ثوب سعودي كلاسيك',defaultPrice:12000,createdAt:new Date().toISOString()});
await addData('dressTypes',{name:'ثوب سعودي سديري',defaultPrice:18000,createdAt:new Date().toISOString()});
await addData('dressTypes',{name:'ثوب قطري',defaultPrice:19000,createdAt:new Date().toISOString()});
await addData('dressTypes',{name:'ثوب كويتي',defaultPrice:14000,createdAt:new Date().toISOString()});
await addData('dressTypes',{name:'ثوب عماني',defaultPrice:13000,createdAt:new Date().toISOString()});
await addData('dressTypes',{name:'ثوب مطرز',defaultPrice:23000,createdAt:new Date().toISOString()});
await addData('colors',{name:'كحلي',code:'#1e3a5f',createdAt:new Date().toISOString()});
await addData('colors',{name:'أبيض',code:'#ffffff',createdAt:new Date().toISOString()});
await addData('colors',{name:'زيتي',code:'#556b2f',createdAt:new Date().toISOString()});
await addData('colors',{name:'كريمي',code:'#f5f5dc',createdAt:new Date().toISOString()});
await addData('colors',{name:'أبيض طبيعي',code:'#faf0e6',createdAt:new Date().toISOString()});
}
