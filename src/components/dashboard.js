import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  getEgoPoints,
  getCurrentLevel,
  getLevelProgress,
} from '../data/storage.js';

import { renderRadar } from './radarChart.js';
import { showTaskModal } from './taskFormModal.js';
import { renderDailyDebrief } from './dailyDebrief.js';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function calculatePlayerStats(data) {
  const base = data.profile?.stats || {
    EXECUTION: 32,
    FOCUS: 27,
    DISCIPLINE: 30,
    MASTERY: 25,
    CREATION: 28,
  };

  const tasks = data.tasks || [];

  const completedTasks = tasks.filter(
    (task) => task.completed
  );

  const completionRate =
    tasks.length > 0
      ? completedTasks.length / tasks.length
      : 0;

  const trainingDays = new Set(
    completedTasks
      .map(
        (task) =>
          task.completedDate?.split('T')[0] ||
          task.date
      )
      .filter(Boolean)
  ).size;

  const academic = completedTasks.filter(
    (task) => task.category === 'ACADEMIC'
  ).length;

  const reading = completedTasks.filter(
    (task) => task.category === 'READING'
  ).length;

  const languages = completedTasks.filter(
    (task) => task.category === 'LANGUAGES'
  ).length;

  const projects = completedTasks.filter(
    (task) => task.category === 'PROJECTS'
  ).length;

  const coding = completedTasks.filter(
    (task) => task.category === 'CODING'
  ).length;

  const competitions = completedTasks.filter(
    (task) => task.category === 'COMPETITIONS'
  ).length;

  const executionGain = Math.round(
    completionRate * 25
  );

  const focusGain = Math.min(
    trainingDays * 2,
    18
  );

  const disciplineGain = Math.min(
    trainingDays * 3,
    24
  );

  const masteryGain = Math.min(
    academic * 3 +
      reading +
      languages * 2,
    25
  );

  const creationGain = Math.min(
    projects * 4 +
      coding * 3 +
      competitions,
    25
  );

  const stats = {
    EXECUTION: Math.min(
      100,
      Math.round(
        base.EXECUTION + executionGain
      )
    ),

    FOCUS: Math.min(
      100,
      Math.round(
        base.FOCUS + focusGain
      )
    ),

    DISCIPLINE: Math.min(
      100,
      Math.round(
        base.DISCIPLINE + disciplineGain
      )
    ),

    MASTERY: Math.min(
      100,
      Math.round(
        base.MASTERY + masteryGain
      )
    ),

    CREATION: Math.min(
      100,
      Math.round(
        base.CREATION + creationGain
      )
    ),
  };

  const debriefs =
    data.dailyDebriefs || [];

  const recentDebriefs =
    debriefs
      .slice()
      .sort((a, b) =>
        String(b.date).localeCompare(
          String(a.date)
        )
      )
      .slice(0, 7);

  if (recentDebriefs.length > 0) {
    const averages = {
      EXECUTION: 0,
      FOCUS: 0,
      DISCIPLINE: 0,
      MASTERY: 0,
      CREATION: 0,
    };

    recentDebriefs.forEach(
      (debrief) => {
        averages.EXECUTION +=
          Number(debrief.execution) || 0;

        averages.FOCUS +=
          Number(debrief.focus) || 0;

        averages.DISCIPLINE +=
          Number(debrief.discipline) || 0;

        averages.MASTERY +=
          Number(debrief.learning) || 0;

        averages.CREATION +=
          Number(debrief.creation) || 0;
      }
    );

    Object.keys(averages).forEach(
      (stat) => {
        averages[stat] =
          averages[stat] /
          recentDebriefs.length;

        const contribution =
          Math.round(
            (averages[stat] - 1) * 0.8
          );

        stats[stat] = Math.min(
          100,
          stats[stat] +
            Math.max(0, contribution)
        );
      }
    );
  }

  return stats;
}

function createStatBox(
  label,
  value
) {
  const box =
    document.createElement('div');

  Object.assign(box.style, {
    border:
      '1px solid rgba(255,255,255,0.12)',
    padding: '1rem',
    minWidth: '130px',
    flex: '1 1 130px',
  });

  const labelEl =
    document.createElement('div');

  labelEl.textContent = label;
  labelEl.style.fontSize = '0.75rem';
  labelEl.style.opacity = '0.6';
  labelEl.style.letterSpacing = '0.08em';

  const valueEl =
    document.createElement('div');

  valueEl.textContent = value;
  valueEl.style.fontSize = '1.8rem';
  valueEl.style.fontWeight = '700';
  valueEl.style.marginTop = '0.3rem';

  box.append(
    labelEl,
    valueEl
  );

  return box;
}

