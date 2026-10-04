// Modal for adding/editing a task
export function showTaskModal(existingTask, onSubmit) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '1000';

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.background = '#1a1a1c';
  modal.style.padding = '1rem';
  modal.style.borderRadius = '0.25rem';
  modal.style.width = '90%';
  modal.style.maxWidth = '500px';
  modal.style.maxHeight = '80vh';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.overflow = 'hidden';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.style.paddingBottom = '0.5rem';
  const title = document.createElement('h4');
  title.textContent = existingTask ? 'Edit Task' : 'Add Task';
  header.appendChild(title);
  modal.appendChild(header);

  const body = document.createElement('div');
  body.className = 'modal-body';
  body.style.flex = '1';
  body.style.overflowY = 'auto';
  body.style.paddingBottom = '0.5rem';

  const form = document.createElement('form');

  const fields = [
    { label: 'TASK NAME', name: 'name', type: 'text', required: true },
    { label: 'TASK DATE', name: 'date', type: 'date', required: true },
    { label: 'Category', name: 'category', type: 'select', options: ['ACADEMIC','COMPETITIONS','PROJECTS','LANGUAGES','CODING','READING','FITNESS','PERSONAL','ADMIN'], required: true },
    { label: 'Priority', name: 'priority', type: 'select', options: ['LOW','MEDIUM','HIGH','CRITICAL'], required: true },
    { label: 'Target Duration (hrs)', name: 'targetDuration', type: 'number', step: '0.25', min: '0' },
    { label: 'Ego Points', name: 'egoPoints', type: 'number', min: '0' },
    { label: 'Difficulty (1-5)', name: 'difficulty', type: 'number', min: '1', max: '5' },
    { label: 'Notes', name: 'notes', type: 'textarea' },
  ];

  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '0.5rem';
    const label = document.createElement('label');
    label.textContent = field.label;
    label.style.display = 'block';
    label.style.fontSize = '0.9rem';
    wrapper.appendChild(label);
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
      if (existingTask) input.value = existingTask[field.name] || '';
    } else if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 2;
      if (existingTask) input.value = existingTask[field.name] || '';
    } else {
      input = document.createElement('input');
      input.type = field.type;
      if (field.step) input.step = field.step;
      if (field.min) input.min = field.min;
      if (field.max) input.max = field.max;
      if (existingTask) input.value = existingTask[field.name] !== undefined ? existingTask[field.name] : '';
      if (field.name === 'date' && !existingTask) {
        const todayStr = new Date().toISOString().split('T')[0];
        input.value = todayStr;
      }
    }
    input.name = field.name;
    if (field.required) input.required = true;
    input.style.width = '100%';
    input.style.padding = '0.4rem';
    input.style.border = '1px solid var(--border-color)';
    input.style.borderRadius = '0.25rem';
    input.style.background = 'transparent';
    input.style.color = 'var(--text-color)';
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.gap = '0.5rem';
  footer.style.paddingTop = '0.5rem';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'btn';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = existingTask ? 'Save' : 'Add';
  submitBtn.className = 'btn';

  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};
    fields.forEach(f => {
      let val = formData.get(f.name);
      if (['targetDuration', 'egoPoints', 'difficulty'].includes(f.name)) {
        val = Number(val);
      }
      data[f.name] = val;
    });
    if (existingTask) {
      data.id = existingTask.id;
      data.completed = existingTask.completed;
      data.completedDate = existingTask.completedDate;
      data.pointsAwarded = existingTask.pointsAwarded;
    }
    onSubmit(data);
    overlay.remove();
  });

  cancelBtn.addEventListener('click', () => {
    overlay.remove();
  });

  body.appendChild(form);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
