const config = {
  girlName: 'Valentina',
  senderName: 'Daniele',
  initialQuestion: 'Valentina, vuoi che smetta di volerti bene?',
  mainMessage: 'Mi dispiace, Valentina… ma non posso smettere di volerti bene.',
  finalMessage: 'Con molto piacere. Ogni giorno un po’ di più.',
  noPhrases: [
    'Non riesci a prendermi!',
    'Questa è la risposta giusta, però…',
    'Dai, riprova 😜',
    'Troppo lenta!',
    'Valentinaaaa!',
    'Questo pulsante è timido',
    'Quasi!',
    'Non voglio farmi premere',
    'Sei sicura di riuscirci?',
    'Il No è fuori servizio ❤️'
  ],
  tryThresholds: {
    hint: 4,
    tiny: 7,
    vanish: 10,
    minSize: 0.72,
  },
  movement: {
    maxMove: 140,
    moveDuration: 220,
    rotationRange: 12,
    shrinkStep: 0.08,
  }
};

const noButton = document.getElementById('no-btn');
const yesButton = document.getElementById('yes-btn');
const questionCard = document.getElementById('question-card');
const finalScreen = document.getElementById('final-screen');
const finalTitle = document.getElementById('final-title');
const finalSubtitle = document.getElementById('final-subtitle');
const finalSteps = document.getElementById('final-steps');
const continueButton = document.getElementById('continue-btn');
const finalMessage = document.getElementById('final-message');
const questionText = document.getElementById('question-text');
const attemptMessage = document.getElementById('attempt-message');
const floatingHearts = document.getElementById('floating-hearts');
const signatureLine = document.getElementById('signature-line');

let attempts = 0;
let yesClicked = false;
let lastPhases = [];

function initText() {
  questionText.textContent = config.initialQuestion;
  finalSubtitle.textContent = config.mainMessage.replace('Valentina', config.girlName);
  finalMessage.textContent = config.finalMessage;
  signatureLine.textContent = `${config.senderName} ❤️ ${config.girlName}`;
}

function setNoButtonPosition(force = false) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxX = Math.max(24, viewportWidth - noButton.offsetWidth - 24);
  const maxY = Math.max(24, viewportHeight - noButton.offsetHeight - 24);
  const safeArea = document.querySelector('.card');
  const safeRect = safeArea.getBoundingClientRect();

  let x = Math.floor(Math.random() * (maxX - 24 + 1)) + 24;
  let y = Math.floor(Math.random() * (maxY - 24 + 1)) + 24;

  if (force) {
    const yesRect = yesButton.getBoundingClientRect();
    const noRect = noButton.getBoundingClientRect();

    const avoidX = yesRect.left + yesRect.width / 2;
    const avoidY = yesRect.top + yesRect.height / 2;

    if (Math.abs(x - avoidX) < 150 && Math.abs(y - avoidY) < 120) {
      y += 120;
    }
  }

  if (y > safeRect.top - 10 && y < safeRect.bottom + 10) {
    y = Math.max(safeRect.bottom + 20, y + 80);
  }

  x = Math.min(Math.max(x, 12), maxX);
  y = Math.min(Math.max(y, 12), maxY);

  noButton.style.position = 'fixed';
  noButton.style.left = `${x}px`;
  noButton.style.top = `${y}px`;
  noButton.style.transition = `left ${config.movement.moveDuration}ms ease, top ${config.movement.moveDuration}ms ease, transform ${config.movement.moveDuration}ms ease, opacity 180ms ease, font-size 180ms ease`;
  noButton.style.transform = `translate3d(0,0,0) rotate(${(Math.random() - 0.5) * config.movement.rotationRange}deg)`;
}

function changeNoButtonText() {
  const phrase = config.noPhrases[Math.floor(Math.random() * config.noPhrases.length)];
  noButton.textContent = phrase;
}

function showAttemptsHint() {
  if (attempts >= config.tryThresholds.hint) {
    attemptMessage.textContent = 'Mi sa che questo No non vuole proprio farsi premere…';
  }
}

