import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import FitnessApp from './app/fitness-app';
import {readJournal} from './lib/browser-store';
import './app/fitness.css';
import './app/interactions.css';
import './app/polish.css';
const root=createRoot(document.getElementById('root')!);
function Unlock({message}:{message:string}){const [link,setLink]=useState('');return <div className="unlock-screen"><span className="brand-mark">日</span><h1>日常有数</h1><p>饮食、训练、身体，每天记一笔。</p><div className="unlock-card"><h2>用专属链接打开</h2><p>{message}</p><form onSubmit={e=>{e.preventDefault();const key=link.includes('#')?link.split('#')[1].replace(/^k=/,''):link.trim();location.hash='k='+key;location.reload();}}><label className="field"><span>专属链接或访问码</span><input type="password" value={link} onChange={e=>setLink(e.target.value)} autoComplete="off" required/></label><button className="primary-button">打开我的手账</button></form><small>不用注册或登录。链接中的访问码只在浏览器本地解密记录。</small></div></div>;}
readJournal().then(s=>root.render(<FitnessApp initial={s}/>)).catch(e=>root.render(<Unlock message={e.message||'暂时未能读取记录，请刷新重试。'}/>));
