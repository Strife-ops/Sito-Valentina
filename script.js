/* ── Personalizza qui il messaggio ─────────────────────────────────────── */
const config = {
  girlName: 'Valentina',
  senderName: 'Daniele',
  initialQuestion: 'Valentina, vuoi che smetta di volerti bene?',
  mainMessage: 'Mi dispiace, Valentina… ma non posso smettere di volerti bene.',
  finalMessage: 'Con molto piacere. Ogni giorno un po’ di più.',
  noPhrases: [
    'Non riesci a prendermi!', 'Questa è la risposta giusta, però…', 'Dai, riprova 😜',
    'Troppo lenta!', 'Valentinaaaa!', 'Questo pulsante è timido', 'Quasi!',
    'Non voglio farmi premere', 'Sei sicura di riuscirci?', 'Il No è fuori servizio ❤️'
  ],
  tryThresholds: { hint: 4, tiny: 7, vanish: 10 },
  animation: { moveDuration: 180, safePadding: 18, escapeDistance: 142, shrinkAfter: 7, shrinkStep: .035 }
};

const $ = (id) => document.getElementById(id);
const noButton = $('no-btn');
const yesButton = $('yes-btn');
const questionCard = $('question-card');
const finalScreen = $('final-screen');
const finalTitle = $('final-title');
const finalSubtitle = $('final-subtitle');
const finalSteps = $('final-steps');
const continueButton = $('continue-btn');
const finalMessage = $('final-message');
const smallSignature = $('small-signature');
const questionText = $('question-text');
const attemptMessage = $('attempt-message');
const floatingHearts = $('floating-hearts');
const confettiLayer = $('confetti-layer');
const signatureLine = $('signature-line');

let attempts = 0;
let finished = false;
let moveTimer;
let heartTimer;
let confettiTimer;

function initText() {
  questionText.textContent = config.initialQuestion;
  finalSubtitle.textContent = config.mainMessage.replace(/Valentina/g, config.girlName);
  finalMessage.textContent = config.finalMessage;
  signatureLine.innerHTML = `${config.senderName} <span aria-hidden="true">♥</span> ${config.girlName}`;
}

function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function overlaps(rectA, rectB, gap = 0) {
  return rectA.left < rectB.right + gap && rectA.right > rectB.left - gap && rectA.top < rectB.bottom + gap && rectA.bottom > rectB.top - gap;
}

function findEscapePosition() {
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;
  const pad = config.animation.safePadding;
  const yesRect = yesButton.getBoundingClientRect();
  const cardRect = questionCard.getBoundingClientRect();
  const maxX = Math.max(pad, window.innerWidth - width - pad);
  const maxY = Math.max(pad, window.innerHeight - height - pad);

  for (let tries = 0; tries < 90; tries += 1) {
    const x = randomBetween(pad, maxX);
    const y = randomBetween(pad, maxY);
    const candidate = { left: x, top: y, right: x + width, bottom: y + height };
    // Keep the escape button away from both the affirmative button and the question card.
    if (!overlaps(candidate, yesRect, 58) && !overlaps(candidate, cardRect, 12)) return { x, y };
  }

  // Small screens can run out of free space: choose the farthest corner available.
  const corners = [{ x: pad, y: pad }, { x: maxX, y: pad }, { x: pad, y: maxY }, { x: maxX, y: maxY }];
  return corners.sort((a, b) => Math.hypot(b.x - yesRect.left, b.y - yesRect.top) - Math.hypot(a.x - yesRect.left, a.y - yesRect.top))[0];
}

function moveNoButton() {
  const { x, y } = findEscapePosition();
  noButton.style.position = 'fixed';
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noButton.style.transitionDuration = `${config.animation.moveDuration}ms`;
  noButton.style.transform = `rotate(${randomBetween(-10, 10)}deg) scale(${Math.max(.7, 1 - Math.max(0, attempts - config.animation.shrinkAfter) * config.animation.shrinkStep)})`;
}