function reactToNoHover() {
  attempts += 1;
  showAttemptsHint();
  changeNoButtonText();
  setNoButtonPosition(true);

  const sizeScale = Math.max(config.tryThresholds.minSize, 1 - attempts * config.movement.shrinkStep * 0.05);
  noButton.style.fontSize = `${sizeScale.toFixed(2)}rem`;
  noButton.style.opacity = attempts > config.tryThresholds.vanish ? '0.15' : '1';
  noButton.style.transform = `scale(${sizeScale}) rotate(${(Math.random() - 0.5) * config.movement.rotationRange}deg)`;

  if (attempts > config.tryThresholds.vanish) {
    noButton.style.visibility = 'hidden';
    setTimeout(() => {
      if (attempts > config.tryThresholds.vanish) {
        noButton.style.visibility = 'visible';
        noButton.style.opacity = '1';
        setNoButtonPosition(true);
      }
    }, 120);
  }
}

function spawnHeart() {
  const heart = document.createElement('span');
  heart.className = 'heart';
  heart.textContent = '❤';
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.top = `${Math.random() * 100}vh`;
  heart.style.animationDuration = `${5 + Math.random() * 4}s`;
  heart.style.fontSize = `${12 + Math.random() * 14}px`;
  floatingHearts.appendChild(heart);
  setTimeout(() => heart.remove(), 9000);
}

function spawnConfetti() {
  const pieces = 20;
  for (let i = 0; i < pieces; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `${Math.random() * 10}vh`;
    piece.style.background = ['#ff5e89', '#a155ff', '#ffb1d1', '#ffd8e8'][Math.floor(Math.random() * 4)];
    piece.style.animationDuration = `${2.5 + Math.random() * 1.8}s`;
    floatingHearts.appendChild(piece);
    setTimeout(() => piece.remove(), 4800);
  }
}

function startRomanticSequence() {
  if (yesClicked) return;
  yesClicked = true;

  questionCard.classList.add('hidden');
  finalScreen.classList.remove('hidden');
  document.body.style.background = 'linear-gradient(135deg, #f7d2e4, #f9b7c4, #f2b0ff)';

  for (let i = 0; i < 34; i += 1) {
    setTimeout(spawnHeart, i * 90);
  }

  setInterval(spawnHeart, 500);
  setInterval(spawnConfetti, 1200);

  const lines = [
    'Ci hai provato…',
    'Ma ormai è troppo tardi.',
    'Ti voglio troppo bene ❤️'
  ];

  lines.forEach((line, index) => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.className = 'line';
      p.textContent = line;
      finalSteps.appendChild(p);
      requestAnimationFrame(() => p.classList.add('show'));
    }, 900 + index * 1200);
  });

  setTimeout(() => {
    continueButton.classList.remove('hidden');
  }, 4200);
}

noButton.addEventListener('pointerenter', reactToNoHover);
noButton.addEventListener('touchstart', (event) => {
  event.preventDefault();
  reactToNoHover();
}, { passive: false });
noButton.addEventListener('mousemove', () => {
  if (window.matchMedia('(pointer: fine)').matches) {
    reactToNoHover();
  }
});

noButton.addEventListener('click', (event) => {
  event.preventDefault();
  if (attempts < 1) {
    attempts += 1;
  }
  showAttemptsHint();
  setNoButtonPosition(true);
  finalTitle.textContent = 'Non so come tu abbia fatto a prenderlo…';
  finalSubtitle.textContent = 'Ma la tua risposta è stata registrata: non vuoi che smetta di volerti bene ❤️';
  startRomanticSequence();
});

yesButton.addEventListener('click', () => {
  startRomanticSequence();
});

continueButton.addEventListener('click', () => {
  finalMessage.classList.remove('hidden');
  continueButton.classList.add('hidden');
});

window.addEventListener('resize', () => setNoButtonPosition(true));
window.addEventListener('orientationchange', () => setNoButtonPosition(true));

initText();
setNoButtonPosition(true);
