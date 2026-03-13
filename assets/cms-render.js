
(function(){
  const ISSUE_FILE='assets/content-issues.json';
  const NEWS_FILE='assets/content-news.json';

  async function fetchJson(path){
    try{
      const res = await fetch(path, {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(e){
      console.warn('CMS data load failed for', path, e);
      return null;
    }
  }

  function issueHref(item){
    return item.page || ('issue.html?id=' + encodeURIComponent(item.id || `${item.year}-${item.num}`));
  }

  function accessLabel(access){
    return access === 'subscription' ? 'По подписке' : 'Открытый архив';
  }

  function actionLabel(access){
    return access === 'subscription' ? 'Получить доступ' : 'Открыть выпуск';
  }

  function escapeHtml(v){
    return String(v || '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }

  function cardHtml(item){
    const href = issueHref(item);
    const title = item.title || `Выпуск № ${item.num} / ${item.year}`;
    return `
      <article class="card" data-year="${escapeHtml(item.year)}">
        <div class="card-body">
          <a class="issue-thumb" href="${escapeHtml(href)}"><img src="${escapeHtml(item.cover)}" alt="Выпуск № ${escapeHtml(item.num)} / ${escapeHtml(item.year)}"></a>
          <div class="label">${accessLabel(item.access)}</div>
          <h3>№ ${escapeHtml(item.num)} / ${escapeHtml(item.year)}</h3>
          <p>${escapeHtml(title)}</p>
          <div class="spacer"><div class="actions"><a class="btn btn-secondary" href="${escapeHtml(href)}">${actionLabel(item.access)}</a></div></div>
        </div>
      </article>`;
  }

  function newsItemHtml(item){
    return `<article class="news-item"><time>${escapeHtml(item.date)}</time><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.excerpt || '')}</p></article>`;
  }

  function paragraphize(text){
    return String(text || '').split(/\n\n+/).filter(Boolean).map(p=>`<p class="lead" style="margin-top:14px">${escapeHtml(p)}</p>`).join('');
  }

  async function renderIndex(){
    const [issuesData, newsData] = await Promise.all([fetchJson(ISSUE_FILE), fetchJson(NEWS_FILE)]);
    const issues = issuesData && issuesData.items || [];
    const news = newsData && newsData.items || [];

    if(issues.length){
      const current = issues.slice().sort((a,b)=> (b.year-a.year) || (b.num-a.num))[0];
      if(current){
        const cover = document.querySelector('.hero-issue .cover img');
        const badge = document.querySelector('.hero-issue .badge');
        const h2 = document.querySelector('.hero-issue-text h2');
        const kicker = document.querySelector('.hero-issue-text .issue-kicker');
        const desc = document.querySelector('.hero-issue-text .issue-description');
        const act = document.querySelector('.issue-actions');
        const hl = document.querySelector('.issue-highlights');
        if(cover){ cover.src = current.cover; cover.alt = `Обложка журнала РУМ № ${current.num} / ${current.year}`; }
        if(badge) badge.textContent = accessLabel(current.access);
        if(h2) h2.textContent = `№ ${current.num} / ${current.year}`;
        if(kicker) kicker.textContent = current.title || '';
        if(desc) desc.textContent = current.access === 'subscription' ? 'На сайте доступны тема номера, аннотация и содержание. Полный PDF предоставляется подписчикам журнала.' : 'Выпуск доступен в открытом архиве журнала.';
        if(act) act.innerHTML = current.access === 'subscription'
          ? `<a class="btn btn-primary" href="subscription.html">Получить доступ</a><a class="btn btn-primary" href="${escapeHtml(issueHref(current))}">Содержание</a>`
          : `<a class="btn btn-primary" href="${escapeHtml(issueHref(current))}">Открыть выпуск</a><a class="btn btn-primary" href="archive.html">В архив</a>`;
        if(hl && Array.isArray(current.sections) && current.sections.length){
          hl.innerHTML = current.sections.slice(0,3).map(sec=>`<div class="mini-box"><strong>${escapeHtml(sec.title)}</strong><span>${escapeHtml(sec.text)}</span></div>`).join('');
        }
      }

      const archiveGrid = document.querySelector('.section .grid-4');
      if(archiveGrid){
        const openRecent = issues.filter(x=>x.access!=='subscription' && Number(x.year)===2025).sort((a,b)=>b.num-a.num).slice(0,4);
        if(openRecent.length) archiveGrid.innerHTML = openRecent.map(cardHtml).join('');
      }
    }

    if(news.length){
      const feature = news[0];
      const featureWrap = document.querySelector('.feature-news');
      const listWrap = document.querySelector('.feature-list');
      if(featureWrap){
        const img = featureWrap.querySelector('img');
        const meta = featureWrap.querySelector('.meta-line');
        const title = featureWrap.querySelector('h3');
        const p = featureWrap.querySelector('p');
        if(img && feature.image) img.src = feature.image;
        if(meta) meta.textContent = 'Главная новость · ' + feature.date;
        if(title) title.textContent = feature.title;
        if(p) p.textContent = feature.excerpt || '';
      }
      if(listWrap){
        listWrap.innerHTML = news.slice(1,5).map(newsItemHtml).join('');
      }
    }
  }

  async function renderArchive(){
    const data = await fetchJson(ISSUE_FILE); if(!data || !data.items) return;
    const grid = document.querySelector('.archive-grid'); if(!grid) return;
    const items = data.items.slice().sort((a,b)=> (b.year-a.year) || (b.num-a.num));
    grid.innerHTML = items.map(cardHtml).join('');
  }

  async function renderNews(){
    const data = await fetchJson(NEWS_FILE); if(!data || !data.items || !data.items.length) return;
    const items = data.items;
    const heroWrap = document.querySelector('.news-hero');
    if(heroWrap){
      const item = items[0];
      const img = heroWrap.querySelector('img');
      const meta = heroWrap.querySelector('.meta-line');
      const title = heroWrap.querySelector('h2');
      const copy = heroWrap.querySelector('.news-hero-copy');
      if(img && item.image) img.src = item.image;
      if(meta) meta.textContent = item.date;
      if(title) title.textContent = item.title;
      if(copy){
        const leads = copy.querySelectorAll('.lead');
        leads.forEach(el=>el.remove());
        copy.insertAdjacentHTML('beforeend', paragraphize(item.body || item.excerpt || ''));
      }
    }
    const list = document.querySelector('.news-list');
    if(list) list.innerHTML = items.slice(1).map(newsItemHtml).join('');
  }

  async function renderIssue(){
    const holder = document.querySelector('[data-dynamic-issue]');
    if(!holder) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const data = await fetchJson('assets/content-issues.json');
    if(!data || !data.items || !id) return;
    const item = data.items.find(x => String(x.id) === String(id));
    if(!item) return;
    document.title = `РУМ — выпуск ${item.num} / ${item.year}`;
    const access = accessLabel(item.access);
    holder.innerHTML = `
      <div class="container page-head"><span class="eyebrow">${access}</span><h1 class="page-title-tight" style="font-size:2.2rem">№ ${item.num} / ${item.year}</h1><p>${escapeHtml(item.title || '')}</p></div>
      <div class="container two-col">
        <div class="panel"><div class="panel-body"><div class="cover"><img src="${escapeHtml(item.cover)}" alt="Выпуск № ${item.num} / ${item.year}"></div></div></div>
        <div class="panel"><div class="panel-body table-like issue-main"><h2>${escapeHtml(item.title || '')}</h2>
          <div class="row"><div class="key">Статус доступа</div><div class="val">${access}</div></div>
          <div class="row"><div class="key">На сайте</div><div class="val">${item.access==='subscription'?'Обложка, тема номера, аннотация и содержание':'Открытый выпуск журнала'}</div></div>
          <div class="row"><div class="key">PDF</div><div class="val">${item.pdf_link ? `<a href="${escapeHtml(item.pdf_link)}" target="_blank" rel="noopener">Открыть PDF</a>` : (item.access==='subscription' ? 'Предоставляется подписчикам' : 'Ссылка не добавлена')}</div></div>
        </div>
        <div class="panel-body" style="padding-top:0">` +
          (item.sections && item.sections.length ? '<div class="stack">'+ item.sections.map(sec=>`<div class="mini-box" style="min-height:auto"><strong>${escapeHtml(sec.title)}</strong><span>${escapeHtml(sec.text)}</span></div>`).join('') + '</div>' : '') +
          `<div class="actions">${item.access==='subscription' ? '<a class="btn btn-primary" href="subscription.html">Оформить подписку</a>' : ''}${item.pdf_link ? `<a class="btn btn-primary" href="${escapeHtml(item.pdf_link)}" target="_blank" rel="noopener">Открыть PDF</a>` : ''}</div>
        </div></div>
      </div>`;
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(document.body.dataset.page === 'home') renderIndex();
    if(document.body.dataset.page === 'archive') renderArchive();
    if(document.body.dataset.page === 'news') renderNews();
    renderIssue();
  });
})();
