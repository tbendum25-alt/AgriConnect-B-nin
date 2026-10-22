import { Routes,Route } from 'react-router-dom'
import Layout from './components/Layout'
import { Protected } from './components/common'
import { Home,Marketplace,Product,Categories,Static,Contact,NotFound } from './pages/Public'
import Auth from './pages/Auth'
import { Farmer,Buyer } from './pages/Dashboards'
import Admin from './pages/Admin'
export default function App(){return <Routes><Route element={<Layout/>}>
 <Route index element={<Home/>}/><Route path="marketplace" element={<Marketplace/>}/><Route path="products/:id" element={<Product/>}/><Route path="categories" element={<Categories/>}/>
 <Route path="how-it-works" element={<Static k="how-it-works"/>}/><Route path="about" element={<Static k="about"/>}/><Route path="contact" element={<Contact/>}/>
 <Route path="legal/terms" element={<Static k="legal/terms"/>}/><Route path="legal/privacy" element={<Static k="legal/privacy"/>}/><Route path="legal/rules" element={<Static k="legal/rules"/>}/>
 <Route path="login" element={<Auth mode="login"/>}/><Route path="register" element={<Auth mode="register"/>}/><Route path="forgot-password" element={<Auth mode="forgot"/>}/><Route path="reset-password" element={<Auth mode="reset"/>}/>
 <Route path="dashboard/farmer" element={<Protected roles={['farmer']}><Farmer/></Protected>}/><Route path="dashboard/buyer" element={<Protected roles={['buyer']}><Buyer/></Protected>}/>
 <Route path="admin" element={<Protected roles={['admin']}><Admin/></Protected>}/><Route path="*" element={<NotFound/>}/></Route></Routes>}
