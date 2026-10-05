import { renderRadar } from './radarChart.js';
import { renderTimeDebrief } from './timeDebrief.js';

function getDateValue(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getStartOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function calculateTrainingStats(data) {
  const base =
    data.profile?.stats || {
      EXECUTION: 32,
      FOCUS: 27,
      DISCIPLINE: 30,
      MASTERY: 25,
      CREATION: 28,
    };

  const tasks = data.tasks || [];

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    );

  const completionRate =
    tasks.length > 0
      ? completedTasks.length /
        tasks.length
      : 0;

  const dates = new Set();

  completedTasks.forEach(
    (task) => {
      const value =
        task.completedDate ||
        task.date;

      if (value) {
        dates.add(
          String(value).split('T')[0]
        );
      }
    }
  );

  const trainingDays =
    dates.size;

  const academic =
    completedTasks.filter(
      (task) =>
        task.category === 'ACADEMIC'
    ).length;

  const reading =
    completedTasks.filter(
      (task) =>
        task.category === 'READING'
    ).length;

  const languages =
    completedTasks.filter(
      (task) =>
        task.category === 'LANGUAGES'
    ).length;

  const projects =
    completedTasks.filter(
      (task) =>
        task.category === 'PROJECTS'
    ).length;

  const coding =
    completedTasks.filter(
      (task) =>
        task.category === 'CODING'
    ).length;

  const competitions =
    completedTasks.filter(
      (task) =>
        task.category === 'COMPETITIONS'
    ).length;

  const executionGain =
    Math.round(
      completionRate * 25
    );

  const focusGain =
    Math.min(
      trainingDays * 2,
      18
    );

  const disciplineGain =
    Math.min(
      trainingDays * 3,
      24
    );

  const masteryGain =
    Math.min(
      academic * 3 +
      reading +
      languages * 2,
      25
    );

  const creationGain =
    Math.min(
      projects * 4 +
      coding * 3 +
      competitions,
      25
    );

  return {
    EXECUTION: Math.min(
      100,
      Math.round(
        base.EXECUTION +
        executionGain
      )
    ),

    FOCUS: Math.min(
      100,
      Math.round(
        base.FOCUS +
        focusGain
      )
    ),

    DISCIPLINE: Math.min(
      100,
      Math.round(
        base.DISCIPLINE +
        disciplineGain
      )
    ),

    MASTERY: Math.min(
      100,
      Math.round(
        base.MASTERY +
        masteryGain
      )
    ),

    CREATION: Math.min(
      100,
      Math.round(
        base.CREATION +
        creationGain
      )
    ),
  };
}

function calculateTimeDebriefAdjustments(
  data
) {
  const adjustments = {
    EXECUTION: 0,
    FOCUS: 0,
    DISCIPLINE: 0,
    MASTERY: 0,
    CREATION: 0,
  };

  const entries =
    data.timeDebriefs || [];

  entries.forEach(
    (entry) => {
      const area =
        entry.area;

      if (
        !Object.prototype.hasOwnProperty.call(
          adjustments,
          area
        )
      ) {
        return;
      }

      const adjustment =
        Number(entry.adjustment) || 0;

      adjustments[area] +=
        adjustment;
    }
  );

  /*
   * Keep self-reported time loss
   * deliberately small and capped.
   *
   * Maximum total reduction from
   * time debriefs = 8 points per stat.
   */
  Object.keys(
    adjustments
  ).forEach(
    (stat) => {
      adjustments[stat] =
        Math.max(
          -8,
          adjustments[stat]
        );
    }
  );

  return adjustments;
}

function calculatePlayerStats(
  data
) {
  const training =
    calculateTrainingStats(data);

  const adjustments =
    calculateTimeDebriefAdjustments(
      data
    );

  return {
    EXECUTION: Math.max(
      0,
      training.EXECUTION +
      adjustments.EXECUTION
    ),

    FOCUS: Math.max(
      0,
      training.FOCUS +
      adjustments.FOCUS
    ),

    DISCIPLINE: Math.max(
      0,
      training.DISCIPLINE +
      adjustments.DISCIPLINE
    ),

    MASTERY: Math.max(
      0,
      training.MASTERY +
      adjustments.MASTERY
    ),

    CREATION: Math.max(
      0,
      training.CREATION +
      adjustments.CREATION
    ),
  };
}

