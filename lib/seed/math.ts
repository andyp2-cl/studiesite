// Seed content for the mathematics package (Lgr22, grade 6–7).
// Bodies are Markdown with KaTeX ($...$ inline, $$...$$ display).
// String.raw keeps LaTeX backslashes intact.

export type SeedDeepening = {
  title: string;
  /** 1 = Lätt, 2 = Medel, 3 = Svår: the level that unlocks the text. */
  unlockLevel: 1 | 2 | 3;
  body: string;
};

export type SeedMoment = {
  slug: string;
  name: string;
  description: string;
  /** lib/generators/<area>/<moment>.ts */
  generatorKey: string;
  intro: string;
  deepenings: SeedDeepening[];
};

export type SeedArea = {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  moments: SeedMoment[];
};

export type SeedSubject = {
  slug: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  areas: SeedArea[];
};

const numberSense: SeedArea = {
  slug: "taluppfattning",
  name: "Taluppfattning",
  description: "Hur tal är uppbyggda och hur vi räknar med dem.",
  color: "#2d46b9",
  icon: "hash",
  moments: [
    {
      slug: "positionssystemet-och-avrundning",
      name: "Positionssystemet och avrundning",
      description: "Vad varje siffra är värd och hur du avrundar.",
      generatorKey: "number-sense/place-value-rounding",
      intro: String.raw`Vi skriver tal med tio siffror, 0–9. Var siffran står avgör vad den är värd. Det kallas **positionssystemet**.

I talet $4\,372{,}5$ betyder:

- **4** fyra tusental $= 4\,000$
- **3** tre hundratal $= 300$
- **7** sju tiotal $= 70$
- **2** två ental $= 2$
- **5** fem tiondelar $= 0{,}5$

**Avrundning** gör ett tal enklare. Titta på siffran *direkt till höger* om platsen du avrundar till:

- 0–4: avrunda nedåt
- 5–9: avrunda uppåt

Exempel: $4\,372$ avrundat till hundratal blir $4\,400$, eftersom siffran efter hundratalet är 7.`,
      deepenings: [
        {
          title: "Varför just tio?",
          unlockLevel: 1,
          body: String.raw`Vårt talsystem kallas **decimalsystemet** eller tiosystemet. Varje steg åt vänster är värt **tio gånger mer**: ental, tiotal, hundratal, tusental …

Antagligen räknar vi i tior för att vi har tio fingrar. Men det finns andra system. Datorer räknar med bara två siffror, 0 och 1. Det kallas **binära talsystemet**. Där skrivs talet fem som $101$: en fyra, ingen tvåa och en etta.`,
        },
      ],
    },
    {
      slug: "negativa-tal",
      name: "Negativa tal",
      description: "Tal under noll – på tallinjen och i beräkningar.",
      generatorKey: "number-sense/negative-numbers",
      intro: String.raw`**Negativa tal** är tal som är mindre än noll. Du har sett dem på en termometer: $-5$ grader är kallare än $0$ grader.

Tänk på en **tallinje**. Ju längre till höger, desto större tal:

$$-3 < -1 < 0 < 2$$

Att räkna:

- $-2 + 5 = 3$ (starta på $-2$ och gå 5 steg åt höger)
- $3 - 7 = -4$ (starta på $3$ och gå 7 steg åt vänster)
- **Minus ett negativt tal** blir plus: $4 - (-2) = 4 + 2 = 6$`,
      deepenings: [
        {
          title: "Varför blir minus minus plus?",
          unlockLevel: 2,
          body: String.raw`Titta på mönstret:

$$5 - 2 = 3 \quad 5 - 1 = 4 \quad 5 - 0 = 5 \quad 5 - (-1) = \;?$$

Varje gång talet vi drar bort blir 1 mindre, blir svaret 1 större. Då måste $5 - (-1) = 6$.

Ett vardagsexempel: om någon **tar bort en skuld** på 100 kr från dig, så har du i praktiken fått 100 kr.`,
        },
      ],
    },
    {
      slug: "de-fyra-raknesatten",
      name: "De fyra räknesätten",
      description: "Addition, subtraktion, multiplikation och division.",
      generatorKey: "number-sense/four-operations",
      intro: String.raw`De fyra räknesätten och vad svaren heter:

| Räknesätt | Exempel | Svaret heter |
|---|---|---|
| Addition | $12 + 8 = 20$ | summa |
| Subtraktion | $12 - 8 = 4$ | differens |
| Multiplikation | $12 \cdot 8 = 96$ | produkt |
| Division | $12 / 4 = 3$ | kvot |

Ett tips är att **dela upp talen**: $7 \cdot 23 = 7 \cdot 20 + 7 \cdot 3 = 140 + 21 = 161$.`,
      deepenings: [
        {
          title: "Räknesätten hänger ihop",
          unlockLevel: 1,
          body: String.raw`Subtraktion är **motsatsen** till addition, och division är motsatsen till multiplikation. Det kan du använda för att kontrollera dina svar:

- Om $96 / 8 = 12$, så måste $12 \cdot 8 = 96$.
- Om $45 - 17 = 28$, så måste $28 + 17 = 45$.

Matematiker kallar det **inversa operationer**. Samma idé används senare när du löser ekvationer.`,
        },
      ],
    },
    {
      slug: "prioriteringsregler",
      name: "Prioriteringsregler",
      description: "I vilken ordning du räknar ut ett uttryck.",
      generatorKey: "number-sense/order-of-operations",
      intro: String.raw`När ett uttryck har flera räknesätt räknar du i den här ordningen:

1. **Parenteser**
2. **Potenser**
3. **Multiplikation och division** (från vänster till höger)
4. **Addition och subtraktion** (från vänster till höger)

Exempel:

$$2 + 3 \cdot 4 = 2 + 12 = 14$$

$$(2 + 3) \cdot 4 = 5 \cdot 4 = 20$$

Samma siffror, men olika svar. Ordningen spelar alltså roll.`,
      deepenings: [
        {
          title: "Varför behövs regler?",
          unlockLevel: 2,
          body: String.raw`Utan gemensamma regler skulle $2 + 3 \cdot 4$ kunna betyda både 14 och 20. Prioriteringsreglerna är en **överenskommelse** så att alla i hela världen tolkar ett uttryck på samma sätt.

Miniräknare och datorer följer också reglerna. Därför kan ett och samma uttryck ge olika svar om du skriver in det med eller utan parenteser.`,
        },
      ],
    },
  ],
};

