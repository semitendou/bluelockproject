import { saveToSupabase } from '../data/storage.js';

export function renderTimeDebrief(container, data) {
  container.innerHTML = '';

  const section = document.createElement('section');

  const title = document.createElement('h3');
  title.textContent = 'TIME DEBRIEF';

  const intro = document.createElement('p');
  intro.textContent =
    'Record where your time went today. This is a reflection tool, not a punishment system.';
  intro.style.opacity = '0.7';

  const form = document.createElement('form');

  const activityLabel = document.createElement('label');
  activityLabel.textContent = 'WHERE DID YOUR TIME GO?';

  const activity = document.createElement('input');
  activity.className = 'input';
  activity.placeholder =
    'e.g. social media, browsing, procrastination';
  activity.required = true;

  const minutesLabel = document.createElement('label');
  minutesLabel.textContent = 'APPROXIMATE TIME';

  const minutes = document.createElement('input');
  minutes.className = 'input';
  minutes.type = 'number';
  minutes.min = '1';
  minutes.placeholder = 'Minutes';
  minutes.required = true;

  const areaLabel = document.createElement('label');
  areaLabel.textContent = 'MAIN AREA AFFECTED';

  const area = document.createElement('select');
  area.className = 'input';

  [
    'FOCUS',
    'DISCIPLINE',
    'EXECUTION',
    'MASTERY',
    'CREATION',
  ].forEach((optionName) => {
    const option = document.createElement('option');
    option.value = optionName;
    option.textContent = optionName;
    area.appendChild(option);
  });

  const reflectionLabel = document.createElement('label');
  reflectionLabel.textContent = 'REFLECTION';

  const reflection = document.createElement('textarea');
  reflection.className = 'input';
  reflection.rows = 4;
  reflection.placeholder =
    'What happened? What would you do differently next time?';

  const submit = document.createElement('button');
  submit.className = 'btn';
  submit.type = 'submit';
  submit.textContent = 'LOG TIME LOSS';

  const status = document.createElement('div');

  Object.assign(status.style, {
    marginTop: '1rem',
    padding: '0.9rem',
    border: '1px solid rgba(255,255,255,0.12)',
    fontWeight: '700',
    letterSpacing: '0.04em',
  });

  form.append(
    activityLabel,
    activity,
    minutesLabel,
    minutes,
    areaLabel,
    area,
    reflectionLabel,
    reflection,
    submit,
    status
  );

  section.append(
    title,
    intro,
    form
  );

  const historyTitle = document.createElement('h4');
  historyTitle.textContent = 'TODAY\'S TIME DEBRIEF';
  historyTitle.style.marginTop = '2rem';

  const history = document.createElement('div');

  section.append(
    historyTitle,
    history
  );

  container.appendChild(section);

  function getEntries() {
    return data.timeDebriefs || [];
  }

  function save() {
    localStorage.setItem(
      'bluelock-app-data',
      JSON.stringify(data)
    );

    void saveToSupabase(data).catch((error) => {
      console.error(
        'Supabase time debrief save error:',
        error
      );
    });
  }

  function calculateAdjustment(entry) {
    const mins = Number(entry.minutes) || 0;

    if (mins < 20) {
      return 0;
    }

    if (mins < 45) {
      return -1;
    }

    if (mins < 90) {
      return -2;
    }

    return -3;
  }

  function formatAdjustment(value) {
    if (value === 0) {
      return 'NO ADJUSTMENT';
    }

    return `${value} ${
      value === -1 ? 'POINT' : 'POINTS'
    }`;
  }

  function renderHistory() {
    history.innerHTML = '';

    const today = new Date()
      .toISOString()
      .split('T')[0];

    const entries = getEntries().filter(
      (entry) => entry.date === today
    );

    if (entries.length === 0) {
      const empty = document.createElement('p');

      empty.textContent =
        'NO TIME LOSS LOGGED TODAY.';

      empty.style.opacity = '0.5';

      history.appendChild(empty);

      return;
    }

    entries.forEach((entry) => {
      const card = document.createElement('div');

      Object.assign(card.style, {
        border:
          '1px solid rgba(255,255,255,0.12)',
        padding: '1rem',
        marginBottom: '0.75rem',
      });

      const heading = document.createElement('strong');

      heading.textContent =
        `${entry.activity} — ${entry.minutes} MIN`;

      heading.style.display = 'block';

      const affected = document.createElement('div');

      affected.textContent =
        `AFFECTED STAT: ${entry.area}`;

      affected.style.marginTop = '0.5rem';
      affected.style.fontSize = '0.82rem';
      affected.style.opacity = '0.7';

      const adjustment = document.createElement('div');

      if (entry.adjustment === 0) {
        adjustment.textContent =
          `${entry.area} → NO STAT CHANGE`;

      } else {
        adjustment.textContent =
          `${entry.area} → ${formatAdjustment(
            entry.adjustment
          )}`;

        adjustment.style.fontWeight = '700';
      }

      adjustment.style.marginTop = '0.6rem';

      const explanation =
        document.createElement('div');

      if (entry.adjustment === 0) {
        explanation.textContent =
          'Under 20 minutes — profile unchanged.';
      } else {
        explanation.textContent =
          `Your ${entry.area} profile signal is reduced by ${
            Math.abs(entry.adjustment)
          } ${
            Math.abs(entry.adjustment) === 1
              ? 'point'
              : 'points'
          }.`;

        explanation.style.opacity = '0.65';
      }

      explanation.style.fontSize = '0.82rem';
      explanation.style.marginTop = '0.35rem';

      card.append(
        heading,
        affected,
        adjustment,
        explanation
      );

      if (entry.reflection) {
        const note = document.createElement('div');

        note.textContent =
          entry.reflection;

        note.style.marginTop = '0.75rem';
        note.style.opacity = '0.65';
        note.style.fontSize = '0.85rem';

        card.appendChild(note);
      }

      history.appendChild(card);
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const minutesValue =
      Number(minutes.value);

    if (
      !Number.isFinite(minutesValue) ||
      minutesValue <= 0
    ) {
      status.textContent =
        'ENTER A VALID TIME.';
      return;
    }

    const selectedArea = area.value;

    const adjustment =
      calculateAdjustment({
        minutes: minutesValue,
      });

    const entry = {
      id: Date.now(),
      date: new Date()
        .toISOString()
        .split('T')[0],
      activity:
        activity.value.trim(),
      minutes: minutesValue,
      area: selectedArea,
      reflection:
        reflection.value.trim(),
      adjustment,
    };

    if (!data.timeDebriefs) {
      data.timeDebriefs = [];
    }

    data.timeDebriefs.push(entry);

    save();

    if (adjustment === 0) {
      status.textContent =
        `${selectedArea} → NO STAT CHANGE`;
    } else {
      status.textContent =
        `${selectedArea} → ${formatAdjustment(
          adjustment
        )}`;
    }

    activity.value = '';
    minutes.value = '';
    reflection.value = '';

    renderHistory();

    window.dispatchEvent(
      new Event('bluelock-data-changed')
    );
  });

  renderHistory();
}