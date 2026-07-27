/* Personalizza qui testi, soglie e ritmo del gioco. */
const CONFIG = {
  question: 'Valentina, mi vuoi veramente bene?',
  buttons: {
    yes: 'Sì, davvero ❤️',
    no: 'No',
    retry: 'Forse ho sbagliato risposta…'
  },
  yesPhrases: [
    'Sei sicura?',
    'Sicura sicura?',
    'Ma proprio davvero?',
    'Quanto davvero?',
    'Pensaci bene 😏',
    'Ne sei proprio convinta?',
    'Non rispondere troppo in fretta',
    'Voglio le prove!',
    'Davvero davvero?',
    'Più di quanto sei stanca?',
    'Anche quando ti prendo in giro?',
    'Anche quando organizzo tutto io?',
    'Anche con la mia parte birichina?',
    'Non basta dirlo così!',
    'Convincimi ❤️'
  ],
  attemptMessages: [
    { after: 3, text: 'Mmh… vediamo quanto ci tieni davvero.' },
    { after: 6, text: 'Dire “sì” a parole era troppo facile.' },
    { after: 9, text: 'Ciccina, devi impegnarti un po’ di più ❤️' },
    { after: 12, text: 'Va bene, forse comincio a crederti…' },
    { after: 15, text: 'Quasi convinto. Ma voglio un ultimo tentativo.' }
  ],
  attempts: {
    softenAfter: 12,
    capturableAfter: 15
  },
  movement: {
    activationDistance: 105,
    escapeDistance: 178,
    minimumEscapeDistance: 48,
    duration: 400,
    finalDuration: 490,
    cooldown: 320,
    phraseMinDuration: 800,
    phraseMaxDuration: 1200,
    safeMargin: 18,
    protectedGap: 14
  },
  animation: {
    cardExitDuration: 450,
    lineInterval: 720,
    confettiDuration: 13000,
    heartsDuration: 15000
  },
  positiveMessages: [
    'Ho letto bene la risposta.',
    'Hai detto che mi vuoi veramente bene.',
    'E sì, sono molto contento.',
    'In realtà lo sapevo già, ciccina… però volevo sentirtelo ammettere ufficialmente.'
  ],
  angryMessages: [
    'Quindi non mi vuoi veramente bene.',
    'Perfetto.',
    'Il ciccino se lo segna.'
  ]
};

const $ = (id) => document.getElementById(id);
const questionCard = $('question-card');
const questionText = $('question-text');
const attemptMessage = $('attempt-message');
const buttonRow = $('button-row');
const yesButton = $('yes-btn');
const noButton = $('no-btn');
const positiveScreen = $('positive-screen');
const positiveTitle = $('positive-title');
const positiveSteps = $('positive-steps');
const positiveLove = $('positive-love');
const positiveSignature = $('positive-signature');
const angryScreen = $('angry-screen');
const angryTitle = $('angry-title');
const angrySteps = $('angry-steps');
const angryEmoji = $('angry-emoji');
const angryClosing = $('angry-closing');
const angryJoke = $('angry-joke');
const retryButton = $('retry-btn');
const floatingHearts = $('floating-hearts');
const confettiLayer = $('confetti-layer');

let attempts = 0;
let finished = false;
let hasEscaped = false;
let moveInProgress = false;
let finalCaptureEnabled = false;
let lastMoveAt = -Infinity;
let lastPhrase = '';
let yesPlaceholder;
let phraseTimer;
let heartTimer;
let confettiTimer;
let stopEffectsTimer;
let scheduledTimers = [];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function schedule(callback, delay) {
  const timer = window.setTimeout(callback, delay);
  scheduledTimers.push(timer);
  return timer;
}

function clearAllTimers() {
  window.clearTimeout(phraseTimer);
  window.clearTimeout(stopEffectsTimer);
  window.clearInterval(heartTimer);
  window.clearInterval(confettiTimer);
  scheduledTimers.forEach((timer) => window.clearTimeout(timer));
  scheduledTimers = [];
  phraseTimer = undefined;
  heartTimer = undefined;
  confettiTimer = undefined;
  stopEffectsTimer = undefined;
}

function getPointerCoordinates(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];
  return {
    x: touch ? touch.clientX : event.clientX,
    y: touch ? touch.clientY : event.clientY
  };
}

