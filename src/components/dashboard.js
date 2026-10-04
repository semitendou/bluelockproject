// Dashboard component: TODAY view
import { getTasks, addTask, updateTask, deleteTask, toggleTaskCompletion, getEgoPoints, getCurrentLevel, getLevelProgress } from '../data/storage.js';
import { renderRadar } from './radarChart.js';
import { showTaskModal } from './taskFormModal.js';

// Utility: format date to YYYY-MM-DD
function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

export function renderDashboard(container, data) {
  container.innerHTML = '';

  // Header
  const header = document.createElement('header');
  header.innerHTML = `<h2>TODAY</h2>`;
  header.style.padding = '1rem';
  container.appendChild(header);

  const main = document.createElement('main');
  main.style.padding = '1rem';
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  main.style.gap = '1.5rem';

  // Stats section
  const stats = document.createElement('section');
  stats.style.display = 'flex';
  stats.style.justifyContent = 'space-between';
  stats.style.alignItems = 'center';

  const dateEl = document.createElement('div');
  dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const nameEl = document.createElement('div');
  nameEl.textContent = data.profile.name;

  const egoEl = document.createElement('div');
  egoEl.textContent = `EGO POINTS: ${getEgoPoints()}`;

  const levelInfo = getCurrentLevel();
  const levelEl = document.createElement('div');
  levelEl.textContent = `LEVEL ${String(levelInfo.id).padStart(2, '0')} — ${levelInfo.name}`;

  const progress = getLevelProgress();
  const progressBar = document.createElement('progress');
  progressBar.max = 100;
  progressBar.value = Math.floor(progress.percent);

  stats.append(dateEl, nameEl, egoEl, levelEl, progressBar);
  main.appendChild(stats);

  // Radar chart
  const radarSection = document.createElement('section');
  radarSection.style.display = 'flex';
  radarSection.style.justifyContent = 'center';
  renderRadar(radarSection, data.profile.stats);
  main.appendChild(radarSection);

  // Win condition placeholder
  const winSection = document.createElement('section');
  winSection.style.display = 'flex';
  winSection.style.justifyContent = 'space-between';
  winSection.style.alignItems = 'center';

  const winCondition = document.createElement('div');
  winCondition.textContent = 'TODAY’S WIN CONDITION';
  winCondition.style.fontWeight = '600';
  const editWinBtn = document.createElement('button');
  editWinBtn.textContent = 'Edit';
  editWinBtn.className = 'btn';
  winCondition.appendChild(editWinBtn);
  winSection.appendChild(winCondition);
  main.appendChild(winSection);

  // Training time and completion placeholder
  const today = new Date();
  const todayStr = toDateStr(today);
  const todayTasks = getTasks().filter(t => t.date === todayStr);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const completionPercent = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0;
  const trainingTimeSection = document.createElement('section');
  trainingTimeSection.style.display = 'flex';
  trainingTimeSection.style.justifyContent = 'space-between';
  const trainingTimeEl = document.createElement('div');
  trainingTimeEl.textContent = `TRAINING TIME: 0h`; // placeholder
  const completionEl = document.createElement('div');
  completionEl.textContent = `COMPLETION: ${completionPercent}%`;
  trainingTimeSection.appendChild(trainingTimeEl);
  trainingTimeSection.appendChild(completionEl);
  main.appendChild(trainingTimeSection);

  // Task list section
  const tasksSection = document.createElement('section');
  tasksSection.style.display = 'flex';
  tasksSection.style.flexDirection = 'column';

  const taskHeader = document.createElement('h3');
  taskHeader.textContent = "TODAY'S TRAINING";
  tasksSection.appendChild(taskHeader);

  const taskList = document.createElement('ul');
  taskList.id = 'task-list';
  tasksSection.appendChild(taskList);

  const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  todayTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  todayTasks.forEach(t => {
    const li = createTaskItem(t);
    taskList.appendChild(li);
  });

  const addTaskBtn = document.createElement('button');
  addTaskBtn.textContent = '+ ADD TASK';
  addTaskBtn.className = 'btn';
  addTaskBtn.addEventListener('click', () => {
    showTaskModal(null, (taskData) => {
      if (!taskData.date) taskData.date = todayStr;
      const added = addTask(taskData);
      const li = createTaskItem(added);
      taskList.appendChild(li);
    });
  });
  tasksSection.appendChild(addTaskBtn);

  main.appendChild(tasksSection);
  container.appendChild(main);
}

function createTaskItem(task) {
  const li = document.createElement('li');
  li.style.display = 'flex';
  li.style.alignItems = 'center';
  li.style.justifyContent = 'space-between';
  li.style.padding = '0.5rem 0';

  const left = document.createElement('div');
  left.style.display = 'flex';
  left.style.alignItems = 'center';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.style.marginRight = '0.5rem';

  const nameSpan = document.createElement('span');
  nameSpan.textContent = task.name;
  if (task.completed) {
    nameSpan.style.textDecoration = 'line-through';
    nameSpan.style.opacity = '0.6';
  }

  left.append(checkbox, nameSpan);
  li.appendChild(left);

  const info = document.createElement('div');
  info.style.display = 'flex';
  info.style.gap = '0.5rem';
  const cat = document.createElement('span');
  cat.textContent = task.category;
  const dur = document.createElement('span');
  dur.textContent = `${task.targetDuration || 0}h`;
  const points = document.createElement('span');
  points.textContent = `${task.egoPoints} EP`;
  const diff = document.createElement('span');
  diff.textContent = `D${task.difficulty}`;
  info.append(cat, dur, points, diff);
  li.appendChild(info);

  const editBtn = document.createElement('button');
  editBtn.className = 'btn';
  editBtn.style.marginLeft = '0.5rem';
  editBtn.textContent = '✎';
  editBtn.title = 'Edit';
  li.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn';
  deleteBtn.style.marginLeft = '0.5rem';
  deleteBtn.textContent = '✕';
  deleteBtn.title = 'Delete';
  li.appendChild(deleteBtn);

  checkbox.addEventListener('change', () => {
    toggleTaskCompletion(task.id, checkbox.checked);
    if (checkbox.checked) {
      nameSpan.style.textDecoration = 'line-through';
      nameSpan.style.opacity = '0.6';
    } else {
      nameSpan.style.textDecoration = 'none';
      nameSpan.style.opacity = '1';
    }
  });

  deleteBtn.addEventListener('click', () => {
    deleteTask(task.id);
    li.remove();
  });

  editBtn.addEventListener('click', () => {
    showTaskModal(task, (updated) => {
      updateTask(task.id, updated);
      nameSpan.textContent = updated.name || task.name;
      cat.textContent = updated.category || task.category;
      dur.textContent = `${updated.targetDuration || 0}h`;
      points.textContent = `${updated.egoPoints} EP`;
      diff.textContent = `D${updated.difficulty}`;
    });
  });

  return li;
}
