# Subsidie-routeplanner energierenovatie (Frankrijk) – 2026

Deze repository bevat een **statische, onafhankelijke tool** die woningeigenaren helpt bepalen:

- welke **Franse subsidie- en fiscale regelingen** mogelijk van toepassing zijn;
- welke **combinaties** meestal wel/niet werken;
- en vooral: **naar welk loket** men moet, in de **juiste volgorde**.

De tool is bedoeld als **pre-check** en routing-instrument.  
Geen garantie op toekenning, geen bedragen, geen vervanging van officiële instanties.

---

## 🎯 Doel van de tool

Veel fouten bij energierenovatie ontstaan door:
- te vroeg tekenen of starten;
- verkeerde combinatie van regelingen;
- of contact met het verkeerde loket.

Deze tool voorkomt dat door:
- harde **timing-regels** zichtbaar te maken;
- combinaties expliciet te benoemen;
- gebruikers **altijd** door te sturen naar het juiste officiële loket (France Rénov’).

---

## ⚙️ Wat de tool doet (en niet)

### Doet wél
- Indicatieve **stoplicht-logica** per regeling (kansrijk / check nodig / risico).
- Postcode → gemeente / département / regio (via officiële API).
- Praktische waarschuwingen bij:
  - MaPrimeRénov’
  - CEE (prime énergie)
  - Éco-PTZ
  - TVA à 5,5%
  - Lokale regelingen
- Extra aandacht voor **combinaties** en **rénovation d’ampleur**.

### Doet niet
- ❌ Geen exacte subsidiebedragen.
- ❌ Geen automatische aanvragen.
- ❌ Geen juridische of fiscale garantie.
- ❌ Geen “postcode-subsidielijst” (die veroudert te snel).

---

## 🧱 Techniek

- 100% **static** (geen backend).
- Bestaat uit:
  - `index.html`
  - `styles.css`
  - `script.js`
- Gebruikt alleen:
  - `geo.api.gouv.fr` (officiële Franse overheid) voor postcode → commune.
- Geen frameworks, geen build-stap.

---

## 🚀 Gebruik

### Lokaal testen
Open `index.html` in de browser.

### Online publiceren
Je kunt dit project hosten via:
- GitHub Pages
- eigen webhosting (bijv. `/tools/subsidie/`)
- Vercel (optioneel, niet vereist)

### Embedden in WordPress / Divi
Gebruik een `<iframe>` vanaf de gehoste URL.  
Scripts draaien dan **buiten** WordPress en worden niet geblokkeerd.

---

## ⚠️ Belangrijke disclaimer

Deze tool is een **oriëntatie- en routehulp**.

Regelingen, voorwaarden en lokale programma’s wijzigen regelmatig.  
De uitkomst moet **altijd** worden bevestigd via een officiële instantie, met name:

👉 https://france-renov.gouv.fr/preparer-projet/trouver-conseiller

---

## 🗓️ Actualiteit

- Inhoudelijke uitgangspunten afgestemd op regelgeving **2026**.
- Laatste inhoudelijke check: **januari 2026**.

---

## 👤 Auteur / initiatief

Anton Noë  
Initiatiefnemer Infofrankrijk.com  

De tool is ontwikkeld als onderdeel van een breder informatie-ecosysteem
voor Nederlandstaligen die wonen of investeren in Frankrijk.

---

## 📄 Licentie

Vrij te gebruiken voor **informatieve doeleinden**.  
Herpublicatie met bronvermelding toegestaan.  
Geen aansprakelijkheid voor beslissingen op basis van deze tool.
