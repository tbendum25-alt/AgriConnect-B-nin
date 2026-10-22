import { supabase } from '../lib/supabase'
import { DEMO_PRODUCTS,DEMO_CATEGORIES } from '../constants'
const SEL='*, categories(name,slug)'
const ck=r=>{if(r.error)throw r.error;return r.data}
export const listCategories=async()=>supabase?ck(await supabase.from('categories').select('*').eq('is_active',true).order('sort_order')):DEMO_CATEGORIES
export const listProducts=async()=>supabase?ck(await supabase.from('products').select(SEL).eq('status','approved').order('created_at',{ascending:false})):DEMO_PRODUCTS
export async function getProduct(id){
 if(!supabase) return DEMO_PRODUCTS.find(p=>p.id===id)||null
 const {data,error}=await supabase.from('products').select(SEL).eq('id',id).maybeSingle(); if(error)throw error; if(!data)return null
 const s=await supabase.from('public_sellers').select('*').eq('id',data.seller_id).maybeSingle(); return {...data,seller:s.data}
}
export const listMine=async uid=>ck(await supabase.from('products').select(SEL).eq('seller_id',uid).order('created_at',{ascending:false}))
export async function createProduct(p,file,uid){
 let images=[]
 if(file){const path=`${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g,'_')}`;ck(await supabase.storage.from('product-images').upload(path,file));images=[supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl]}
 return ck(await supabase.from('products').insert({...p,seller_id:uid,images,status:'pending'}).select().single())
}
export const updateMine=async(id,patch)=>ck(await supabase.from('products').update(patch).eq('id',id))
export const adminList=async()=>ck(await supabase.from('products').select(SEL).order('created_at',{ascending:false}))
export const adminSetStatus=async(id,status,reason=null)=>ck(await supabase.from('products').update({status,rejection_reason:reason}).eq('id',id))
export async function adminStats(){
 const n=async q=>(await q).count||0, h={count:'exact',head:true}
 const [users,farmers,buyers,products,pending,approved,rejected,reports]=await Promise.all([
  n(supabase.from('profiles').select('*',h)),n(supabase.from('profiles').select('*',h).eq('role','farmer')),n(supabase.from('profiles').select('*',h).eq('role','buyer')),
  n(supabase.from('products').select('*',h)),n(supabase.from('products').select('*',h).eq('status','pending')),n(supabase.from('products').select('*',h).eq('status','approved')),n(supabase.from('products').select('*',h).eq('status','rejected')),n(supabase.from('reports').select('*',h).eq('status','pending'))])
 return {users,farmers,buyers,products,pending,approved,rejected,reports}
}
export const listFavs=async uid=>ck(await supabase.from('favorites').select('product_id, products(*, categories(name,slug))').eq('user_id',uid))
export const addFav=async(uid,pid)=>ck(await supabase.from('favorites').upsert({user_id:uid,product_id:pid}))
export const removeFav=async(uid,pid)=>ck(await supabase.from('favorites').delete().eq('user_id',uid).eq('product_id',pid))
export const report=async(r)=>ck(await supabase.from('reports').insert(r))
export const sendContact=async(m)=>ck(await supabase.from('contact_messages').insert(m))
// --- Administration (étape 1) ---
export const adminUsers=async()=>ck(await supabase.from('profiles').select('*').order('created_at',{ascending:false}))
export const adminSetAccount=async(id,account_status)=>ck(await supabase.from('profiles').update({account_status}).eq('id',id))
export const adminCategories=async()=>ck(await supabase.from('categories').select('*').order('sort_order'))
export const adminSaveCategory=async(c)=>ck(await supabase.from('categories').upsert(c))
export const adminDeleteCategory=async(id)=>ck(await supabase.from('categories').delete().eq('id',id))
export const adminReports=async()=>ck(await supabase.from('reports').select('*, products(id,name,status)').order('created_at',{ascending:false}))
export const adminHandleReport=async(id)=>ck(await supabase.from('reports').update({status:'handled'}).eq('id',id))
