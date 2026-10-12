# Design package: Old River Hotel & Ristorante

Tier 2, viaggio concatenato in 3 capitoli, ~15 secondi di scrub. Stack: Next.js (App Router) + React + TypeScript + Tailwind + Framer Motion + lucide-react, tutto in `app/page.tsx`. Hosting: Vercel. Media: Magnific (immagini e video).

---

## 0. Cosa ho trovato sul campo (fonti, non inventato)

Il sito attuale ristorantehoteloldriver.com è in manutenzione ("Stiamo effettuando dei lavori sul sito"): nessun contenuto da leggere. I soli dati verificabili vengono dalla scheda turistica ufficiale di Reggio Emilia Welcome (reggioemiliawelcome.it, pagina "Hotel Old River").

| Dato | Valore | Stato |
|---|---|---|
| Categoria | 3 stelle | confermato dalla scheda |
| Indirizzo | Viale Po 2, 42016 Guastalla (RE) | confermato (un'altra fonte scrive "2/4") |
| Telefono | 0522 838401 | confermato; compare anche 340 3565932 |
| Camere | bagno con doccia, TV satellitare, aria condizionata, minibar, telefono, asciugacapelli | confermato |
| Servizi | ristorante, bar, sala congressi, ascensore, Wi-Fi, cassaforte, parcheggio custodito, garage privato, animali di piccola taglia, pagamento con carta | confermato |
| Apertura | tutto l'anno, reception 24 ore, chiuso il 25 dicembre | confermato dalla scheda, da ricontrollare |
| Caselli | A22 a 16 km, A1 a 25 km | dalla scheda, da ricontrollare |

**Non trovato, quindi NON scritto in pagina finché non lo fornisci:**
numero e tipologie di camere, prezzi, orari del ristorante, menu, email, P.IVA e ragione sociale, social, recensioni, premi, booking engine, foto reali di camere e sala.

---

## 1. Premessa di brand

Una sola parola: **rallentare**. Il Po rallenta in pianura, e Old River è il posto dove ci si ferma. Tutta la pagina insegna questa idea: il viaggio dall'alto perde velocità fino alla facciata, i titoli sono corti e lasciano spazio, ogni sezione ha una sola cosa da dire. Il momento interattivo (giorno/sera) è la stessa idea: la stessa casa, due ritmi.

Se una sezione non serve a "fermarsi qui", non entra.

---

## 2. Palette (token, `tailwind.config`)

Solo i tre colori del brand più quattro tinte derivate per le superfici (inferenza mia, da dichiarare).

```css
--ink:#0B0A0A;      /* fondo scuro principale */
--ink-2:#161414;    /* card su scuro */
--stone:#D3CECE;    /* accento brand: linee, label su scuro, numeri */
--mist:#F4F2F2;     /* fondo chiaro */
--black:#000000;    /* testo, logo, CTA */
--white:#FFFFFF;    /* testo su scuro, CTA piena */
--ink-soft:#4A4646; /* testo secondario su mist */
```

**Correzione al brief, contrasto:** `stone` su `mist` fa circa 1,4:1, quindi fallisce WCAG. Su fondo chiaro `stone` si usa SOLO per linee e ornamenti; le label su `mist` usano `ink-soft` (circa 8:1). Su `ink` lo `stone` regge (circa 12:1).

---

## 3. Tipografia

Josefin Sans, unico font, come da scheda brand. Pesi in uso: 300 (titoli grandi), 400 (corpo), 600 (label e bottoni), 700 (enfasi rara). Caricato con `next/font/google`, `display: swap`.
Niente mono: le label piccole usano SemiBold maiuscolo con `tracking-[0.5em]`, come la scritta H O T E L del logo.

---

## 4. Il viaggio (storyboard, 3 capitoli, 16:9)

Un solo piano sequenza, catena di 3 clip da 5 secondi. L'ultimo frame di ogni clip è il primo della successiva. Nessuna persona in primo piano. "No text, no logos, no lettering" in ogni prompt.

| Cap. | Mondo | Movimento camera | Frame finale (diventa start del successivo) |
|---|---|---|---|
| 1 | Guastalla dall'alto: la piazza con la statua di Ferrante Gonzaga, portici, tetti in coppo, luce dorata di fine pomeriggio | volo a uccello, avanza e si alza verso nord | tetti che finiscono, il verde dell'argine all'orizzonte, il fiume appare in alto |
| 2 | Il Po: acqua larga e calma, golene verdi, pioppeti, foschia leggera, riflessi | scivola in avanti sopra la corrente, lento, quasi orizzontale | il fiume si apre, sulla riva sinistra compare un edificio in mattoni lontano |
| 3 | L'hotel: la facciata in mattoni, pensilina in legno, ulivo, cipressi, insegna HOTEL sul tetto | la camera scende e si avvicina, rallenta, si ferma | **la foto reale** `hotel-esterno.jpg` |

**Metodo per il capitolo 3 (dichiarato):** Kling 2.5 su Magnific accetta start frame + end frame a 1080p. Uso come end frame la foto reale dell'hotel (upscalata), così l'ultimo frame del sito è la facciata vera, senza dover invertire il clip. Se il raccordo non regge, piano B: genero dalla foto un allontanamento e lo inverto con ffmpeg.

**Rischi dichiarati:**
1. La foto reale è 550×384 px. Per un frame 1080p va upscalata (Magnific). Resa migliore se mi mandi l'originale in alta risoluzione.
2. Piazza Mazzini non è nei miei riferimenti visivi: il modello può inventare una piazza "tipo". Prima di generare cerco una foto reale della piazza da usare come riferimento di composizione. Se non è fedele, il capitolo 1 si rilegge come "Guastalla" generica dall'alto, senza promettere il monumento in caption.

**Prompt capitolo 1 (start frame, immagine 16:9, 2k):**
> Aerial bird's-eye view of a small Emilian Renaissance town square with a single bronze standing statue on a tall pedestal at its center, arcaded porticoes, terracotta tiled roofs, a cathedral facade on one side, warm late afternoon golden light, long soft shadows, subtle haze toward a green river plain on the horizon. Desaturated elegant grade, deep neutral blacks, warm greys. Edge-to-edge scene, calm sky at the top third. Cinematic, photorealistic, 16:9. No text, no logos, no lettering anywhere.

**Prompt video (generico, adattato per capitolo):**
> One continuous shot, no cuts. The camera glides forward and slowly rises over [WORLD], moving steadily north at constant speed. The scene stays alive: soft haze drifting, light shifting across rooftops, a few birds far away, gentle water shimmer where visible. The shot ends at rest on [FRAME FINALE]. No text or lettering anywhere.

---

## 5. Band map (scroll hero ~1000vh, range 900vh)

Valori di partenza, da validare col flick test.

| Band | Range | Cosa fa il video | Copy (esatto) | Entrata |
|---|---|---|---|---|
| 1 | 0.00 a 0.26 | volo sopra Guastalla | "Guastalla, terra di Gonzaga." | drift-down (scende come la camera) |
| 2 | 0.36 a 0.60 | sopra il Po | "Dove il Po rallenta." | blur-to-sharp (nebbia che si dirada) |
| 3 | 0.70 a 0.86 | discesa verso la facciata | "Old River. Il tuo posto sul fiume." | approach-from-depth |
| Settle | 0.90 a 1.00 | facciata ferma | vedi sotto | parole in salita, poi sottotitolo, poi CTA |

**Settle (e hero statico su mobile / reduced motion):**
- Label: `OLD RIVER HOTEL · RISTORANTE` (tracking largo)
- Titolo: **"Una sosta sul Po, a Guastalla."**
- Sottotitolo: "Camere, ristorante e sale per chi viaggia per lavoro e per chi cerca un posto dove fermarsi."
- Barra prenotazione: Arrivo, Partenza, Ospiti, bottone "Verifica disponibilità"
- Micro-copy: "Prenota direttamente con noi: rispondiamo noi, non un call center."
- CTA: "Verifica disponibilità" (pieno) · "Soggiorni per aziende" (outline)

**Hero statico:** frame finale (facciata) con lo stesso blocco di copy, composto, non una toppa.

---

## 6. Sotto la piega (tutto porta a UNA azione: la richiesta nel modulo)

Ritmo: ink, mist, ink, mist, ink. Nessuna coppia di sezioni vicine con lo stesso scheletro.

1. **Camere** (mist). Carousel con drag e frecce. Titolo: "Camere per dormire davvero." Dotazioni verificate: bagno con doccia, aria condizionata, TV satellitare, minibar. CTA per camera: "Richiedi questa camera" (precompila il modulo). *Le tipologie vanno confermate: finché non le ho, il carousel usa una voce "Camera" con le sole dotazioni confermate e immagini rappresentative generate, dichiarate.*
2. **Tipologie di camera** (ink, tutta larghezza, editoriale). Sostituisce la sezione ristorante su richiesta del cliente (2026-10-12). Selettore Doppia / Tripla / Quadrupla che cambia immagine e testo, dotazioni comuni confermate, CTA che precompila il modulo con il numero di ospiti. Immagini rappresentative.
3. **Momento interattivo: selettore di tipologia** (dentro questa sezione).
4. **Servizi** (mist, bento asimmetrico). Solo i confermati: parcheggio custodito, garage privato, Wi-Fi, ascensore, cassaforte, sala congressi, bar, animali di piccola taglia, pagamento con carta, reception sempre aperta.
5. **Aziende** (ink, PAS leggero). Problema: "La trasferta funziona quando non devi pensarci." Soluzione: tre promesse concrete (nessun numero inventato): una camera pronta, una sala per riunirsi, una cena a fine giornata. Posizione: caselli A22 e A1 (km da ricontrollare). CTA: "Chiedi una proposta per la tua azienda".
6. **Modulo** (mist). Toggle Privato / Azienda. Campi privato: nome, email, telefono, arrivo, partenza, ospiti, messaggio. Azienda: in più ragione sociale, numero persone, tipo di esigenza (trasferta, convenzione, evento). Consenso privacy obbligatorio. Invio: `NEXT_PUBLIC_FORM_ENDPOINT`, altrimenti `mailto:` verso l'email reale. Il messaggio di successo dice dove va la richiesta. Accanto: indirizzo, telefono, link a Google Maps.
7. **Footer** (ink, minimale). Logo grande, indirizzo, telefono, P.IVA (da fornire), privacy e cookie, social reali (da fornire). Linea sottile del brand sopra.

**Header:** logo a sinistra, menu (Camere, Ristorante, Aziende, Dove siamo, Contatti), telefono e "Prenota" a destra. Trasparente sull'hero, vetro compatto allo scroll. Mobile: pannello a tutto schermo.

**Booking:** non ho trovato un booking engine. La barra quindi precompila il modulo e scrolla lì. Se esiste un motore, la barra passa a costruire l'URL con le date.

---

## 7. Livello vettoriale

- **Linea del Po:** SVG sinuoso disegnato a mano, si traccia con lo scroll sotto l'hero e collega le sezioni.
- **Separatori:** la linea sottile del logo, si disegna all'ingresso di ogni sezione.
- **Tre stelle:** micro-ornamento, una volta per sezione al massimo.
- **Una polvere di luce** nell'hero, a livello sussurro. Tutto fermo a stato finale con reduced motion.

## 8. Standard di ingegneria

Fetch del video come Blob in streaming con anello di caricamento, lerp dt-normalizzato, seek con gate, scritture DOM solo su cambio, caption con plateau lungo, scrim a quattro strati con audit sul frame peggiore (contrasto ≥ 3,5:1 sul video, ≥ 4,5:1 sul testo di pagina), cinque gate per l'hero statico tenuti vivi con change listener, pagina completa senza video, reduced motion nei due sensi. Tutto in hook React dentro `app/page.tsx`.

## 9. Gate copy

Ogni riga sopra va in pagina com'è. Prima di mostrare il sito: zero trattini lunghi, zero parole da brochure (eccellenza, a 360 gradi, soluzioni su misura, esperienza unica, immerso nel verde, più le inglesi della lista), e sweep dei tic da AI.

---

## 10. Costi (verificati con preflight, esatti)

Saldo Magnific: **16.459 crediti**.

| Voce | Crediti |
|---|---|
| Start frame cap. 1 (immagine 2k, stima) | ~100 |
| Upscale foto reale dell'hotel | 90 a 180 |
| Clip 1, 2, 3 con **Kling 2.5, 1080p, 5 s** (325 ciascuna) | 975 |
| 4 a 6 immagini di supporto (stima) | 400 a 600 |
| **Totale stimato** | **circa 1.600 a 1.850** |
| Riserva per 1 re-roll per capitolo | +975 |

Alternative per i video, stesso shot da 6 secondi:

| Modello | Per clip | Per 3 clip |
|---|---|---|
| Kling 2.5, 1080p (5 s) | 325 | 975 |
| Seedance 2.0 Fast, 720p | 1.410 | 4.230 |
| Seedance 2.5, 720p | 2.640 | 7.920 |
| Seedance 2.0 Pro, 1080p | 4.200 | 12.600 |
| Seedance 2.5, 1080p | 4.740 | 14.220 |

Raccomando **Kling 2.5 a 1080p**: è l'unico che entra con ampio margine nel saldo, supporta start+end frame a 1080p (serve per atterrare sulla foto vera) e lascia crediti per i re-roll. Seedance 2.5 resta il piano B solo se un capitolo fallisce tre volte.

---

## 11. Dove devio dai default (e perché)

1. **Magnific al posto di Higgsfield**, per tua preferenza già registrata. Kling usato come modello dentro Magnific, non il connettore Kling.
2. **Un solo font** (Josefin Sans) invece del trio display/corpo/mono, perché la scheda brand lo impone.
3. **Stone su mist solo per linee**, per il contrasto.
4. **React + Tailwind in un file, Vercel**, come da vincoli del cliente, invece di HTML vanilla e Hostinger.
5. **5 sezioni** invece delle 10 del motore homepage-redesign, come da brief.
