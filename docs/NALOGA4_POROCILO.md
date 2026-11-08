# 4. naloga - Avtomatizacija funkcionalnega testiranja

Projekt: StudySync PWA (StudentBuddy)

Datum lokalne izvedbe: 4. 11. 2026

Izhodišče: pet testnih primerov TC-01 do TC-05 iz priloženega dokumenta Naloga2.pdf.

## Izbira orodja

Aplikacija uporablja HTML, CSS in JavaScript ter backend Node.js/Express. Izbrano orodje je Playwright Test za JavaScript, ker omogoča izvedbo celotnih uporabniških postopkov v resničnem brskalniku, preverjanje API-odgovorov in pregled IndexedDB. Podpira Service Worker, ki je potreben za predpogoj TC-05. Obstoječi testi k6 preverjajo API in obremenitev; novi testi preverjajo funkcionalnosti uporabniškega vmesnika.

Playwright samodejno počaka, da so elementi pripravljeni za interakcijo, njegove asinhrone trditve pa čakajo na pričakovano stanje. To zmanjša odvisnost od hitrosti računalnika. Rezultati se izpišejo v terminal ter shranijo kot HTML, JUnit XML in JSON. Ob neuspehu se ohranijo posnetek zaslona, video, sled izvajanja in izpis lokalnih ter strežniških podatkov pred čiščenjem.