function getViewportBounds() {
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft || 0;
  const top = viewport?.offsetTop || 0;
  return {
    left,
    top,
    right: left + (viewport?.width || window.innerWidth),
    bottom: top + (viewport?.height || window.innerHeight)
  };
}

function rectFromPosition(x, y, width, height) {
  return { left: x, top: y, right: x + width, bottom: y + height, width, height };
}

function rectanglesOverlap(a, b, gap = 0) {
  return (
    a.left < b.right + gap &&
    a.right > b.left - gap &&
    a.top < b.bottom + gap &&
    a.bottom > b.top - gap
  );
}

function overlapArea(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return width * height;
}

function calculateEscapeDirection(pointer, rect = yesButton.getBoundingClientRect()) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  let x = centerX - pointer.x;
  let y = centerY - pointer.y;
  const length = Math.hypot(x, y);

  if (length < 1) {
    const angle = Math.random() * Math.PI * 2;
    x = Math.cos(angle);
    y = Math.sin(angle);
  } else {
    x /= length;
    y /= length;
  }

  return { x, y };
}

function getEscapeDistance() {
  if (attempts < CONFIG.attempts.softenAfter) return CONFIG.movement.escapeDistance;

  const softeningSteps = CONFIG.attempts.capturableAfter - CONFIG.attempts.softenAfter;
  const progress = clamp((attempts - CONFIG.attempts.softenAfter + 1) / Math.max(1, softeningSteps), 0, 1);
  return Math.round(
    CONFIG.movement.escapeDistance -
    (CONFIG.movement.escapeDistance - CONFIG.movement.minimumEscapeDistance) * progress
  );
}

function getMoveDuration() {
  if (attempts < CONFIG.attempts.softenAfter) return CONFIG.movement.duration;

  const span = CONFIG.attempts.capturableAfter - CONFIG.attempts.softenAfter;
  const progress = clamp((attempts - CONFIG.attempts.softenAfter + 1) / Math.max(1, span), 0, 1);
  return Math.round(
    CONFIG.movement.duration +
    (CONFIG.movement.finalDuration - CONFIG.movement.duration) * progress
  );
}

function isSafeCandidate(candidateRect, noRect, questionRect, messageRect) {
  if (rectanglesOverlap(candidateRect, noRect, CONFIG.movement.protectedGap)) return false;
  if (rectanglesOverlap(candidateRect, questionRect, 4)) return false;
  if (attemptMessage.textContent && rectanglesOverlap(candidateRect, messageRect, 4)) return false;
  return true;
}

function findSafePosition(pointer) {
  const currentRect = yesButton.getBoundingClientRect();
  const noRect = noButton.getBoundingClientRect();
  const questionRect = questionText.getBoundingClientRect();
  const messageRect = attemptMessage.getBoundingClientRect();
  const viewport = getViewportBounds();
  const margin = CONFIG.movement.safeMargin;
  const minX = viewport.left + margin;
  const minY = viewport.top + margin;
  const maxX = Math.max(minX, viewport.right - currentRect.width - margin);
  const maxY = Math.max(minY, viewport.bottom - currentRect.height - margin);
  const direction = calculateEscapeDirection(pointer, currentRect);
  const baseAngle = Math.atan2(direction.y, direction.x);
  const distance = getEscapeDistance();
  const angleOffsets = [0, -.38, .38, -.72, .72, -1.08, 1.08, Math.PI];
  const distanceFactors = [1, .84, .68];
  const candidates = [];

  angleOffsets.forEach((offset) => {
    distanceFactors.forEach((factor) => {
      const x = clamp(currentRect.left + Math.cos(baseAngle + offset) * distance * factor, minX, maxX);
      const y = clamp(currentRect.top + Math.sin(baseAngle + offset) * distance * factor, minY, maxY);
      const rect = rectFromPosition(x, y, currentRect.width, currentRect.height);
      if (!isSafeCandidate(rect, noRect, questionRect, messageRect)) return;

      const centerX = x + currentRect.width / 2;
      const centerY = y + currentRect.height / 2;
      const pointerDistance = Math.hypot(centerX - pointer.x, centerY - pointer.y);
      const actualTravel = Math.hypot(x - currentRect.left, y - currentRect.top);
      candidates.push({ x, y, score: pointerDistance + actualTravel * .35 });
    });
  });

  if (candidates.length) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  // On very small screens use a scored grid. It still keeps "No" clear and
  // minimizes overlap with the question instead of jumping to a random corner.
  const gridCandidates = [];
  const columns = 5;
  const rows = 6;

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const x = minX + (maxX - minX) * (column / (columns - 1));
      const y = minY + (maxY - minY) * (row / (rows - 1));
      const rect = rectFromPosition(x, y, currentRect.width, currentRect.height);
      if (rectanglesOverlap(rect, noRect, CONFIG.movement.protectedGap)) continue;

      const centerX = x + currentRect.width / 2;
      const centerY = y + currentRect.height / 2;
      const pointerDistance = Math.hypot(centerX - pointer.x, centerY - pointer.y);
      const questionPenalty = overlapArea(rect, questionRect) * 2;
      const messagePenalty = overlapArea(rect, messageRect) * 1.5;
      const actualTravel = Math.hypot(x - currentRect.left, y - currentRect.top);
      gridCandidates.push({
        x,
        y,
        score: pointerDistance + Math.min(actualTravel, distance) * .25 - questionPenalty - messagePenalty
      });
    }
  }

  gridCandidates.sort((a, b) => b.score - a.score);
  return gridCandidates[0] || { x: minX, y: maxY };
}

