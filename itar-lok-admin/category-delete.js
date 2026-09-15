import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const URL='https://dmmjlsrdohdzwcyfnlgt.supabase.co';
const KEY='sb_publishable_Nb1BJiz1m9W-qLtiOrJpsw_s6PsrBXi';
const supabase=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'itar-lok-admin-auth'}});

const select=document.getElementById('pCategory');
const control=select?.closest('.categoryControl');
if(select&&control){
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='deleteSelectedCategory';
  btn.className='btn danger hidden';
  btn.textContent='Delete selected category';
  btn.style.gridColumn='1 / -1';
  control.appendChild(btn);

  const sync=()=>btn.classList.toggle('hidden',!select.value);
  select.addEventListener('change',sync);
  sync();

  btn.addEventListener('click',async()=>{
    const categoryId=select.value;
    if(!categoryId)return;
    const option=select.options[select.selectedIndex];
    const categoryName=option?.textContent?.trim()||'this category';

    btn.disabled=true;
    const oldText=btn.textContent;
    btn.textContent='Checking…';

    const {count,error:countError}=await supabase
      .from('products')
      .select('id',{count:'exact',head:true})
      .eq('category_id',categoryId);

    if(countError){
      alert(`Could not check this category: ${countError.message}`);
      btn.disabled=false;
      btn.textContent=oldText;
      return;
    }

    if((count||0)>0){
      alert(`${categoryName} still contains ${count} product${count===1?'':'s'}. Move or delete those products first, then delete the category.`);
      btn.disabled=false;
      btn.textContent=oldText;
      return;
    }

    if(!confirm(`Delete the category “${categoryName}” permanently?`)){
      btn.disabled=false;
      btn.textContent=oldText;
      return;
    }

    const {data:category,error:readError}=await supabase
      .from('categories')
      .select('image_path')
      .eq('id',categoryId)
      .single();

    if(readError){
      alert(`Could not read this category: ${readError.message}`);
      btn.disabled=false;
      btn.textContent=oldText;
      return;
    }

    btn.textContent='Deleting…';
    const {error:deleteError}=await supabase.from('categories').delete().eq('id',categoryId);
    if(deleteError){
      alert(`Category was not deleted: ${deleteError.message}`);
      btn.disabled=false;
      btn.textContent=oldText;
      return;
    }

    const imagePath=category?.image_path||'';
    if(imagePath&&!/^https?:\/\//i.test(imagePath)){
      await supabase.storage.from('product-images').remove([imagePath]);
    }

    alert(`${categoryName} was deleted.`);
    location.reload();
  });
}
