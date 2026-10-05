import { saveToSupabase } from '../data/storage.js';

export function renderDailyDebrief(container, data) {
  container.innerHTML = '';

  const section = document.createElement('section');

  const title = document.createElement('h3');
  title.textContent = 'DAILY DEBRIEF';

  const intro = document.createElement('p');
  intro.textContent =
    'Review the day. Identify what worked, what got in the way, and what you want to improve tomorrow.';
  intro.style.opacity = '0.7';

  const form = document.createElement('form');

  const fields = [
    ['focus', 'FOCUS'],
    ['discipline', 'DISCIPLINE'],
    ['execution', 'EXECUTION'],
    ['learning', 'LEARNING'],
    ['creation', 'CREATION'],
  ];

  const inputs = {};

  fields.forEach(([key, label]) => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '1rem';

    const labelEl = document.createElement('label');
    labelEl.textContent = `${label}: 1–10`;

    const input = document.createElement('input');
    input.className = 'input';
    input.type = 'number';
    input.min = '1';
    input.max = '10';
    input.step = '1';
    input.required = true;

    wrapper.append(labelEl, input);
    form.appendChild(wrapper);

    inputs[key] = input;
  });

  const accomplishmentLabel = document.createElement('label');
  accomplishmentLabel.textContent = 'WHAT DID YOU ACCOMPLISH?';

  const accomplishment = document.createElement('textarea');
  accomplishment.className = 'input';
  accomplishment.rows = 4;
  accomplishment.placeholder =
    'What meaningful progress did you make today?';

  const obstacleLabel = document.createElement('label');
  obstacleLabel.textContent = 'WHAT GOT IN YOUR WAY?';

  const obstacle = document.createElement('textarea');
  obstacle.className = 'input';
  obstacle.rows = 4;
  obstacle.placeholder =
    'What made today harder than expected?';

  const improvementLabel = document.createElement('label');
  improvementLabel.textContent = 'WHAT SHOULD YOU IMPROVE TOMORROW?';

  const improvement = document.createElement('textarea');
  improvement.className = 'input';
  improvement.rows = 4;
  improvement.placeholder =
    'Choose one practical improvement for tomorrow.';

  const winLabel = document.createElement('label');
  winLabel.textContent = 'DID YOU COMPLETE YOUR WIN CONDITION?';

  const winCondition = document.createElement('select');
  winCondition.className = 'input';

  [
    ['YES', 'YES'],
    ['PARTIALLY', 'PARTIALLY'],
    ['NO', 'NO'],
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    winCondition.appendChild(option);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'btn';
  submit.textContent = 'SAVE DAILY DEBRIEF';

  const status = document.createElement('div');
  status.style.marginTop = '1rem';
  status.style.fontWeight = '700';

  form.append(
    accomplishmentLabel,
    accomplishment,
    obstacleLabel,
    obstacle,
    improvementLabel,
    improvement,
    winLabel,
    winCondition,
    submit,
    status
  );

  section.append(title, intro, form);
  container.appendChild(section);

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function getExistingDebrief() {
    const today = getToday();

    return (data.dailyDebriefs || []).find(
      (entry) => entry.date === today
    );
  }

  function loadExisting() {
    const existing = getExistingDebrief();

    if (!existing) {
      return;
    }

    fields.forEach(([key]) => {
      inputs[key].value = existing[key] ?? '';
    });

    accomplishment.value =
      existing.accomplishment || '';

    obstacle.value =
      existing.obstacle || '';

    improvement.value =
      existing.improvement || '';

    winCondition.value =
      existing.winCondition || 'NO';

    submit.textContent = 'UPDATE DAILY DEBRIEF';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const ratings = {};

    for (const [key] of fields) {
      const value = Number(inputs[key].value);

      if (
        !Number.isFinite(value) ||
        value < 1 ||
        value > 10
      ) {
        status.textContent =
          'ALL RATINGS MUST BE BETWEEN 1 AND 10.';
        return;
      }

      ratings[key] = value;
    }

    if (!data.dailyDebriefs) {
      data.dailyDebriefs = [];
    }

    const today = getToday();
    const existingIndex =
      data.dailyDebriefs.findIndex(
        (entry) => entry.date === today
      );

    const entry = {
      id:
        existingIndex >= 0
          ? data.dailyDebriefs[existingIndex].id
          : Date.now(),

      date: today,

      ...ratings,

      accomplishment:
        accomplishment.value.trim(),

      obstacle:
        obstacle.value.trim(),

      improvement:
        improvement.value.trim(),

      winCondition:
        winCondition.value,
    };

    if (existingIndex >= 0) {
      data.dailyDebriefs[existingIndex] = entry;
    } else {
      data.dailyDebriefs.push(entry);
    }

    localStorage.setItem(
      'bluelock-app-data',
      JSON.stringify(data)
    );

    try {
      await saveToSupabase(data);

      status.textContent =
        'DAILY DEBRIEF SAVED.';

      submit.textContent =
        'UPDATE DAILY DEBRIEF';
    } catch (error) {
      console.error(
        'Daily debrief save error:',
        error
      );

      status.textContent =
        'DEBRIEF SAVED LOCALLY. CLOUD SYNC FAILED.';
    }

    window.dispatchEvent(
      new Event('bluelock-data-changed')
    );
  });

  loadExisting();
}