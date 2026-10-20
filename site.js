document.documentElement.classList.add('js');
const normalized = value => (value || '').toLocaleLowerCase('ru').replaceAll('ё','е');
let searchIndex;
async function getIndex(){
  if(window.PREVIEW_INDEX)return window.PREVIEW_INDEX;
  if(!searchIndex)searchIndex=fetch('/search-index.json').then(r=>{if(!r.ok)throw new Error('Search unavailable');return r.json()}).catch(error=>{searchIndex=null;throw error});
  return searchIndex;
}
function setup(){
  const menu=document.querySelector('[data-menu]');
  if(menu)menu.onclick=()=>{const nav=document.getElementById('main-nav');const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));};
  document.querySelectorAll('[data-search]').forEach(form=>{
    const input=form.querySelector('input');const results=form.querySelector('[data-results]');let run=0;let timer;
    form.dismissSearch=()=>{clearTimeout(timer);run++;results.hidden=true;};
    async function search(){
      const token=++run;const q=normalized(input.value.trim());results.replaceChildren();
      if(q.length<2){results.hidden=true;return;}
      try{
        const index=await getIndex();if(token!==run)return;
        const words=q.split(/\s+/);const matches=index.filter(p=>words.every(w=>normalized(p.title+' '+p.text).includes(w))).sort((a,b)=>Number(normalized(b.title).includes(q))-Number(normalized(a.title).includes(q))).slice(0,10);
        const status=document.createElement('p');status.textContent=matches.length?`Найдено / Found: ${matches.length}${matches.length===10?' +':''}`:'Ничего не найдено. Попробуйте другое слово. / No results.';results.append(status);
        for(const item of matches){const a=document.createElement('a');a.href=item.path;a.textContent=item.title;const meta=document.createElement('small');meta.textContent=item.category; a.append(meta);results.append(a);}
        results.hidden=false;
      }catch(error){if(token!==run)return;const p=document.createElement('p');p.textContent='Поиск временно недоступен. Откройте раздел «База знаний». / Search unavailable.';results.append(p);results.hidden=false;}
    }
    input.oninput=()=>{run++;clearTimeout(timer);timer=setTimeout(search,150)};
    input.onkeydown=e=>{if(e.key==='Escape'){form.dismissSearch()}if(e.key==='ArrowDown'){const first=results.querySelector('a');if(first){e.preventDefault();first.focus()}}};
    form.onsubmit=e=>{e.preventDefault();clearTimeout(timer);search()};
  });
}
document.addEventListener('click',e=>{document.querySelectorAll('[data-search]').forEach(f=>{if(!f.contains(e.target))f.dismissSearch?.()})});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('[data-search]').forEach(f=>f.dismissSearch?.());const nav=document.getElementById('main-nav');const wasOpen=nav?.classList.contains('open');if(nav)nav.classList.remove('open');const b=document.querySelector('[data-menu]');if(b){b.setAttribute('aria-expanded','false');if(wasOpen)b.focus();}}});
setup();
