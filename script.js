/* ── Personalizza qui il messaggio, le soglie e le probabilità ──────────── */
const config = {
  girlName: 'Valentina',
  senderName: 'Daniele',
  question: 'Valentina, ammetti che la timidona è soltanto una copertura?',
  yesButtonText: 'Sì 😏',
  noButtonText: 'No, assolutamente!',
  noPhrases: [
    'Quasi!', 'No, non lo ammetto!', 'Non mi prenderai 😝', 'La timidona non parla!',
    'Troppo lenta!', 'Chissà…', 'Non vale!', 'Ci sei quasi', 'La copertura regge ancora',
    'Il tuo ciccino non avrà prove', 'Non ho detto niente!', 'Modalità timidona attiva'
  ],
  attemptMessages: [
    { after: 3, text: 'Come mai questo No è così agitato?' },
    { after: 6, text: 'La copertura della timidona comincia a cedere…' },
    { after: 10, text: 'Ciccina, forse fai prima ad ammetterlo 😏' },
    { after: 15, text: 'Il tuo ciccino aveva già capito tutto.' }
  ],
  animation: {
    moveDuration: 500,
    cooldown: 650,
    safePadding: 18,
    activationDistance: 170,
    phraseDuration: 1100,
    shrinkAfter: 11,
    shrinkStep: 0.018
  },
  effects: {
    normalShare: 0.70,
    curveShare: 0.12,
    bounceShare: 0.10,
    shrinkShare: 0.08
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
const playfulMessage = $('playful-message');
const finalClosing = $('final-closing');
const smallSignature = $('small-signature');
const retryButton = $('retry-btn');
const questionText = $('question-text');
const attemptMessage = $('attempt-message');
const floatingHearts = $('floating-hearts');
const confettiLayer = $('confetti-layer');
const signatureLine = $('signature-line');

let attempts = 0;
let finished = false;
let hasEscaped = false;
let specialEffectRunning = false;
let lastMoveAt = -Infinity;
let moveInProgress = false;
let phraseTimer;
let heartTimer;
let confettiTimer;
let sequenceStopTimer;
let scheduledTimers = [];

function initText() {
  questionText.textContent = config.question;
  yesButton.textContent = config.yesButtonText;
  noButton.textContent = config.noButtonText;
  signatureLine.innerHTML = `${config.senderName} <span aria-hidden="true">♥</span> ${config.girlName}`;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function overlaps(rectA, rectB, gap = 0) {
  return rectA.left < rectB.right + gap && rectA.right > rectB.left - gap && rectA.top < rectB.bottom + gap && rectA.bottom > rectB.top - gap;
}

function rectFromPosition(x, y, width, height) {
  return { left: x, top: y, right: x + width, bottom: y + height };
}

function pointerCoordinates(event) {
  const touch = event.touches && event.touches[0];
  return {
    x: touch ? touch.clientX : event.clientX,
    y: touch ? touch.clientY : event.clientY
  };
}

function schedule(callback, delay) {
  const timer = setTimeout(callback, delay);
  scheduledTimers.push(timer);
  return timer;
}

function clearAllTimers() {
  clearTimeout(phraseTimer);
  clearTimeout(sequenceStopTimer);
  clearInterval(heartTimer);
  clearInterval(confettiTimer);
  scheduledTimers.forEach((timer) => clearTimeout(timer));
  scheduledTimers = [];
  heartTimer = undefined;
  confettiTimer = undefined;
  specialEffectRunning = false;
  moveInProgress = false;
}

function updateAttemptMessage() {
  const current = [...config.attemptMessages].reverse().find((item) => attempts >= item.after);
  const nextText = current ? current.text : '';
  if (attemptMessage.textContent === nextText) return;

  attemptMessage.classList.remove('visible');
  schedule(() => {
    if (finished) return;
    attemptMessage.textContent = nextText;
    attemptMessage.classList.add('visible');
  }, 80);
}

function candidateIsSafe(candidate, yesRect, cardRect, width, height, gap = 0) {
  const candidateRect = rectFromPosition(candidate.x, candidate.y, width, height);
  return !overlaps(candidateRect, yesRect, gap) && !overlaps(candidateRect, cardRect, 10);
}

function findSafePosition(pointer) {
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;
  const pad = config.animation.safePadding;
  const maxX = Math.max(pad, window.innerWidth - width - pad);
  const maxY = Math.max(pad, window.innerHeight - height - pad);
  const yesRect = yesButton.getBoundingClientRect();
  const cardRect = questionCard.getBoundingClientRect();
  const currentRect = noButton.getBoundingClientRect();
  const current = { x: currentRect.left + currentRect.width / 2, y: currentRect.top + currentRect.height / 2 };
  const targetPointer = pointer || { x: current.x, y: current.y };
  let awayX = current.x - targetPointer.x;
  let awayY = current.y - targetPointer.y;
  const awayLength = Math.hypot(awayX, awayY) || 1;
  awayX /= awayLength;
  awayY /= awayLength;
  const perpendicular = { x: -awayY, y: awayX };
  const travel = Math.min(390, 160 + attempts * 15);
  const candidates = [];

  // First try the direction opposite to the pointer, then add curved and
  // lightly random alternatives so the escape feels intentional.
  for (let index = 0; index < 28; index += 1) {
    const angleOffset = index === 0 ? 0 : (Math.random() - 0.5) * 1.35;
    const directionX = awayX * Math.cos(angleOffset) + perpendicular.x * Math.sin(angleOffset);
    const directionY = awayY * Math.cos(angleOffset) + perpendicular.y * Math.sin(angleOffset);
    const extraDistance = index === 0 ? travel : travel * (0.72 + Math.random() * 0.55);
    const rawX = currentRect.left + directionX * extraDistance + (Math.random() - 0.5) * 90;
    const rawY = currentRect.top + directionY * extraDistance + (Math.random() - 0.5) * 90;
    const candidate = { x: clamp(rawX, pad, maxX), y: clamp(rawY, pad, maxY) };
    if (candidateIsSafe(candidate, yesRect, cardRect, width, height, 58)) candidates.push(candidate);
  }

  // Add a few viewport-wide options for later attempts and compact screens.
  for (let index = 0; index < 42; index += 1) {
    const candidate = { x: randomBetween(pad, maxX), y: randomBetween(pad, maxY) };
    if (candidateIsSafe(candidate, yesRect, cardRect, width, height, 58)) candidates.push(candidate);
  }

  if (candidates.length > 0) {
    return candidates.sort((a, b) => {
      const score = (candidate) => {
        const center = { x: candidate.x + width / 2, y: candidate.y + height / 2 };
        return distanceBetween(center, targetPointer) + distanceBetween(center, current) * 0.3;
      };
      return score(b) - score(a);
    })[0];
  }

  const corners = [
    { x: pad, y: pad }, { x: maxX, y: pad },
    { x: pad, y: maxY }, { x: maxX, y: maxY }
  ];
  return corners.find((candidate) => !overlaps(rectFromPosition(candidate.x, candidate.y, width, height), yesRect, 20)) || corners[0];
}

function promoteToViewportPosition() {
  if (hasEscaped) return;
  const rect = noButton.getBoundingClientRect();
  // The initial flex position is measured first, then preserved exactly while
  // the element changes to fixed positioning for all subsequent escapes.
  noButton.style.transition = 'none';
  noButton.style.position = 'fixed';
  noButton.style.left = `${rect.left}px`;
  noButton.style.top = `${rect.top}px`;
  noButton.style.margin = '0';
  hasEscaped = true;
  void noButton.offsetWidth;
  noButton.style.transition = '';
}

function pickEffect() {
  const roll = Math.random();
  if (roll < config.effects.normalShare) return 'normal';
  if (roll < config.effects.normalShare + config.effects.curveShare) return 'curve';
  if (roll < config.effects.normalShare + config.effects.curveShare + config.effects.bounceShare) return 'bounce';
  return 'shrink';
}

function applyMove(target, effect) {
  const shrink = Math.max(0.78, 1 - Math.max(0, attempts - config.animation.shrinkAfter) * config.animation.shrinkStep);
  const duration = effect === 'bounce' ? 460 : effect === 'curve' ? 540 : config.animation.moveDuration;
  const rotation = effect === 'curve' ? randomBetween(-12, 12) : randomBetween(-6, 6);
  const scale = effect === 'shrink' ? shrink * 0.9 : shrink;

  noButton.style.transitionDuration = `${duration}ms`;
  noButton.style.transitionTimingFunction = effect === 'bounce' ? 'cubic-bezier(.18, 1.35, .35, 1)' : 'cubic-bezier(.2, .8, .25, 1)';
  noButton.style.left = `${target.x}px`;
  noButton.style.top = `${target.y}px`;
  noButton.style.transform = `rotate(${rotation}deg) scale(${scale})`;
  noButton.style.boxShadow = effect === 'curve' || effect === 'bounce'
    ? '0 18px 34px rgba(93, 24, 66, .29)'
    : '0 12px 24px rgba(93, 24, 66, .17)';
}

function showTemporaryPhrase() {
  noButton.textContent = config.noPhrases[randomBetween(0, config.noPhrases.length - 1)];
  clearTimeout(phraseTimer);
  phraseTimer = setTimeout(() => {
    if (!finished) noButton.textContent = config.noButtonText;
  }, config.animation.phraseDuration);
}

function dodgeNoButton(event) {
  if (finished || specialEffectRunning || moveInProgress) return false;
  const now = performance.now();
  if (now - lastMoveAt < config.animation.cooldown) return false;
  lastMoveAt = now;
  moveInProgress = true;
  attempts += 1;
  updateAttemptMessage();
  promoteToViewportPosition();
  showTemporaryPhrase();

  const pointer = event ? pointerCoordinates(event) : undefined;
  const target = findSafePosition(pointer);
  const effect = pickEffect();
  applyMove(target, effect);
  // Do not allow another pointer event to queue a second escape while this
  // one is still visible and moving. This is what makes the motion readable.
  setTimeout(() => { moveInProgress = false; }, config.animation.moveDuration + 100);
  return true;
}

function isPointerNearNoButton(event) {
  const pointer = pointerCoordinates(event);
  if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return false;
  const rect = noButton.getBoundingClientRect();
  const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  return distanceBetween(pointer, center) < config.animation.activationDistance + Math.min(attempts * 5, 35);
}

function handlePointerMove(event) {
  if (!finished && isPointerNearNoButton(event)) dodgeNoButton(event);
}

function keepNoButtonInsideViewport() {
  if (!hasEscaped || finished) return;
  const rect = noButton.getBoundingClientRect();
  const pad = config.animation.safePadding;
  const x = clamp(rect.left, pad, Math.max(pad, window.innerWidth - rect.width - pad));
  const y = clamp(rect.top, pad, Math.max(pad, window.innerHeight - rect.height - pad));
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
  for (let index = 0; index < 20; index += 1) {
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
  schedule(() => {
    const paragraph = document.createElement('p');
    paragraph.className = 'line';
    paragraph.textContent = text;
    finalSteps.appendChild(paragraph);
    requestAnimationFrame(() => paragraph.classList.add('show'));
  }, delay);
}

function revealElement(element, text, delay) {
  schedule(() => {
    if (text) element.textContent = text;
    element.classList.remove('hidden');
  }, delay);
}

function startCelebration() {
  for (let index = 0; index < 34; index += 1) schedule(spawnHeart, index * 82);
  heartTimer = setInterval(spawnHeart, 520);
  confettiTimer = setInterval(spawnConfetti, 1400);
  spawnConfetti();
  sequenceStopTimer = setTimeout(() => {
    clearInterval(heartTimer);
    clearInterval(confettiTimer);
  }, 18000);
}

function startFinalSequence(answer) {
  if (finished) return;
  finished = true;
  clearAllTimers();
  questionCard.classList.add('leaving');
  document.body.classList.add('romantic-mode');
  finalSteps.innerHTML = '';
  finalMessage.classList.add('hidden');
  playfulMessage.classList.add('hidden');
  finalClosing.classList.add('hidden');
  smallSignature.classList.add('hidden');
  retryButton.classList.add('hidden');

  if (answer === 'yes') {
    finalTitle.textContent = 'Lo sapevo 😏';
    finalSubtitle.textContent = 'Confessione ufficialmente registrata.';
    revealLine('Quindi la timidona era davvero soltanto una copertura…', 700);
    revealElement(finalMessage, 'Sono contento che tu l’abbia finalmente ammesso, ciccina ❤️', 1500);
    revealElement(playfulMessage, 'Adesso resta solo da scoprire fino a che punto arriva la parte birichina… chissà 😝', 2250);
    revealElement(finalClosing, 'Il tuo ciccino aveva ragione.', 3100);
    revealElement(smallSignature, 'Questo sito è stato creato apposta per te.', 3650);
  } else {
    finalTitle.textContent = 'Risposta sospetta…';
    finalSubtitle.textContent = 'Il sistema non crede alla timidona 😏';
    revealElement(finalMessage, 'La domanda resta aperta, ciccina.', 850);
    revealElement(retryButton, '', 1900);
  }

  schedule(() => {
    questionCard.classList.add('hidden');
    finalScreen.classList.remove('hidden');
  }, 430);
  startCelebration();
}

function resetQuestion() {
  clearAllTimers();
  finished = false;
  hasEscaped = false;
  specialEffectRunning = false;
  attempts = 0;
  lastMoveAt = -Infinity;
  noButton.style.position = '';
  noButton.style.left = '';
  noButton.style.top = '';
  noButton.style.margin = '';
  noButton.style.transform = '';
  noButton.style.opacity = '';
  noButton.style.visibility = '';
  noButton.style.transition = '';
  noButton.style.transitionDuration = '';
  noButton.style.transitionTimingFunction = '';
  noButton.style.animation = '';
  noButton.style.boxShadow = '';
  noButton.textContent = config.noButtonText;
  attemptMessage.textContent = '';
  attemptMessage.classList.remove('visible');
  floatingHearts.innerHTML = '';
  confettiLayer.innerHTML = '';
  finalScreen.classList.add('hidden');
  questionCard.classList.remove('hidden', 'leaving');
  document.body.classList.remove('romantic-mode');
}

// The initial layout is deliberately untouched. The first escape measures the
// normal button position, promotes it to fixed and only then animates away.
window.addEventListener('pointermove', handlePointerMove, { passive: true });
noButton.addEventListener('pointerenter', (event) => dodgeNoButton(event));
noButton.addEventListener('mouseenter', (event) => dodgeNoButton(event));
noButton.addEventListener('mouseover', (event) => dodgeNoButton(event));
noButton.addEventListener('pointerdown', (event) => {
  // Cancel the native mouse/touch activation: the button should escape before
  // a physical tap can turn into a click.
  event.preventDefault();
  dodgeNoButton(event);
});
noButton.addEventListener('touchstart', (event) => {
  event.preventDefault();
  dodgeNoButton(event);
}, { passive: false });
noButton.addEventListener('click', (event) => {
  event.preventDefault();
  // Keyboard activation remains a harmless fallback, while pointer/touch
  // clicks are redirected into another visible escape.
  if (event.detail === 0) startFinalSequence('no');
  else dodgeNoButton(event);
});
yesButton.addEventListener('click', () => startFinalSequence('yes'));
retryButton.addEventListener('click', resetQuestion);
window.addEventListener('resize', keepNoButtonInsideViewport);
window.addEventListener('orientationchange', () => setTimeout(keepNoButtonInsideViewport, 120));

initText();
