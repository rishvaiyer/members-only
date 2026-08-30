const loginPanel = document.querySelector('#login-panel');
const loginForm = document.querySelector('#login-form');
const loginStatus = document.querySelector('#login-status');
const workspace = document.querySelector('#workspace');
const logoutButton = document.querySelector('#logout');
const form = document.querySelector('#link-form');
const formTitle = document.querySelector('#form-title');
const formStatus = document.querySelector('#form-status');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const entriesList = document.querySelector('#entries-list');
const entryCount = document.querySelector('#entry-count');
const slugInput = document.querySelector('#slug');
const preview = document.querySelector('#url-preview');
let links = [];

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function setNotice(element, message = '', error = false) {
  element.textContent = message;
  element.classList.toggle('error', error);
}

function shortUrl(slug) {
  return `${location.origin}/testingstuff/${slug}`;
}

function localDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function resetForm() {
  form.reset();
  document.querySelector('#link-id').value = '';
  document.querySelector('#listed').checked = true;
  formTitle.textContent = 'Add a link';
  saveButton.textContent = 'Create link';
  cancelButton.hidden = true;
  preview.textContent = '/testingstuff/field-notes';
  setNotice(formStatus);
}

function renderEntries() {
  entryCount.textContent = `${links.length} ${links.length === 1 ? 'link' : 'links'}`;
  if (!links.length) {
    entriesList.innerHTML = '<p class="empty empty-entries">Create your first clean link on the left.</p>';
    return;
  }
  entriesList.replaceChildren(...links.map((link) => {
    const entry = document.createElement('article');
    entry.className = 'entry';
    const top = document.createElement('div');
    top.className = 'entry-top';
    const copy = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'entry-title';
    title.textContent = link.title;
    const path = document.createElement('p');
    path.className = 'entry-path';
    path.textContent = shortUrl(link.slug);
    copy.append(title, path);
    const status = document.createElement('span');
    status.className = `status-pill${link.active && link.listed ? '' : ' off'}`;
    status.textContent = !link.active ? 'Expired' : link.listed ? 'Listed' : 'Unlisted';
    top.append(copy, status);
    const destination = document.createElement('p');
    destination.className = 'entry-destination';
    destination.textContent = `Goes to ${link.destination}`;
    const actions = document.createElement('div');
    actions.className = 'entry-actions';
    actions.innerHTML = '<button class="button button-secondary" data-action="copy">Copy link</button><button class="button button-secondary" data-action="edit">Edit</button><button class="button button-danger" data-action="delete">Delete</button>';
    actions.querySelector('[data-action="copy"]').addEventListener('click', async () => {
      await navigator.clipboard.writeText(shortUrl(link.slug));
      setNotice(formStatus, 'Link copied.');
    });
    actions.querySelector('[data-action="edit"]').addEventListener('click', () => editLink(link));
    actions.querySelector('[data-action="delete"]').addEventListener('click', () => deleteLink(link));
    entry.append(top, destination, actions);
    return entry;
  }));
}

async function loadLinks() {
  const data = await api('/api/testingstuff/links');
  links = data.links || [];
  renderEntries();
}

function editLink(link) {
  document.querySelector('#link-id').value = link.id;
  document.querySelector('#title').value = link.title;
  slugInput.value = link.slug;
  document.querySelector('#destination').value = link.destination;
  document.querySelector('#note').value = link.note || '';
  document.querySelector('#expires-at').value = localDateTime(link.expires_at);
  document.querySelector('#listed').checked = link.listed;
  formTitle.textContent = 'Edit link';
  saveButton.textContent = 'Save changes';
  cancelButton.hidden = false;
  preview.textContent = shortUrl(link.slug);
  setNotice(formStatus);
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteLink(link) {
  if (!confirm(`Delete “${link.title}”? The short link will stop working.`)) return;
  try {
    await api(`/api/testingstuff/links/${encodeURIComponent(link.id)}`, { method: 'DELETE' });
    if (document.querySelector('#link-id').value === link.id) resetForm();
    await loadLinks();
    setNotice(formStatus, 'Link deleted.');
  } catch (error) {
    setNotice(formStatus, error.message, true);
  }
}

async function unlock() {
  loginPanel.hidden = true;
  workspace.hidden = false;
  logoutButton.hidden = false;
  await loadLinks();
}

slugInput.addEventListener('input', () => {
  slugInput.value = slugInput.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
  preview.textContent = shortUrl(slugInput.value || 'field-notes');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector('button');
  button.disabled = true;
  try {
    await api('/api/testingstuff/login', { method: 'POST', body: JSON.stringify({ password: document.querySelector('#password').value }) });
    document.querySelector('#password').value = '';
    setNotice(loginStatus);
    await unlock();
  } catch (error) {
    setNotice(loginStatus, error.message, true);
  } finally {
    button.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#link-id').value;
  const expiresValue = document.querySelector('#expires-at').value;
  const payload = {
    title: document.querySelector('#title').value,
    slug: slugInput.value,
    destination: document.querySelector('#destination').value,
    note: document.querySelector('#note').value,
    expires_at: expiresValue ? Math.floor(new Date(expiresValue).getTime() / 1000) : null,
    listed: document.querySelector('#listed').checked,
  };
  saveButton.disabled = true;
  try {
    await api(id ? `/api/testingstuff/links/${encodeURIComponent(id)}` : '/api/testingstuff/links', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(payload),
    });
    resetForm();
    await loadLinks();
    setNotice(formStatus, id ? 'Changes saved.' : 'Link created.');
  } catch (error) {
    setNotice(formStatus, error.message, true);
  } finally {
    saveButton.disabled = false;
  }
});

cancelButton.addEventListener('click', resetForm);
logoutButton.addEventListener('click', async () => {
  await api('/api/testingstuff/logout', { method: 'POST', body: '{}' });
  workspace.hidden = true;
  logoutButton.hidden = true;
  loginPanel.hidden = false;
  resetForm();
});

api('/api/testingstuff/session')
  .then((data) => data.authorized ? unlock() : null)
  .catch(() => setNotice(loginStatus, 'The manager could not be loaded.', true));