const fractions: SeedArea = {
  slug: "brak",
  name: "Bråk",
  description: "Delar av en helhet – förlänga, förkorta och räkna.",
  color: "#e8115b",
  icon: "pie-chart",
  moments: [
    {
      slug: "forlanga-och-forkorta",
      name: "Förlänga och förkorta",
      description: "Samma värde, olika utseende.",
      generatorKey: "fractions/expand-simplify",
      intro: String.raw`Ett bråk består av **täljare** (överst) och **nämnare** (nederst). I $\frac{3}{4}$ är 3 täljaren och 4 nämnaren.

**Förlänga** betyder att multiplicera täljare och nämnare med samma tal:

$$\frac{3}{4} = \frac{3 \cdot 2}{4 \cdot 2} = \frac{6}{8}$$

**Förkorta** betyder att dividera täljare och nämnare med samma tal:

$$\frac{12}{18} = \frac{12 / 6}{18 / 6} = \frac{2}{3}$$

Bråkets värde ändras inte. Det är bara skrivsättet som byts.`,
      deepenings: [
        {
          title: "Enklaste form",
          unlockLevel: 1,
          body: String.raw`Ett bråk står i **enklaste form** när det inte går att förkorta mer, alltså när täljare och nämnare inte har någon gemensam faktor förutom 1.

Snabbaste vägen dit är att dividera med den **största gemensamma delaren** (SGD). För $\frac{12}{18}$ är SGD 6, så du kommer direkt till $\frac{2}{3}$. Det går också bra att förkorta i flera steg: först med 2, sedan med 3.`,
        },
      ],
    },
    {
      slug: "jamfora-och-storleksordna",
      name: "Jämföra och storleksordna",
      description: "Vilket bråk är störst?",
      generatorKey: "fractions/compare-order",
      intro: String.raw`Om bråken har **samma nämnare** jämför du täljarna: $\frac{5}{8} > \frac{3}{8}$.

Om bråken har **samma täljare** är det bråket med *minst* nämnare som är störst: $\frac{1}{3} > \frac{1}{5}$. Om något delas i färre delar blir varje del större.

Om allt skiljer sig, **förläng** så att bråken får samma nämnare:

$$\frac{2}{3} = \frac{8}{12} \qquad \frac{3}{4} = \frac{9}{12}$$

Alltså är $\frac{3}{4}$ störst.`,
      deepenings: [
        {
          title: "Jämför med en halv",
          unlockLevel: 2,
          body: String.raw`Ett snabbt knep är att jämföra med $\frac{1}{2}$. Ett bråk är större än en halv om täljaren är mer än halva nämnaren.

- $\frac{4}{9}$ är mindre än en halv (eftersom $4 < 4{,}5$)
- $\frac{5}{8}$ är större än en halv

Alltså är $\frac{5}{8} > \frac{4}{9}$, och du behövde inte räkna fram någon gemensam nämnare. Ett sådant jämförelsetal kallas **riktmärke**.`,
        },
      ],
    },
    {
      slug: "blandad-form",
      name: "Blandad form",
      description: "Heltal och bråk i samma tal.",
      generatorKey: "fractions/mixed-numbers",
      intro: String.raw`Ett bråk där täljaren är större än nämnaren, till exempel $\frac{7}{3}$, kallas **oäkta bråk**. Det kan skrivas i **blandad form**:

$$\frac{7}{3} = 2\frac{1}{3}$$

eftersom 3 får plats 2 hela gånger i 7, och 1 blir kvar.

Åt andra hållet gör du så här: $2\frac{1}{3} = \frac{2 \cdot 3 + 1}{3} = \frac{7}{3}$.`,
      deepenings: [
        {
          title: "Division med rest",
          unlockLevel: 1,
          body: String.raw`Att gå från oäkta bråk till blandad form är samma sak som **division med rest**:

$$17 / 5 = 3 \text{ rest } 2 \quad\Rightarrow\quad \frac{17}{5} = 3\frac{2}{5}$$

Kvoten blir heltalet, resten blir den nya täljaren och nämnaren är densamma.`,
        },
      ],
    },
    {
      slug: "addition-och-subtraktion",
      name: "Addition och subtraktion",
      description: "Plussa och minusa med bråk.",
      generatorKey: "fractions/add-subtract",
      intro: String.raw`Du kan bara addera eller subtrahera bråk som har **samma nämnare**. Då räknar du med täljarna:

$$\frac{2}{7} + \frac{3}{7} = \frac{5}{7}$$

Om nämnarna är olika förlänger du först till en **gemensam nämnare**:

$$\frac{1}{4} + \frac{1}{6} = \frac{3}{12} + \frac{2}{12} = \frac{5}{12}$$

Ett vanligt fel är att addera nämnarna också. $\frac{1}{2} + \frac{1}{2}$ är 1, inte $\frac{2}{4}$!`,
      deepenings: [
        {
          title: "Minsta gemensamma nämnare",
          unlockLevel: 2,
          body: String.raw`Du kan alltid använda produkten av nämnarna som gemensam nämnare ($4 \cdot 6 = 24$), men talen blir ofta onödigt stora.

Den **minsta gemensamma nämnaren** är det minsta tal som båda nämnarna går jämnt upp i. För 4 och 6 är det 12. Räkna upp multiplarna av den större nämnaren tills du hittar en som den mindre går jämnt upp i: 6, **12**.`,
        },
      ],
    },
    {
      slug: "multiplikation-och-division",
      name: "Multiplikation och division",
      description: "Gånger och delat med bråk.",
      generatorKey: "fractions/multiply-divide",
      intro: String.raw`**Multiplikation:** täljare gånger täljare och nämnare gånger nämnare.

$$\frac{2}{3} \cdot \frac{4}{5} = \frac{8}{15}$$

**Division:** vänd på det andra bråket och multiplicera.

$$\frac{2}{3} / \frac{4}{5} = \frac{2}{3} \cdot \frac{5}{4} = \frac{10}{12} = \frac{5}{6}$$

Ett heltal kan skrivas som bråk: $3 = \frac{3}{1}$.`,
      deepenings: [
        {
          title: "Varför vänder man på bråket?",
          unlockLevel: 3,
          body: String.raw`Division frågar: *hur många gånger får det ena plats i det andra?*

$4 / \frac{1}{2}$ frågar hur många halvor det finns i 4. Svaret är 8, och det är samma sak som $4 \cdot 2$.

Att dividera med $\frac{1}{2}$ är alltså samma sak som att multiplicera med $\frac{2}{1}$. Det omvända bråket kallas **inverterat värde**. Ett tal gånger sitt inverterade värde blir alltid 1.`,
        },
      ],
    },
  ],
};

