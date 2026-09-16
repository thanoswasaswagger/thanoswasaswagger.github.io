import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const URL='https://dmmjlsrdohdzwcyfnlgt.supabase.co';
const KEY='sb_publishable_Nb1BJiz1m9W-qLtiOrJpsw_s6PsrBXi';
const sb=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'itar-lok-admin-auth'}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const imageUrl=p=>/^https?:\/\//i.test(p||'')?p:sb.storage.from('product-images').getPublicUrl(p||'').data.publicUrl;
let activeDigital=null;

const style=document.createElement('style');
style.textContent=`
.v4panel{border:1px solid #fed7aa;border-radius:18px;padding:14px;background:linear-gradient(135deg,#fff,#fffaf5)}
.v4head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.v4gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:10px;margin-top:12px}
.v4tile{position:relative;border:1px solid #e4e4e7;border-radius:15px;background:#fff;overflow:hidden;min-height:116px}
.v4tile img{width:100%;height:105px;object-fit:contain;background:#fafafa;display:block}
.v4actions{display:flex;gap:4px;padding:6px;flex-wrap:wrap}.v4actions button{font-size:9px;padding:5px 7px;border:0;border-radius:8px;font-weight:800;cursor:pointer}.v4cover{background:#ffedd5;color:#9a3412}.v4delete{background:#fee2e2;color:#991b1b}
.v4digital{margin-top:12px}.v4digital input,.v4digital select{width:100%;border:1px solid #e8e8e3;border-radius:12px;padding:11px;background:#fff}
.v4status{font-size:11px;margin-top:8px;color:#71717a}.v4ok{color:#166534;font-weight:800}.v4warn{color:#9a3412;font-weight:800}
`;
document.head.appendChild(style);

function selectedCategoryName(){const s=$('pCategory');return String(s?.options?.[s.selectedIndex]?.textContent||'').trim().toLowerCase()}
function kindFromForm(){const n=selectedCategoryName();if(n==='sadhna')return'sadhna';if(n==='mantra')return'mantra';return null}
function currentProductId(){return $('productId')?.value||''}

const baseImageField=$('pImages')?.closest('.field');
if(baseImageField){
  const label=baseImageField.querySelector('label');
  if(label)label.textContent='Primary product image(s) — 1 required for a new product';
  const extra=document.createElement('div');
  extra.id='v4ExtraImages';extra.className='v4panel';
  extra.innerHTML=`<div class="v4head"><div><b>Product image gallery</b><div class="muted" style="font-size:11px">Keep the first image as the cover, then add as many extra product photos as needed.</div></div><button id="v4MoreImagesBtn" type="button" class="btn secondary">+ Upload more images</button></div><input id="v4MoreImages" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden><div id="v4ProductGallery" class="v4gallery"></div><div id="v4ImageStatus" class="v4status"></div>`;
  baseImageField.after(extra);
  $('v4MoreImagesBtn').onclick=()=>{if(!currentProductId()){alert('Save the new product first. You can select multiple images in the main image field now, then use Upload more images whenever you edit it.');return}$('v4MoreImages').click()};
  $('v4MoreImages').onchange=async()=>{const files=[...$('v4MoreImages').files];if(!files.length)return;await uploadExtraImages(currentProductId(),files);$('v4MoreImages').value='';await renderProductGallery()};
}

