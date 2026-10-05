// Data storage for Blue Lock app
// localStorage is kept as the local cache.
// Supabase stores the authenticated player's complete data object.

import { supabase } from './supabase.js';

const STORAGE_KEY = 'bluelock-app-data';

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function initData() {
  const data = {
    profile: {
      name: 'Player',
      archetype: 'THE SOVEREIGN EXECUTOR',
      primaryWeapon: 'RUTHLESS EXECUTION',
      secondaryWeapon: 'STRUCTURED ADAPTATION',
      longTermGoals: [],
      currentGoals: [],
      stats: {
        EXECUTION: 32,
        FOCUS: 27,
        DISCIPLINE: 30,
        MASTERY: 25,
        CREATION: 28,
      },
    },
    egoPoints: 0,
    egoTransactions: [],
    tasks: [],
    trainingSessions: [],
    calendar: [],
    books: [],
    readingSessions: [],
    projects: [],
    achievements: [],
    dailyDebriefs: [],
  };

  saveData(data);
  return data;
}

// -----------------------------------------------------------------------------
// Supabase helpers
// -----------------------------------------------------------------------------

export async function loadFromSupabase() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('player_data')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.data || null;
}

export async function saveToSupabase(data) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('No authenticated user');
  }

  const { error } = await supabase
    .from('player_data')
    .upsert(
      {
        user_id: user.id,
        data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    throw error;
  }
}

export async function migrateLocalToSupabase() {
  const local = loadData();

  if (!local) {
    return;
  }

  try {
    const cloudData = await loadFromSupabase();

    // Never overwrite existing cloud data with local data.
    if (!cloudData) {
      await saveToSupabase(local);
    }
  } catch (e) {
    console.error('Supabase migration error:', e);
  }
}

// -----------------------------------------------------------------------------
// Task helpers
// -----------------------------------------------------------------------------

export function getTasks() {
  const data = loadData();
  return data ? data.tasks : [];
}

export function addTask(task) {
  const data = loadData();

  if (!data) {
    return;
  }

  task.id = Date.now();
  task.completed = false;
  task.completedDate = null;
  task.pointsAwarded = false;

  data.tasks.push(task);
  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase task save error:', e);
  });

  return task;
}

export function updateTask(id, updates) {
  const data = loadData();

  if (!data) {
    return;
  }

  const idx = data.tasks.findIndex((t) => t.id === id);

  if (idx === -1) {
    return;
  }

  const existing = data.tasks[idx];

  data.tasks[idx] = {
    ...existing,
    ...updates,
  };

  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase task update error:', e);
  });

  return data.tasks[idx];
}

export function deleteTask(id) {
  const data = loadData();

  if (!data) {
    return;
  }

  data.tasks = data.tasks.filter((t) => t.id !== id);
  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase task delete error:', e);
  });
}

export function toggleTaskCompletion(id, completed) {
  const data = loadData();

  if (!data) {
    return;
  }

  const task = data.tasks.find((t) => t.id === id);

  if (!task) {
    return;
  }

  if (task.completed === completed) {
    return;
  }

  if (completed) {
    // Award EP exactly once.
    if (!task.pointsAwarded) {
      const points = task.egoPoints || 0;

      data.egoPoints += points;

      data.egoTransactions.push({
        date: new Date().toISOString().split('T')[0],
        task: task.name,
        points,
      });

      task.pointsAwarded = true;
    }

    task.completed = true;
    task.completedDate = new Date().toISOString();
  } else {
    // Keep the existing app behaviour:
    // unchecking a completed task does not remove already-earned EP.
    task.completed = false;
    task.completedDate = null;
  }

  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase toggle error:', e);
  });

  return task;
}

// -----------------------------------------------------------------------------
// Ego points / levels
// -----------------------------------------------------------------------------

export function getEgoPoints() {
  const data = loadData();
  return data ? data.egoPoints : 0;
}

export function getEgoTransactions() {
  const data = loadData();
  return data ? data.egoTransactions : [];
}

const LEVELS = [
  { id: 1, name: 'AWAKENING', points: 0 },
  { id: 2, name: 'FOUNDATION', points: 200 },
  { id: 3, name: 'WEAPON', points: 600 },
  { id: 4, name: 'FLOW', points: 1200 },
  { id: 5, name: 'ADAPTATION', points: 2000 },
  { id: 6, name: 'DOMINANCE', points: 3500 },
  { id: 7, name: 'EVOLUTION', points: 5500 },
  { id: 8, name: 'COMPLETE EGO', points: 8000 },
];

export function getCurrentLevel() {
  const ep = getEgoPoints();

  let current = LEVELS[0];

  for (const lvl of LEVELS) {
    if (ep >= lvl.points) {
      current = lvl;
    }
  }

  return current;
}

export function getLevelProgress() {
  const ep = getEgoPoints();
  const current = getCurrentLevel();
  const next =
    LEVELS.find((lvl) => lvl.id === current.id + 1) || current;

  const needed = next.points - current.points;
  const progress = ep - current.points;
  const percent = needed > 0 ? (progress / needed) * 100 : 0;

  return {
    current,
    next,
    progress,
    needed,
    percent,
  };
}

// -----------------------------------------------------------------------------
// Book helpers
// -----------------------------------------------------------------------------

export function getBooks() {
  const data = loadData();
  return data ? data.books : [];
}

export function addBook(book) {
  const data = loadData();

  if (!data) {
    return;
  }

  book.id = Date.now();

  data.books.push(book);
  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase book save error:', e);
  });

  return book;
}

export function updateBook(id, updates) {
  const data = loadData();

  if (!data) {
    return;
  }

  const idx = data.books.findIndex((b) => b.id === id);

  if (idx === -1) {
    return;
  }

  data.books[idx] = {
    ...data.books[idx],
    ...updates,
  };

  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase book update error:', e);
  });

  return data.books[idx];
}

export function deleteBook(id) {
  const data = loadData();

  if (!data) {
    return;
  }

  data.books = data.books.filter((b) => b.id !== id);
  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase book delete error:', e);
  });
}

// -----------------------------------------------------------------------------
// Reading session helpers
// -----------------------------------------------------------------------------

export function getReadingSessions() {
  const data = loadData();
  return data ? data.readingSessions : [];
}

export function addReadingSession(session) {
  const data = loadData();

  if (!data) {
    return;
  }

  session.id = Date.now();

  data.readingSessions.push(session);
  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase reading session save error:', e);
  });

  return session;
}

export function updateReadingSession(id, updates) {
  const data = loadData();

  if (!data) {
    return;
  }

  const idx = data.readingSessions.findIndex((s) => s.id === id);

  if (idx === -1) {
    return;
  }

  data.readingSessions[idx] = {
    ...data.readingSessions[idx],
    ...updates,
  };

  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase reading session update error:', e);
  });

  return data.readingSessions[idx];
}

export function deleteReadingSession(id) {
  const data = loadData();

  if (!data) {
    return;
  }

  data.readingSessions = data.readingSessions.filter(
    (s) => s.id !== id
  );

  saveData(data);

  void saveToSupabase(data).catch((e) => {
    console.error('Supabase reading session delete error:', e);
  });
}