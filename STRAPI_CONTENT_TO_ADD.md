# STRAPI CONTENT MIGRATION GUIDE

Complete documentation of all content types with website data ready to be added to Strapi.
Copy and paste entries into Strapi admin panel for each content type.

---

## 1. LOCATIONS (lokacije)

### Location 1: Ugrinovačka

```
Name: Ugrinovačka
Slug: ugrinovacka
Address: Ugrinovačka 456, 11070 Beograd
Phone: +381 11 2101 111
Email: ugrinova@prvi-balkan.rs
Latitude: 44.8176 (approximately)
Longitude: 20.4747 (approximately)
Opening Hours:
  {
    "weekdays": "08:00 - 18:00",
    "saturday": "09:00 - 15:00",
    "sunday": "Zatvoreno"
  }
Description:
  Naša lokacija na Ugrinovoj Čuki je centralno pozicionirana i lako dostupna. Sa parking mjestima i modernom opremom, osiguravamo ugodno iskustvo dok čekate pregled vašeg vozila.
Image: https://images.unsplash.com/photo-1487754180143-c282803d6773?w=800&h=500&fit=crop
```

### Location 2: Voždovac

```
Name: Voždovac
Slug: vozdovac
Address: Voždovska 789, 11050 Beograd
Phone: +381 11 2101 111
Email: vozdovac@prvi-balkan.rs
Latitude: 44.7866 (approximately)
Longitude: 20.5500 (approximately)
Opening Hours:
  {
    "weekdays": "08:00 - 18:00",
    "saturday": "09:00 - 15:00",
    "sunday": "Zatvoreno"
  }
Description:
  Naša lokacija u Voždovcu je novija lokacija sa najnovijom opremom za tehnički pregled. Nalaze se blizu glavnih putanja što je čini veoma pristupačnom za sve stanovnike ovog dela Beograda.
Image: https://images.unsplash.com/photo-1687845542172-977c123c65f6?q=80&w=1170&auto=format&fit=crop
```

### Location 3: Zemun

```
Name: Zemun
Slug: zemun
Address: Ulica Glavna 123, 11080 Zemun
Phone: +381 11 2101 111
Email: zemun@prvi-balkan.rs
Latitude: 44.8627 (approximately)
Longitude: 20.4025 (approximately)
Opening Hours:
  {
    "weekdays": "08:00 - 18:00",
    "saturday": "09:00 - 15:00",
    "sunday": "Zatvoreno"
  }
Description:
  Naša lokacija u Zemunu je idealno pozicionirana za klijente koji dolaze iz tog dela Beograda. Imamo modernu opremu i iskusne tehničare koji će obaviti pregled vašeg vozila sa pažnjom i profesionalizmom.
Image: https://images.unsplash.com/photo-1762912297981-ee1a51f4f187?q=80&w=737&auto=format&fit=crop
```

---

## 2. SERVICES (usluge)

### Service 1: Tehnički Pregled

```
Title: Tehnički Pregled
Slug: tehnicki-pregled
Icon: miscellaneous_services
Price: 2500 (or as applicable)
Description:
  Kompletan tehnički pregled vozila prema zvaničnim standardima. Naši tehničari će detaljno pregledati sve delove vašeg vozila i dati vam detaljni izveštaj.
Features:
  {
    "features": [
      "Pregled motora i delova",
      "Proverava kočnih sistema",
      "Kontrola osvetljenja",
      "Merenje emisije",
      "Digitalni izveštaj"
    ]
  }
Image: (optional service image)
```

### Service 2: Registracija Vozila

```
Title: Registracija Vozila
Slug: registracija-vozila
Icon: description
Price: (as applicable)
Description:
  Pomoć pri registraciji vozila i pripremi svih potrebnih dokumenata za nadležne organe.
Features:
  {
    "features": [
      "Priprema dokumenata",
      "Koordinacija sa MUP-om",
      "Pomoć pri registraciji",
      "Konsultacije"
    ]
  }
Image: (optional service image)
```

### Service 3: Osiguranje

```
Title: Osiguranje
Slug: osiguranje
Icon: security
Price: (as applicable)
Description:
  Konsultacije i pomoć pri sklapanju osiguranja vozila sa našim partnerima.
Features:
  {
    "features": [
      "Konsultacije o osiguranju",
      "Veza sa osiguravačima",
      "Pomoć pri ugovaranju"
    ]
  }
Image: (optional service image)
```

### Service 4: Online Poruke

```
Title: Online Poruke
Slug: online-poruke
Icon: smartphone
Price: (as applicable - free service)
Description:
  Brz odgovor na sve tvoje pitanje preko različitih kanala komunikacije.
Features:
  {
    "features": [
      "Brz odgovor",
      "Više kanala komunikacije",
      "Dostupna podrška"
    ]
  }
Image: (optional service image)
```

