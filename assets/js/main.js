document.getElementById('yr').textContent = new Date().getFullYear();
// Hide any link that still has a PASTE_ placeholder, so unfinished links never show
window.addEventListener('load',()=>document.querySelectorAll('.figs').forEach(f=>{if(!f.querySelector('figure'))f.remove()}));
document.querySelectorAll('a[href^="PASTE_"]').forEach(a => a.style.display = 'none');
const root = document.documentElement, btn = document.getElementById('theme');
const themes = [['light','☀'],['slate','◐'],['sand','◑'],['forest','❦'],['dark','☾'],['midnight','★']];
function setTheme(t){ const i = Math.max(0, themes.findIndex(x=>x[0]===t)); root.setAttribute('data-theme', themes[i][0]); btn.textContent = themes[i][1]; btn.title = 'Theme: ' + themes[i][0] + ' (click to change)'; return themes[i][0]; }
let cur = 'light';
try { cur = localStorage.getItem('theme') || 'light'; } catch(e){}
cur = setTheme(cur);
btn.onclick = () => {
  const i = themes.findIndex(x=>x[0]===cur);
  cur = setTheme(themes[(i+1)%themes.length][0]);
  try { localStorage.setItem('theme', cur); } catch(e){}
};
const links = document.getElementById('links');
document.getElementById('menu').onclick = () => links.classList.toggle('open');
links.querySelectorAll('a').forEach(a => a.onclick = () => links.classList.remove('open'));

// ---- Search ----
(function(){
  const ov=document.getElementById('sov'), inp=document.getElementById('sinput'),
        res=document.getElementById('sres'), hint=document.getElementById('shint');
  const items=[];
  function secName(el){const sec=el.closest('section'); if(!sec) return 'Top'; const h=sec.querySelector('h2'); return h?h.textContent.trim():''}
  function add(el,title,box){items.push({el,title:title.trim().replace(/\s+/g,' '),text:(box||el).textContent.toLowerCase().replace(/\s+/g,' '),sec:secName(el)})}
  document.querySelectorAll('section[id] h2').forEach(h=>add(h,h.textContent,h.closest('section')));
  document.querySelectorAll('.ri-list li').forEach(li=>add(li,li.querySelector('h3').textContent));
  document.querySelectorAll('.pub,.pubrow').forEach(a=>{const h=a.querySelector('h3'); if(h) add(a,h.textContent)});
  document.querySelectorAll('.xp').forEach(x=>{const h=x.querySelector('h4'); if(h) add(x,h.textContent)});
  document.querySelectorAll('.stat').forEach(()=>{});
  function open(){ov.hidden=false;inp.value='';render('');setTimeout(()=>inp.focus(),0)}
  function close(){ov.hidden=true}
  function render(q){
    q=q.trim().toLowerCase(); res.innerHTML='';
    if(!q){hint.textContent='Type to search this portfolio.';hint.style.display='block';return}
    const words=q.split(/\s+/);
    const hits=items.filter(i=>words.every(w=>i.text.includes(w))).slice(0,8);
    hint.style.display=hits.length?'none':'block'; hint.textContent='No results found.';
    hits.forEach(i=>{
      const li=document.createElement('li'), b=document.createElement('button');
      b.innerHTML='<span class="rt"></span><span class="rs"></span>';
      b.querySelector('.rt').textContent=i.title; b.querySelector('.rs').textContent=i.sec;
      b.onclick=()=>{close();i.el.scrollIntoView({behavior:'smooth',block:'center'});i.el.classList.add('flash');setTimeout(()=>i.el.classList.remove('flash'),1800)};
      li.appendChild(b);res.appendChild(li);
    });
  }
  document.getElementById('searchBtn').onclick=open;
  inp.addEventListener('input',()=>render(inp.value));
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!ov.hidden){close();return}
    const typing=/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||'');
    if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();open()}
  });
})();

// ---- Project status filter ----
(function(){
  const sec=document.getElementById('projects'); if(!sec) return;
  const arts=[...sec.querySelectorAll('.proj')];
  const count=f=>f==='all'?arts.length:arts.filter(a=>a.dataset.status===f).length;
  ['all','ongoing','completed'].forEach(f=>{const e=document.getElementById('c-'+f); if(e) e.textContent=count(f)});
  function apply(f){
    arts.forEach(a=>a.style.display=(f==='all'||a.dataset.status===f)?'':'none');
    sec.querySelectorAll('h3.group').forEach(g=>{
      let n=g.nextElementSibling, any=false;
      while(n && !n.classList.contains('group')){
        const r=n.matches('.proj')?[n]:[...n.querySelectorAll('.proj')];
        const vis=r.some(x=>x.style.display!=='none');
        if(r.length) n.style.display=vis?'':'none';
        if(vis) any=true; n=n.nextElementSibling;
      }
      g.style.display=any?'':'none';
    });
  }
  document.querySelectorAll('#pfilter .pf').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('#pfilter .pf').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); apply(b.dataset.f);
  });
})();

// ---- Auto-updating bar chart (counted from the page content) ----
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counts = {};
  document.querySelectorAll('h3.group[data-stat]').forEach(g => {
    let n = g.nextElementSibling, c = 0;
    while (n && !n.classList.contains('group')) { c += n.matches('article') ? 1 : n.querySelectorAll('article').length; n = n.nextElementSibling; }
    counts[g.dataset.stat] = c;
  });

  const rows = [...document.querySelectorAll('.bar-row[data-stat]')];
  const max = Math.max(1, ...rows.map(r => counts[r.dataset.stat] || 0));

  rows.forEach(r => {
    const t = counts[r.dataset.stat];
    if (t === undefined) return;
    r.querySelector('.bl').textContent = t === 1 ? r.dataset.one : r.dataset.many;
    const fill = r.querySelector('.bf'), val = r.querySelector('.bv');
    const width = (t / max * 100) + '%';

    if (reduce || !('IntersectionObserver' in window)) {
      fill.style.width = width; val.textContent = t; return;
    }
    val.textContent = '0';
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      o.disconnect();
      fill.style.width = width;
      const t0 = performance.now(), d = 900;
      (function tick(now){
        const k = Math.min((now - t0) / d, 1);
        val.textContent = Math.round(t * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }), { threshold: .6 }).observe(r);
  });
})();
// ---- Highlight current section in the menu ----
(function(){
  if(!('IntersectionObserver' in window)) return;
  const map={top:'#about'}; const links=[...document.querySelectorAll('#links a')];
  const byHref=h=>links.find(a=>a.getAttribute('href')===h);
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    const h=map[e.target.id]||('#'+e.target.id);
    links.forEach(a=>a.classList.remove('active')); const a=byHref(h); if(a) a.classList.add('active');
  }),{rootMargin:'-45% 0px -50% 0px'});
  document.querySelectorAll('header#top, section[id]').forEach(x=>io.observe(x));
})();
