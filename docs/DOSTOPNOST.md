# Poročilo o dostopnosti aplikacije StudySync / StudentBuddy PWA


## 1. Dostopnost kot del načrtovanja

Dostopnost ni bila dodana šele na koncu projekta, ampak je bila vključena že pri načrtovanju uporabniškega vmesnika. Pri implementaciji so bili upoštevani:

* semantičen HTML,
* pravilna struktura naslovov,
* dostopni obrazci,
* uporaba s tipkovnico,
* jasen fokus,
* kontrastne barve,
* razumljiva sporočila o napakah,
* `aria-live` statusna sporočila,
* odzivnost,
* podpora povečavi besedila,
* osnovna podpora bralnikom zaslona.

---

## 2. Semantičen HTML

Aplikacija uporablja semantične HTML elemente, ki pomagajo brskalnikom, bralnikom zaslona in uporabnikom razumeti strukturo strani.

Uporabljeni elementi vključujejo:

```html
<header>
<nav>
<main>
<section>
<article>
<form>
<button>
```

Primeri iz aplikacije:

```html
<header class="app-header">
<nav class="main-nav" aria-label="Glavna navigacija">
<main id="main-content" class="container">
<section class="dashboard" aria-labelledby="today-title">
<form id="task-form" novalidate>
```

Uporaba semantičnih elementov omogoča, da bralniki zaslona pravilno prepoznajo glavo strani, glavno navigacijo, glavno vsebino, razdelke in obrazce.

---

## 3. Struktura naslovov

Aplikacija uporablja logično strukturo naslovov:

* `h1` za glavni naslov aplikacije,
* `h2` za glavne razdelke,
* `h3` za podrazdelke oziroma kartice.

Primer:

```html
<h1>StudySync</h1>
<h2>Stanje povezave</h2>
<h2>Obvestila</h2>
<h2>Današnji pregled</h2>
<h2>Dodaj testno nalogo</h2>
<h2>Dostopnost aplikacije</h2>
```

Takšna struktura omogoča uporabnikom bralnikov zaslona hitro premikanje po vsebini s pomočjo bližnjic za naslove.

---

## 4. Uporaba s tipkovnico

Aplikacija je zasnovana tako, da jo je mogoče uporabljati s tipkovnico brez uporabe miške.

Preverjeno je bilo, da lahko uporabnik s tipko `Tab` dostopa do:

* povezave za preskok na glavno vsebino,
* navigacije,
* gumbov za obvestila,
* obrazca za dodajanje obveznosti,
* gumbov za dodajanje, urejanje, kopiranje in brisanje obveznosti,
* seznama obveznosti.

Uporabljene tipke:

| Tipka         | Namen                                    |
| ------------- | ---------------------------------------- |
| `Tab`         | Premik naprej po interaktivnih elementih |
| `Shift + Tab` | Premik nazaj                             |
| `Enter`       | Aktivacija povezave ali gumba            |
| `Space`       | Aktivacija gumba                         |
| Puščice       | Uporaba izbirnih seznamov                |

---

## 5. Skip link

Aplikacija vključuje povezavo za preskok na glavno vsebino:

```html
<a href="#main-content" class="skip-link">Preskoči na glavno vsebino</a>
```

Ta povezava je pomembna za uporabnike tipkovnice in bralnikov zaslona, saj omogoča, da uporabnik preskoči ponavljajočo se navigacijo in hitro pride do glavne vsebine.

Pri testiranju je bilo preverjeno, da se povezava prikaže ob prvem pritisku tipke `Tab` in da po pritisku `Enter` fokus preskoči na glavno vsebino.

---

## 6. Jasen fokus

V aplikaciji je fokus jasno viden na interaktivnih elementih. To je pomembno za uporabnike, ki se po strani premikajo s tipkovnico.

Primer CSS pravila:

```css
a:focus,
input:focus,
select:focus,
button:focus {
  outline: 3px solid #facc15;
  outline-offset: 3px;
}
```

Fokus je viden na:

* povezavah,
* gumbih,
* vnosnih poljih,
* izbirnih seznamih.

---

## 7. Kontrast

Pri oblikovanju aplikacije so uporabljene kontrastne barve. Besedilo je temno na svetlem ozadju, gumbi pa imajo dovolj izrazite barve za dobro berljivost.

Primeri:

* temno besedilo na svetlem ozadju,
* bel tekst na modrem gumbu,
* bel tekst na rdečem gumbu za brisanje,
* jasno označene napake v rdeči barvi,
* status sinhronizacije z besedilom in barvno oznako.

Pomembno je, da informacije niso izražene samo z barvo. Pri prioriteti se poleg barve prikaže tudi besedilo, na primer:

```text
Nizka prioriteta
Srednja prioriteta
Visoka prioriteta
```

S tem je informacija razumljiva tudi uporabnikom, ki težje razlikujejo barve.

---

## 8. Obrazci

Obrazci so zasnovani tako, da so razumljivi in dostopni.

Vsako vnosno polje ima pripadajoč `label`:

```html
<label for="task-title">Naslov naloge</label>
<input id="task-title" name="task-title" type="text">
```

Polja imajo tudi dodatna navodila:

```html
<p id="task-title-hint" class="input-hint">
  Vpiši kratek in jasen naslov naloge.
</p>
```

Input je z navodilom in napako povezan z `aria-describedby`:

```html
<input 
  id="task-title"
  aria-describedby="task-title-hint task-title-error"
/>
```

To omogoča, da bralnik zaslona poleg imena polja prebere tudi navodilo in sporočilo o napaki.

---

## 9. Dostopna sporočila o napakah