const decimalsPercent: SeedArea = {
  slug: "decimaltal-och-procent",
  name: "Decimaltal och procent",
  description: "Tal med decimaler och delar av hundra.",
  color: "#e1118c",
  icon: "percent",
  moments: [
    {
      slug: "rakna-med-decimaltal",
      name: "Räkna med decimaltal",
      description: "De fyra räknesätten med decimaler.",
      generatorKey: "decimals-percent/decimal-arithmetic",
      intro: String.raw`**Addition och subtraktion:** ställ upp så att decimaltecknen hamnar under varandra.

$$3{,}25 + 1{,}6 = 4{,}85$$

**Multiplikation:** räkna som om kommatecknen inte fanns, och sätt sedan tillbaka lika många decimaler som faktorerna har tillsammans.

$$0{,}3 \cdot 0{,}4 = 0{,}12 \quad (3 \cdot 4 = 12, \text{ två decimaler})$$

**Multiplikation och division med 10, 100 och 1000** flyttar decimaltecknet: $2{,}5 \cdot 100 = 250$.`,
      deepenings: [
        {
          title: "Gånger kan göra mindre",
          unlockLevel: 2,
          body: String.raw`Med heltal blir produkten oftast större än faktorerna. Med decimaltal under 1 blir den **mindre**:

$$20 \cdot 0{,}5 = 10$$

Det beror på att $0{,}5$ betyder *hälften av*. På samma sätt kan en division med ett tal mindre än 1 ge ett **större** svar: $20 / 0{,}5 = 40$, eftersom det finns 40 halvor i 20.`,
        },
      ],
    },
    {
      slug: "brak-decimaltal-och-procent",
      name: "Bråk, decimaltal och procent",
      description: "Tre sätt att skriva samma sak.",
      generatorKey: "decimals-percent/convert",
      intro: String.raw`**Procent** betyder *hundradelar*. Samma värde kan skrivas på tre sätt:

| Bråk | Decimaltal | Procent |
|---|---|---|
| $\frac{1}{2}$ | $0{,}5$ | $50\,\%$ |
| $\frac{1}{4}$ | $0{,}25$ | $25\,\%$ |
| $\frac{3}{4}$ | $0{,}75$ | $75\,\%$ |
| $\frac{1}{10}$ | $0{,}1$ | $10\,\%$ |

- Bråk till decimaltal: dividera täljaren med nämnaren, $\frac{3}{8} = 3 / 8 = 0{,}375$.
- Decimaltal till procent: multiplicera med 100, $0{,}375 = 37{,}5\,\%$.`,
      deepenings: [
        {
          title: "Decimaltal som aldrig tar slut",
          unlockLevel: 2,
          body: String.raw`Vissa bråk blir decimaltal som fortsätter i all oändlighet:

$$\frac{1}{3} = 0{,}3333\ldots$$

Det kallas **periodisk decimalutveckling**, eftersom samma siffror upprepas. Därför är $\frac{1}{3}$ ungefär $33{,}3\,\%$. Det exakta värdet skrivs enklast som bråk.`,
        },
      ],
    },
    {
      slug: "procent-av-ett-tal",
      name: "Procent av ett tal",
      description: "Hur mycket är 20 % av 350?",
      generatorKey: "decimals-percent/percent-of",
      intro: String.raw`För att räkna ut procent av ett tal gör du om procenten till ett decimaltal och multiplicerar:

$$20\,\% \text{ av } 350 = 0{,}20 \cdot 350 = 70$$

Huvudräkningsknep:

- $10\,\%$: dividera med 10. $10\,\%$ av $350 = 35$.
- $5\,\%$ är hälften av $10\,\%$.
- $1\,\%$: dividera med 100.

$20\,\%$ är dubbelt så mycket som $10\,\%$: $2 \cdot 35 = 70$.`,
      deepenings: [
        {
          title: "Rea och förändringsfaktor",
          unlockLevel: 2,
          body: String.raw`När något kostar 400 kr och är **25 % billigare** kan du räkna i två steg: $0{,}25 \cdot 400 = 100$ och sedan $400 - 100 = 300$ kr.

Det går snabbare i ett steg. Om priset sänks med 25 % är det kvar 75 %:

$$0{,}75 \cdot 400 = 300$$

Talet $0{,}75$ kallas **förändringsfaktor**. Vid en ökning med 25 % är förändringsfaktorn $1{,}25$.`,
        },
      ],
    },
    {
      slug: "hur-manga-procent",
      name: "Hur många procent?",
      description: "Hur stor del är det, uttryckt i procent?",
      generatorKey: "decimals-percent/what-percent",
      intro: String.raw`Frågan *"hur många procent är 12 av 48?"* löser du genom att skriva delen som bråk och göra om det till procent:

$$\frac{12}{48} = 0{,}25 = 25\,\%$$

Kom ihåg: **delen** står i täljaren och **det hela** i nämnaren.

$$\text{andel} = \frac{\text{delen}}{\text{det hela}}$$`,
      deepenings: [
        {
          title: "Procent eller procentenheter?",
          unlockLevel: 3,
          body: String.raw`Om andelen som gillar fotboll ökar från 20 % till 30 % har den ökat med **10 procentenheter**. Det är skillnaden mellan procentsatserna.

Men räknat i procent har den ökat med **50 %**, eftersom ökningen 10 är hälften av 20.

Nyheter blandar ofta ihop de två begreppen, så det är bra att kunna skilja på dem.`,
        },
      ],
    },
  ],
};

