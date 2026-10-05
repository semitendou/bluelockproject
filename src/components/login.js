import { supabase } from '../data/supabase.js';

export function renderLogin(container, onAuthSuccess) {
  const form = document.createElement('form');

  form.className = 'center';
  form.style.flexDirection = 'column';
  form.style.width = '300px';

  const title = document.createElement('h1');
  title.textContent = 'BLUE LOCK\nPROJECT EGO';
  title.style.textAlign = 'center';
  title.style.whiteSpace = 'pre-line';

  const sub = document.createElement('h3');
  sub.textContent = 'PLAYER ACCESS';
  sub.style.textAlign = 'center';

  const email = document.createElement('input');
  email.type = 'email';
  email.placeholder = 'Email:';
  email.className = 'input';
  email.autocomplete = 'email';
  email.style.marginBottom = '0.75rem';

  const password = document.createElement('input');
  password.type = 'password';
  password.placeholder = 'Password:';
  password.className = 'input';
  password.autocomplete = 'current-password';
  password.style.marginBottom = '1rem';

  const signInBtn = document.createElement('button');
  signInBtn.type = 'submit';
  signInBtn.className = 'btn';
  signInBtn.textContent = 'ENTER PROJECT EGO';

  const signUpBtn = document.createElement('button');
  signUpBtn.type = 'button';
  signUpBtn.className = 'btn';
  signUpBtn.textContent = 'CREATE PLAYER ACCOUNT';
  signUpBtn.style.marginTop = '0.5rem';

  const status = document.createElement('div');
  status.style.marginTop = '1rem';
  status.style.textAlign = 'center';
  status.style.fontSize = '0.85rem';

  form.append(
    title,
    sub,
    email,
    password,
    signInBtn,
    signUpBtn,
    status
  );

  container.append(form);

  function setStatus(message) {
    status.textContent = message;
  }

  function setLoading(loading) {
    signInBtn.disabled = loading;
    signUpBtn.disabled = loading;
    email.disabled = loading;
    password.disabled = loading;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailValue = email.value.trim();
    const passwordValue = password.value;

    if (!emailValue || !passwordValue) {
      setStatus('ENTER EMAIL AND PASSWORD.');
      return;
    }

    setLoading(true);
    setStatus('AUTHENTICATING...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (error) {
      setStatus(error.message.toUpperCase());
      setLoading(false);
      return;
    }

    if (data.user) {
      setStatus('ACCESS GRANTED.');
      await onAuthSuccess(data.user);
    }

    setLoading(false);
  });

  signUpBtn.addEventListener('click', async () => {
    const emailValue = email.value.trim();
    const passwordValue = password.value;

    if (!emailValue || !passwordValue) {
      setStatus('ENTER EMAIL AND PASSWORD.');
      return;
    }

    if (passwordValue.length < 6) {
      setStatus('PASSWORD MUST BE AT LEAST 6 CHARACTERS.');
      return;
    }

    setLoading(true);
    setStatus('CREATING PLAYER ACCOUNT...');

    const { data, error } = await supabase.auth.signUp({
      email: emailValue,
      password: passwordValue,
    });

    if (error) {
      setStatus(error.message.toUpperCase());
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      setStatus('PLAYER ACCOUNT CREATED.');
      await onAuthSuccess(data.user);
    } else {
      setStatus('ACCOUNT CREATED. CHECK YOUR EMAIL TO CONFIRM ACCESS.');
    }

    setLoading(false);
  });
}