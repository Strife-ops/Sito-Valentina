# Sito romantico per Valentina

Un piccolo sito romantico e giocoso dedicato a Valentina: l’appuntamento di domani sera è confermato. La pagina è interamente statica: non usa framework, server applicativi o dipendenze esterne.

## File

- `index.html` — struttura, contenuti e accessibilità di base.
- `style.css` — effetto vetro, palette romantica, layout responsive e animazioni.
- `script.js` — configurazione personalizzabile, movimento fluido del pulsante “No” e finali romantici.

Il pulsante “No ❤️” parte affiancato a “Sì” e si sposta soltanto quando ci si avvicina o si prova a premerlo. Il primo movimento conserva la posizione iniziale, poi il pulsante scappa con una transizione di circa 340 ms e un cooldown per evitare movimenti caotici. Se viene comunque premuto, mostra “Perfetto ❤️”; anche “Sì” porta a un finale positivo e divertente.

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
