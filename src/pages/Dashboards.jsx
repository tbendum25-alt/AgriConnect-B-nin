import { useEffect,useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listMine,createProduct,updateMine,listCategories,listFavs,removeFav } from '../services/products'
import { Loading,Empty,ErrorMsg,ProductCard,Img } from '../components/common'
import { COMMUNES,UNITS,STATUS } from '../constants'
import { fcfa } from '../utils/format'
const E0={name:'',category_id:'',description:'',price:'',unit:'kg',quantity:'',commune:'Cotonou',location_detail:''}
export function Farmer(){
 const {user,role}=useAuth(),[items,setItems]=useState(null),[cats,setCats]=useState([]),[f,setF]=useState(E0),[file,setFile]=useState(null),[err,setErr]=useState(''),[ok,setOk]=useState('')
 const load=()=>listMine(user.id).then(setItems).catch(e=>setErr(e.message))
 useEffect(()=>{load();listCategories().then(setCats)},[])
 if(role!=='farmer') return <ErrorMsg>Cet espace est réservé aux producteurs.</ErrorMsg>
 const set=k=>e=>setF({...f,[k]:e.target.value})
 const pick=e=>{const x=e.target.files[0];if(!x)return;if(!['image/jpeg','image/png','image/webp'].includes(x.type)||x.size>2097152){setErr('Image JPG, PNG ou WebP de 2 Mo maximum.');e.target.value='';return}setErr('');setFile(x)}
 const submit=async e=>{e.preventDefault();setErr('');setOk('')
  const price=+f.price,qty=+f.quantity
  if(f.name.trim().length<2||!f.category_id) return setErr('Nom et catégorie obligatoires.')
  if(!(price>0&&price<=10000000)||!(qty>0&&qty<=1000000)) return setErr('Prix (≤ 10 000 000) et quantité (≤ 1 000 000) doivent être positifs.')
  try{await createProduct({...f,name:f.name.trim(),price,quantity:qty},file,user.id);setF(E0);setFile(null);setOk('Annonce envoyée : elle sera visible après approbation.');load()}catch(x){setErr(x.message)}}
 const patch=async(id,p)=>{try{await updateMine(id,p);load()}catch(x){setErr(x.message)}}
 return <><h1>Espace producteur</h1><form className="form" onSubmit={submit}><h2>Nouvelle annonce</h2>
  <label>Produit<input value={f.name} onChange={set('name')}/></label><label>Catégorie<select value={f.category_id} onChange={set('category_id')}><option value="">Choisir…</option>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label>Description<textarea rows="3" value={f.description} onChange={set('description')}/></label>
  <label>Prix (FCFA)<input type="number" min="1" value={f.price} onChange={set('price')}/></label><label>Unité<select value={f.unit} onChange={set('unit')}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></label>
  <label>Quantité disponible<input type="number" min="1" value={f.quantity} onChange={set('quantity')}/></label><label>Commune<select value={f.commune} onChange={set('commune')}>{COMMUNES.map(c=><option key={c}>{c}</option>)}</select></label>
  <label>Précision de localisation (facultatif)<input value={f.location_detail} onChange={set('location_detail')}/></label>
  <label>Photo principale<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick}/></label>{file&&<img className="preview" src={URL.createObjectURL(file)} alt="Aperçu de la photo"/>}
  <button className="btn">Publier l'annonce</button>{err&&<p className="err" role="alert">{err}</p>}{ok&&<p className="okmsg">{ok}</p>}</form>
  <h2>Mes annonces</h2>{!items?<Loading/>:items.length?items.map(p=><div key={p.id} className="row item"><Img className="thumb" src={p.images?.[0]} alt=""/><div><b>{p.name}</b> · {fcfa(p.price)}/{p.unit} · {p.quantity} {p.unit}<br/><span className={'tag '+(p.status==='approved'?'':'warn')}>{STATUS[p.status]}</span>{p.rejection_reason&&<span className="err"> Motif : {p.rejection_reason}</span>}</div>
   <button className="btn small ghost" onClick={()=>patch(p.id,{is_available:!p.is_available})}>{p.is_available?'Marquer indisponible':'Marquer disponible'}</button>
   <button className="btn small ghost" onClick={()=>window.confirm('Archiver cette annonce ?')&&patch(p.id,{status:'archived'})}>Archiver</button></div>):<Empty>Aucune annonce. Créez la première ci-dessus.</Empty>}
  <p className="muted">Statistiques : {items?.length||0} annonce(s), {items?.filter(p=>p.status==='approved').length||0} publiée(s).</p></>
}
export function Buyer(){
 const {user}=useAuth(),[favs,setFavs]=useState(null),[err,setErr]=useState('')
 const load=()=>listFavs(user.id).then(setFavs).catch(e=>setErr(e.message));useEffect(()=>{load()},[])
 return <><h1>Espace acheteur</h1><h2>Mes favoris</h2>{err&&<ErrorMsg>{err}</ErrorMsg>}{!favs?<Loading/>:favs.length?<div className="grid">{favs.map(x=><div key={x.product_id}><ProductCard p={x.products}/><button className="btn small ghost" onClick={()=>removeFav(user.id,x.product_id).then(load)}>Retirer</button></div>)}</div>:<Empty>Aucun favori. <Link to="/marketplace">Explorer les produits</Link></Empty>}
  <p className="muted">Le suivi des demandes de contact n'est pas encore implémenté : contactez les vendeurs via WhatsApp depuis les fiches produits.</p></>
}
