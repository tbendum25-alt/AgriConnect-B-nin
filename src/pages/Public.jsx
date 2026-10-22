import { useEffect,useState } from 'react'
import { Link,useNavigate,useParams,useSearchParams } from 'react-router-dom'
import { listProducts,listCategories,getProduct,addFav,report,sendContact } from '../services/products'
import { ProductCard,Loading,Empty,ErrorMsg,Img } from '../components/common'
import { useAuth } from '../context/AuthContext'
import { COMMUNES,REPORT_REASONS,PHOTOS } from '../constants'
import { fcfa,dateFr,whatsappLink } from '../utils/format'
import { supabase } from '../lib/supabase'
export function Home(){
 const [items,setItems]=useState(null),[cats,setCats]=useState([]),[q,setQ]=useState(''),nav=useNavigate()
 useEffect(()=>{listProducts().then(setItems).catch(()=>setItems([]));listCategories().then(setCats).catch(()=>{})},[])
 return <><section className="hero"><div><h1>Les produits agricoles du Bénin, plus proches de vous.</h1>
  <p>AgriConnect met en relation producteurs et acheteurs : découvrez les offres, comparez les prix et contactez directement les vendeurs.</p>
  <form className="bar" onSubmit={e=>{e.preventDefault();nav('/marketplace?q='+encodeURIComponent(q))}}><input aria-label="Rechercher un produit" placeholder="Maïs, tomates, manioc…" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn">Rechercher</button></form>
  <div className="row"><Link className="btn" to="/marketplace">Explorer les produits</Link><Link className="btn ghost light" to="/register">Vendre mes produits</Link></div></div></section>
  <div className="trio"><Img src={PHOTOS.soil} alt="Agriculteurs travaillant la terre"/><Img src={PHOTOS.market} alt="Marché africain de produits frais"/><Img src={PHOTOS.corn} alt="Épis de maïs mûrs dans un champ"/></div>
  <h2>Catégories</h2><div className="chips">{cats.map(c=><Link key={c.slug} className="chip" to={`/marketplace?cat=${c.slug}`}>{c.name}</Link>)}</div>
  <h2>Publiés récemment</h2>{!items?<Loading/>:items.length?<div className="grid">{items.slice(0,4).map(p=><ProductCard key={p.id} p={p}/>)}</div>:<Empty>Aucune annonce publiée pour le moment.</Empty>}
  <h2>Pour les producteurs</h2><p className="box">Publiez vos récoltes avec prix, quantités et photos. Chaque annonce est examinée avant publication.</p>
  <h2>Pour les acheteurs</h2><p className="box">Restaurants, hôtels, revendeurs ou particuliers : estimez le montant d'une commande et contactez le vendeur.</p></>
}
export function Marketplace(){
 const [sp]=useSearchParams(),[items,setItems]=useState(null),[err,setErr]=useState(''),[cats,setCats]=useState([]),[shown,setShown]=useState(6)
 const E0={q:sp.get('q')||'',cat:sp.get('cat')||'',commune:'',min:'',max:'',sort:'new'},[f,setF]=useState(E0),set=k=>e=>{setF({...f,[k]:e.target.value});setShown(6)}
 useEffect(()=>{listProducts().then(setItems).catch(e=>setErr(e.message));listCategories().then(setCats).catch(()=>{})},[])
 if(err) return <ErrorMsg>Impossible de charger les produits : {err}</ErrorMsg>
 if(!items) return <Loading/>
 const q=f.q.toLowerCase()
 const res=items.filter(p=>p.name.toLowerCase().includes(q)&&(!f.cat||p.categories?.slug===f.cat)&&(!f.commune||p.commune===f.commune)&&(!f.min||p.price>=+f.min)&&(!f.max||p.price<=+f.max))
  .sort((a,b)=>f.sort==='pa'?a.price-b.price:f.sort==='pd'?b.price-a.price:new Date(b.created_at)-new Date(a.created_at))
 return <><h1>Produits</h1><div className="filters"><input placeholder="Nom du produit" value={f.q} onChange={set('q')}/>
  <select value={f.cat} onChange={set('cat')}><option value="">Toutes catégories</option>{cats.map(c=><option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
  <select value={f.commune} onChange={set('commune')}><option value="">Toutes communes</option>{COMMUNES.map(c=><option key={c}>{c}</option>)}</select>
  <input type="number" min="0" placeholder="Prix min (FCFA)" value={f.min} onChange={set('min')}/><input type="number" min="0" placeholder="Prix max (FCFA)" value={f.max} onChange={set('max')}/>
  <select value={f.sort} onChange={set('sort')}><option value="new">Plus récents</option><option value="pa">Prix croissant</option><option value="pd">Prix décroissant</option></select>
  <button className="btn ghost" onClick={()=>setF(E0)}>Effacer les filtres</button></div>
  <p className="muted">{res.length} résultat{res.length>1?'s':''}</p>
  {res.length?<><div className="grid">{res.slice(0,shown).map(p=><ProductCard key={p.id} p={p}/>)}</div>{shown<res.length&&<button className="btn center" onClick={()=>setShown(shown+6)}>Voir plus</button>}</>:<Empty>Aucun produit ne correspond. Modifiez vos filtres.</Empty>}</>
}
export function Product(){
 const {id}=useParams(),{user,configured}=useAuth(),[p,setP]=useState(undefined),[err,setErr]=useState(''),[qty,setQty]=useState(1),[all,setAll]=useState([]),[msg,setMsg]=useState('')
 useEffect(()=>{getProduct(id).then(setP).catch(e=>setErr(e.message));listProducts().then(setAll).catch(()=>{})},[id])
 if(err) return <ErrorMsg>{err}</ErrorMsg>
 if(p===undefined) return <Loading/>
 if(!p) return <ErrorMsg>Annonce introuvable. <Link to="/marketplace">Retour aux produits</Link></ErrorMsg>
 const total=(+qty>0?+qty:0)*p.price,wa=whatsappLink(p.seller?.phone,p.name),sim=all.filter(x=>x.id!==p.id&&x.categories?.slug===p.categories?.slug).slice(0,3)
 const act=async fn=>{try{await fn();setMsg('Enregistré.')}catch(e){setMsg('Erreur : '+e.message)}}
 return <><div className="detail"><Img className="big" src={p.images?.[0]} alt={p.alt||`Photo : ${p.name}`}/><p className="muted cap">Photo illustrative : elle ne prouve pas la disponibilité du produit.</p><div>
  <span className="tag">{p.categories?.name}</span>{p.demo&&<span className="tag warn">Données fictives</span>}<h1>{p.name}</h1>
  <p><b>{fcfa(p.price)}</b> par {p.unit}</p><p>Quantité déclarée : {p.quantity} {p.unit} · {p.is_available?'Disponible':'Indisponible'}</p><p>{p.commune} · publié le {dateFr(p.created_at)}</p><p>{p.description}</p>
  <p className="muted">Vendeur : {p.seller?.full_name||'non renseigné'} ({p.seller?.commune||p.commune})</p>
  <div className="box"><h3>Estimer un montant</h3><label>Quantité souhaitée ({p.unit})<input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}/></label>
  {+qty>p.quantity&&<p className="err">Supérieure à la quantité déclarée ({p.quantity}).</p>}<p><b>Montant estimé : {fcfa(total)}</b></p><p className="muted">Estimation, pas une commande confirmée.</p></div>
  <div className="row">{wa?<a className="btn" href={wa} target="_blank" rel="noopener noreferrer">Contacter sur WhatsApp</a>:<span className="muted">Aucun numéro WhatsApp public pour ce vendeur.</span>}
  {user&&configured&&!p.demo&&<button className="btn ghost" onClick={()=>act(()=>addFav(user.id,p.id))}>Ajouter aux favoris</button>}
  {user&&configured&&!p.demo&&<select aria-label="Signaler" defaultValue="" onChange={e=>e.target.value&&act(()=>report({product_id:p.id,reporter_id:user.id,reason:e.target.value}))}><option value="">Signaler l'annonce…</option>{REPORT_REASONS.map(r=><option key={r}>{r}</option>)}</select>}</div>{msg&&<p>{msg}</p>}</div></div>
  <h2>Produits similaires</h2>{sim.length?<div className="grid">{sim.map(x=><ProductCard key={x.id} p={x}/>)}</div>:<Empty>Aucun produit similaire.</Empty>}</>
}
export function Categories(){
 const [c,setC]=useState(null);useEffect(()=>{listCategories().then(setC).catch(()=>setC([]))},[])
 return <><h1>Catégories</h1>{!c?<Loading/>:<div className="grid">{c.map(x=><Link key={x.slug} className="box" to={`/marketplace?cat=${x.slug}`}><h3>{x.name}</h3><p className="muted">Voir les produits</p></Link>)}</div>}</>
}
const T={
 'how-it-works':['Comment ça marche ?',['Producteur : créez un compte, publiez une annonce avec photo, prix et quantité ; elle est publiée après examen.','Acheteur : recherchez un produit, filtrez par commune et prix, estimez le montant.','Contact : écrivez au vendeur (WhatsApp si autorisé). Les modalités de vente se règlent directement entre vous.','Signalement : utilisez « Signaler l\'annonce » pour toute annonce suspecte.','AgriConnect ne garantit ni la transaction, ni la qualité, ni le transport, et n\'encaisse aucun paiement.']],
 about:['À propos',['AgriConnect Bénin est une plateforme indépendante de mise en relation entre producteurs et acheteurs agricoles.','Projet de démonstration : aucun partenaire, aucune statistique et aucune histoire d\'entreprise ne sont revendiqués.']],
 'legal/terms':['Conditions générales d\'utilisation (modèle)',['Texte modèle à faire vérifier avant toute mise en production ; il ne constitue pas une conformité juridique complète au droit béninois.','La plateforme met en relation ; chaque utilisateur est responsable de ses annonces et de ses échanges.']],
 'legal/privacy':['Politique de confidentialité (modèle)',['Modèle à faire valider. Données collectées : e-mail, nom, commune, téléphone facultatif, annonces. Le numéro n\'est affiché que si le vendeur l\'autorise.','Aucun cookie publicitaire ou de mesure n\'est utilisé ; seule la session de connexion est conservée.']],
 'legal/rules':['Règles de publication et de modération',['Annonces véridiques, produits réels, prix honnêtes. Toute annonce est examinée avant publication.','Annonces rejetées, suspendues ou retirées en cas d\'information trompeuse ou de signalement fondé.']]}
export const Static=({k})=><><h1>{T[k][0]}</h1>{T[k][1].map(t=><p key={t}>{t}</p>)}</>
export function Contact(){
 const [f,setF]=useState({name:'',email:'',subject:'',message:'',site:''}),[st,setSt]=useState(''),set=k=>e=>setF({...f,[k]:e.target.value})
 const submit=async e=>{e.preventDefault()
  if(f.site) return setSt('ok')
  if(!f.name.trim()||!/^\S+@\S+\.\S+$/.test(f.email)||!f.subject.trim()||f.message.trim().length<5) return setSt('Vérifiez les champs : nom, e-mail valide, objet et message (5 caractères min.).')
  const last=+localStorage.getItem('acb.lastContact')||0; if(Date.now()-last<30000) return setSt('Merci de patienter 30 secondes entre deux messages.')
  if(!supabase) return setSt('demo')
  try{await sendContact({name:f.name,email:f.email,subject:f.subject,message:f.message});localStorage.setItem('acb.lastContact',Date.now());setSt('ok');setF({name:'',email:'',subject:'',message:'',site:''})}catch(x){setSt('Envoi impossible : '+x.message)}}
 return <><h1>Contact</h1><form className="form" onSubmit={submit}><label>Nom<input value={f.name} onChange={set('name')}/></label><label>E-mail<input type="email" value={f.email} onChange={set('email')}/></label>
  <label>Objet<input value={f.subject} onChange={set('subject')}/></label><label>Message<textarea rows="5" value={f.message} onChange={set('message')}/></label>
  <input className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true" value={f.site} onChange={set('site')}/><button className="btn">Envoyer</button>
  {st==='ok'&&<p className="okmsg">Message envoyé. Merci.</p>}{st==='demo'&&<p className="demo">Mode démonstration : le message n'a pas été envoyé (Supabase non configuré).</p>}{st&&st!=='ok'&&st!=='demo'&&<p className="err" role="alert">{st}</p>}</form></>
}
export const NotFound=()=><ErrorMsg>Page introuvable. <Link to="/">Accueil</Link></ErrorMsg>