---

## 3. TESTIMONIALS (iskustva/svedočanstva)

### Testimonial 1: Marko Jovanović

```
Author: Marko Jovanović
Role: Privatni vozač
Rating: 5
Content:
  Izuzetno brz i profesionalan servis. Sve je bilo gotovo u manje od sat vremena. Preporučujem svima!
Image: (profile image - optional)
```

### Testimonial 2: Nikola Kostić

```
Author: Nikola Kostić
Role: Vlasnik kompanije
Rating: 5
Content:
  Pouzdane ljude kojima se mogu poveriti sa mojim vozilima. Transparentne cene bez pretnje. Odličan izbor!
Image: (profile image - optional)
```

### Testimonial 3: Ana Petrović

```
Author: Ana Petrović
Role: Penzionisana
Rating: 5
Content:
  Veoma ljubazna ekipa koja je pažljivo objasnila sve rezultate pregleda. Hvala vam puno!
Image: (profile image - optional)
```

---

## 4. FAQ (često postavljana pitanja)

### FAQ 1

```
Question: Koliko dugo traje tehnički pregled?
Category: Opšte
Answer:
  Tehnički pregled obično traje između 30 do 60 minuta, zavisno od stanja vozila i vrste pregleda koji je potreban. Naš brz i efikasan tim je tu da obezbedi najbolje iskustvo.
```

### FAQ 2

```
Question: Koja je cena pregleda?
Category: Cene
Answer:
  Cena se razlikuje zavisno od vrste vozila, ali početna cena je od 2.500 dinara za osnovno pregled. Poseti našu stranicu sa cenama za detaljne informacije.
```

### FAQ 3

```
Question: Da li je potrebna rezervacija?
Category: Rezervacija
Answer:
  Preporučujem rezervaciju unapred kroz našu veb stranicu ili pozivom, ali primamo i bez zakazivanja zavisno od opterećenja. Unaprije rezervacija osigurava brže obavljanje pregleda.
```

### FAQ 4

```
Question: Šta ako vozilo ne prođe tehnički?
Category: Rezultati
Answer:
  Daćemo vam detaljni izveštaj sa svim manjkavostima i preporukama za reparaciju. Naš tim može vam predložiti poznate servise koji mogu da reše probleme.
```

### FAQ 5

```
Question: Radno vreme?
Category: Informacije
Answer:
  Radimo od ponedjeljka do petka od 08:00 do 18:00, subotom od 09:00 do 15:00. Nedjeljom zatvoreni. Sve tri lokacije imaju identično radno vreme.
```

### FAQ 6

```
Question: Jesu li vase sertifikate?
Category: Sertifikacija
Answer:
  Svi naši tehničari su sertifikovani prema međunarodnim standardima i redovno se usavršavaju. Naša laboratorija je akreditirana od strane nadležnih vlasti.
```

---

## 5. SETTINGS

```
Site Name: Prvi Balkan - Tehnički Pregled Vozila
Site Description: Profesionalni tehnički pregled vozila sa 3 lokacije u Beogradu. Brz i pouzdan servis, registracija vozila i pomoć kod osiguranja.
Phone: +381 11 2101 111
Email: info@prvi-balkan.rs
Address: Beograd, Srbija (general address - or use one of the three locations)
Hero:
  {
    "title": "Prvi Balkan - Tehnički Pregled Vozila",
    "description": "Profesionalni tehnički pregled sa 10+ godina iskustva. 3 lokacije u Beogradu za vašu pogodnost.",
    "buttonText": "Zakaži Pregled",
    "buttonLink": "/kontakt",
    "backgroundImage": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop"
  }
About Text:
  Prvi Balkan je vodeća firma za tehnički pregled vozila sa više od 10 godina iskustva na tržištu. Naš tim se bavi pružanjem najkvalitetnije usluge tehnijkog pregleda vozila sa 3 lokacije u Beogradu.
Social Links:
  {
    "facebook": "https://facebook.com/prvi-balkan",
    "instagram": "https://instagram.com/prvi-balkan",
    "twitter": "https://twitter.com/prvi-balkan",
    "phone": "+381112101111"
  }
Logo: (optional - upload company logo)
```

---

## 6. BLOG POSTS

### Blog Post 1: Kako se Pripremiti za Tehnički Pregled?

