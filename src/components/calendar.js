import { getTasks, toggleTaskCompletion, deleteTask, updateTask, addTask } from '../data/storage.js';
import { showTaskModal } from './taskFormModal.js';

function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function renderCalendar(container, data) {
  container.innerHTML = '';
  const today = new Date();
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();

  function render() {
    container.innerHTML = '';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '0.5rem';

    const nav = document.createElement('div');
    nav.style.display = 'flex';
    nav.style.gap = '0.5rem';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.className = 'btn';
    prevBtn.addEventListener('click', () => {
      currentMonth -= 1;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
      }
      render();
    });

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.className = 'btn';
    nextBtn.addEventListener('click', () => {
      currentMonth += 1;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
      }
      render();
    });

    const todayBtn = document.createElement('button');
    todayBtn.textContent = 'TODAY';
    todayBtn.className = 'btn';
    todayBtn.addEventListener('click', () => {
      currentYear = today.getFullYear();
      currentMonth = today.getMonth();
      render();
    });

    nav.append(prevBtn, nextBtn, todayBtn);
    header.appendChild(nav);

    const title = document.createElement('h3');
    title.textContent = `${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth))}`;
    title.style.margin = '0';
    header.appendChild(title);

    container.appendChild(header);

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'center';

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    weekdays.forEach(day => {
      const th = document.createElement('th');
      th.textContent = day;
      th.style.padding = '0.5rem 0';
      th.style.borderBottom = '1px solid var(--border-color)';
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    let dayCounter = 1;
    let nextDayCounter = 1;
    for (let week = 0; week < 6; week++) {
      const tr = document.createElement('tr');
      for (let d = 0; d < 7; d++) {
        const td = document.createElement('td');
        td.style.border = '1px solid var(--border-color)';
        td.style.padding = '0.5rem';
        td.style.verticalAlign = 'top';
        td.style.height = '80px';
        td.style.cursor = 'pointer';

        let dayNumber;
        let isCurrentMonth = true;
        if (week === 0 && d < firstDay) {
          dayNumber = prevMonthLastDay - (firstDay - d - 1);
          isCurrentMonth = false;
        } else if (dayCounter > daysInMonth) {
          dayNumber = nextDayCounter;
          nextDayCounter++;
          isCurrentMonth = false;
        } else {
          dayNumber = dayCounter;
          dayCounter++;
        }

        const cellDate = new Date(currentYear, currentMonth, dayNumber);
        const cellDateStr = formatDateYMD(cellDate);
        const isToday = cellDate.toDateString() === today.toDateString();

        const dayHeader = document.createElement('div');
        dayHeader.textContent = dayNumber;
        dayHeader.style.fontWeight = isCurrentMonth ? '600' : '400';
        dayHeader.style.color = isToday ? '#ff4d4d' : 'inherit';
        td.appendChild(dayHeader);

        const dayTasks = getTasks().filter(t => t.date === cellDateStr);
        dayTasks.forEach(t => {
          const taskDiv = document.createElement('div');
          taskDiv.style.display = 'flex';
          taskDiv.style.alignItems = 'center';
          taskDiv.style.gap = '0.2rem';
          taskDiv.style.fontSize = '0.8rem';
          taskDiv.style.marginTop = '0.2rem';
          if (t.completed) {
            taskDiv.style.opacity = '0.5';
            taskDiv.style.textDecoration = 'line-through';
          }
          if (t.priority === 'CRITICAL') {
            taskDiv.style.color = '#ff4d4d';
          }

          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = t.completed;
          cb.addEventListener('change', () => {
            toggleTaskCompletion(t.id, cb.checked);
            render();
          });
          taskDiv.appendChild(cb);

          const span = document.createElement('span');
          span.textContent = t.name;
          taskDiv.appendChild(span);

          const editBtn = document.createElement('button');
          editBtn.textContent = '✎';
          editBtn.className = 'btn';
          editBtn.style.fontSize = '0.8rem';
          editBtn.addEventListener('click', () => {
            showTaskModal(t, (updated) => {
              updateTask(t.id, updated);
              render();
            });
          });
          taskDiv.appendChild(editBtn);

          const delBtn = document.createElement('button');
          delBtn.textContent = '✕';
          delBtn.className = 'btn';
          delBtn.style.fontSize = '0.8rem';
          delBtn.addEventListener('click', () => {
            if (confirm('Delete this task?')) {
              deleteTask(t.id);
              render();
            }
          });
          taskDiv.appendChild(delBtn);

          td.appendChild(taskDiv);
        });

        td.addEventListener('click', (e) => {
          if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;
          showTaskModal({
            date: cellDateStr,
            category: '',
            priority: 'MEDIUM',
            targetDuration: 0,
            egoPoints: 0,
            difficulty: 3,
            notes: ''
          }, (taskData) => {
            if (!taskData.date) taskData.date = cellDateStr;
            addTask(taskData);
            render();
          });
        });

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  render();
}
