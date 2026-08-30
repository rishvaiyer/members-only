const list = document.querySelector('#link-list');
const count = document.querySelector('#link-count');

function expiryLabel(timestamp) {
  if (!timestamp) return 'No expiry';
  return `Until ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(timestamp * 1000))}`;
}

function render(links) {
  count.textContent = `${links.length} ${links.length === 1 ? 'link' : 'links'}`;
  if (!links.length) {
    list.innerHTML = '<p class="empty">Nothing is being shared here right now.</p>';
    return;
  }
  list.replaceChildren(...links.map((link) => {
    const row = document.createElement('a');
    row.className = 'link-row';
    row.href = `/testingstuff/${encodeURIComponent(link.slug)}`;
    const copy = document.createElement('span');
    const title = document.createElement('span');
    title.className = 'link-title';
    title.textContent = link.title;
    const note = document.createElement('span');
    note.className = 'link-note';
    note.textContent = link.note || `Open /${link.slug}`;
    copy.append(title, note);
    const meta = document.createElement('span');
    meta.className = 'link-meta';
    meta.textContent = `${expiryLabel(link.expires_at)}  ↗`;
    row.append(copy, meta);
    return row;
  }));
}

fetch('/api/testingstuff/links', { credentials: 'same-origin' })
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((data) => render(data.links || []))
  .catch(() => {
    count.textContent = 'Unavailable';
    list.innerHTML = '<p class="empty">The link list could not be loaded.</p>';
  });