async function uploadExtraImages(productId,files){
  const status=$('v4ImageStatus');if(status)status.textContent='Uploading images…';
  const {data:existing,error:qe}=await sb.from('product_images').select('sort_order').eq('product_id',productId).order('sort_order',{ascending:false}).limit(1);if(qe)throw qe;
  let order=(existing?.[0]?.sort_order??-10)+10;
  for(const f of files){
    if(f.size>5*1024*1024){if(status)status.textContent=`${f.name} is over the 5 MB product-image limit.`;continue}
    if(!/^image\/(jpeg|png|webp|avif)$/i.test(f.type)){if(status)status.textContent=`${f.name} is not a supported image.`;continue}
    const ext=(f.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase();const path=`${productId}/${crypto.randomUUID()}.${ext}`;
    const {error:ue}=await sb.storage.from('product-images').upload(path,f,{contentType:f.type,cacheControl:'3600',upsert:false});if(ue)throw ue;
    const {error:ie}=await sb.from('product_images').insert({product_id:productId,storage_path:path,alt_text:$('pName')?.value?.trim()||'Product image',sort_order:order});if(ie){await sb.storage.from('product-images').remove([path]);throw ie}order+=10;
  }
  if(status)status.innerHTML='<span class="v4ok">Images uploaded. They will appear in the app gallery automatically.</span>';
}

async function renderProductGallery(){
  const root=$('v4ProductGallery');if(!root)return;const id=currentProductId();root.innerHTML='';if(!id){root.innerHTML='<div class="muted" style="font-size:11px">For a new product, select one or more images above. After saving, this becomes the permanent gallery manager.</div>';return}
  const {data,error}=await sb.from('product_images').select('*').eq('product_id',id).order('sort_order',{ascending:true}).order('created_at',{ascending:true});if(error){root.textContent=error.message;return}
  const rows=data||[];if(!rows.length){root.innerHTML='<div class="v4warn">This product has no image. Upload at least one image before publishing.</div>';return}
  root.innerHTML=rows.map((x,i)=>`<div class="v4tile"><img src="${esc(imageUrl(x.storage_path))}" alt="${esc(x.alt_text||'Product image')}"><div class="v4actions">${i===0?'<span class="chip live">COVER</span>':`<button type="button" class="v4cover" data-v4-cover="${x.id}">Set cover</button>`}<button type="button" class="v4delete" data-v4-delete="${x.id}" data-path="${esc(x.storage_path)}">Delete</button></div></div>`).join('');
  root.querySelectorAll('[data-v4-delete]').forEach(b=>b.onclick=async()=>{if(rows.length<=1){alert('At least one product image is required. Upload another image before deleting this one.');return}if(!confirm('Delete this product image?'))return;const {error}=await sb.from('product_images').delete().eq('id',b.dataset.v4Delete);if(error){alert(error.message);return}if(b.dataset.path&&!/^https?:/i.test(b.dataset.path))await sb.storage.from('product-images').remove([b.dataset.path]);await normalizeImageOrder(id);await renderProductGallery()});
  root.querySelectorAll('[data-v4-cover]').forEach(b=>b.onclick=async()=>{const chosen=rows.find(x=>x.id===b.dataset.v4Cover);if(!chosen)return;await sb.from('product_images').update({sort_order:-10}).eq('id',chosen.id);await normalizeImageOrder(id);await renderProductGallery()});
}
async function normalizeImageOrder(id){const {data}=await sb.from('product_images').select('id,sort_order,created_at').eq('product_id',id).order('sort_order').order('created_at');for(let i=0;i<(data||[]).length;i++)await sb.from('product_images').update({sort_order:i*10}).eq('id',data[i].id)}

const digital=document.createElement('div');digital.id='v4DigitalPanel';digital.className='v4panel v4digital hidden';digital.innerHTML=`<div class="v4head"><div><b id="v4DigitalTitle">Protected digital content</b><div id="v4DigitalHelp" class="muted" style="font-size:11px"></div></div><span class="chip live">PRIVATE</span></div><div id="v4AccessWrap" class="field" style="margin-top:10px"><label>Access</label><select id="v4Access"><option value="paid">Paid — Buy Now required</option><option value="free">Free — opens without payment</option></select></div><div class="field" style="margin-top:10px"><label id="v4FileLabel">Digital file</label><input id="v4DigitalFile" type="file"></div><div id="v4DigitalStatus" class="v4status"></div>`;
$('v4ExtraImages')?.after(digital);

async function refreshDigitalPanel(){
  const kind=kindFromForm();digital.classList.toggle('hidden',!kind);activeDigital=null;if(!kind)return;
  const file=$('v4DigitalFile'), access=$('v4Access'), wrap=$('v4AccessWrap');
  if(kind==='sadhna'){ $('v4DigitalTitle').textContent='Sadhna PDF';$('v4DigitalHelp').textContent='Protected PDF product. The normal price and Buy Now flow remain active. No app-level PDF size cap is imposed.';$('v4FileLabel').textContent='Upload / replace Sadhna PDF';file.accept='application/pdf,.pdf';access.value='paid';wrap.classList.add('hidden') }
  else { $('v4DigitalTitle').textContent='Mantra content';$('v4DigitalHelp').textContent='Upload the mantra as a PDF or image. Choose whether it is free or paid.';$('v4FileLabel').textContent='Upload / replace Mantra image or PDF';file.accept='application/pdf,.pdf,image/jpeg,image/png,image/webp,image/avif';wrap.classList.remove('hidden') }
  const id=currentProductId();if(!id){$('v4DigitalStatus').textContent='A digital file is required when creating this product.';return}
  const {data}=await sb.from('digital_documents').select('*').eq('product_id',id).maybeSingle();activeDigital=data||null;
  const {data:p}=await sb.from('products').select('price_paise,metadata').eq('id',id).maybeSingle();if(kind==='mantra')access.value=(p?.metadata?.access_type==='free'||Number(p?.price_paise||0)===0)?'free':'paid';
  $('v4DigitalStatus').innerHTML=data?`<span class="v4ok">Current file: ${esc(data.file_name)} • ${esc(data.media_kind.toUpperCase())}</span>`:'<span class="v4warn">No digital file uploaded yet.</span>';
}
$('pCategory')?.addEventListener('change',()=>setTimeout(refreshDigitalPanel,0));
document.addEventListener('click',e=>{if(e.target.closest('#newProduct,[data-edit]'))setTimeout(async()=>{await renderProductGallery();await refreshDigitalPanel()},120)});

function validateDigitalSelection(){
  const kind=kindFromForm();if(!kind)return true;const file=$('v4DigitalFile')?.files?.[0];const isNew=!currentProductId();if(isNew&&!file){alert(`${kind==='sadhna'?'Sadhna PDF':'Mantra file'} is required.`);return false}
  if(kind==='sadhna'&&file&&file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){alert('Sadhna products accept PDF files only.');return false}
  if(kind==='mantra'&&file&&!['application/pdf','image/jpeg','image/png','image/webp','image/avif'].includes(file.type)&&!file.name.toLowerCase().endsWith('.pdf')){alert('Mantra content must be a PDF, JPG, PNG, WEBP or AVIF image.');return false}
  const access=kind==='sadhna'?'paid':$('v4Access').value;if(access==='free'){if($('pPrice'))$('pPrice').value='0';if($('pCompare'))$('pCompare').value=''}else if(Number($('pPrice')?.value||0)<=0){alert('Enter a price greater than ₹0 for a paid digital product.');return false}
  return true;
}

document.addEventListener('submit',e=>{if(e.target?.id!=='productForm')return;if(!validateDigitalSelection()){e.preventDefault();e.stopImmediatePropagation();return}const kind=kindFromForm();if(!kind)return;const snap={started:Date.now(),existing:currentProductId(),name:$('pName').value.trim(),categoryId:$('pCategory').value,kind,access:kind==='sadhna'?'paid':$('v4Access').value,file:$('v4DigitalFile')?.files?.[0]||null};setTimeout(()=>finishDigitalSave(snap),100)},true);

async function locateSavedProduct(s){if(s.existing)return s.existing;for(let i=0;i<40;i++){await sleep(300);const {data}=await sb.from('products').select('id,created_at').eq('name',s.name).eq('category_id',s.categoryId).order('created_at',{ascending:false}).limit(1);if(data?.[0]&&new Date(data[0].created_at).getTime()>=s.started-4000)return data[0].id}return null}
async function finishDigitalSave(s){
  const id=await locateSavedProduct(s);if(!id)return;const {data:p}=await sb.from('products').select('metadata').eq('id',id).maybeSingle();const metadata={...(p?.metadata||{}),digital_kind:s.kind,access_type:s.access};
  if(s.access==='free')await sb.from('products').update({price_paise:0,compare_at_price_paise:null,metadata}).eq('id',id);else await sb.from('products').update({metadata}).eq('id',id);
  if(!s.file)return;
  try{await saveDigitalFile(id,s.kind,s.file);$('v4DigitalFile').value='';await refreshDigitalPanel()}catch(err){console.error(err);await sb.from('products').update({is_published:false}).eq('id',id);alert('The product was saved as a draft because the protected file upload failed: '+(err?.message||err))}
}
async function saveDigitalFile(productId,kind,file){
  const isPdf=file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf');if(kind==='sadhna'&&!isPdf)throw new Error('Sadhna requires a PDF.');if(kind==='mantra'&&!isPdf&&!/^image\/(jpeg|png|webp|avif)$/i.test(file.type))throw new Error('Unsupported Mantra file type.');
  const ext=(file.name.split('.').pop()||(isPdf?'pdf':'bin')).replace(/[^a-z0-9]/gi,'').toLowerCase();const path=`${kind}/${productId}/${crypto.randomUUID()}.${ext}`;
  $('v4DigitalStatus').textContent='Uploading protected content…';
  const {error:ue}=await sb.storage.from('digital-content').upload(path,file,{contentType:file.type||(isPdf?'application/pdf':'application/octet-stream'),cacheControl:'0',upsert:false});if(ue)throw ue;
  const {data:old}=await sb.from('digital_documents').select('bucket_id,storage_path').eq('product_id',productId).maybeSingle();const row={product_id:productId,bucket_id:'digital-content',storage_path:path,file_name:file.name,file_size:file.size,mime_type:file.type||(isPdf?'application/pdf':'application/octet-stream'),media_kind:isPdf?'pdf':'image',is_published:true,updated_at:new Date().toISOString()};
  const {error:de}=await sb.from('digital_documents').upsert(row,{onConflict:'product_id'});if(de){await sb.storage.from('digital-content').remove([path]);throw de}if(old?.storage_path&&old.storage_path!==path)await sb.storage.from(old.bucket_id||'digital-content').remove([old.storage_path]);
  const {data:p}=await sb.from('products').select('metadata').eq('id',productId).maybeSingle();await sb.from('products').update({metadata:{...(p?.metadata||{}),content_type:isPdf?'pdf':'image'}}).eq('id',productId);
  $('v4DigitalStatus').innerHTML='<span class="v4ok">Protected digital content uploaded successfully.</span>';
}

setTimeout(async()=>{await renderProductGallery();await refreshDigitalPanel()},500);
