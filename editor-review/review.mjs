export const editorialAuthor = {id: 'editorial', name: 'Редакция «ЭКО в России»', role: 'Редакционный материал'};
export function reviewLink(context, catalog, specialistId, checks) {
  if (!/^[a-f0-9]{24}$/.test(context.ticket || '') ||
      !/^[a-f0-9]{12}$/.test(context.revision || '') || context.revision !== catalog.revision ||
      !/^[a-z0-9-]{1,16}$/.test(specialistId || '') ||
      ![editorialAuthor, ...catalog.specialists].some(person => person.id === specialistId) ||
      checks.length !== 6 || !checks.every(value => value === true)) return null;
  const payload = `review3_${context.ticket}_${specialistId}_${context.revision}`;
  return payload.length <= 64 ? `https://t.me/Mamontenok_editing_bot?start=${payload}` : null;
}

async function setup() {
  const get = id => document.getElementById(id);
  const params = new URLSearchParams(location.hash.slice(1));
  const context = {ticket: params.get('ticket'), revision: params.get('revision')};
  const title = params.get('title');
  if (title) get('article-title').textContent = title.slice(0, 180);
  const status = get('status');
  const select = get('specialist');
  const button = get('approve-button');
  const checks = ['sources-check', 'medical-check', 'language-check', 'cover-check', 'notes-check', 'author-check'].map(get);
  try {
    const response = await fetch('/russia-ivf-site/editor-review/specialists.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('catalog');
    const catalog = await response.json();
    if (!Array.isArray(catalog.specialists) || !catalog.specialists.length) throw new Error('catalog');
    const authors = [editorialAuthor, ...catalog.specialists];
    for (const person of authors) {
      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = `${person.name} — ${person.role}`;
      select.append(option);
    }
    select.disabled = false;
    const validContext = /^[a-f0-9]{24}$/.test(context.ticket || '') && context.revision === catalog.revision;
    status.textContent = !context.ticket ? 'Это просмотр формы. Для утверждения открой ссылку из карточки черновика.' :
      'Ссылка устарела или неполная. Открой актуальную карточку в Telegram.';
    status.hidden = validContext;
    const update = () => {
      const person = authors.find(p => p.id === select.value);
      get('selected-specialist').hidden = !person;
      if (person) {
        get('person-name').textContent = person.name;
        get('person-role').textContent = person.role;
        get('person-profile').hidden = !person.profile_url;
        if (person.profile_url) {
          const url = new URL(person.profile_url);
          if (url.origin !== 'https://russia-ivf.com' || !url.pathname.startsWith('/ourteam/')) throw new Error('profile');
          get('person-profile').href = url.href;
        }
        get('author-confirmation').textContent = person.id === 'editorial' ?
          'Публикую от редакции «ЭКО в России» и принимаю ответственность за выпуск.' :
          `Подтверждаю участие автора (${person.name}) в подготовке материала и его согласие на публикацию под этим именем.`;
      }
      button.disabled = !reviewLink(context, catalog, select.value, checks.map(c => c.checked));
    };
    select.addEventListener('change', () => {get('author-check').checked = false; update();});
    checks.forEach(check => check.addEventListener('change', update));
    get('review-form').addEventListener('submit', event => {
      event.preventDefault();
      const link = reviewLink(context, catalog, select.value, checks.map(c => c.checked));
      if (link) location.assign(link);
    });
  } catch {
    status.hidden = false;
    status.textContent = 'Не удалось загрузить форму. Обнови страницу или вернись к карточке бота.';
    button.disabled = true;
  }
}

if (typeof document !== 'undefined') setup();