function promoteYesButtonToViewport() {
  if (hasEscaped) return;

  const rect = yesButton.getBoundingClientRect();
  yesButton.style.transition = 'none';
  yesPlaceholder = document.createElement('span');
  yesPlaceholder.className = 'yes-placeholder';
  yesPlaceholder.setAttribute('aria-hidden', 'true');
  yesPlaceholder.style.width = `${rect.width}px`;
  yesPlaceholder.style.height = `${rect.height}px`;
  buttonRow.insertBefore(yesPlaceholder, yesButton);
  document.body.appendChild(yesButton);
  yesButton.style.position = 'fixed';
  yesButton.style.left = `${rect.left}px`;
  yesButton.style.top = `${rect.top}px`;
  yesButton.style.margin = '0';
  yesButton.style.zIndex = '20';
  yesButton.style.opacity = '1';
  yesButton.style.visibility = 'visible';
  hasEscaped = true;

  // Force the measured fixed position to render before the animated target is
  // applied. This prevents any visual jump during the first escape.
  void yesButton.offsetWidth;
  yesButton.style.transition = '';
}

function updateYesButtonText() {
  let phrase = CONFIG.yesPhrases[randomBetween(0, CONFIG.yesPhrases.length - 1)];
  if (CONFIG.yesPhrases.length > 1 && phrase === lastPhrase) {
    phrase = CONFIG.yesPhrases[(CONFIG.yesPhrases.indexOf(phrase) + 1) % CONFIG.yesPhrases.length];
  }
  lastPhrase = phrase;
  yesButton.textContent = phrase;

  window.clearTimeout(phraseTimer);
  phraseTimer = window.setTimeout(() => {
    if (!finished) yesButton.textContent = CONFIG.buttons.yes;
  }, randomBetween(CONFIG.movement.phraseMinDuration, CONFIG.movement.phraseMaxDuration));
}

function updateAttemptMessage() {
  const current = [...CONFIG.attemptMessages].reverse().find((item) => attempts >= item.after);
  const nextText = current?.text || '';
  if (attemptMessage.textContent === nextText) return;

  attemptMessage.classList.remove('visible');
  schedule(() => {
    if (finished) return;
    attemptMessage.textContent = nextText;
    attemptMessage.classList.toggle('visible', Boolean(nextText));
  }, 90);
}

function enableFinalCapture() {
  finalCaptureEnabled = true;
  moveInProgress = false;
  yesButton.classList.add('is-capturable');
  yesButton.setAttribute('aria-label', CONFIG.buttons.yes);
  window.clearTimeout(phraseTimer);
  phraseTimer = window.setTimeout(() => {
    if (!finished) yesButton.textContent = CONFIG.buttons.yes;
  }, 500);
}

