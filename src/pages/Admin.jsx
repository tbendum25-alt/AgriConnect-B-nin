import { useEffect,useState } from 'react'
import { useAuth } from '../context/AuthContext'
import * as S from '../services/products'
import { Loading,Empty,ErrorMsg } from '../components/common'
import { STATUS } from '../constants'
import { fcfa,dateFr } from '../utils/format'
const slug=n=>n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
function useLoad(fn){
 const [st,setSt]=useState({data:null,err:''})
 const load=()=>fn().then(data=>setSt({data,err:''})).catch(e=>setSt({data:null,err:e.message}))
 useEffect(()=>{load()},[])
 return [st,load]
}
const Box=({st,children})=>st.err?<ErrorMsg>{st.err}</ErrorMsg>:!st.data?<Loading/>:children(st.data)
const run=async(fn,reload,setMsg)=>{try{await fn();setMsg('');reload()}catch(e){setMsg(e.message)}}

function Products(){
 const [st,load]=useLoad(S.adminList),[cats]=useLoad(S.adminCategories),[f,setF]=useState({q:'',status:'pending',cat:''}),[msg,setMsg]=useState('')
 const act=(id,status,ask)=>{let r=null;if(ask){r=window.prompt('Motif (obligatoire) :');if(!r)return}else if(!window.confirm('Confirmer ?'))return;run(()=>S.adminSetStatus(id,status,r),load,setMsg)}
 return <><div className="filters"><input placeholder="Rechercher une annonce" value={f.q} onChange={e=>setF({...f,q:e.target.value})}/>
  <select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option value="">Tous statuts</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
  <select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})}><option value="">Toutes catégories</option>{(cats.data||[]).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{msg&&<ErrorMsg>{msg}</ErrorMsg>}
  <Box st={st}>{d=>{const l=d.filter(p=>p.name.toLowerCase().includes(f.q.toLowerCase())&&(!f.status||p.status===f.status)&&(!f.cat||p.category_id===f.cat))
   return l.length?l.map(p=><div key={p.id} className="row item"><div><b>{p.name}</b> · {fcfa(p.price)}/{p.unit} · {p.commune} · {dateFr(p.created_at)}<br/><span className="tag">{STATUS[p.status]}</span>{p.rejection_reason&&<span className="muted"> Motif : {p.rejection_reason}</span>}</div>
    <button className="btn small" onClick={()=>act(p.id,'approved')}>Approuver</button><button className="btn small ghost" onClick={()=>act(p.id,'rejected',1)}>Rejeter</button><button className="btn small ghost" onClick={()=>act(p.id,'suspended',1)}>Suspendre</button></div>):<Empty>Aucune annonce.</Empty>}}</Box></>
}
function Users(){
 const {user}=useAuth(),[st,load]=useLoad(S.adminUsers),[q,setQ]=useState(''),[msg,setMsg]=useState('')
 const toggle=u=>{const to=u.account_status==='active'?'suspended':'active';if(window.confirm(`${to==='suspended'?'Suspendre':'Réactiver'} ${u.full_name||'ce compte'} ?${to==='suspended'?' Ses annonces publiées seront suspendues.':''}`))run(()=>S.adminSetAccount(u.id,to),load,setMsg)}
 return <><input placeholder="Rechercher par nom" value={q} onChange={e=>setQ(e.target.value)}/>{msg&&<ErrorMsg>{msg}</ErrorMsg>}
  <Box st={st}>{d=>{const l=d.filter(u=>(u.full_name||'').toLowerCase().includes(q.toLowerCase()))
   return l.length?<div className="scroll"><table><thead><tr><th>Nom</th><th>Rôle</th><th>Commune</th><th>Statut</th><th>Inscrit le</th><th></th></tr></thead><tbody>{l.map(u=><tr key={u.id}><td>{u.full_name||'—'}</td><td>{u.role}</td><td>{u.commune||'—'}</td><td><span className={'tag '+(u.account_status==='active'?'':'warn')}>{u.account_status==='active'?'Actif':'Suspendu'}</span></td><td>{dateFr(u.created_at)}</td>
    <td>{u.id!==user.id&&u.role!=='admin'&&<button className="btn small ghost" onClick={()=>toggle(u)}>{u.account_status==='active'?'Suspendre':'Réactiver'}</button>}</td></tr>)}</tbody></table></div>:<Empty>Aucun utilisateur.</Empty>}}</Box>
  <p className="muted">La suppression définitive d'un compte n'est pas proposée ici : elle doit respecter les obligations de conservation et de suppression des données.</p></>
}
function Categories(){
 const [st,load]=useLoad(S.adminCategories),[name,setName]=useState(''),[msg,setMsg]=useState('')
 const add=e=>{e.preventDefault();if(name.trim().length<2||!slug(name))return setMsg('Nom invalide.');const max=Math.max(0,...(st.data||[]).map(c=>c.sort_order));run(async()=>{await S.adminSaveCategory({name:name.trim(),slug:slug(name),sort_order:max+1});setName('')},load,setMsg)}
 const move=(a,b)=>run(async()=>{await S.adminSaveCategory({id:a.id,name:a.name,slug:a.slug,sort_order:b.sort_order});await S.adminSaveCategory({id:b.id,name:b.name,slug:b.slug,sort_order:a.sort_order})},load,setMsg)
 const del=c=>window.confirm(`Supprimer « ${c.name} » ?`)&&S.adminDeleteCategory(c.id).then(load).catch(()=>setMsg(`Impossible de supprimer « ${c.name} » : elle est utilisée par des produits. Désactivez-la plutôt.`))
 return <><form className="row" onSubmit={add}><input style={{maxWidth:280}} placeholder="Nouvelle catégorie" value={name} onChange={e=>setName(e.target.value)}/><button className="btn">Ajouter</button></form>{msg&&<ErrorMsg>{msg}</ErrorMsg>}
  <Box st={st}>{d=>d.map((c,i)=><div key={c.id} className="row item"><div><b>{c.name}</b> <span className="muted">/{c.slug}</span> {!c.is_active&&<span className="tag warn">Désactivée</span>}</div>
   <button className="btn small ghost" disabled={!i} onClick={()=>move(c,d[i-1])}>Monter</button><button className="btn small ghost" disabled={i===d.length-1} onClick={()=>move(c,d[i+1])}>Descendre</button>
   <button className="btn small ghost" onClick={()=>{const n=window.prompt('Nouveau nom :',c.name);if(n&&n.trim().length>1)run(()=>S.adminSaveCategory({id:c.id,name:n.trim(),slug:c.slug,sort_order:c.sort_order}),load,setMsg)}}>Renommer</button>
   <button className="btn small ghost" onClick={()=>run(()=>S.adminSaveCategory({id:c.id,name:c.name,slug:c.slug,sort_order:c.sort_order,is_active:!c.is_active}),load,setMsg)}>{c.is_active?'Désactiver':'Activer'}</button>
   <button className="btn small ghost" onClick={()=>del(c)}>Supprimer</button></div>)}</Box></>
}
function Reports(){
 const [st,load]=useLoad(S.adminReports),[show,setShow]=useState('pending'),[msg,setMsg]=useState('')
 const suspend=r=>window.confirm('Suspendre cette annonce et clôturer le signalement ?')&&run(async()=>{await S.adminSetStatus(r.product_id,'suspended',`Signalement : ${r.reason}`);await S.adminHandleReport(r.id)},load,setMsg)
 return <><select aria-label="Statut" value={show} onChange={e=>setShow(e.target.value)}><option value="pending">En attente</option><option value="handled">Traités</option><option value="">Tous</option></select>{msg&&<ErrorMsg>{msg}</ErrorMsg>}
  <Box st={st}>{d=>{const l=d.filter(r=>!show||r.status===show);return l.length?l.map(r=><div key={r.id} className="row item"><div><b>{r.products?.name||'Annonce supprimée'}</b> · {r.reason}<br/><span className="muted">{dateFr(r.created_at)}{r.details?' · '+r.details:''}</span></div>
   {r.status==='pending'?<><button className="btn small" onClick={()=>suspend(r)}>Suspendre l'annonce</button><button className="btn small ghost" onClick={()=>run(()=>S.adminHandleReport(r.id),load,setMsg)}>Marquer traité (sans suite)</button></>:<span className="tag">Traité</span>}</div>):<Empty>Aucun signalement.</Empty>}}</Box></>
}
export default function Admin(){
 const {role}=useAuth(),[tab,setTab]=useState('products'),[stats]=useLoad(S.adminStats)
 if(role!=='admin') return <ErrorMsg>Accès réservé aux administrateurs.</ErrorMsg>
 const T={products:['Annonces',Products],users:['Utilisateurs',Users],cats:['Catégories',Categories],reports:['Signalements',Reports]},Cur=T[tab][1]
 return <><h1>Administration</h1>
  <Box st={stats}>{s=>{const k=[['Comptes',s.users],['Producteurs',s.farmers],['Acheteurs',s.buyers],['Produits',s.products],['En attente',s.pending],['Approuvées',s.approved],['Rejetées',s.rejected],['Signalements en attente',s.reports]];return <div className="grid stats">{k.map(([l,v])=><div className="box" key={l}><b className="num">{v}</b><br/>{l}</div>)}</div>}}</Box>
  <div className="tabs" role="tablist">{Object.entries(T).map(([k,[l]])=><button key={k} role="tab" aria-selected={tab===k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</div><Cur key={tab}/></>
}
