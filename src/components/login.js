export function renderLogin(container, onSubmit) {
  const form = document.createElement('form');
  form.className = 'center';
  form.style.flexDirection = 'column';
  form.style.width = '300px';

  const title = document.createElement('h1');
  title.textContent = 'BLUE LOCK\nPROJECT EGO';
  title.style.textAlign = 'center';

  const sub = document.createElement('h3');
  sub.textContent = 'PLAYER ACCESS';
  sub.style.textAlign = 'center';

  const input = document.createElement('input');
  input.type = 'password';
  input.placeholder = 'Password:';
  input.className = 'input';
  input.style.marginBottom = '1rem';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn';
  btn.textContent = 'ENTER PASSWORD';

  form.append(title, sub, input, btn);
  container.append(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = input.value.trim();
    onSubmit(pwd);
  });
}