function escapeYesButton(event) {
  if (finished || finalCaptureEnabled || moveInProgress) return false;

  const now = performance.now();
  if (now - lastMoveAt < CONFIG.movement.cooldown) return false;

  const pointer = getPointerCoordinates(event);
  if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return false;

  lastMoveAt = now;
  moveInProgress = true;
  attempts += 1;
  updateAttemptMessage();
  promoteYesButtonToViewport();
  updateYesButtonText();

  const target = findSafePosition(pointer);
  const duration = getMoveDuration();
  const rotation = randomBetween(-4, 4);
  yesButton.style.transitionDuration = `${duration}ms`;
  yesButton.style.transitionTimingFunction = 'cubic-bezier(.2, .8, .25, 1)';
  yesButton.style.left = `${target.x}px`;
  yesButton.style.top = `${target.y}px`;
  yesButton.style.transform = `rotate(${rotation}deg)`;
  yesButton.style.boxShadow = '0 17px 30px rgba(93, 24, 66, .24)';

  window.setTimeout(() => {
    moveInProgress = false;
    yesButton.style.boxShadow = '';
    if (attempts >= CONFIG.attempts.capturableAfter) enableFinalCapture();
  }, duration + 30);

  return true;
}

function detectPointerProximity(event) {
  if (finished || finalCaptureEnabled || moveInProgress) return;

  const pointer = getPointerCoordinates(event);
  if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return;

  const rect = yesButton.getBoundingClientRect();
  const closestX = clamp(pointer.x, rect.left, rect.right);
  const closestY = clamp(pointer.y, rect.top, rect.bottom);
  const distance = Math.hypot(pointer.x - closestX, pointer.y - closestY);

  if (distance <= CONFIG.movement.activationDistance) escapeYesButton(event);
}

function keepYesButtonInsideViewport() {
  if (!hasEscaped || finished) return;

  const rect = yesButton.getBoundingClientRect();
  const viewport = getViewportBounds();
  const margin = CONFIG.movement.safeMargin;
  const x = clamp(rect.left, viewport.left + margin, viewport.right - rect.width - margin);
  const y = clamp(rect.top, viewport.top + margin, viewport.bottom - rect.height - margin);
  yesButton.style.left = `${x}px`;
  yesButton.style.top = `${y}px`;
}

function spawnHeart() {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = Math.random() > .28 ? '♥' : '♡';
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.top = `${75 + Math.random() * 30}vh`;
  heart.style.fontSize = `${12 + Math.random() * 16}px`;
  heart.style.animationDuration = `${5 + Math.random() * 5}s`;
  floatingHearts.appendChild(heart);
  window.setTimeout(() => heart.remove(), 10500);
}

function launchHearts() {
  for (let index = 0; index < 28; index += 1) schedule(spawnHeart, index * 95);
  heartTimer = window.setInterval(spawnHeart, 560);
}

function spawnConfettiBurst() {
  const colors = ['#dc4c80', '#a76bd0', '#f4a5bf', '#f6c56e', '#fff4f7'];
  for (let index = 0; index < 22; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.width = `${5 + Math.random() * 4}px`;
    piece.style.height = `${8 + Math.random() * 7}px`;
    piece.style.background = colors[randomBetween(0, colors.length - 1)];
    piece.style.animationDuration = `${2.5 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * .3}s`;
    confettiLayer.appendChild(piece);
    window.setTimeout(() => piece.remove(), 4700);
  }
}

function launchConfetti() {
  spawnConfettiBurst();
  confettiTimer = window.setInterval(spawnConfettiBurst, 1500);
}

function revealLine(container, text, delay) {
  schedule(() => {
    const line = document.createElement('p');
    line.className = 'line';
    line.textContent = text;
    container.appendChild(line);
    requestAnimationFrame(() => line.classList.add('show'));
  }, delay);
}

function revealElement(element, delay) {
  schedule(() => element.classList.remove('hidden'), delay);
}

function beginResult(screen, bodyClass) {
  finished = true;
  clearAllTimers();
  questionCard.classList.add('leaving');
  yesButton.classList.add('result-hide');
  yesButton.style.opacity = '0';
  document.body.classList.add(bodyClass);

  schedule(() => {
    questionCard.classList.add('hidden');
    screen.classList.remove('hidden');
  }, CONFIG.animation.cardExitDuration);
}