function renderTaskList(
  container,
  tasks
) {
  container.innerHTML = '';

  if (tasks.length === 0) {
    const empty =
      document.createElement('p');

    empty.textContent =
      'NO TRAINING ASSIGNED FOR TODAY.';

    empty.style.opacity = '0.5';

    container.appendChild(empty);

    return;
  }

  tasks.forEach((task) => {
    const row =
      document.createElement('div');

    Object.assign(row.style, {
      border:
        '1px solid rgba(255,255,255,0.12)',
      padding: '1rem',
      marginBottom: '0.75rem',
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      flexWrap: 'wrap',
    });

    const checkbox =
      document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.checked =
      Boolean(task.completed);

    checkbox.addEventListener(
      'change',
      () => {
        toggleTaskCompletion(
          task.id,
          checkbox.checked
        );

        window.dispatchEvent(
          new Event(
            'bluelock-data-changed'
          )
        );
      }
    );

    const info =
      document.createElement('div');

    info.style.flex =
      '1 1 250px';

    const name =
      document.createElement('strong');

    name.textContent =
      task.name || 'UNTITLED TASK';

    if (task.completed) {
      name.style.textDecoration =
        'line-through';

      name.style.opacity =
        '0.5';
    }

    const details =
      document.createElement('div');

    details.textContent =
      `${task.category || 'PERSONAL'} • ${
        task.targetDuration || 0
      } HRS • ${
        task.egoPoints || 0
      } EP • ${
        task.difficulty || 1
      }/5`;

    details.style.fontSize =
      '0.75rem';

    details.style.opacity =
      '0.6';

    details.style.marginTop =
      '0.4rem';

    info.append(
      name,
      details
    );

    const edit =
      document.createElement('button');

    edit.className = 'btn';
    edit.textContent = 'EDIT';

    edit.addEventListener(
      'click',
      () => {
        showTaskModal(
          task,
          (updatedTask) => {
            updateTask(
              task.id,
              updatedTask
            );

            window.dispatchEvent(
              new Event(
                'bluelock-data-changed'
              )
            );
          }
        );
      }
    );

    const remove =
      document.createElement('button');

    remove.className = 'btn';
    remove.textContent = 'DELETE';

    remove.addEventListener(
      'click',
      () => {
        const confirmed =
          window.confirm(
            'DELETE THIS TRAINING TASK?'
          );

        if (!confirmed) {
          return;
        }

        deleteTask(task.id);

        window.dispatchEvent(
          new Event(
            'bluelock-data-changed'
          )
        );
      }
    );

    row.append(
      checkbox,
      info,
      edit,
      remove
    );

    container.appendChild(row);
  });
}

