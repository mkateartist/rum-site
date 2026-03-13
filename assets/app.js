function normalizeItems(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function issueId(issue) {
  return `${issue.year}-${issue.num}`;
}

function issueUrl(issue) {
  return `issue.html?id=${encodeURIComponent(issueId(issue))}`;
}

function issueNumber(issue) {
  return `№ ${issue.num} / ${issue.year}`;
}

function coverPath(cover) {
  if (!cover) return 'assets/COVER_2026-01_Cover_.webp';
  if (/^(https?:)?\//.test(cover) || cover.startsWith('assets/')) return cover;
  return cover.startsWith('uploads/') ? `assets/${cover}` : `assets/${cover.replace(/^\//, '')}`;
}

function accessLabel(access) {
  return access === 'subscription' ? 'По подписке' : 'Открытый архив';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nlToBr(str = '') {
  return escapeHtml(str).replace(/\n/g, '<br>');
}

function textPreview(text = '', max = 180) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trimEnd()}…`;
}

function sortIssues(items) {
  return [...items].sort((a, b) => (b.year - a.year) || (b.num - a.num));
}

function sortNews(items) {
  function parseRuDate(value) {
    const [d, m, y] = String(value).split('.').map(Number);
    return new Date(y || 0, (m || 1) - 1, d || 1).getTime();
  }
  return [...items].sort((a, b) => parseRuDate(b.date) - parseRuDate(a.date));
}

function setIssueSummary(issue) {
  const title = issue.title || issue.topic_text || 'Без названия';
  document.getElementById('home-issue-badge').textContent = accessLabel(issue.access);
  document.getElementById('home-issue-cover').src = coverPath(issue.cover);
  document.getElementById('home-issue-cover').alt = `Обложка ${issueNumber(issue)}`;
  document.getElementById('home-issue-number').textContent = issueNumber(issue);
  document.getElementById('home-issue-title').textContent = title;
  document.getElementById('home-issue-description').textContent = issue.access === 'subscription'
    ? 'На сайте доступны тема номера, аннотация и содержание. Полный PDF предоставляется подписчикам журнала.'
    : 'Выпуск открыт для чтения и скачивания. Подробности и ссылка на PDF доступны на странице номера.';
  document.getElementById('home-topic-heading').textContent = issue.topic_heading || 'Тема номера';
  document.getElementById('home-topic-text').textContent = issue.topic_text || 'Заполните описание в кабинете редактора.';
  document.getElementById('home-law-heading').textContent = issue.law_heading || 'Правовой вопрос';
  document.getElementById('home-law-text').textContent = issue.law_text || 'Заполните описание в кабинете редактора.';
  document.getElementById('home-norm-heading').textContent = issue.norm_heading || 'Нормативно-техническое обеспечение';
  document.getElementById('home-norm-text').textContent = issue.norm_text || 'Заполните описание в кабинете редактора.';

  const detailBtn = document.getElementById('home-issue-detail-btn');
  detailBtn.href = issueUrl(issue);
  const accessBtn = document.getElementById('home-issue-access-btn');
  if (issue.access === 'subscription') {
    accessBtn.textContent = 'Получить доступ';
    accessBtn.href = 'subscription.html';
  } else {
    accessBtn.textContent = issue.pdf ? 'Открыть PDF' : 'Открыть выпуск';
    accessBtn.href = issue.pdf || issueUrl(issue);
    if (issue.pdf) accessBtn.target = '_blank';
  }
}

function renderHomeNews(news) {
  const feature = news[0];
  const featureBox = document.getElementById('home-feature-news');
  const listBox = document.getElementById('home-news-list');
  if (!featureBox || !listBox) return;
  featureBox.innerHTML = '';
  listBox.innerHTML = '';
  if (!feature) {
    listBox.innerHTML = '<article class="news-item"><h4>Новости пока не добавлены</h4></article>';
    return;
  }
  const featureImage = feature.image ? `<div class="feature-media"><img src="${escapeHtml(coverPath(feature.image))}" alt="Иллюстрация к главной новости"></div>` : '';
  featureBox.innerHTML = `${featureImage}<div class="feature-content"><div class="meta-line">Главная новость · ${escapeHtml(feature.date)}</div><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(textPreview(feature.body, 220))}</p><div class="actions"><a class="btn btn-primary" href="news.html">Читать новости</a></div></div>`;
  news.slice(1, 5).forEach(item => {
    const article = document.createElement('article');
    article.className = 'news-item';
    article.innerHTML = `<time>${escapeHtml(item.date)}</time><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(textPreview(item.body, 220))}</p>`;
    listBox.appendChild(article);
  });
}

function renderHomeArchive(issues) {
  const box = document.getElementById('home-archive-grid');
  if (!box) return;
  const openIssues = issues.filter(item => item.access === 'open').slice(0, 4);
  box.innerHTML = '';
  openIssues.forEach(issue => {
    const article = document.createElement('article');
    article.className = 'card';
    article.innerHTML = `<div class="card-body"><a class="issue-thumb" href="${issueUrl(issue)}"><img src="${escapeHtml(coverPath(issue.cover))}" alt="${escapeHtml(issueNumber(issue))}"></a><div class="label">${escapeHtml(accessLabel(issue.access))}</div><h3>${escapeHtml(issueNumber(issue))}</h3><p>${escapeHtml(issue.title || issue.topic_text || issueNumber(issue))}</p><div class="spacer"><div class="actions"><a class="btn btn-secondary" href="${issueUrl(issue)}">Подробнее</a></div></div></div>`;
    box.appendChild(article);
  });
}

function renderArchive(issues) {
  const grid = document.getElementById('archive-grid');
  const filter = document.getElementById('archive-year-filter');
  if (!grid || !filter) return;
  const years = [...new Set(issues.map(item => item.year))].sort((a, b) => b - a);
  filter.innerHTML = '<option value="all">Все годы</option>' + years.map(year => `<option value="${year}">${year}</option>`).join('');
  grid.innerHTML = '';
  issues.forEach(issue => {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.year = issue.year;
    const buttonLabel = issue.access === 'subscription' ? 'Получить доступ' : (issue.pdf ? 'Открыть PDF' : 'Открыть выпуск');
    const buttonHref = issue.access === 'subscription' ? 'subscription.html' : (issue.pdf || issueUrl(issue));
    article.innerHTML = `<div class="card-body"><a class="issue-thumb" href="${issueUrl(issue)}"><img src="${escapeHtml(coverPath(issue.cover))}" alt="${escapeHtml(issueNumber(issue))}"></a><div class="label">${escapeHtml(accessLabel(issue.access))}</div><h3>${escapeHtml(issueNumber(issue))}</h3><p>${escapeHtml(issue.title || issue.topic_text || issueNumber(issue))}</p><div class="spacer"><div class="actions"><a class="btn btn-secondary" href="${escapeHtml(buttonHref)}" ${issue.access === 'open' && issue.pdf ? 'target="_blank"' : ''}>${buttonLabel}</a></div></div></div>`;
    grid.appendChild(article);
  });

  filter.addEventListener('change', () => {
    const value = filter.value;
    grid.querySelectorAll('[data-year]').forEach(el => {
      el.style.display = value === 'all' || el.dataset.year === value ? '' : 'none';
    });
  });
}

function renderNewsPage(news) {
  const hero = document.getElementById('news-hero');
  const list = document.getElementById('news-list');
  if (!hero || !list) return;
  const first = news[0];
  if (!first) {
    hero.innerHTML = '<p class="lead">Новости пока не добавлены.</p>';
    list.innerHTML = '';
    return;
  }
  const paragraphs = (first.body || '').split(/\n{2,}/).filter(Boolean).map(p => `<p class="lead" style="margin-top:14px">${escapeHtml(p)}</p>`).join('');
  const image = first.image ? `<div class="news-hero-image"><img src="${escapeHtml(coverPath(first.image))}" alt="Иллюстрация к новости"></div>` : '';
  hero.innerHTML = `<div class="news-hero">${image}<div class="news-hero-copy"><div class="meta-line">${escapeHtml(first.date)}</div><h2 style="margin-top:10px">${escapeHtml(first.title)}</h2>${paragraphs}</div></div>`;
  list.innerHTML = '';
  news.slice(1).forEach(item => {
    const article = document.createElement('article');
    article.className = 'news-item';
    article.innerHTML = `<time>${escapeHtml(item.date)}</time><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.body || '')}</p>`;
    list.appendChild(article);
  });
}

function renderIssuePage(issues) {
  if (!document.body.dataset.page || document.body.dataset.page !== 'issue') return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const issue = issues.find(item => issueId(item) === id) || issues[0];
  if (!issue) return;
  document.title = `РУМ — ${issueNumber(issue)}`;
  document.getElementById('issue-access-label').textContent = accessLabel(issue.access);
  document.getElementById('issue-number').textContent = issueNumber(issue);
  document.getElementById('issue-title').textContent = issue.title || issue.topic_text || issueNumber(issue);
  document.getElementById('issue-cover').src = coverPath(issue.cover);
  document.getElementById('issue-cover').alt = `Обложка ${issueNumber(issue)}`;
  document.getElementById('issue-main-title').textContent = issue.title || issue.topic_text || issueNumber(issue);
  document.getElementById('issue-topic-heading').textContent = issue.topic_heading || 'Тема номера';
  document.getElementById('issue-topic-text').innerHTML = nlToBr(issue.topic_text || 'Описание не заполнено.');
  document.getElementById('issue-law-heading').textContent = issue.law_heading || 'Правовой вопрос';
  document.getElementById('issue-law-text').innerHTML = nlToBr(issue.law_text || 'Описание не заполнено.');
  document.getElementById('issue-norm-heading').textContent = issue.norm_heading || 'Нормативно-техническое обеспечение';
  document.getElementById('issue-norm-text').innerHTML = nlToBr(issue.norm_text || 'Описание не заполнено.');
  document.getElementById('issue-access-text').textContent = accessLabel(issue.access);
  const pdfCell = document.getElementById('issue-pdf-cell');
  const actions = document.getElementById('issue-actions');
  actions.innerHTML = '';
  if (issue.access === 'subscription') {
    pdfCell.textContent = 'Предоставляется подписчикам';
    actions.innerHTML = '<a class="btn btn-primary" href="subscription.html">Оформить подписку</a><a class="btn btn-secondary" href="archive.html">Назад к архиву</a>';
  } else if (issue.pdf) {
    pdfCell.innerHTML = `<a href="${escapeHtml(issue.pdf)}" target="_blank" rel="noopener">Открыть PDF</a>`;
    actions.innerHTML = `<a class="btn btn-primary" href="${escapeHtml(issue.pdf)}" target="_blank" rel="noopener">Открыть PDF</a><a class="btn btn-secondary" href="archive.html">Назад к архиву</a>`;
  } else {
    pdfCell.textContent = 'Ссылка не добавлена';
    actions.innerHTML = '<a class="btn btn-secondary" href="archive.html">Назад к архиву</a>';
  }
}

async function init() {
  try {
    const issues = sortIssues(normalizeItems(await fetchJson('assets/content-issues.json')));
    const news = sortNews(normalizeItems(await fetchJson('assets/content-news.json')));
    if (issues.length) {
      setIssueSummary(issues[0]);
      renderHomeArchive(issues.filter(item => item.access === 'open'));
      renderArchive(issues);
      renderIssuePage(issues);
    }
    if (news.length) {
      renderHomeNews(news);
      renderNewsPage(news);
    }
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', init);
