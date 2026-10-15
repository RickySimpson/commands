'use strict';

const $ = id => document.getElementById(id);
const searchInput = $('searchInput');
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const entries = Object.entries(commands).flatMap(([category, items]) => items.map(item => ({
    ...item, category, id: slug(category + '-' + item.name)
})));
let activeFilter = 'all';
let favoritesOnly = false;
let favorites = new Set();
let view = 'cards';
try {
    const saved = JSON.parse(localStorage.getItem('commandFavorites') || '[]');
    if (Array.isArray(saved)) favorites = new Set(saved.filter(id => entries.some(item => item.id === id)));
    if (localStorage.getItem('commandView') === 'list') view = 'list';
} catch { /* The reference still works when storage is unavailable. */ }

function savePreference(key, value) {
    try { localStorage.setItem(key, value); }
    catch { announce('Browser storage is unavailable. This preference will last for this visit.'); }
}
let statusTimer;
function announce(message) {
    clearTimeout(statusTimer);
    $('copyStatus').textContent = message;
    statusTimer = setTimeout(() => { $('copyStatus').textContent = ''; }, 5000);
}
function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function button(text, label, action) {
    const node = element('button', '', text);
    node.type = 'button';
    if (label) node.setAttribute('aria-label', label);
    node.addEventListener('click', action);
    return node;
}
async function copyText(text, success, control) {
    try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(text);
        announce(success);
        if (control) {
            control.textContent = 'Copied';
            clearTimeout(control.copyTimer);
            control.copyTimer = setTimeout(() => { control.textContent = 'Copy'; }, 1800);
        }
    } catch {
        announce('Could not access the clipboard. Select the command text and copy it manually.');
    }
}
function badgesFor(item) {
    const text = item.command;
    const tags = [item.category === 'Command Prompt' ? 'Command Prompt' :
        item.category === 'Winget' && text.startsWith('winget ') ? 'PowerShell / CMD' :
        item.category === 'Windows Repair' ? 'PowerShell / CMD' : 'PowerShell'];
    if (item.category === 'Windows Repair' || /^(Install-PackageProvider|Install-Module|Get-WindowsUpdate|Get-WUHistory)/.test(text) ||
        /^(Restart-Service|Test-ComputerSecureChannel|powercfg \/hibernate|ipconfig \/flushdns)/i.test(text)) tags.push('Run as administrator');
    if (/PSWindowsUpdate|Get-WindowsUpdate|Get-WUHistory/.test(text)) tags.push('PSWindowsUpdate');
    if (/MgGraph|MgUser/.test(text)) tags.push('Microsoft Graph');
    if (/ExchangeOnline|Mailbox|DistributionGroup/.test(text)) tags.push('ExchangeOnlineManagement');
    if (/Get-Team|Add-TeamUser/.test(text)) tags.push('MicrosoftTeams');
    if (/ADSync/.test(text)) tags.push('ADSync server');
    if (/-AutoReboot/.test(text)) tags.push('May restart PC');
    if (/ipconfig \/release/.test(text)) tags.push('Interrupts network');
    if (/Update-MgUser/.test(text)) tags.push('Changes password');
    return tags;
}
function docsFor(item) {
    if (item.docs) return item.docs;
    if (/^Add-AppxPackage/.test(item.command)) return 'https://learn.microsoft.com/en-us/powershell/module/appx/add-appxpackage';
    const pages = {
        'Winget':'https://learn.microsoft.com/en-us/windows/package-manager/winget/',
        'Command Prompt':'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands',
        'Windows Repair':'https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image',
        'Windows Update':'https://www.powershellgallery.com/packages/PSWindowsUpdate',
        'PowerShell':'https://learn.microsoft.com/en-us/powershell/',
        'Microsoft 365':'https://learn.microsoft.com/en-us/microsoft-365/enterprise/manage-microsoft-365-with-microsoft-365-powershell'
    };
    return pages[item.category];
}
function renderCard(item) {
    const card = element('article', 'command-card');
    card.id = item.id;
    const header = element('div', 'command-header');
    const title = element('h3', '', item.name);
    const actions = element('div', 'card-actions');
    const favorite = button(favorites.has(item.id) ? '★' : '☆', 'Favorite: ' + item.name, () => {
        if (favorites.has(item.id)) favorites.delete(item.id); else favorites.add(item.id);
        savePreference('commandFavorites', JSON.stringify([...favorites]));
        favorite.textContent = favorites.has(item.id) ? '★' : '☆';
        favorite.setAttribute('aria-pressed', String(favorites.has(item.id)));
        if (favoritesOnly) {
            renderCommands();
            $('favoritesOnly').focus();
        }
    });
    favorite.className = 'favorite-btn';
    favorite.setAttribute('aria-pressed', String(favorites.has(item.id)));
    const copy = button('Copy', 'Copy ' + item.name, () => copyText(item.command, 'Copied: ' + item.name, copy));
    actions.append(favorite, copy);
    header.append(title, actions);
    const badges = element('div', 'badges');
    badgesFor(item).forEach(tag => badges.append(element('span', 'badge' + (/restart|Interrupts|Changes/.test(tag) ? ' attention' : ''), tag)));
    const pre = element('pre');
    pre.tabIndex = 0;
    pre.setAttribute('aria-label', 'Command: ' + item.name);
    pre.append(element('code', '', item.command));
    const footer = element('div', 'card-footer');
    const link = element('a', '', 'Link');
    link.href = '#' + item.id;
    link.setAttribute('aria-label', 'Direct link to ' + item.name);
    const docs = element('a', '', item.docs ? 'Command docs ↗' : 'Reference ↗');
    docs.href = docsFor(item);
    docs.target = '_blank';
    docs.rel = 'noopener noreferrer';
    docs.setAttribute('aria-label', 'Documentation for ' + item.name + ' (opens in a new tab)');
    const wrap = button('Wrap: on', 'Toggle line wrapping for ' + item.name, () => {
        const unwrapped = pre.classList.toggle('nowrap');
        wrap.textContent = unwrapped ? 'Wrap: off' : 'Wrap: on';
        wrap.setAttribute('aria-pressed', String(!unwrapped));
    });
    wrap.setAttribute('aria-pressed', 'true');
    footer.append(link, docs, wrap);
    card.append(header, badges, pre, element('p', 'command-description', item.description), footer);
    if (item.reviewed) card.append(element('p', 'reviewed', 'Docs reviewed ' + item.reviewed));
    return card;
}
function renderCommands() {
    const query = searchInput.value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = entries.filter(item => (activeFilter === 'all' || item.category === activeFilter) &&
        (!favoritesOnly || favorites.has(item.id)) && terms.every(term =>
            [item.name, item.command, item.description, item.category].join(' ').toLowerCase().includes(term)));
    const container = $('commandsContainer');
    container.replaceChildren();
    container.classList.toggle('list-view', view === 'list');
    for (const category of Object.keys(commands)) {
        const items = matches.filter(item => item.category === category);
        if (!items.length) continue;
        const section = element('section', 'category-section');
        const header = element('div', 'category-header');
        const heading = element('h2', '', category);
        heading.id = 'category-' + slug(category);
        section.setAttribute('aria-labelledby', heading.id);
        header.append(heading, element('span', 'category-count', String(items.length)));
        const grid = element('div', 'commands-grid');
        items.forEach(item => grid.append(renderCard(item)));
        section.append(header, grid);
        container.append(section);
    }
    $('resultCount').textContent = `${matches.length} of ${entries.length} commands · ${activeFilter === 'all' ? 'All categories' : activeFilter}${favoritesOnly ? ' · Favorites' : ''}`;
    $('noResults').hidden = matches.length !== 0;
    $('clearSearch').hidden = searchInput.value.length === 0;
}
function setFilter(category) {
    activeFilter = category;
    $('categorySelect').value = category;
    for (const control of $('filters').children) control.setAttribute('aria-pressed', String(control.dataset.category === category));
    renderCommands();
}
for (const category of ['all', ...Object.keys(commands)]) {
    const label = category === 'all' ? 'All commands' : category;
    const control = button(label, '', () => setFilter(category));
    control.dataset.category = category;
    control.setAttribute('aria-pressed', String(category === activeFilter));
    $('filters').append(control);
    const option = element('option', '', label);
    option.value = category;
    $('categorySelect').append(option);
}
function clearSearch() { searchInput.value = ''; renderCommands(); searchInput.focus(); }
searchInput.addEventListener('input', renderCommands);
$('clearSearch').addEventListener('click', clearSearch);
$('categorySelect').addEventListener('change', event => setFilter(event.target.value));
$('favoritesOnly').addEventListener('click', () => {
    favoritesOnly = !favoritesOnly;
    $('favoritesOnly').setAttribute('aria-pressed', String(favoritesOnly));
    renderCommands();
});
function setView(nextView, persist = true) {
    view = nextView;
    $('cardsView').setAttribute('aria-pressed', String(view === 'cards'));
    $('listView').setAttribute('aria-pressed', String(view === 'list'));
    if (persist) savePreference('commandView', view);
    renderCommands();
}
$('cardsView').addEventListener('click', () => setView('cards'));
$('listView').addEventListener('click', () => setView('list'));
$('resetFilters').addEventListener('click', () => {
    searchInput.value = '';
    favoritesOnly = false;
    $('favoritesOnly').setAttribute('aria-pressed', 'false');
    setFilter('all');
    searchInput.focus();
});
function revealHash() {
    const item = entries.find(entry => '#' + entry.id === location.hash);
    if (!item) return;
    searchInput.value = '';
    favoritesOnly = false;
    $('favoritesOnly').setAttribute('aria-pressed', 'false');
    setFilter(item.category);
    const card = $(item.id);
    card.tabIndex = -1;
    card.focus({preventScroll:true});
    card.scrollIntoView({block:'start'});
}
window.addEventListener('hashchange', revealHash);
document.addEventListener('keydown', event => {
    const editing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); searchInput.focus();
    }
    if (event.key === 'Escape' && document.activeElement === searchInput) clearSearch();
});
$('catalogSummary').textContent = `${entries.length} commands · ${Object.keys(commands).length} categories`;
setView(view, false);
revealHash();