Aplikacija uporablja dostopna sporočila o napakah pri validaciji obrazca.

Če uporabnik odda prazen obrazec, se prikaže povzetek napak:

```html
<div id="form-error-summary" class="error-summary" tabindex="-1" hidden>
  <h3>Napake v obrazcu</h3>
  <ul id="form-error-list"></ul>
</div>
```

Napake so prikazane tudi pri posameznih poljih:

```html
<p id="task-title-error" class="error-message" aria-live="polite"></p>
```

V primeru napake aplikacija nastavi:

```html
aria-invalid="true"
```

S tem uporabnik dobi jasno informacijo, katero polje je napačno izpolnjeno. Povzetek napak ima `tabindex="-1"`, zato se lahko fokus premakne nanj in ga bralnik zaslona prebere.

---

## 10. Statusna sporočila in aria-live

Aplikacija vsebuje dinamična statusna sporočila, ki se spreminjajo brez ponovnega nalaganja strani. Zato so uporabljeni ARIA atributi.

Primer za stanje povezave:

```html
<p id="connection-status" role="status" aria-live="polite">
  Preverjam povezavo ...
</p>
```

Primer za status obvestil:

```html
<p id="notification-status" role="status" aria-live="polite">
  Obvestila še niso omogočena.
</p>
```

Ta sporočila omogočajo, da bralnik zaslona uporabniku sporoči spremembe, kot so:

* uporabnik je brez povezave,
* povezava je ponovno aktivna,
* obvestila so omogočena,
* povzetek naloge je bil kopiran,
* sinhronizacija je zaključena.

---

## 11. Gumbi in razumljiva imena

Gumbi imajo jasna besedila:

```text
Dodaj nalogo
Shrani spremembe
Prekliči urejanje
Kopiraj
Uredi
Izbriši
```

Pri gumbih, ki se nanašajo na določeno obveznost, so dodani tudi `aria-label` atributi.

Primer:

```javascript
deleteButton.setAttribute("aria-label", `Izbriši nalogo ${task.title}`);
copyButton.setAttribute("aria-label", `Kopiraj povzetek naloge ${task.title}`);
editButton.setAttribute("aria-label", `Uredi nalogo ${task.title}`);
```

S tem bralnik zaslona ne prebere samo “Izbriši, gumb”, ampak bolj natančno pove, katera naloga bo izbrisana.

---

## 14. Odzivnost in povečava besedila

Aplikacija je odzivna in se prilagaja različnim velikostim zaslona. Uporabljene so relativne enote in media queries.

Primer:

```css
@media (max-width: 640px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .button-row {
    flex-direction: column;
  }
}
```

Aplikacija je bila preverjena tudi pri povečavi strani do 200 %. Pri povečavi ostanejo:

* besedilo berljivo,
* gumbi uporabni,
* obrazci dostopni,
* vsebina dosegljiva,
* elementi brez prekrivanja.

---

## 15. Podpora bralnikom zaslona

Podpora bralnikom zaslona pomeni, da aplikacija ni odvisna samo od vizualnega prikaza. Bralnik zaslona mora razumeti strukturo strani, obrazce, gumbe, napake in statusna sporočila.

Aplikacija podpira bralnike zaslona z naslednjimi rešitvami:

* semantični HTML elementi,
* logična struktura naslovov,
* `label` za vsa vnosna polja,
* `aria-describedby` za navodila in napake,
* `aria-live` za statusna sporočila,
* `aria-label` za gumbe pri posameznih obveznostih,
* skip link za preskok na glavno vsebino,
* razumljiva imena gumbov.

Testiranje je bilo izvedeno z ročnim pregledom in uporabo tipkovnice. Priporočeno je tudi testiranje z bralnikom zaslona NVDA.

---

## 16. Testiranje dostopnosti

Dostopnost je bila testirana z naslednjimi metodami:

* ročno testiranje s tipkovnico,
* preverjanje vidnega fokusa,
* preverjanje obrazcev in napak,
* preverjanje `aria-live` statusnih sporočil,
* preverjanje povečave strani do 200 %,
* Lighthouse audit,
* osnovni test z bralnikom zaslona oziroma pregled ARIA oznak.

Rezultati testiranja:

| Test                 | Pričakovani rezultat                          | Rezultat |
| -------------------- | --------------------------------------------- | -------- |
| Uporaba s tipkovnico | Do vseh elementov je mogoče priti s tipko Tab | Uspešno  |
| Skip link            | Uporabnik lahko preskoči na glavno vsebino    | Uspešno  |
| Vidni fokus          | Fokus je jasno viden                          | Uspešno  |
| Obrazci              | Vsa polja imajo `label`                       | Uspešno  |
| Napake               | Napake so razumljive in povezane s polji      | Uspešno  |
| Statusna sporočila   | Uporabljata se `role="status"` in `aria-live` | Uspešno  |
| Bralniki zaslona     | Struktura in elementi so razumljivo označeni  | Uspešno  |
| Povečava 200 %       | Vmesnik ostane uporaben                       | Uspešno  |
| Kontrast             | Besedilo in gumbi so berljivi                 | Uspešno  |


---

## 17. Znane omejitve

Trenutna različica aplikacije ima naslednje omejitve:

* aplikacija ne uporablja kompleksnih slik ali diagramov, zato nadomestna besedila za vsebinske slike trenutno niso uporabljena,
* testiranje z bralnikom zaslona je bilo osnovno in ročno,
* za popolno preverjanje skladnosti z WCAG 2.2 AA bi bilo priporočljivo dodatno testiranje z več bralniki zaslona in orodjem axe DevTools.

