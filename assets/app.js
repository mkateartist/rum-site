
(function(){
  const ISSUE_FILE = 'assets/content-issues.json';
  const NEWS_FILE = 'assets/content-news.json';

  const state = { issues: [], news: [] };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function resolveAsset(path) {
    if (!path) return '';
    const value = String(path).trim();
    if (!value) return '';
    if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) return value;
    if (value.startsWith('assets/')) return value;
    return 'assets/' + value.replace(/^\.\//,'');
  }

  function getIssueId(issue) {
    return String(issue.id || `${issue.year}-${issue.num}`);
  }

  function getIssueHref(issue) {
    return `issue.html?id=${encodeURIComponent(getIssueId(issue))}`;
  }

  function parseRuDate(value) {
    if (!value) return new Date(0);
    const match = String(value).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) return new Date(value);
    const [, dd, mm, yyyy] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  function paragraphize(text) {
    const parts = String(text || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    if (!parts.length) return '';
    return parts.map(p => `<p>${p}</p>`).join('');
  }

  function normalizeIssue(item) {
    const issue = { ...item };
    issue.id = getIssueId(issue);
    issue.cover = resolveAsset(issue.cover);
    issue.pdf = issue.pdf_link || issue.pdf_file || item.pdf || '';
    issue.sections = Array.isArray(issue.sections) ? issue.sections.filter(Boolean).slice(0, 3) : [];
    issue.subtitle = issue.subtitle || (issue.title ? String(issue.title).split(':')[0] : '');
    return issue;
  }

  function normalizeNews(item, index) {
    const news = { ...item };
    news.id = String(news.id || `news-${index + 1}`);
    news.image = resolveAsset(news.image);
    if (!news.body) {
      news.body = [news.lead, news.lead2].filter(Boolean).join('\n\n');
    }
    if (!news.excerpt) {
      news.excerpt = news.lead || String(news.body || '').replace(/[#*_>`\-]/g, '').slice(0, 220);
    }
    return news;
  }

  function truncate(text, limit) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (value.length <= limit) return value;
    return value.slice(0, limit).trimEnd() + '…';
  }

  function renderHomeHero() {
    const target = document.getElementById('home-hero');
    if (!target || !state.issues.length) return;
    const latest = state.issues[0];
    const accessLabel = latest.access === 'open' ? 'Открытый архив' : 'Доступ по подписке';
    const primaryBtn = latest.access === 'open'
      ? `<a class="btn btn-primary" href="${escapeHtml(latest.pdf || getIssueHref(latest))}" ${latest.pdf ? 'target="_blank" rel="noopener"' : ''}>Скачать PDF</a>`
      : `<a class="btn btn-primary" href="subscription.html">Получить доступ</a>`;
    const sectionCards = latest.sections.length
      ? latest.sections.map(section => `<div class="mini-box"><strong>${escapeHtml(section.title)}</strong><span>${escapeHtml(section.text)}</span></div>`).join('')
      : `<div class="mini-box"><strong>Выпуск</strong><span>${escapeHtml(latest.title)}</span></div>`;

    target.innerHTML = `
      <div class="container hero">
        <section class="panel hero-main">
          <div class="panel-body">
            <div class="hero-main-copy">
              <span class="eyebrow">РУМ</span>
              <h1>Журнал по проектированию и эксплуатации электрических сетей</h1>
              <p class="lead">Новый выпуск, архив с 2018 года, новости, материалы для авторов и подписка — в единой цифровой системе. Полные версии выпусков 2026 года доступны подписчикам, архив 2018–2025 открыт для скачивания.</p>
            </div>
            <div class="hero-bottom hero-main-bottom">
              <div class="hero-main-actions">
                <a class="btn btn-primary" href="subscription.html">Оформить подписку</a>
                <a class="btn btn-primary" href="about.html">О журнале</a>
                <a class="btn btn-primary" href="archive.html">Архив</a>
              </div>
              <div class="hero-main-facts">
                <div class="mini-box"><strong>1954</strong><span>журнал выходит с января 1954 года</span></div>
                <div class="mini-box"><strong>2018–2025</strong><span>открытый архив выпусков с прямыми ссылками на PDF</span></div>
                <div class="mini-box"><strong>${state.issues.length} выпусков</strong><span>актуальная база номеров на сайте</span></div>
              </div>
            </div>
          </div>
        </section>
        <aside class="panel hero-issue">
          <div class="panel-body">
            <div class="issue-top">
              <div class="cover"><span class="badge">${accessLabel}</span><img src="${escapeHtml(latest.cover)}" alt="Обложка журнала РУМ № ${escapeHtml(latest.num)} / ${escapeHtml(latest.year)}"></div>
              <div class="hero-issue-text">
                <div class="small">Текущий выпуск</div>
                <h2>№ ${escapeHtml(latest.num)} / ${escapeHtml(latest.year)}</h2>
                <div class="issue-kicker">${escapeHtml(latest.subtitle || latest.title)}</div>
                <p class="issue-description">${escapeHtml(latest.title)}</p>
              </div>
            </div>
            <div class="hero-bottom issue-bottom">
              <div class="issue-actions">
                ${primaryBtn}
                <a class="btn btn-primary" href="${getIssueHref(latest)}">Содержание</a>
              </div>
              <div class="issue-highlights">${sectionCards}</div>
            </div>
          </div>
        </aside>
      </div>`;
  }

  function renderHomeNews() {
    const target = document.getElementById('home-news');
    if (!target) return;
    const items = state.news.slice(0, 5);
    if (!items.length) {
      target.innerHTML = '<div class="empty-state">Пока нет новостей для отображения.</div>';
      return;
    }
    const feature = items[0];
    const featureImage = feature.image ? `<div class="feature-media"><img src="${escapeHtml(feature.image)}" alt="Иллюстрация к новости"></div>` : '';
    const list = items.slice(1).map(item => `
      <article class="news-item">
        <time>${escapeHtml(item.date)}</time>
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(truncate(item.excerpt || item.body, 200))}</p>
      </article>`).join('');
    target.innerHTML = `
      <div class="news-grid">
        <article class="feature-news panel">
          ${featureImage}
          <div class="feature-content">
            <div class="meta-line">Главная новость · ${escapeHtml(feature.date)}</div>
            <h3>${escapeHtml(feature.title)}</h3>
            <p>${escapeHtml(truncate(feature.excerpt || feature.body, 320))}</p>
            <div class="actions"><a class="btn btn-primary" href="news.html">Читать новости</a></div>
          </div>
        </article>
        <div class="feature-list">${list}</div>
      </div>`;
  }

  function renderHomeArchive() {
    const target = document.getElementById('home-archive');
    if (!target) return;
    const items = state.issues.filter(issue => issue.access === 'open').slice(0, 4);
    if (!items.length) {
      target.innerHTML = '<div class="empty-state">Пока нет открытых выпусков.</div>';
      return;
    }
    target.innerHTML = `<div class="grid-4">${items.map(renderIssueCard).join('')}</div>`;
  }

  function renderIssueCard(issue) {
    const accessLabel = issue.access === 'open' ? 'Открытый архив' : 'По подписке';
    const actionLabel = issue.access === 'open' ? 'Подробнее' : 'Содержание';
    return `
      <article class="card" data-year="${escapeHtml(issue.year)}">
        <div class="card-body">
          <a class="issue-thumb" href="${getIssueHref(issue)}"><img src="${escapeHtml(issue.cover)}" alt="${escapeHtml(issue.num)} / ${escapeHtml(issue.year)}"></a>
          <div class="label">${accessLabel}</div>
          <h3>№ ${escapeHtml(issue.num)} / ${escapeHtml(issue.year)}</h3>
          <p>${escapeHtml(issue.title)}</p>
          <div class="spacer"><div class="actions"><a class="btn btn-secondary" href="${getIssueHref(issue)}">${actionLabel}</a></div></div>
        </div>
      </article>`;
  }

  function renderArchivePage() {
    const target = document.getElementById('archive-grid');
    if (!target) return;
    target.innerHTML = state.issues.map(renderIssueCard).join('');
    const years = [...new Set(state.issues.map(issue => issue.year))].sort((a,b) => b-a);
    const select = document.querySelector('[data-year-filter]');
    if (select) {
      select.innerHTML = '<option value="all">Все годы</option>' + years.map(year => `<option value="${year}">${year}</option>`).join('');
      select.addEventListener('change', () => {
        const value = select.value;
        target.querySelectorAll('[data-year]').forEach((card) => {
          card.style.display = value === 'all' || card.dataset.year === value ? '' : 'none';
        });
      });
    }
  }

  function renderNewsPage() {
    const target = document.getElementById('news-list');
    if (!target) return;
    if (!state.news.length) {
      target.innerHTML = '<div class="empty-state">Пока нет опубликованных новостей.</div>';
      return;
    }
    target.innerHTML = `<div class="news-list">${state.news.map(item => `
      <article class="news-item panel">
        <time>${escapeHtml(item.date)}</time>
        <h3>${escapeHtml(item.title)}</h3>
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="Иллюстрация к новости">` : ''}
        <div class="news-body">${paragraphize(item.body || item.excerpt)}</div>
      </article>`).join('')}</div>`;
  }

  function renderIssuePage() {
    const target = document.getElementById('issue-page');
    if (!target) return;
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id');
    const issue = state.issues.find(item => item.id === requestedId) || state.issues[0];
    if (!issue) {
      target.innerHTML = '<div class="container"><div class="empty-state">Выпуск не найден.</div></div>';
      return;
    }
    document.title = `РУМ — выпуск ${issue.num} / ${issue.year}`;
    const accessLabel = issue.access === 'open' ? 'Открытый архив' : 'По подписке';
    const pdfHref = issue.pdf;
    const pdfButton = issue.access === 'open' && pdfHref
      ? `<a class="btn btn-primary" href="${escapeHtml(pdfHref)}" target="_blank" rel="noopener">Скачать PDF</a>`
      : `<a class="btn btn-primary" href="subscription.html">Оформить подписку</a>`;
    const sectionBlock = issue.sections.length ? `
      <section class="section">
        <div class="container">
          <div class="section-head"><div><span class="eyebrow">Содержание</span><h2 style="margin-top:12px">Основные блоки выпуска</h2></div></div>
          <div class="issue-section-grid">${issue.sections.map(section => `<article class="issue-section-card"><h3>${escapeHtml(section.title)}</h3><p>${escapeHtml(section.text)}</p></article>`).join('')}</div>
        </div>
      </section>` : '';
    target.innerHTML = `
      <div class="container page-head">
        <span class="eyebrow">${accessLabel}</span>
        <h1 class="page-title-tight" style="font-size:2.2rem">№ ${escapeHtml(issue.num)} / ${escapeHtml(issue.year)}</h1>
        <p>${escapeHtml(issue.title)}</p>
      </div>
      <div class="container two-col">
        <div class="panel"><div class="panel-body"><div class="cover"><img src="${escapeHtml(issue.cover)}" alt="Выпуск № ${escapeHtml(issue.num)} / ${escapeHtml(issue.year)}"></div></div></div>
        <div class="panel">
          <div class="panel-body table-like issue-summary">
            <h2>${escapeHtml(issue.subtitle || issue.title)}</h2>
            <div class="row"><div class="key">Год</div><div class="val">${escapeHtml(issue.year)}</div></div>
            <div class="row"><div class="key">Номер</div><div class="val">${escapeHtml(issue.num)}</div></div>
            <div class="row"><div class="key">Статус доступа</div><div class="val">${accessLabel}</div></div>
            <div class="row"><div class="key">PDF</div><div class="val">${issue.access === 'open' && pdfHref ? 'Доступен для скачивания' : 'Предоставляется подписчикам'}</div></div>
          </div>
          <div class="panel-body" style="padding-top:0"><div class="actions">${pdfButton}<a class="btn btn-secondary" href="archive.html">Вернуться в архив</a></div></div>
        </div>
      </div>
      ${sectionBlock}`;
  }

  function unwrapListPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return [];
  }

  Promise.all([
    fetch(ISSUE_FILE).then(r => r.json()).catch(() => []),
    fetch(NEWS_FILE).then(r => r.json()).catch(() => [])
  ]).then(([issues, news]) => {
    state.issues = unwrapListPayload(issues).map(normalizeIssue).sort((a,b) => (b.year - a.year) || (b.num - a.num));
    state.news = unwrapListPayload(news).map(normalizeNews).sort((a,b) => parseRuDate(b.date) - parseRuDate(a.date));
    renderHomeHero();
    renderHomeNews();
    renderHomeArchive();
    renderArchivePage();
    renderNewsPage();
    renderIssuePage();
  });
})();