function showPositiveResult() {
  if (finished) return;

  positiveSteps.innerHTML = '';
  positiveLove.classList.add('hidden');
  positiveSignature.classList.add('hidden');
  positiveTitle.textContent = 'Finalmente! ❤️';
  beginResult(positiveScreen, 'romantic-mode');

  CONFIG.positiveMessages.forEach((message, index) => {
    revealLine(
      positiveSteps,
      message,
      CONFIG.animation.cardExitDuration + 520 + index * CONFIG.animation.lineInterval
    );
  });
  const finalMessageDelay =
    CONFIG.animation.cardExitDuration + 520 + CONFIG.positiveMessages.length * CONFIG.animation.lineInterval;
  revealElement(positiveLove, finalMessageDelay);
  revealElement(positiveSignature, finalMessageDelay + 720);

  launchHearts();
  launchConfetti();
  stopEffectsTimer = window.setTimeout(() => {
    window.clearInterval(heartTimer);
    window.clearInterval(confettiTimer);
  }, Math.max(CONFIG.animation.heartsDuration, CONFIG.animation.confettiDuration));
}

function showAngryResult() {
  if (finished) return;

  angrySteps.innerHTML = '';
  angryEmoji.classList.add('hidden');
  angryClosing.classList.add('hidden');
  retryButton.classList.add('hidden');
  angryJoke.classList.add('hidden');
  angryTitle.textContent = 'Ah.';
  beginResult(angryScreen, 'angry-mode');

  CONFIG.angryMessages.forEach((message, index) => {
    revealLine(
      angrySteps,
      message,
      CONFIG.animation.cardExitDuration + 650 + index * 820
    );
  });

  const emojiDelay = CONFIG.animation.cardExitDuration + 650 + CONFIG.angryMessages.length * 820;
  revealElement(angryEmoji, emojiDelay);
  revealElement(angryClosing, emojiDelay + 560);
  revealElement(retryButton, emojiDelay + 1900);
  revealElement(angryJoke, emojiDelay + 3300);
}

function resetGame() {
  clearAllTimers();
  attempts = 0;
  finished = false;
  hasEscaped = false;
  moveInProgress = false;
  finalCaptureEnabled = false;
  lastMoveAt = -Infinity;
  lastPhrase = '';

  yesButton.style.position = '';
  yesButton.style.left = '';
  yesButton.style.top = '';
  yesButton.style.margin = '';
  yesButton.style.zIndex = '';
  yesButton.style.opacity = '';
  yesButton.style.visibility = '';
  yesButton.style.transition = '';
  yesButton.style.transitionDuration = '';
  yesButton.style.transitionTimingFunction = '';
  yesButton.style.transform = '';
  yesButton.style.boxShadow = '';
  yesButton.classList.remove('is-capturable', 'result-hide');
  yesButton.removeAttribute('aria-label');
  yesPlaceholder?.remove();
  yesPlaceholder = undefined;
  buttonRow.insertBefore(yesButton, noButton);

  questionText.textContent = CONFIG.question;
  yesButton.textContent = CONFIG.buttons.yes;
  noButton.textContent = CONFIG.buttons.no;
  retryButton.textContent = CONFIG.buttons.retry;
  attemptMessage.textContent = '';
  attemptMessage.classList.remove('visible');
  positiveSteps.innerHTML = '';
  angrySteps.innerHTML = '';
  floatingHearts.innerHTML = '';
  confettiLayer.innerHTML = '';
  positiveScreen.classList.add('hidden');
  angryScreen.classList.add('hidden');
  questionCard.classList.remove('hidden', 'leaving');
  document.body.classList.remove('romantic-mode', 'angry-mode');
}

function initializeGame() {
  resetGame();

  window.addEventListener('pointermove', detectPointerProximity, { passive: true });
  yesButton.addEventListener('pointerenter', detectPointerProximity);
  yesButton.addEventListener('pointerdown', (event) => {
    if (finished || finalCaptureEnabled) return;
    event.preventDefault();
    escapeYesButton(event);
  });

  // Pointer Events cover modern touchscreens. This fallback is only installed
  // on older touch browsers, preventing duplicate escapes on current devices.
  if (!window.PointerEvent) {
    yesButton.addEventListener('touchstart', (event) => {
      if (finished || finalCaptureEnabled) return;
      event.preventDefault();
      escapeYesButton(event);
    }, { passive: false });
  }

  yesButton.addEventListener('click', (event) => {
    if (finished) return;
    if (finalCaptureEnabled || event.detail === 0) {
      showPositiveResult();
      return;
    }
    event.preventDefault();
    escapeYesButton(event);
  });
  noButton.addEventListener('click', showAngryResult);
  retryButton.addEventListener('click', resetGame);
  window.addEventListener('resize', keepYesButtonInsideViewport);
  window.addEventListener('orientationchange', () => window.setTimeout(keepYesButtonInsideViewport, 120));
}

initializeGame();
