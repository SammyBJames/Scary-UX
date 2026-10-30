// Every letter of the alphabet plus a space, each appearing twice on the board.
const SYMBOLS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ' '];
const MISMATCH_DELAY = 900;
const MATCH_DELAY = 1100;

const board = document.getElementById('board');
const nameSlots = document.getElementById('name');
const flipsEl = document.getElementById('flips');
const attemptsEl = document.getElementById('attempts');
const statusEl = document.getElementById('status');
const toast = document.getElementById('toast');
const result = document.getElementById('result');
const confirmNotice = document.getElementById('confirm-notice');
const heading = document.querySelector('h1');
const nameLabel = document.getElementById('name-label');
const submitBtn = document.getElementById('submit');

let name = '';
// The name from the first pass once it's submitted; null while still on the first pass.
let firstEntry = null;
let firstCard = null;
let locked = false;
let flips = 0;
let attempts = 1;
let toastTimer = null;

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function label(symbol) {
  return symbol === ' ' ? '␣' : symbol;
}

// "SAM SMITH" -> "Sam Smith"
function formatName(raw) {
  return raw.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function renderName(justAdded = false) {
  const display = formatName(name);
  nameSlots.replaceChildren();
  // One box per matched character, plus one empty box waiting for the next match.
  for (let i = 0; i <= name.length; i++) {
    const slot = document.createElement('span');
    slot.className = 'slot';
    const char = display[i];
    if (char === ' ') slot.classList.add('space');
    else if (char) slot.textContent = char;
    if (i < name.length) slot.classList.add('filled');
    if (i === name.length) slot.classList.add('active');
    if (justAdded && i === name.length - 1) slot.classList.add('new');
    nameSlots.append(slot);
  }
  nameSlots.setAttribute('aria-label', display.trim() ? `Name: ${display}` : 'Name: empty');
}

function deal() {
  board.replaceChildren();
  for (const symbol of shuffle([...SYMBOLS, ...SYMBOLS])) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.symbol = symbol;
    card.setAttribute('aria-label', 'Face-down card');
    card.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back"><span class="emblem">?</span></span>
        <span class="card-face card-front">
          <span class="corner top">${label(symbol)}</span>
          <span class="pip">${label(symbol)}</span>
          <span class="corner bottom">${label(symbol)}</span>
        </span>
      </span>`;
    card.addEventListener('click', () => flip(card));
    board.append(card);
  }
}

function flip(card) {
  if (locked || card.classList.contains('flipped')) return;

  card.classList.add('flipped');
  card.setAttribute('aria-label', `Card ${label(card.dataset.symbol)}`);
  flipsEl.textContent = ++flips;

  if (!firstCard) {
    firstCard = card;
    return;
  }

  const pair = [firstCard, card];
  const symbol = card.dataset.symbol;
  const isMatch = firstCard.dataset.symbol === symbol;
  firstCard = null;
  locked = true;

  if (isMatch) {
    pair.forEach((c) => c.classList.add('matched'));
    name += symbol;
    renderName(true);
    statusEl.textContent = `Added "${label(symbol)}". Got the wrong letter? Feel free to hit the start over button below!`;
  } else {
    statusEl.textContent = 'No match.';
  }

  // Matched or not, the cards go back face down so letters can be reused.
  setTimeout(() => {
    pair.forEach((c) => {
      c.classList.remove('flipped', 'matched');
      c.setAttribute('aria-label', 'Face-down card');
    });
    locked = false;
  }, isMatch ? MATCH_DELAY : MISMATCH_DELAY);
}

function setConfirming(confirming) {
  heading.textContent = confirming ? 'Confirm your name...' : 'Enter your name...';
  nameLabel.textContent = confirming ? 'Confirm name' : 'Name';
  submitBtn.textContent = confirming ? 'Confirm' : 'Submit';
}

function resetBoard() {
  name = '';
  firstCard = null;
  locked = false;
  renderName();
  deal();
}

function startOver(message = 'Board reshuffled. Good luck.') {
  firstEntry = null;
  setConfirming(false);
  attemptsEl.textContent = ++attempts;
  statusEl.textContent = message;
  result.hidden = true;
  resetBoard();
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 2500);
}

function submit() {
  const entered = formatName(name).trim();
  if (!entered) {
    showToast('Please enter your name.');
    return;
  }

  // First submission: make them do the whole thing again on a fresh shuffle.
  if (firstEntry === null) {
    firstEntry = entered;
    setConfirming(true);
    resetBoard();
    statusEl.textContent = 'To make sure we got it right, please enter your name again. The cards have been reshuffled.';
    confirmNotice.hidden = false;
    return;
  }

  // We don't know which entry was wrong, so both have to be redone.
  if (entered !== firstEntry) {
    startOver('Names did not match. Please start over.');
    showToast('Names did not match.');
    return;
  }

  document.getElementById('result-title').textContent = `Nice to meet you, ${entered}!`;
  document.getElementById('result-body').textContent =
    `That only took ${flips} flips across ${attempts} attempt${attempts === 1 ? '' : 's'}.`;
  result.hidden = false;
}

// Typing is for people who don't value security.
document.addEventListener('keydown', (e) => {
  if (e.key.length === 1 || e.key === 'Backspace') {
    e.preventDefault();
    showToast('Keyboard input is not supported. Please use the Name Builder™.');
  }
});

document.getElementById('restart').addEventListener('click', () => startOver());
submitBtn.addEventListener('click', submit);
document.getElementById('confirm-ok').addEventListener('click', () => (confirmNotice.hidden = true));
document.getElementById('not-my-name').addEventListener('click', () => startOver());
document.getElementById('done').addEventListener('click', () => {
  result.hidden = true;
  statusEl.textContent = 'Name submitted. Thank you for your patience.';
});

renderName();
deal();