function updateAttemptFeedback() {
  if (attempts >= config.tryThresholds.hint) attemptMessage.textContent = 'Mi sa che questo No non vuole proprio farsi premere…';
}

function makeNoButtonDodge() {
  if (finished) return;
  attempts += 1;
  updateAttemptFeedback();
  noButton.textContent = config.noPhrases[Math.floor(Math.random() * config.noPhrases.length)];
  noButton.style.opacity = '1';
  noButton.style.visibility = 'visible';
  moveNoButton();

  if (attempts > config.tryThresholds.vanish) {
    clearTimeout(moveTimer);
    noButton.style.opacity = '.14';
    moveTimer = setTimeout(() => {
      noButton.style.visibility = 'hidden';
      moveTimer = setTimeout(() => {
        if (finished) return;
        noButton.style.visibility = 'visible';
        noButton.style.opacity = '1';
        moveNoButton();
      }, 120);
    }, 120);
  }
}

function pointerIsClose(event) {
  const rect = noButton.getBoundingClientRect();
  return Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)) < Math.max(config.animation.escapeDistance, rect.width * 1.8);
}

function handlePointerMove(event) {
  if (!finished && pointerIsClose(event)) makeNoButtonDodge();
}

function spawnHeart() {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = Math.random() > .28 ? '♥' : '♡';
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
    piece.style.animationDelay = `${Math.random() * .35}s`;
    confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 4300);
  }
}

function startRomanticSequence(isEasterEgg = false) {
  if (finished) return;
  finished = true;
  clearTimeout(moveTimer);
  questionCard.classList.add('hidden');
  finalScreen.classList.remove('hidden');
  document.body.classList.add('romantic-mode');

  if (isEasterEgg) {
    finalTitle.textContent = 'Non so come tu abbia fatto a prenderlo…';
    finalSubtitle.textContent = 'Ma la tua risposta è stata registrata: non vuoi che smetta di volerti bene ❤️';
  }

  for (let index = 0; index < 32; index += 1) setTimeout(spawnHeart, index * 80);
  heartTimer = setInterval(spawnHeart, 480);
  confettiTimer = setInterval(spawnConfetti, 1250);
  spawnConfetti();

  ['Ci hai provato…', 'Ma ormai è troppo tardi.', 'Ti voglio troppo bene ❤️'].forEach((line, index) => {
    setTimeout(() => {
      const paragraph = document.createElement('p');
      paragraph.className = 'line';
      paragraph.textContent = line;
      finalSteps.appendChild(paragraph);
      requestAnimationFrame(() => paragraph.classList.add('show'));
    }, 800 + index * 1050);
  });

  setTimeout(() => continueButton.classList.remove('hidden'), 3900);
}

function finishWithExtraLove() {
  continueButton.classList.add('hidden');
  finalMessage.classList.remove('hidden');
  smallSignature.classList.remove('hidden');
  for (let index = 0; index < 22; index += 1) setTimeout(spawnHeart, index * 90);
  spawnConfetti();
  clearInterval(confettiTimer);
  clearInterval(heartTimer);
}

// A wider pointer zone makes the dodge work on touch screens before the button receives the tap.
window.addEventListener('pointermove', handlePointerMove, { passive: true });
noButton.addEventListener('pointerenter', makeNoButtonDodge);
noButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  makeNoButtonDodge();
});
noButton.addEventListener('click', (event) => {
  event.preventDefault();
  startRomanticSequence(true);
});
yesButton.addEventListener('click', () => startRomanticSequence(false));
continueButton.addEventListener('click', finishWithExtraLove);
window.addEventListener('resize', () => { if (!finished) moveNoButton(); });
window.addEventListener('orientationchange', () => setTimeout(() => { if (!finished) moveNoButton(); }, 100));

initText();
requestAnimationFrame(moveNoButton);