```
Title: Kako se Pripremiti za Tehnički Pregled?
Slug: kako-se-pripremiti-za-tehnicki-pregled
Excerpt: Detaljan vodič kako da pripremite vaše vozilo za tehnički pregled kako bi prolazilo bez problema...
Category: Saveti
Author: Prvi Balkan
Published: 2025-01-15
Featured Image: https://images.unsplash.com/photo-1487754180143-c282803d6773?w=800&h=500&fit=crop

Content:
Tehnički pregled je važan deo održavanja vašeg vozila. Evo kako da se najbolje pripremite:

1. PROVERITE TEČNOSTI
- Motorno ulje - mora biti na odgovarajućem nivou
- Rashladna tečnost - dopunite ako je potrebno
- Freninska tečnost - proverite nivo
- Tečnost za čišćenje stakla - dopunite

2. PREGLEDAJTE GUME
- Dubina profila guma - mora biti najmanje 1.6mm
- Pritisak vazduha - mora biti prema preporukama proizvođača
- Jednakost trošenja - gume bi trebale biti ravnomerno pohabane
- Provera baterije na daljinskom upravljaču

3. SISTEM KOČENJA
- Kočione pločice - mogu biti istrošene
- Kočioni diskovi - ne smeju imati raznih ozbiljnih oštećenja
- Kočioni fluid - mora biti čist i na odgovarajućem nivou
- Testirajte kočnice pred dolazak kod nas

4. OSVAJANJE
- Provera svetala - prednja, zadnja i signalni reflektori
- Farovi - moraju biti pravilno poravnati
- Brisači stakla - moraju raditi pravilno
- Kondenzacija u farovima - nije dozvoljeno

5. ČISTOĆA
- Očistite vozilo - makar osnovnu prljavu
- Makljite unutrašnjost - proverite sve dijelove koji će biti pregledani
- Sklonjite sve lične predmete iz vozila

6. DOKUMENTACIJA
- Donesi vozačku dozvolu
- Donesi registarske pločice i sve relevantne dokumente
- Proverite da li je vozilo registrovano
- Pripremite sve neophodno za brži pregled

Sledi nas za više saveta i ostani informisan o zahvatima tehnničkog pregleda!
```

### Blog Post 2: Česte Greške Pri Tehnničkom Pregledu

```
Title: Česte Greške Pri Tehnničkom Pregledu
Slug: ceste-greske-pri-tehnichkom-pregledu
Excerpt: Saznajte koje su najčešće greške koje vozači prave pri tehnničkom pregledu i kako da ih izbjegnete...
Category: Saveti
Author: Prvi Balkan
Published: 2025-01-10
Featured Image: https://images.unsplash.com/photo-1624996341304-d754e3f6e6c5?w=800&h=500&fit=crop

Content:
Nakon 15+ godina rada u branši, videli smo sve moguće greške. Evo najčešćih koje mogu da vam koštaju pregleda:

1. ISTROŠENE KOČIONE PLOČICE
To je najčešća greška. Vozači čekaju da pločice budu potpuno istrošene pre nego što ih zamene. Zamenjujte ih pre nego što počnu da se troše u drugu komponentu.

2. NEDOVOLJNA DUBINA PROFILA GUMA
Minimalno 1.6mm je zakonska granica, ali najčešće vozači imaju manje. Zamenite gume redovno - bezbednost vam zavisi od toga.

3. OZBILJNA OŠTEĆENJA KOČIONIH DISKOVA
Ako vidite varnice ili čujete čudne zvukove tokom kočenja, verovatno ste oštedili diskove. Zamenjujete diskove zajedno sa pločicama.

4. NEISPRAVNA OSVAJANJA
Farovi koji nisu poravnati ili svetla koja ne rade su česta greška. Ova su jeftina popravka - samo zamena sijalica ili poravnanje farova.

5. CURENJA FLUIDA
Ako vidiš mrlje ispod vozila, sigurno imate curenje. To može biti motorni ulje, rashladna tečnost ili kočioni fluid. Popraviće se brzo.

6. PROČIŠĆIVANJE KATALIZATORA
Starijim vozilima, katalizatori mogu biti zapušeni. To se detektuje pri testiranju emisije i zahteva čišćenje.

7. NEISPRAVNE KOČNICE
Meka kočnica ili preterano čvrsta je česta greška. Provera sistema kočenja je kritična.

8. PROBLEMI SA REGISTRACIJOM
Vozilo koje nije registrovano ne može proći tehnički. Obavezno registrujte vozilo pre nego što dodjete.

SAVETI ZA IZBEGAVANJE GREŠKI:
- Redovno održavajte vozilo
- Ne čekajte dok ne krene svetlo "check engine"
- Zamenjujte potrošne delove na vreme
- Pratite redovne servise
- Čitajte priručnik za vozilo

Ako imate bilo kakvu nedoumicu, slobodno nas kontaktirajte! Naš tim je tu da vam pomogne.
```

### Blog Post 3: Novi Zakoni o Tehnničkom Pregledu 2025