const powers: SeedArea = {
  slug: "potenser",
  name: "Potenser",
  description: "Upprepad multiplikation och rötter.",
  color: "#8400e7",
  icon: "superscript",
  moments: [
    {
      slug: "potensform",
      name: "Potensform",
      description: "Ett kortare sätt att skriva upprepad multiplikation.",
      generatorKey: "powers/power-notation",
      intro: String.raw`En **potens** är ett kort sätt att skriva upprepad multiplikation:

$$2^5 = 2 \cdot 2 \cdot 2 \cdot 2 \cdot 2 = 32$$

- **2** är **basen**: talet som multipliceras.
- **5** är **exponenten**: hur många gånger basen är med.

Ett vanligt fel: $2^5$ är **inte** $2 \cdot 5$.

Tiopotenser är extra lätta: $10^3 = 1\,000$. Exponenten anger antalet nollor.`,
      deepenings: [
        {
          title: "Stora tal i grundpotensform",
          unlockLevel: 2,
          body: String.raw`Forskare skriver väldigt stora tal med tiopotenser. Avståndet till solen är ungefär 150 miljoner km:

$$150\,000\,000 = 1{,}5 \cdot 10^8$$

Det kallas **grundpotensform**. Först kommer ett tal mellan 1 och 10, och sedan gånger en tiopotens. Det är mycket lättare att läsa än att räkna nollor.`,
        },
      ],
    },
    {
      slug: "kvadrater-och-kvadratrotter",
      name: "Kvadrater och kvadratrötter",
      description: "Upphöjt till två och tvärtom.",
      generatorKey: "powers/squares-roots",
      intro: String.raw`Ett tal **i kvadrat** är talet gånger sig självt:

$$7^2 = 7 \cdot 7 = 49$$

Namnet kommer från geometrin: en kvadrat med sidan 7 cm har arean $49\text{ cm}^2$.

**Kvadratroten** går åt andra hållet. Den frågar vilket tal gånger sig självt som blir talet:

$$\sqrt{49} = 7 \quad \text{eftersom} \quad 7 \cdot 7 = 49$$

Bra att kunna utantill: $1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144$.`,
      deepenings: [
        {
          title: "Rötter som inte går jämnt ut",
          unlockLevel: 2,
          body: String.raw`$\sqrt{50}$ är inget heltal. Men eftersom $49 < 50 < 64$ måste $\sqrt{50}$ ligga mellan 7 och 8, nära 7.

Med miniräknare: $\sqrt{50} \approx 7{,}07$. Rötter som $\sqrt{2}$ har oändligt många decimaler utan något mönster. Sådana tal kallas **irrationella tal**.`,
        },
      ],
    },
  ],
};

