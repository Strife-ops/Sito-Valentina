# Sito romantico per Valentina

Un piccolo sito romantico e giocoso dedicato a Valentina, costruito attorno alla domanda: “Valentina, ammetti che la timidona è soltanto una copertura?”. La pagina è interamente statica: non usa framework, server applicativi o dipendenze esterne.

## File

- `index.html` — struttura, contenuti e accessibilità di base.
- `style.css` — effetto vetro, palette romantica, layout responsive e animazioni.
- `script.js` — configurazione personalizzabile, movimento fluido del pulsante “No” e finali romantici.

Il pulsante “No, assolutamente!” parte affiancato a “Sì 😏” e si sposta soltanto quando ci si avvicina o si prova a premerlo. Il primo movimento conserva la posizione iniziale, poi il pulsante scappa in direzione opposta al puntatore con transizioni tra 460 e 540 ms e un cooldown di 650 ms per evitare movimenti caotici. Durante ogni fuga resta sempre visibile e non accetta il click del mouse o del touchscreen prima di essersi spostato. Dopo alcuni tentativi compaiono messaggi progressivi senza spostare il layout.

La maggior parte delle fughe è fluida; più raramente vengono aggiunti una curva, un rimbalzo, una rotazione, un’ombra dinamica o una riduzione graduale. Non viene più usata la sparizione: l’effetto principale deve rimanere leggibile e il pulsante deve restare sullo schermo. Se il pulsante viene comunque attivato da tastiera, compare “Risposta sospetta…” con la possibilità di ripresentare la domanda. Premendo “Sì 😏” parte la rivelazione romantica con cuori, coriandoli e i messaggi finali personalizzati.

## Prova locale

Apri `index.html` direttamente nel browser oppure avvia un server statico:

```bash
python3 -m http.server 8000
```

Poi visita <http://localhost:8000>.

## Personalizzazione

Le variabili principali sono all’inizio di `script.js`: nome della ragazza, mittente, testi, frasi del pulsante “No”, soglie dei tentativi e intensità delle animazioni.

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