function calculatePeriodStats(
  data,
  startDate,
  endDate
) {
  const originalTasks =
    data.tasks || [];

  const originalTimeDebriefs =
    data.timeDebriefs || [];

  const filteredTasks =
    originalTasks.filter(
      (task) => {
        if (!task.completed) {
          return false;
        }

        const taskDate =
          getDateValue(
            task.completedDate ||
            task.date
          );

        if (!taskDate) {
          return false;
        }

        return (
          taskDate >= startDate &&
          taskDate <= endDate
        );
      }
    );

  const filteredDebriefs =
    originalTimeDebriefs.filter(
      (entry) => {
        const entryDate =
          getDateValue(
            entry.date
          );

        if (!entryDate) {
          return false;
        }

        return (
          entryDate >= startDate &&
          entryDate <= endDate
        );
      }
    );

  const tempData = {
    ...data,

    tasks:
      filteredTasks,

    timeDebriefs:
      filteredDebriefs,
  };

  return calculatePlayerStats(
    tempData
  );
}

function formatChange(value) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function createStatCard(
  name,
  current,
  weekChange,
  monthChange
) {
  const card =
    document.createElement(
      'div'
    );

  Object.assign(
    card.style,
    {
      border:
        '1px solid rgba(255,255,255,0.12)',
      padding: '1rem',
      minWidth: '150px',
      flex: '1 1 150px',
    }
  );

  const nameEl =
    document.createElement(
      'div'
    );

  nameEl.textContent =
    name;

  nameEl.style.fontWeight =
    '700';

  nameEl.style.letterSpacing =
    '0.08em';

  const valueEl =
    document.createElement(
      'div'
    );

  valueEl.textContent =
    `${current}/100`;

  valueEl.style.fontSize =
    '2rem';

  valueEl.style.fontWeight =
    '700';

  valueEl.style.margin =
    '0.4rem 0';

  const changes =
    document.createElement(
      'div'
    );

  changes.textContent =
    `WEEK ${formatChange(
      weekChange
    )} • MONTH ${formatChange(
      monthChange
    )}`;

  changes.style.fontSize =
    '0.72rem';

  changes.style.opacity =
    '0.65';

  card.append(
    nameEl,
    valueEl,
    changes
  );

  return card;
}

function createPriorityList(
  stats
) {
  return Object.entries(stats)
    .sort(
      (a, b) =>
        a[1] - b[1]
    )
    .slice(0, 2)
    .map(
      ([name, value]) =>
        `${name} — ${value}/100`
    );
}

