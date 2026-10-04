// Main entry point for Blue Lock app
import { renderLogin } from './components/login.js';
import { renderDashboard } from './components/dashboard.js';
import { renderCalendar } from './components/calendar.js';
import { loadData, initData, getCurrentLevel, getEgoPoints } from './data/storage.js';

const app = document.getElementById('app');
const PASSWORD = 'BLUELOCKSUMMER';

let currentView = 'dashboard'; // 'dashboard' or 'calendar'

function renderView() {
  app.innerHTML = '';
  const headerBar = document.createElement('div');
  headerBar.className = 'header-bar';
  const left = document.createElement('div');
  left.className = 'left';
  const title = document.createElement('div');
  title.textContent = 'BLUE LOCK // PROJECT EGO';
  left.appendChild(title);
  const data = loadData();
  const levelInfo = getCurrentLevel();
  const level = document.createElement('div');
  level.textContent = `LEVEL: ${String(levelInfo.id).padStart(2, '0')} – ${levelInfo.name}`;
  const ep = document.createElement('div');
  ep.textContent = `EP: ${getEgoPoints()}`;
  left.append(level, ep);
  headerBar.appendChild(left);
  app.appendChild(headerBar);

  const nav = document.createElement('nav');
  nav.className = 'nav-tabs';
  const tabs = [
    { id: 'dashboard', label: 'TODAY' },
    { id: 'calendar', label: 'CALENDAR' },
    { id: 'training', label: 'TRAINING' },
    { id: 'reading', label: 'READING ARENA' },
    { id: 'projects', label: 'PROJECT ARENA' },
    { id: 'profile', label: 'PLAYER PROFILE' },
    { id: 'evolution', label: 'EVOLUTION' },
    { id: 'achievements', label: 'ACHIEVEMENTS' },
    { id: 'settings', label: 'SETTINGS' },
  ];
  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'nav-tab' + (currentView === tab.id ? ' active' : '');
    btn.textContent = tab.label;
    btn.addEventListener('click', () => {
      currentView = tab.id;
      renderView();
    });
    nav.appendChild(btn);
  });
  app.appendChild(nav);

  const container = document.createElement('div');
  container.style.padding = '1rem';
  container.style.flexGrow = '1';
  app.appendChild(container);

  if (currentView === 'dashboard') {
    renderDashboard(container, data);
  } else if (currentView === 'calendar') {
    renderCalendar(container, data);
  }
}

function showLogin() {
  app.innerHTML = '';
  renderLogin(app, onLogin);
}

function onLogin(password) {
  if (password === PASSWORD) {
    localStorage.setItem('bluelock-logged-in', 'true');
    if (!loadData()) {
      initData();
    }
    renderView();
  } else {
    alert('Incorrect password');
  }
}

let loggedIn = localStorage.getItem('bluelock-logged-in') === 'true';
if (loggedIn && loadData()) {
  renderView();
} else {
  showLogin();
}