export function renderDashboard(
  container,
  data
) {
  container.innerHTML = '';

  const today =
    getToday();

  const tasks =
    getTasks().filter(
      (task) =>
        task.date === today
    );

  const completed =
    tasks.filter(
      (task) =>
        task.completed
    ).length;

  const completion =
    tasks.length > 0
      ? Math.round(
          (completed /
            tasks.length) *
            100
        )
      : 0;

  const egoPoints =
    getEgoPoints();

  const level =
    getCurrentLevel();

  const levelProgress =
    getLevelProgress();

  const stats =
    calculatePlayerStats(data);

  /* PAGE HEADER */

  const heading =
    document.createElement('h1');

  heading.textContent =
    'TODAY';

  heading.style.fontSize =
    'clamp(2rem, 5vw, 4rem)';

  heading.style.letterSpacing =
    '0.08em';

  heading.style.marginBottom =
    '0.25rem';

  container.appendChild(
    heading
  );

  const playerName =
    document.createElement('div');

  playerName.textContent =
    data.profile?.name ||
    'PLAYER';

  playerName.style.fontSize =
    '1rem';

  playerName.style.opacity =
    '0.65';

  playerName.style.letterSpacing =
    '0.1em';

  container.appendChild(
    playerName
  );

  /* TOP STATISTICS */

  const statsGrid =
    document.createElement('div');

  Object.assign(
    statsGrid.style,
    {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.75rem',
      margin:
        '1.5rem 0 2rem',
    }
  );

  statsGrid.append(
    createStatBox(
      'LEVEL',
      `${String(
        level.id
      ).padStart(
        2,
        '0'
      )} — ${
        level.name
      }`
    ),

    createStatBox(
      'EGO POINTS',
      egoPoints
    ),

    createStatBox(
      'TODAY',
      `${completed}/${tasks.length}`
    ),

    createStatBox(
      'COMPLETION',
      `${completion}%`
    )
  );

  container.appendChild(
    statsGrid
  );

  /* LEVEL PROGRESS */

  const levelSection =
    document.createElement(
      'section'
    );

  const levelTitle =
    document.createElement(
      'h3'
    );

  levelTitle.textContent =
    'EGO PROGRESSION';

  const levelText =
    document.createElement(
      'div'
    );

  if (level.id === 8) {
    levelText.textContent =
      'COMPLETE EGO — MAXIMUM LEVEL';
  } else {
    levelText.textContent =
      `${levelProgress.progress} / ${
        levelProgress.needed
      } EP TO NEXT LEVEL`;
  }

  levelText.style.opacity =
    '0.65';

  const progressTrack =
    document.createElement(
      'div'
    );

  Object.assign(
    progressTrack.style,
    {
      height: '8px',
      background:
        'rgba(255,255,255,0.08)',
      marginTop: '0.75rem',
      overflow: 'hidden',
    }
  );

  const progressBar =
    document.createElement(
      'div'
    );

  Object.assign(
    progressBar.style,
    {
      height: '100%',
      width: `${Math.min(
        100,
        Math.max(
          0,
          levelProgress.percent
        )
      )}%`,
      background: '#00b0ff',
    }
  );

  progressTrack.appendChild(
    progressBar
  );

  levelSection.append(
    levelTitle,
    levelText,
    progressTrack
  );

  container.appendChild(
    levelSection
  );

  /* PLAYER SNAPSHOT */

  const snapshot =
    document.createElement(
      'section'
    );

  snapshot.style.marginTop =
    '2.5rem';

  const snapshotTitle =
    document.createElement(
      'h3'
    );

  snapshotTitle.textContent =
    'PLAYER SNAPSHOT';

  const radarContainer =
    document.createElement(
      'div'
    );

  Object.assign(
    radarContainer.style,
    {
      width: '100%',
      maxWidth: '560px',
      minHeight: '420px',
      margin: '0 auto',
    }
  );

  renderRadar(
    radarContainer,
    stats
  );

  snapshot.append(
    snapshotTitle,
    radarContainer
  );

  container.appendChild(
    snapshot
  );

  /* WIN CONDITION */

  const winSection =
    document.createElement(
      'section'
    );

  Object.assign(
    winSection.style,
    {
      marginTop: '2.5rem',
      border:
        '1px solid rgba(255,255,255,0.12)',
      padding: '1.25rem',
    }
  );

  const winTitle =
    document.createElement(
      'h3'
    );

  winTitle.textContent =
    "TODAY'S WIN CONDITION";

  const winInput =
    document.createElement(
      'input'
    );

  winInput.className =
    'input';

  winInput.value =
    data.winConditions?.[today] ||
    '';

  winInput.placeholder =
    'Define the one outcome that would make today meaningful.';

  const saveWin =
    document.createElement(
      'button'
    );

  saveWin.className =
    'btn';

  saveWin.textContent =
    'SET WIN CONDITION';

  saveWin.style.marginTop =
    '0.75rem';

  saveWin.addEventListener(
    'click',
    () => {
      if (!data.winConditions) {
        data.winConditions = {};
      }

      data.winConditions[today] =
        winInput.value.trim();

      localStorage.setItem(
        'bluelock-app-data',
        JSON.stringify(data)
      );

      window.dispatchEvent(
        new Event(
          'bluelock-data-changed'
        )
      );
    }
  );

  winSection.append(
    winTitle,
    winInput,
    saveWin
  );

  container.appendChild(
    winSection
  );

  /* TODAY'S TRAINING */

  const trainingSection =
    document.createElement(
      'section'
    );

  trainingSection.style.marginTop =
    '2.5rem';

  const trainingTitle =
    document.createElement(
      'h3'
    );

  trainingTitle.textContent =
    "TODAY'S TRAINING";

  const addButton =
    document.createElement(
      'button'
    );

  addButton.className =
    'btn';

  addButton.textContent =
    '+ ADD TRAINING';

  addButton.style.marginBottom =
    '1rem';

  addButton.addEventListener(
    'click',
    () => {
      showTaskModal(
        null,
        (newTask) => {
          addTask(newTask);

          window.dispatchEvent(
            new Event(
              'bluelock-data-changed'
            )
          );
        }
      );
    }
  );

  const taskList =
    document.createElement(
      'div'
    );

  trainingSection.append(
    trainingTitle,
    addButton,
    taskList
  );

  container.appendChild(
    trainingSection
  );

  renderTaskList(
    taskList,
    tasks
  );

  /* DAILY DEBRIEF */

  const debriefSection =
    document.createElement(
      'section'
    );

  Object.assign(
    debriefSection.style,
    {
      marginTop: '3rem',
      borderTop:
        '1px solid rgba(255,255,255,0.12)',
      paddingTop: '1.5rem',
    }
  );

  container.appendChild(
    debriefSection
  );

  renderDailyDebrief(
    debriefSection,
    data
  );
}