const algebra: SeedArea = {
  slug: "algebra",
  name: "Algebra",
  description: "Räkna med bokstäver, uttryck och ekvationer.",
  color: "#148a08",
  icon: "variable",
  moments: [
    {
      slug: "skriva-och-tolka-uttryck",
      name: "Skriva och tolka uttryck",
      description: "Från ord till matematik och tillbaka.",
      generatorKey: "algebra/expressions",
      intro: String.raw`En **variabel** är en bokstav som står för ett tal som kan variera. Ett **uttryck** är en kombination av tal, variabler och räknesätt.

| I ord | Uttryck |
|---|---|
| 5 mer än $x$ | $x + 5$ |
| 3 gånger $x$ | $3x$ |
| hälften av $x$ | $\frac{x}{2}$ |

Mellan tal och bokstav brukar man inte skriva något gångertecken: $3x$ betyder $3 \cdot x$.

För att **beräkna** ett uttryck sätter du in ett värde. Om $x = 4$ är $3x + 5 = 3 \cdot 4 + 5 = 17$.`,
      deepenings: [
        {
          title: "Varför bokstäver?",
          unlockLevel: 1,
          body: String.raw`En biljett kostar 45 kr. Med en variabel kan du skriva priset för **hur många biljetter som helst** på en gång:

$$\text{pris} = 45n$$

där $n$ är antalet biljetter. Ett uttryck är som ett recept. Det fungerar för alla värden, och du behöver bara sätta in rätt tal. Det gör algebra så kraftfullt.`,
        },
      ],
    },
    {
      slug: "forenkla-uttryck",
      name: "Förenkla uttryck",
      description: "Slå ihop termer av samma sort.",
      generatorKey: "algebra/simplify",
      intro: String.raw`Att **förenkla** betyder att skriva ett uttryck så kort som möjligt. Du får bara slå ihop **termer av samma sort**:

$$3x + 2 + 4x - 5 = 7x - 3$$

$x$-termerna ($3x$ och $4x$) slås ihop och talen ($2$ och $-5$) slås ihop.

Med parentes multiplicerar du in talet framför i varje term:

$$2(x + 3) = 2x + 6$$`,
      deepenings: [
        {
          title: "Äpplen och päron",
          unlockLevel: 2,
          body: String.raw`Tänk dig att $x$ är äpplen och $y$ är päron. $3x + 2y$ kan inte bli $5xy$, lika lite som 3 äpplen och 2 päron blir 5 "äppelpäron".

Men $3x + 2x = 5x$, eftersom 3 äpplen och 2 äpplen är 5 äpplen. Termer som har exakt samma bokstavsdel kallas **lika termer**.`,
        },
      ],
    },
    {
      slug: "ekvationer-i-ett-steg",
      name: "Ekvationer i ett steg",
      description: "Hitta det okända talet.",
      generatorKey: "algebra/one-step-equations",
      intro: String.raw`En **ekvation** är en likhet med ett okänt tal. Målet är att få $x$ ensamt på ena sidan.

Gör **samma sak på båda sidor** så att likheten fortsätter att stämma:

$$x + 7 = 12 \quad\Rightarrow\quad x = 12 - 7 = 5$$

$$4x = 28 \quad\Rightarrow\quad x = \frac{28}{4} = 7$$

**Pröva** alltid ditt svar genom att sätta in det: $5 + 7 = 12$ stämmer.`,
      deepenings: [
        {
          title: "Som en balansvåg",
          unlockLevel: 1,
          body: String.raw`Tänk på likhetstecknet som en **balansvåg**. Båda sidorna väger lika mycket.

Om du tar bort 7 från ena vågskålen måste du ta bort 7 från den andra också, annars tippar vågen. Det är därför du alltid gör samma sak på båda sidor.

Det du gör kallas att använda den **inversa operationen**: minus tar bort plus och division tar bort multiplikation.`,
        },
      ],
    },
    {
      slug: "ekvationer-i-tva-steg",
      name: "Ekvationer i två steg",
      description: "Två operationer att reda ut.",
      generatorKey: "algebra/two-step-equations",
      intro: String.raw`Här behöver du två steg. Ta först bort det som **adderas eller subtraheras**, och dela sedan:

$$3x + 4 = 19$$

$$3x = 19 - 4 = 15$$

$$x = \frac{15}{3} = 5$$

Pröva: $3 \cdot 5 + 4 = 19$ stämmer.`,
      deepenings: [
        {
          title: "Baklänges",
          unlockLevel: 2,
          body: String.raw`Läs $3x + 4$ som en maskin: *ta talet, gånger 3, plus 4*. För att hitta talet kör du maskinen **baklänges** och i omvänd ordning: *minus 4, delat med 3*.

Därför tar man bort plus och minus först. Samma metod fungerar för längre ekvationer med flera steg.`,
        },
      ],
    },
    {
      slug: "talmonster",
      name: "Talmönster",
      description: "Hitta regeln och fortsätt mönstret.",
      generatorKey: "algebra/number-patterns",
      intro: String.raw`I ett **talmönster** följer talen en regel. Titta på skillnaden mellan talen:

$$3,\; 7,\; 11,\; 15,\; \ldots$$

Varje tal är 4 mer än det förra, så nästa tal är 19.

Du kan också skriva en **formel** för tal nummer $n$. Här är den $4n - 1$: det första talet är $4 \cdot 1 - 1 = 3$ och det tionde är $4 \cdot 10 - 1 = 39$.`,
      deepenings: [
        {
          title: "Varför formel?",
          unlockLevel: 3,
          body: String.raw`Att räkna fram tal nummer 100 genom att lägga till 4 hela tiden tar lång tid. Med formeln går det direkt: $4 \cdot 100 - 1 = 399$.

Ett mönster där man lägger till samma tal varje gång kallas **aritmetisk talföljd**. Skillnaden (här 4) står alltid framför $n$ i formeln.`,
        },
      ],
    },
  ],
};

