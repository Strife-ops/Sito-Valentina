/* ── Personalizza qui il messaggio ─────────────────────────────────────── */
const config = {
  girlName: 'Valentina',
  senderName: 'Daniele',
  initialQuestion: 'Valentina, vuoi saltare il nostro appuntamento di domani sera?',
  noButtonText: 'No ❤️',
  noPhrases: [
    'Quasi!', 'Devi prendermi!', 'Risposta giusta, ma difficile', 'Non scappo… forse',
    'Domani è confermato ❤️', 'Troppo lenta!', 'Valentina, concentrati!', 'Il No è timido',
    'Ci sei quasi', 'Non mi prenderai così'
  ],
  animation: {
    moveDuration: 340,
    cooldown: 320,
    safePadding: 18,
    escapeDistance: 128,
    phraseDuration: 1450,
    shrinkAfter: 8,
    shrinkStep: 0.025
  }
};

const $ = (id) => document.getElementById(id);
const noButton = $('no-btn');
const yesButton = $('yes-btn');
const questionCard = $('question-card');
const finalScreen = $('final-screen');
const finalTitle = $('final-title');
const finalSubtitle = $('final-subtitle');
const finalSteps = $('final-steps');
const finalMessage = $('final-message');
const smallSignature = $('small-signature');
const questionText = $('question-text');
const attemptMessage = $('attempt-message');
const floatingHearts = $('floating-hearts');
const confettiLayer = $('confetti-layer');
const signatureLine = $('signature-line');

let attempts = 0;
let finished = false;
let hasEscaped = false;
let lastMoveAt = -Infinity;
let phraseTimer;
let heartTimer;
let confettiTimer;

function initText() {
  questionText.textContent = config.initialQuestion;
  signatureLine.innerHTML = `${config.senderName} <span aria-hidden="true">♥</span> ${config.girlName}`;
  noButton.textContent = config.noButtonText;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function overlaps(rectA, rectB, gap = 0) {
  return rectA.left < rectB.right + gap && rectA.right > rectB.left - gap && rectA.top < rectB.bottom + gap && rectA.bottom > rectB.top - gap;
}

function rectFromPosition(x, y, width, height) {
  return { left: x, top: y, right: x + width, bottom: y + height };
}

function findEscapePosition() {
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;
  const pad = config.animation.safePadding;
  const yesRect = yesButton.getBoundingClientRect();
  const cardRect = questionCard.getBoundingClientRect();
  const maxX = Math.max(pad, window.innerWidth - width - pad);
  const maxY = Math.max(pad, window.innerHeight - height - pad);

  for (let tries = 0; tries < 100; tries += 1) {
    const x = randomBetween(pad, maxX);
    const y = randomBetween(pad, maxY);
    const candidate = rectFromPosition(x, y, width, height);

    // The new spot avoids both the friendly button and the question card.
    if (!overlaps(candidate, yesRect, 64) && !overlaps(candidate, cardRect, 12)) return { x, y };
  }

  // On a very small screen there may be no completely free area. Keep the
  // button in a visible corner and still prefer one away from “Sì”.
  const corners = [
    { x: pad, y: pad },
    { x: maxX, y: pad },
    { x: pad, y: maxY },
    { x: maxX, y: maxY }
  ];
  return corners
    .sort((a, b) => Math.hypot(b.x - yesRect.left, b.y - yesRect.top) - Math.hypot(a.x - yesRect.left, a.y - yesRect.top))
    .find(({ x, y }) => !overlaps(rectFromPosition(x, y, width, height), yesRect, 18)) || corners[0];
}

function promoteToViewportPosition() {
  if (hasEscaped) return;
  const rect = noButton.getBoundingClientRect();
  // Preserve the exact initial visual position when switching from the
  // normal flex layout to a viewport-positioned button.
  noButton.style.transition = 'none';
  noButton.style.position = 'fixed';
  noButton.style.left = `${rect.left}px`;
  noButton.style.top = `${rect.top}px`;
  noButton.style.margin = '0';
  hasEscaped = true;
  void noButton.offsetWidth;
  noButton.style.transition = '';
}

function moveNoButton() {
  const { x, y } = findEscapePosition();
  const shrink = Math.max(0.78, 1 - Math.max(0, attempts - config.animation.shrinkAfter) * config.animation.shrinkStep);
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noButton.style.transform = `rotate(${randomBetween(-8, 8)}deg) scale(${shrink})`;
}

function showTemporaryPhrase() {
  noButton.textContent = config.noPhrases[Math.floor(Math.random() * config.noPhrases.length)];
  clearTimeout(phraseTimer);
  phraseTimer = setTimeout(() => {
    if (!finished) noButton.textContent = config.noButtonText;
  }, config.animation.phraseDuration);
}

function dodgeNoButton() {
  if (finished) return false;
  const now = performance.now();
  if (now - lastMoveAt < config.animation.cooldown) return false;

  lastMoveAt = now;
  attempts += 1;
  if (attempts >= 4) attemptMessage.textContent = 'Mi sa che questo No vuole proprio farsi desiderare…';
  promoteToViewportPosition();
  showTemporaryPhrase();
  moveNoButton();
  return true;
}

function pointerIsClose(event) {
  if (!hasEscaped && !noButton.matches(':hover') && event.type === 'pointermove') {
    const rect = noButton.getBoundingClientRect();
    return Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)) < config.animation.escapeDistance;
  }
  return true;
}