Utemeljitev temelji na uradni dokumentaciji: [samodejno čakanje](https://playwright.dev/docs/actionability), [trditve](https://playwright.dev/docs/test-assertions), [poročila](https://playwright.dev/docs/test-reporters), [cevovodi](https://playwright.dev/docs/ci).

## Namestitev in ponovitev

Zahtevan je Node.js 20 ali novejši; cevovod uporablja Node.js 22. V korenski mapi projekta:

```bash
npm ci
npm ci --prefix backend
npx playwright install chromium
npm run test:e2e
```

Na Linuxu se brskalnik s sistemskimi odvisnostmi namesti z `npx playwright install --with-deps chromium`.

Pred izvedbo morata biti vrata 3000 in 5173 prosta. Testni sistem sam zažene frontend in za vsak test nov backend. Če na vratih že teče druga aplikacija, je treba svoj razvojni strežnik najprej ustaviti. Skripte ne ustavljajo tujega procesa.

Za ogled poročila uporabi `npm run test:e2e:report`. Za interaktivno pregledovanje korakov uporabi `npm run test:e2e:ui`.

## Izolacija in robustnost

Vsak test dobi nov brskalniški kontekst, svojo IndexedDB in svojo začasno strežniško shrambo. Izvorni `backend/server.js` se za izvedbo kopira v začasno mapo; aplikacijska koda ostane enaka. Backend se poveže z že nameščenimi odvisnostmi projekta. Začasni seznam naročnin je prazen, zato testi ne pošiljajo potisnih obvestil dejanskim naročnikom. Obstoječa `backend/data/tasks.json` se ne uporablja in ne spreminja.

Testi tečejo z enim izvajalcem, ker aplikacija uporablja fiksna naslova localhost:3000 in localhost:5173. Kljub zaporedni izvedbi se noben test ne zanaša na rezultat prejšnjega. Predpogoji se ustvarijo v istem testu. Ob zaključku se testni zapis odstrani prek UI in preveri odsotnost na strežniku; pri neuspehu se najprej zajame diagnostično stanje, nato odstrani celotno začasno okolje.

Izbira elementov temelji predvsem na oznakah obrazca in vlogah ter dostopnih imenih gumbov. Izbrana vrstica mora vsebovati točen naslov naloge. Za posamezne vrednosti se uporabljajo obstoječi razredi oziroma ID-ji, brez izbire po položaju elementa. Ni fiksnih pavz; uporabljene so trditve `expect`, `expect.poll`, čakanje na registracijo Service Workerja, pripravljenost API in konec procesa.

## Pregled skladnosti s testnimi primeri

| Primer | Predpogoji in testni podatki | Preverjeni koraki in rezultati |
|---|---|---|
| TC-01 / F-01 | Prazen testni seznam; ZTIS_TC01_Kolokvij, Zanesljivost in testiranje IS, 12. 11. 2026, Visoka. | Vnos in preverjanje vseh polj; shranitev brez validacijskih napak; natanko ena vrstica z naslovom, predmetom, rokom in prioriteto; ohranitev po osvežitvi; natanko en ustrezen strežniški zapis; odstranitev prek UI in preverjanje API. |
| TC-02 / F-02 | Način dodajanja; prazen naslov, Zanesljivost in testiranje IS, 12. 11. 2026, Srednja. | Pravilne vrednosti ostalih polj; oddaja; konkretna napaka za naslov in aria-invalid; fokus na povzetku napak; dostop do naslova s tipkama Tab in Enter; brez nove vrstice in brez zapisa v IndexedDB; nespremenjen API; ponastavitev obrazca. |
| TC-03 / F-03 | V samem testu ustvarjena in sinhronizirana ZTIS_TC03_Porocilo, Baze podatkov, 15. 11. 2026, Nizka. | Natanko ena vrstica; Uredi in preverjanje predizpolnitve; sprememba v ZTIS_TC03_Porocilo_popravljeno, 20. 11. 2026, Visoka; shranitev in izhod iz urejanja; ohranitev po osvežitvi; odsotnost starega naslova; isti serverId in en sam posodobljen strežniški zapis; čiščenje. |
| TC-04 / F-04 | Ustvarjena in sinhronizirana ZTIS_TC04_ZacasnaNaloga, Zanesljivost in testiranje IS, 18. 11. 2026, Nizka; dodatna kontrolna obveznost. | Brisanje točno izbrane vrstice; podpora potrditvenemu dialogu, če se pojavi; odsotnost v UI in API; kontrolni zapis ostane enak pred osvežitvijo in po njej; odstranjeni zapis se ne vrne. |
| TC-05 / F-05, F-06 | Delujoča strežnika, registriran Service Worker in prazni testni shrambi; ZTIS_TC05_OfflineRok, Zanesljivost in testiranje IS, 25. 11. 2026, Visoka. | Dejanska ustavitev samo testnega backenda; neuspeh API-zahteve in dostopen frontend; dodajanje prek UI; lokalni zapis s synced=false; čakajoče stanje; ohranitev po osvežitvi; ponovni zagon backenda in dogodek online; sinhronizirano stanje; natanko en zapis v API in UI po novi osvežitvi; čiščenje. |

TC-05 simulira nedosegljivost backenda, kot zahteva izhodiščni primer, in ne izklopi celotnega omrežja brskalnika. Ponovno sinhronizacijo sproži dogodek `online`, na katerega je aplikacija vezana. Test ne dokazuje samodejne zaznave vrnitve strežnika brez dogodka ali pravilnosti vseh možnosti Background Sync.

## Agent UI in pregled skript

Skripte je pripravil agent umetne inteligence Codex na podlagi priloženih primerov in izvorne kode. Pri tehničnem pregledu so bili primerjani predpogoji, točni testni podatki, koraki, pričakovani rezultati in čiščenje. Zgornja tabela povezuje zahteve s preverjanji v skriptah. Datoteki sta `tests/e2e/studysync.spec.js` in `tests/e2e/fixtures.js`, konfiguracija pa `playwright.config.js`.

Osebni pregled študentke pred oddajo še ni potrjen. Priporočeno je, da študentka pri vsakem testu v interaktivnem načinu pregleda korake in trditve ter primerja tabelo z morebitnimi popravki iz 3. naloge. Ločenega dokumenta s pregledom iz 3. naloge ni bilo med posredovanimi gradivi.

## Vključitev v cevovod

Workflow `.github/workflows/functional-tests.yml` se sproži ob push, pull request in ročno prek workflow_dispatch. Namesti Node.js, izvede `npm ci` za teste in backend, namesti Chromium s sistemskimi odvisnostmi ter zažene vseh pet testov. Neuspešen test vrne neničelno izhodno kodo in povzroči neuspeh opravila. Samodejne ponovitve so izključene, da napake ne bi bile prikrite.

HTML, XML, JSON in diagnostične datoteke se tudi ob neuspehu testov naložijo kot artefakt `funkcionalni-testi-porocila`, z rokom hrambe 14 dni. JUnit datoteka je pripravljena za nadaljnjo integracijo; ločen prikaz rezultatov JUnit v GitHub ni konfiguriran.

Workflow je dodan lokalno. Oddaljena izvedba GitHub Actions bo preverjena po objavi sprememb v repozitorij; lokalna izvedba sama ne dokazuje uspeha oddaljenega cevovoda.

## Rezultati izvedbe

Lokalna izvedba: macOS ARM64, Node.js 22.22.3, Playwright Test 1.64.1, Chromium 156.0.8078.4. Ukaz: `npm run test:e2e`. Vseh pet testov je uspešno zaključenih, brez samodejnih ponovitev. Skupno trajanje, kot ga izpiše Playwright: 6,4 s.

| Primer | Dejanski rezultat | Status | Trajanje testa |
|---|---|---|---|
| TC-01 | Vrednosti so pravilno prikazane, zapis obstane po osvežitvi in je na strežniku samo enkrat; čiščenje uspe. | Uspešno | 1,6 s |
| TC-02 | Prikazana je napaka za prazen naslov, fokus in tipkovnični dostop delujeta, zapis ne nastane v UI, IndexedDB ali API. | Uspešno | 0,5 s |
| TC-03 | Predizpolnitev ustreza začetnim podatkom; spremenjene vrednosti obstanejo po osvežitvi; serverId ostane enak, podvojitve ni. | Uspešno | 1,9 s |
| TC-04 | Izbrani zapis izgine iz UI in API ter se po osvežitvi ne vrne; kontrolni zapis ostane nespremenjen. | Uspešno | 0,8 s |
| TC-05 | Zapis se lokalno ohrani ob ustavljenem backendu in po osvežitvi; po zagonu backenda in dogodku online se sinhronizira natanko enkrat. | Uspešno | 0,7 s |

Med pripravo je prvi zagon odkril napako v testnih selektorjih: natančno ujemanje oznak ni upoštevalo zvezdice za obvezno polje. Selektorji so bili popravljeni tako, da dopuščajo to oznako. Prvotni zagon je bil prekinjen; zgornji rezultati pripadajo naslednjemu, v celoti uspešnemu zagonu. Aplikacijska koda ni bila spremenjena.

Merodajna dokaza lokalne izvedbe sta `test-results/results.json` in `test-results/junit.xml`; HTML pregled je v `playwright-report/index.html`. Te datoteke se ustvarijo pri vsakem zagonu in niso vključene v Git. V GitHub Actions jih ohrani naloženi artefakt. Pred oddajo shrani HTML poročilo oziroma artefakt skupaj s tem poročilom.

## Omejitve

Obseg zajema pet primerov in šest funkcionalnosti iz matrike izhodiščnega PDF-ja. Preverjanje se izvaja samo v Chromiumu, ne v Firefoxu, Safariju ali na fizičnih mobilnih napravah. Ne vključuje celovitega preverjanja dostopnosti, obremenitve ali dostave potisnih obvestil. Uspešen rezultat dokazuje izpolnitev preverjenih scenarijev v navedenem okolju, ne odsotnosti vseh napak aplikacije.