const geometry: SeedArea = {
  slug: "geometri",
  name: "Geometri",
  description: "Former, mått, vinklar och enheter.",
  color: "#e8590c",
  icon: "triangle",
  moments: [
    {
      slug: "omkrets-och-area",
      name: "Omkrets och area",
      description: "Rektangel, triangel, parallellogram och cirkel.",
      generatorKey: "geometry/perimeter-area",
      intro: String.raw`**Omkrets** är längden runt en figur. **Area** är hur stor yta figuren täcker.

| Figur | Area |
|---|---|
| Rektangel | $b \cdot h$ |
| Parallellogram | $b \cdot h$ |
| Triangel | $\frac{b \cdot h}{2}$ |
| Cirkel | $\pi \cdot r^2$ |

Cirkelns omkrets är $\pi \cdot d$, där $d$ är diametern. $\pi \approx 3{,}14$.

Höjden $h$ mäts alltid **vinkelrätt** mot basen $b$.`,
      deepenings: [
        {
          title: "Varför delat med två?",
          unlockLevel: 1,
          body: String.raw`Två likadana trianglar kan alltid läggas ihop till en **parallellogram** med samma bas och höjd. Därför är triangelns area hälften av parallellogrammens: $\frac{b \cdot h}{2}$.

En parallellogram kan i sin tur klippas och flyttas om till en rektangel. Alla tre formlerna bygger alltså på samma idé.`,
        },
        {
          title: "Talet π",
          unlockLevel: 3,
          body: String.raw`I alla cirklar, stora som små, är omkretsen ungefär **3,14 gånger** diametern. Det talet kallas $\pi$ (pi).

$\pi$ har oändligt många decimaler utan mönster: $3{,}14159265\ldots$ Datorer har räknat ut biljoner decimaler, men för det mesta räcker $3{,}14$.`,
        },
      ],
    },
    {
      slug: "vinklar",
      name: "Vinklar",
      description: "Mät, namnge och räkna ut vinklar.",
      generatorKey: "geometry/angles",
      intro: String.raw`Vinklar mäts i **grader** ($^\circ$).

| Namn | Storlek |
|---|---|
| Spetsig | mindre än $90^\circ$ |
| Rät | exakt $90^\circ$ |
| Trubbig | mellan $90^\circ$ och $180^\circ$ |
| Rak | exakt $180^\circ$ |

Viktiga fakta:

- Vinklarna i en **triangel** är tillsammans $180^\circ$.
- Vinklarna längs en **rät linje** är tillsammans $180^\circ$.
- Ett helt varv är $360^\circ$.`,
      deepenings: [
        {
          title: "Varför 180 grader?",
          unlockLevel: 2,
          body: String.raw`Rita en triangel på papper, riv av de tre hörnen och lägg dem bredvid varandra. Tillsammans bildar de en **rak linje**, alltså $180^\circ$.

Det fungerar för alla trianglar. I en fyrhörning blir summan $360^\circ$, eftersom den kan delas i två trianglar.`,
        },
      ],
    },
    {
      slug: "enhetsomvandling",
      name: "Enhetsomvandling",
      description: "Längd, area och volym.",
      generatorKey: "geometry/unit-conversion",
      intro: String.raw`**Längd:** $1\text{ m} = 10\text{ dm} = 100\text{ cm} = 1\,000\text{ mm}$, och $1\text{ km} = 1\,000\text{ m}$.

**Area:** varje steg är **100** gånger, eftersom det är två dimensioner:

$$1\text{ m}^2 = 100\text{ dm}^2 = 10\,000\text{ cm}^2$$

**Volym:** varje steg är **1 000** gånger, eftersom det är tre dimensioner:

$$1\text{ dm}^3 = 1\,000\text{ cm}^3 = 1 \text{ liter}$$

Tumregel: till en **mindre** enhet blir talet **större**.`,
      deepenings: [
        {
          title: "Varför 100 för area?",
          unlockLevel: 2,
          body: String.raw`En kvadrat på $1\text{ dm} \times 1\text{ dm}$ är $10\text{ cm} \times 10\text{ cm}$. Det blir $10 \cdot 10 = 100$ små rutor på en kvadratcentimeter var.

En kub på $1\text{ dm}^3$ rymmer $10 \cdot 10 \cdot 10 = 1\,000$ små kuber på $1\text{ cm}^3$. Och den rymmer exakt en liter, ungefär som ett mjölkpaket.`,
        },
      ],
    },
  ],
};