```
Title: Novi Zakoni o Tehnničkom Pregledu 2025
Slug: novi-zakoni-o-technichkom-pregledu-2025
Excerpt: Pregled novih zakona koji će stupit i na snagu tokom 2025. godine za tehnički pregled vozila...
Category: Vest
Author: Prvi Balkan
Published: 2025-01-05
Featured Image: https://images.unsplash.com/photo-1450883580519-340f3cecb55f?w=800&h=500&fit=crop

Content:
Nove 2025. godine, važi nekoliko važnih promena u zakonima o tehnničkom pregledu vozila. Evo šta se menja:

1. JACI STANDARDI ZA EMISIJU ZAGAĐENJA
Počevši od 2025, standardi za emisiju zagađenja su strožiji. Vozila sa starijom tehnologijom mogu imati problema da provedu. Preporučujemo da čistite katalizatore redovno.

2. OBAVEZNI ELEKTRONSKI SERTIFIKATI
Novi elektronski sertifikati će zameniti papirne. To znači da će vaš pregled biti direktno unesen u sistem i dostupan službama. Brže i efikasnije.

3. ELEKTRONSKA REGISTRACIJA
Nova procedura zahteva elektronsku registraciju pre nego što dodjete na pregled. Ovo se može uraditi online kroz naš sistem.

4. STROŽA PRAVILA ZA OSVAJANJE
Svetla i reflektori moraju biti još preciznije usaglašeni sa novim normama. Očekujte malo viši standard.

5. NOVI TESTOVI ZA EV I HIBRIDNA VOZILA
Sa povećanjem broja EV vozila, uvedeni su novi testovi specifično za электричних vozila. Naše oprema je već ažurirana za ove testove.

6. DUŽINA VALIDNOSTI TEHNNIČKOG
Tehnički pregled sada važi:
- 12 meseci za vozila starija od 3 godine
- 6 meseci za vozila između 3-7 godina
- 6 meseci za vozila starija od 7 godina

7. POVEĆANE KAZNE ZA NEISPUNJAVANJE
Kazne za vožnju bez važnog tehnničkog su povećane. Pazite da uvek imate validan pregled.

8. PREPORUKE ZA 2025:
- Obavite pregled vozila što pre
- Pazite na nove standarde
- Registrujte se elektronski
- Podrži se sa našim timom za sve informacije

Naš tim je obučen na sve nove zakone i procedire. Dolazite sa sigurnošću da ćete proći bez problema.

Ako imate bilo kakva pitanja, slobodno nas kontaktirajte!
```

---

## INSTRUCTIONS FOR ADDING CONTENT TO STRAPI

### Step-by-Step Guide:

1. **Access Strapi Admin Panel**
   - Navigate to http://localhost:1337/admin (or your deployed Strapi URL)
   - Login with your admin credentials

2. **Add Locations**
   - Go to Content Manager → Locations
   - Click "Create new entry"
   - Fill in all fields for each location (3 total)
   - Click "Save" for each location
   - Publish each location entry

3. **Add Services**
   - Go to Content Manager → Services
   - Click "Create new entry"
   - Fill in service details (4 total)
   - Publish each service

4. **Add Testimonials**
   - Go to Content Manager → Testimonials
   - Click "Create new entry"
   - Add testimonial data (3 total)
   - Publish each testimonial

5. **Add Blog Posts**
   - Go to Content Manager → Blog Posts
   - Click "Create new entry"
   - Add blog post data (3 total):
     - Kako se Pripremiti za Tehnički Pregled?
     - Česte Greške Pri Tehnničkom Pregledu
     - Novi Zakoni o Tehnničkom Pregledu 2025
   - Publish each blog post

6. **Add Settings**
   - Go to Content Manager → Settings
   - Create or update the main settings entry
   - Fill in all site-wide information
   - Publish

7. **Verify Content**
   - Check that the frontend displays content correctly
   - Verify all links work properly
   - Test on different devices

---

## IMAGE REFERENCES

All images are currently linked from Unsplash or should be uploaded locally:

- **Location Images**: Can use the provided URLs or upload your own
- **Service Icons**: Using Material Icons (referenced by icon name)
- **Testimonial Images**: Optional - can use placeholder initials
- **Logo**: Should be uploaded to your Strapi media library

---

## DATA STRUCTURE SUMMARY

| Content Type | Count | Required Fields            |
| ------------ | ----- | -------------------------- |
| Locations    | 3     | name, slug, address, phone |
| Services     | 4     | title, slug, icon          |
| Testimonials | 3     | author, content, rating    |
| FAQ          | 6     | question, answer           |
| Blog Posts   | 3     | title, slug, content       |
| Settings     | 1     | siteName, siteDescription  |

---

## NOTES

- All content is in **Serbian (Latin script)**
- Phone numbers use Serbian format (+381)
- Opening hours are consistent across all locations
- All entries are ready to be marked as "Published"
- Images can be replaced with your own uploads
- Slugs are URL-friendly and match the current website structure
- JSON fields (features, social links, opening hours) should be pasted as provided
