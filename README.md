# Romnyi Food V1.0

Romnyi Food egy böngészőben, helyben futó receptgyűjtemény. A receptek, kedvencek, statisztikák, napi ajánlat és Csalónap funkciók internetkapcsolat nélkül is használhatók, mert az alkalmazás a böngésző helyi tárhelyét használja.

## Fő funkciók

- Receptek létrehozása, szerkesztése, törlése és kedvencnek jelölése.
- Keresés, központilag kezelt kategóriák és kategóriaszűrés.
- Recept-részletek, tápértékek, statisztikák és legutóbb hozzáadott receptek.
- Stabil, helyi naptárhoz kötött **Mai ajánlat** és véletlen receptválasztás.
- **Csalónap** szerencsekerék: napi pörgetés, havi ütemezéssel és helyi állapotmegőrzéssel.
- Biztonsági mentés exportálása, ellenőrzött visszaállítása és teljes helyi adattisztítás.
- Prémium világos/sötét téma, a mentett beállítás alapján induló tématudatos splash screen.
- Offline képfallback, valamint JPEG, PNG és WebP receptképek kliensoldali méretezése és tömörítése.
- Több böngészőfül közötti receptszinkron; szerkesztéskor védelem az újabb külső módosítások felülírása ellen.

## Technológia

- React 19
- React Router
- Vite
- Vitest és React Testing Library
- ESLint

## Helyi fejlesztés

Node.js telepítése után a projekt gyökerében futtasd:

```bash
npm install
npm run dev
```

Hasznos ellenőrző parancsok:

```bash
npm run test:run
npm run lint
npm run build
```

## Adattárolás és adatbiztonság

Az alkalmazás a böngésző `localStorage` tárhelyét használja; nincs külön szerver vagy adatbázis.

- A receptek, a téma, a napi ajánlat és a Csalónap állapota helyben marad meg.
- A receptképek optimalizálva, adat URL-ként kerülnek tárolásra. A feltöltés csak JPEG, PNG és WebP formátumot fogad el, a nagy képeket az alkalmazás méretezi és tömöríti.
- A mentés kezeli a tárhelykvóta- és írási hibákat, így sikertelen mentés nem írja felül a korábbi receptet.
- Sérült vagy nem értelmezhető receptadatnál az eredeti nyers érték helyreállítási kulcs alá kerül, az alkalmazás pedig biztonságosan folytatható üres receptlistával indul.
- A biztonsági mentés JSON formátumú. Visszaállítás előtt az alkalmazás ellenőrzi a formátumot és az adatokat, majd tranzakciósan ír: hiba esetén a korábbi helyi értékek maradnak érvényben.

## Többfüles használat és szerkesztési védelem

A recepttároló másik böngészőfülben történt változásait az alkalmazás `storage` eseménnyel figyeli. A Receptek, Kedvencek, Statisztika, Recept részletei és Mai ajánlat nézetek ennek hatására frissülnek.

A szerkesztő a megnyitáskori receptverziót rögzíti. Mentés előtt újraolvassa az aktuális receptet; ha azt másik ablak már módosította vagy törölte, a mentés nem írja felül az újabb állapotot. A saját űrlapmódosítások megmaradnak, és a felhasználó megnyithatja a legfrissebb verziót. Az új és módosított receptek `updatedAt` jelölőt kapnak; a régebbi receptek továbbra is szerkeszthetők.

## Akadálymentesség

- Magyar nyelvű dokumentumnyelv és feliratok.
- Címkézett kereső- és receptűrlapmezők, valamint akadálymentes Beállítások gomb.
- Billentyűzettel kezelhető párbeszédablakok: fókuszkezelés, fókuszcsapda, Escape bezárás és fókusz-visszaállítás.
- Képernyőolvasóbarát alkalmazásértesítések.
- A splash screen, Csalónap és értesítések tiszteletben tartják a csökkentett mozgás beállítását.

## V1.0 kiadási ellenőrzőlista

- [ ] `npm run test:run` sikeres.
- [ ] `npm run lint` sikeres.
- [ ] `npm run build` sikeres.
- [ ] Új recept létrehozása, szerkesztése, törlése és kedvencjelölése ellenőrizve.
- [ ] Biztonsági mentés exportja és visszaállítása ellenőrizve.
- [ ] Világos és sötét téma, valamint az indítóképernyő ellenőrizve.
- [ ] Két böngészőfülben a receptlista és a szerkesztési konfliktuskezelés ellenőrizve.

Az Androidos csomagolás külön feladatként történik; ez a tároló jelenleg a webes V1.0 alkalmazást dokumentálja.