const statistics: SeedArea = {
  slug: "statistik-och-sannolikhet",
  name: "Statistik och sannolikhet",
  description: "Lägesmått och chanser.",
  color: "#0d73ec",
  icon: "bar-chart-3",
  moments: [
    {
      slug: "medelvarde-median-och-typvarde",
      name: "Medelvärde, median och typvärde",
      description: "Tre sätt att beskriva det typiska värdet.",
      generatorKey: "statistics/mean-median-mode",
      intro: String.raw`Ta talen $2, 3, 3, 5, 7$.

- **Medelvärde:** summan delat med antalet. $\frac{2 + 3 + 3 + 5 + 7}{5} = \frac{20}{5} = 4$
- **Median:** värdet i mitten när talen är sorterade, här $3$. Om antalet är jämnt tar du medelvärdet av de två mittersta.
- **Typvärde:** det värde som förekommer flest gånger, här $3$.

De här tre kallas **lägesmått**.`,
      deepenings: [
        {
          title: "När medelvärdet lurar",
          unlockLevel: 2,
          body: String.raw`Fem kompisar har 50, 60, 60, 70 och 2 000 kr i veckopeng. Medelvärdet blir 448 kr, men det beskriver ingen av dem!

Medianen, 60 kr, ger en bättre bild. Ett enda extremt värde, ett **extremvärde**, kan dra iväg medelvärdet. Medianen påverkas nästan inte alls. Därför används ofta median när man redovisar till exempel löner.`,
        },
      ],
    },
    {
      slug: "enkel-sannolikhet",
      name: "Enkel sannolikhet",
      description: "Hur stor är chansen?",
      generatorKey: "statistics/probability",
      intro: String.raw`**Sannolikhet** anger hur troligt något är. Om alla utfall är lika troliga gäller:

$$P = \frac{\text{antal gynnsamma utfall}}{\text{antal möjliga utfall}}$$

Exempel: chansen att få en sexa med en tärning är $P = \frac{1}{6}$.

Sannolikheten är alltid mellan $0$ (omöjligt) och $1$ (säkert). Den kan skrivas som bråk, decimaltal eller procent: $\frac{1}{2} = 0{,}5 = 50\,\%$.`,
      deepenings: [
        {
          title: "Tärningen har inget minne",
          unlockLevel: 2,
          body: String.raw`Om du har slagit fem ettor i rad, är det då större chans att nästa slag blir något annat? **Nej.** Tärningen minns inte vad som hänt. Chansen för en etta är fortfarande $\frac{1}{6}$.

Att tro att det "måste" komma något annat snart kallas **spelarens felslut**. Över väldigt många kast jämnar det ändå ut sig. Det kallas **de stora talens lag**.`,
        },
      ],
    },
  ],
};

export const mathSubject: SeedSubject = {
  slug: "matematik",
  name: "Matematik",
  description: "Matte för åk 6–7 enligt Lgr22.",
  color: "#1ed760",
  icon: "calculator",
  areas: [numberSense, fractions, decimalsPercent, powers, algebra, geometry, statistics],
};