function handlePointerMove(event) {
  if (!finished && pointerIsClose(event)) dodgeNoButton();
}

function keepEscapedButtonInsideViewport() {
  if (!hasEscaped || finished) return;
  const pad = config.animation.safePadding;
  const rect = noButton.getBoundingClientRect();
  const x = Math.min(Math.max(pad, rect.left), Math.max(pad, window.innerWidth - rect.width - pad));
  const y = Math.min(Math.max(pad, rect.top), Math.max(pad, window.innerHeight - rect.height - pad));
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
}

function spawnHeart() {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = Math.random() > 0.28 ? '♥' : '♡';
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.top = `${72 + Math.random() * 35}vh`;
  heart.style.fontSize = `${12 + Math.random() * 16}px`;
  heart.style.animationDuration = `${5 + Math.random() * 5}s`;
  floatingHearts.appendChild(heart);
  setTimeout(() => heart.remove(), 10500);
}

function spawnConfetti() {
  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = ['#dc4c80', '#a76bd0', '#f4a5bf', '#f6c56e'][randomBetween(0, 3)];
    piece.style.animationDuration = `${2.2 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.35}s`;
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 4300);
  }
}

function revealLine(text, delay) {
  setTimeout(() => {
    const paragraph = document.createElement('p');
    paragraph.className = 'line';
    paragraph.textContent = text;
    finalSteps.appendChild(paragraph);
    requestAnimationFrame(() => paragraph.classList.add('show'));
  }, delay);
}

function startRomanticSequence(answer) {
  if (finished) return;
  finished = true;
  clearTimeout(phraseTimer);
  questionCard.classList.add('hidden');
  finalScreen.classList.remove('hidden');
  document.body.classList.add('romantic-mode');
  finalSteps.innerHTML = '';
  finalMessage.classList.add('hidden');
  smallSignature.classList.add('hidden');

  if (answer === 'no') {
    finalTitle.innerHTML = 'Perfetto <span aria-hidden="true">♥</span>';
    finalSubtitle.textContent = 'Allora l’appuntamento di domani sera è confermato.';
    finalMessage.textContent = 'Non vedevo l’ora.';
    revealLine('Ci vediamo domani sera ❤️', 850);
  } else {
    finalTitle.innerHTML = 'Risposta non accettata <span aria-hidden="true">♥</span>';
    finalSubtitle.textContent = 'Mi dispiace, Valentina, ma non puoi annullare l’appuntamento.';
    finalMessage.textContent = 'E sarà bellissimo.';
    revealLine('Domani sera ci vediamo lo stesso.', 850);
  }

  for (let index = 0; index < 30; index += 1) setTimeout(spawnHeart, index * 85);
  heartTimer = setInterval(spawnHeart, 520);
  confettiTimer = setInterval(spawnConfetti, 1400);
  spawnConfetti();

  setTimeout(() => {
    finalMessage.classList.remove('hidden');
    smallSignature.classList.remove('hidden');
  }, 2050);
}

// The initial layout is intentionally untouched. The first dodge promotes
// the button to fixed positioning while preserving its original coordinates.
window.addEventListener('pointermove', handlePointerMove, { passive: true });
noButton.addEventListener('pointerenter', () => dodgeNoButton());
noButton.addEventListener('mouseenter', () => dodgeNoButton());
noButton.addEventListener('pointerdown', () => dodgeNoButton());
noButton.addEventListener('touchstart', () => dodgeNoButton(), { passive: true });
noButton.addEventListener('click', (event) => {
  event.preventDefault();
  startRomanticSequence('no');
});
yesButton.addEventListener('click', () => startRomanticSequence('yes'));
window.addEventListener('resize', keepEscapedButtonInsideViewport);
window.addEventListener('orientationchange', () => setTimeout(keepEscapedButtonInsideViewport, 100));

initText();
