# Sito romantico per Valentina

Un piccolo sito romantico e giocoso dedicato a Valentina, costruito attorno alla domanda: “Valentina, mi vuoi veramente bene?”. La pagina è interamente statica: non usa framework, server applicativi o dipendenze esterne.

## File

- `index.html` — struttura, contenuti e accessibilità di base.
- `style.css` — effetto vetro, palette romantica, layout responsive e animazioni.
- `script.js` — configurazione personalizzabile, movimento fluido del pulsante “Sì” e finali romantici.

Il pulsante “Sì, davvero ❤️” parte affiancato a “No” e si sposta soltanto quando ci si avvicina o si prova a premerlo. Il primo movimento conserva esattamente la posizione iniziale, poi il pulsante scappa in direzione opposta al puntatore con transizioni fluide e un breve cooldown. Resta sempre visibile, dentro lo schermo e lontano dal pulsante “No”. Dopo alcuni tentativi compaiono messaggi progressivi senza spostare il layout.

Dal dodicesimo tentativo la fuga si accorcia e rallenta gradualmente; dopo il quindicesimo il pulsante diventa finalmente catturabile. Premendo “Sì” parte la rivelazione romantica con cuori, coriandoli e messaggi progressivi. “No” rimane sempre fermo e apre una finta schermata offesa, dalla quale si può ripristinare completamente il gioco.

## Prova locale

Apri `index.html` direttamente nel browser oppure avvia un server statico:

```bash
python3 -m http.server 8000
```

Poi visita <http://localhost:8000>.

## Personalizzazione

Le variabili principali sono nell’oggetto `CONFIG` all’inizio di `script.js`: testi, frasi del pulsante “Sì”, soglie dei tentativi, distanze, tempi e messaggi dei due finali.

## Pubblicazione con GitHub Pages

La repository prevista è `Sito-Valentina` (oppure `sito-valentina` se il nome viene normalizzato da GitHub). Dopo aver effettuato l’accesso a GitHub CLI:

```bash
gh auth login -h github.com
gh repo create Sito-Valentina --public --source=. --remote=origin --push
gh api -X POST repos/UTENTE/Sito-Valentina/pages -f 'source[branch]=main' -f 'source[path]=/'
```

In alternativa, in GitHub: `Settings` → `Pages` → `Deploy from a branch` → `main` → `/ (root)`.

Il link sarà:

```text
https://UTENTE.github.io/Sito-Valentina/
```

Sostituisci `UTENTE` con il tuo nome GitHub. Non sono presenti suoni né richieste a servizi esterni.