export function renderProfile(
  container,
  data
) {
  container.innerHTML = '';

  const currentStats =
    calculatePlayerStats(data);

  const today =
    getStartOfDay(
      new Date()
    );

  const weekStart =
    new Date(today);

  weekStart.setDate(
    weekStart.getDate() - 7
  );

  const monthStart =
    new Date(today);

  monthStart.setDate(
    monthStart.getDate() - 30
  );

  const previousWeekStart =
    new Date(weekStart);

  previousWeekStart.setDate(
    previousWeekStart.getDate() - 7
  );

  const previousMonthStart =
    new Date(monthStart);

  previousMonthStart.setDate(
    previousMonthStart.getDate() - 30
  );

  const lastWeekStats =
    calculatePeriodStats(
      data,
      weekStart,
      today
    );

  const previousWeekStats =
    calculatePeriodStats(
      data,
      previousWeekStart,
      weekStart
    );

  const lastMonthStats =
    calculatePeriodStats(
      data,
      monthStart,
      today
    );

  const previousMonthStats =
    calculatePeriodStats(
      data,
      previousMonthStart,
      monthStart
    );

  const heading =
    document.createElement(
      'h2'
    );

  heading.textContent =
    'PLAYER PROFILE';

  container.appendChild(
    heading
  );

  const playerName =
    document.createElement(
      'div'
    );

  playerName.textContent =
    data.profile?.name ||
    'PLAYER';

  playerName.style.fontSize =
    '2rem';

  playerName.style.fontWeight =
    '700';

  const archetype =
    document.createElement(
      'div'
    );

  archetype.textContent =
    data.profile?.archetype ||
    'THE SOVEREIGN EXECUTOR';

  archetype.style.opacity =
    '0.7';

  archetype.style.letterSpacing =
    '0.08em';

  container.append(
    playerName,
    archetype
  );

  const weaponsTitle =
    document.createElement(
      'h3'
    );

  weaponsTitle.textContent =
    'WEAPONS';

  const primary =
    document.createElement(
      'p'
    );

  primary.textContent =
    `PRIMARY — ${
      data.profile?.primaryWeapon ||
      'RUTHLESS EXECUTION'
    }`;

  const secondary =
    document.createElement(
      'p'
    );

  secondary.textContent =
    `SECONDARY — ${
      data.profile?.secondaryWeapon ||
      'STRUCTURED ADAPTATION'
    }`;

  container.append(
    weaponsTitle,
    primary,
    secondary
  );

  const profileTitle =
    document.createElement(
      'h3'
    );

  profileTitle.textContent =
    'CURRENT PROFILE';

  container.appendChild(
    profileTitle
  );

  const radarWrapper =
    document.createElement(
      'div'
    );

  Object.assign(
    radarWrapper.style,
    {
      width: '100%',
      minHeight: '520px',
      display: 'flex',
      justifyContent:
        'center',
      alignItems: 'center',
      margin:
        '1rem 0 2rem',
    }
  );

  renderRadar(
    radarWrapper,
    currentStats
  );

  container.appendChild(
    radarWrapper
  );

  const statsGrid =
    document.createElement(
      'section'
    );

  Object.assign(
    statsGrid.style,
    {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.75rem',
      marginBottom: '2rem',
    }
  );

  Object.keys(
    currentStats
  ).forEach(
    (stat) => {
      const weekChange =
        lastWeekStats[stat] -
        previousWeekStats[stat];

      const monthChange =
        lastMonthStats[stat] -
        previousMonthStats[stat];

      statsGrid.appendChild(
        createStatCard(
          stat,
          currentStats[stat],
          weekChange,
          monthChange
        )
      );
    }
  );

  container.appendChild(
    statsGrid
  );

  const priorityTitle =
    document.createElement(
      'h3'
    );

  priorityTitle.textContent =
    'CURRENT DEVELOPMENT PRIORITIES';

  container.appendChild(
    priorityTitle
  );

  const priorityList =
    createPriorityList(
      currentStats
    );

  priorityList.forEach(
    (priority) => {
      const item =
        document.createElement(
          'div'
        );

      item.textContent =
        `// ${priority}`;

      item.style.padding =
        '0.6rem 0';

      item.style.borderBottom =
        '1px solid rgba(255,255,255,0.08)';

      container.appendChild(
        item
      );
    }
  );

  const timeDebriefContainer =
    document.createElement(
      'section'
    );

  Object.assign(
    timeDebriefContainer.style,
    {
      marginTop: '3rem',
      borderTop:
        '1px solid rgba(255,255,255,0.12)',
      paddingTop: '1.5rem',
    }
  );

  container.appendChild(
    timeDebriefContainer
  );

  renderTimeDebrief(
    timeDebriefContainer,
    data
  );

  const evolutionTitle =
    document.createElement(
      'h3'
    );

  evolutionTitle.textContent =
    'PROFILE EVOLUTION';

  evolutionTitle.style.marginTop =
    '3rem';

  container.appendChild(
    evolutionTitle
  );

  const explanation =
    document.createElement(
      'p'
    );

  explanation.textContent =
    'Your profile responds to completed training and your own time reflections. Time-loss adjustments are intentionally small and capped so one difficult day cannot erase your long-term progress.';

  explanation.style.opacity =
    '0.65';

  container.appendChild(
    explanation
  );

  const comparison =
    document.createElement(
      'div'
    );

  Object.assign(
    comparison.style,
    {
      display: 'flex',
      gap: '2rem',
      flexWrap: 'wrap',
      marginTop: '1rem',
    }
  );

  const currentBlock =
    document.createElement(
      'div'
    );

  currentBlock.innerHTML =
    `<strong>CURRENT</strong><br>${Object.values(
      currentStats
    ).join(' / ')}`;

  const weekBlock =
    document.createElement(
      'div'
    );

  weekBlock.innerHTML =
    `<strong>LAST 7 DAYS</strong><br>${Object.values(
      lastWeekStats
    ).join(' / ')}`;

  const monthBlock =
    document.createElement(
      'div'
    );

  monthBlock.innerHTML =
    `<strong>LAST 30 DAYS</strong><br>${Object.values(
      lastMonthStats
    ).join(' / ')}`;

  comparison.append(
    currentBlock,
    weekBlock,
    monthBlock
  );

  container.appendChild(
    comparison
  );
}