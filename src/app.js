import { renderLogin } from './components/login.js';
import { renderDashboard } from './components/dashboard.js';
import { renderCalendar } from './components/calendar.js';
import { renderProfile } from './components/profile.js';

import {
  loadData,
  initData,
  getCurrentLevel,
  getEgoPoints,
  loadFromSupabase,
  saveToSupabase,
} from './data/storage.js';

import { supabase } from './data/supabase.js';

const app = document.getElementById('app');

let currentView = 'dashboard';
let currentUser = null;

function showLoading() {
  app.innerHTML = '';

  const loading = document.createElement('div');

  loading.className = 'center';
  loading.style.flexDirection = 'column';

  const title = document.createElement('h2');

  title.textContent =
    'LOADING PLAYER DATA...';

  loading.appendChild(title);

  app.appendChild(
    loading
  );
}

function renderView() {
  app.innerHTML = '';

  const headerBar =
    document.createElement('div');

  headerBar.className =
    'header-bar';

  const left =
    document.createElement('div');

  left.className =
    'left';

  const title =
    document.createElement('div');

  title.textContent =
    'BLUE LOCK // PROJECT EGO';

  left.appendChild(
    title
  );

  const levelInfo =
    getCurrentLevel();

  const level =
    document.createElement('div');

  level.id =
    'level-header';

  level.textContent =
    `LEVEL: ${String(
      levelInfo.id
    ).padStart(
      2,
      '0'
    )} – ${levelInfo.name}`;

  const ep =
    document.createElement('div');

  ep.id =
    'ego-points-header';

  ep.textContent =
    `EP: ${getEgoPoints()}`;

  left.append(
    level,
    ep
  );

  headerBar.appendChild(
    left
  );

  app.appendChild(
    headerBar
  );

  const nav =
    document.createElement('nav');

  nav.className =
    'nav-tabs';

  const tabs = [
    {
      id: 'dashboard',
      label: 'TODAY',
    },
    {
      id: 'calendar',
      label: 'CALENDAR',
    },
    {
      id: 'training',
      label: 'TRAINING',
    },
    {
      id: 'reading',
      label: 'READING ARENA',
    },
    {
      id: 'projects',
      label: 'PROJECT ARENA',
    },
    {
      id: 'profile',
      label: 'PLAYER PROFILE',
    },
    {
      id: 'evolution',
      label: 'EVOLUTION',
    },
    {
      id: 'achievements',
      label: 'ACHIEVEMENTS',
    },
    {
      id: 'settings',
      label: 'SETTINGS',
    },
  ];

  tabs.forEach(
    (tab) => {
      const btn =
        document.createElement(
          'button'
        );

      btn.className =
        'nav-tab' +
        (
          currentView ===
          tab.id
            ? ' active'
            : ''
        );

      btn.textContent =
        tab.label;

      btn.addEventListener(
        'click',
        () => {
          currentView =
            tab.id;

          renderView();
        }
      );

      nav.appendChild(
        btn
      );
    }
  );

  app.appendChild(
    nav
  );

  const container =
    document.createElement(
      'div'
    );

  container.style.padding =
    '1rem';

  container.style.flexGrow =
    '1';

  app.appendChild(
    container
  );

  const data =
    loadData();

  if (!data) {
    return;
  }

  if (
    currentView ===
    'dashboard'
  ) {
    renderDashboard(
      container,
      data
    );

  } else if (
    currentView ===
    'calendar'
  ) {
    renderCalendar(
      container,
      data
    );

  } else if (
    currentView ===
    'profile'
  ) {
    renderProfile(
      container,
      data
    );

  } else if (
    currentView ===
    'settings'
  ) {
    renderSettings(
      container
    );

  } else {
    const message =
      document.createElement(
        'div'
      );

    message.style.padding =
      '2rem';

    message.textContent =
      `${
        tabs.find(
          (tab) =>
            tab.id ===
            currentView
        )?.label ||
        'SECTION'
      } — COMING SOON`;

    container.appendChild(
      message
    );
  }
}

function renderSettings(
  container
) {
  const heading =
    document.createElement(
      'h2'
    );

  heading.textContent =
    'SETTINGS';

  const description =
    document.createElement(
      'p'
    );

  description.textContent =
    currentUser?.email
      ? `PLAYER: ${currentUser.email}`
      : 'PLAYER ACCOUNT';

  const signOutBtn =
    document.createElement(
      'button'
    );

  signOutBtn.className =
    'btn';

  signOutBtn.textContent =
    'SIGN OUT';

  signOutBtn.addEventListener(
    'click',
    async () => {
      signOutBtn.disabled =
        true;

      signOutBtn.textContent =
        'SIGNING OUT...';

      const {
        error,
      } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'Sign out error:',
          error
        );

        signOutBtn.disabled =
          false;

        signOutBtn.textContent =
          'SIGN OUT';

        alert(
          'Unable to sign out. Please try again.'
        );
      }
    }
  );

  container.append(
    heading,
    description,
    signOutBtn
  );
}

async function loadPlayerData(
  user
) {
  currentUser =
    user;

  showLoading();

  try {
    const cloudData =
      await loadFromSupabase();

    if (cloudData) {
      saveLocalCache(
        cloudData
      );

    } else {
      let localData =
        loadData();

      if (!localData) {
        localData =
          initData();
      }

      await saveToSupabase(
        localData
      );

      saveLocalCache(
        localData
      );
    }

    renderView();

  } catch (error) {
    console.error(
      'Player data loading error:',
      error
    );

    let localData =
      loadData();

    if (!localData) {
      localData =
        initData();
    }

    saveLocalCache(
      localData
    );

    renderView();
  }
}

function saveLocalCache(
  data
) {
  localStorage.setItem(
    'bluelock-app-data',
    JSON.stringify(data)
  );
}

async function onLogin(
  user
) {
  await loadPlayerData(
    user
  );
}

function showLogin() {
  app.innerHTML = '';

  renderLogin(
    app,
    onLogin
  );
}

async function handleAuthStateChange(
  event,
  session
) {
  if (session?.user) {
    currentUser =
      session.user;

    if (
      event !==
      'INITIAL_SESSION'
    ) {
      await loadPlayerData(
        session.user
      );
    }

  } else {
    currentUser =
      null;

    showLogin();
  }
}

async function startup() {
  showLoading();

  const {
    data: {
      session,
    },
    error,
  } =
    await supabase.auth.getSession();

  if (error) {
    console.error(
      'Session check error:',
      error
    );

    showLogin();

    return;
  }

  if (session?.user) {
    await loadPlayerData(
      session.user
    );

  } else {
    showLogin();
  }
}

supabase.auth.onAuthStateChange(
  (
    event,
    session
  ) => {
    void handleAuthStateChange(
      event,
      session
    ).catch(
      (error) => {
        console.error(
          'Auth state change error:',
          error
        );
      }
    );
  }
);

window.addEventListener(
  'bluelock-data-changed',
  () => {
    if (currentUser) {
      renderView();
    }
  }
);

startup().catch(
  (error) => {
    console.error(
      'Application startup error:',
      error
    );

    showLogin();
  }
);