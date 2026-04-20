"use strict";

const newsItems = [
  {
    id: 1,
    title: "RBI keeps repo rate steady to support balance between growth and prices",
    region: "india",
    sector: "Banking",
    company: "Reserve Bank of India",
    source: "Reserve Bank of India",
    sourceUrl: "https://www.rbi.org.in/",
    trustedType: "Official release",
    publishedAt: "2026-04-20",
    tags: ["RBI", "Interest Rates", "Inflation"],
    summary:
      "The central bank did not change the repo rate, which means borrowing cost guidance stayed stable for now.",
    simple: {
      english:
        "The RBI did not press the change button. It wants the economy to keep moving, but it also wants prices to stay under control.",
      hinglish:
        "RBI ne abhi rate change nahi kiya. Matlab economy ko chalne dena hai, lekin prices ko zyada fast badhne bhi nahi dena.",
      marathi:
        "RBI ne atta rate badlala nahi. Yacha artha economy la support dyaicha aahe, pan prices jast vegane vadhu naye he pan baghaycha aahe."
    },
    highLevel:
      "Rates stayed the same, so loans and business planning may not change suddenly.",
    whyItMatters:
      "Stable policy rates can affect home loans, business borrowing, and stock market mood.",
    glossary: [
      {
        term: "Repo Rate",
        meaning: "Repo rate is the interest rate at which RBI lends money to banks."
      },
      {
        term: "Inflation",
        meaning: "Inflation means prices of goods and services are rising."
      }
    ]
  },
  {
    id: 2,
    title: "India's manufacturing activity signals continued industrial momentum",
    region: "india",
    sector: "Manufacturing",
    company: "Industrial Sector",
    source: "S&P Global PMI",
    sourceUrl: "https://www.spglobal.com/",
    trustedType: "Market data",
    publishedAt: "2026-04-20",
    tags: ["PMI", "Factories", "Growth"],
    summary:
      "Factory activity remained healthy, suggesting companies are still producing and receiving demand.",
    simple: {
      english:
        "Factories are still busy. This is a sign that businesses are making things because people are still buying.",
      hinglish:
        "Factories abhi bhi kaam kar rahi hain. Iska matlab demand abhi theek hai aur companies production kar rahi hain.",
      marathi:
        "Factories madhye kaam suru aahe. Mhanje demand aajun tikun aahe ani companies production karat aahet."
    },
    highLevel:
      "Busy factories usually mean business activity is still healthy.",
    whyItMatters:
      "Stronger manufacturing can support jobs, exports, and broader economic confidence.",
    glossary: [
      {
        term: "PMI",
        meaning: "PMI is an indicator that shows whether business activity is improving or slowing."
      }
    ]
  },
  {
    id: 3,
    title: "Oil prices stay sensitive as global supply concerns influence markets",
    region: "global",
    sector: "Energy",
    company: "Oil Market",
    source: "International Energy updates",
    sourceUrl: "https://www.iea.org/",
    trustedType: "Industry data",
    publishedAt: "2026-04-20",
    tags: ["Oil", "Energy", "Commodities"],
    summary:
      "Crude prices moved cautiously as traders watched whether supply disruptions could tighten the market.",
    simple: {
      english:
        "People are watching oil very carefully. If there is less oil available, the price can go up fast.",
      hinglish:
        "Log oil market ko dhyan se dekh rahe hain. Agar supply kam hui, toh oil price jaldi upar ja sakta hai.",
      marathi:
        "Oil market khup lakshat thevla jato aahe. Supply kami zali tar oil chi kimat lagkar vadhu shakate."
    },
    highLevel:
      "Small supply worries can quickly move energy prices.",
    whyItMatters:
      "Oil prices can affect transport costs, inflation, and profits for many industries.",
    glossary: [
      {
        term: "Commodity",
        meaning: "A commodity is a basic raw material like oil, gold, or wheat that is traded."
      }
    ]
  },
  {
    id: 4,
    title: "US technology companies continue investing heavily in AI infrastructure",
    region: "global",
    sector: "Technology",
    company: "Global Tech",
    source: "Company filings and earnings commentary",
    sourceUrl: "https://www.sec.gov/",
    trustedType: "Company filings",
    publishedAt: "2026-04-20",
    tags: ["AI", "Capex", "Technology"],
    summary:
      "Large tech firms signaled more spending on servers, chips, and data centers to support AI services.",
    simple: {
      english:
        "Big tech companies are spending a lot of money now because they believe AI can help them grow later.",
      hinglish:
        "Badi tech companies abhi zyada paisa kharch kar rahi hain kyunki unko lagta hai AI future mein growth dega.",
      marathi:
        "Mothya tech companies atta jast kharcha karat aahet karan tyanna watta AI mule pudhe growth milu shakate."
    },
    highLevel:
      "Tech firms are spending today to build future AI products.",
    whyItMatters:
      "This affects chip demand, cloud services, energy use, and future profits.",
    glossary: [
      {
        term: "Capex",
        meaning: "Capex means money a company spends on big long-term assets like machines or data centers."
      }
    ]
  },
  {
    id: 5,
    title: "Indian banks focus on deposit growth as credit demand remains active",
    region: "india",
    sector: "Banking",
    company: "Indian Banks",
    source: "Bank disclosures and market commentary",
    sourceUrl: "https://www.bseindia.com/",
    trustedType: "Exchange disclosures",
    publishedAt: "2026-04-20",
    tags: ["Deposits", "Credit", "Banks"],
    summary:
      "Banks are trying to attract more savings while continuing to lend to households and businesses.",
    simple: {
      english:
        "Banks need more money coming in from customers so they can continue giving loans safely.",
      hinglish:
        "Banks ko customers se zyada paisa deposit mein chahiye, taki woh aage loan dena smoothly continue kar sakein.",
      marathi:
        "Banks na customer kadeun adhik deposit pahijet, mhanje te surakshit pane pudhe loans deu shaktat."
    },
    highLevel:
      "Banks want more deposits so they can keep lending safely.",
    whyItMatters:
      "Deposit growth helps banks stay strong while meeting loan demand in the economy.",
    glossary: [
      {
        term: "Deposit",
        meaning: "Deposit is money customers keep in a bank account."
      },
      {
        term: "Credit",
        meaning: "Credit means borrowed money that must be repaid later."
      }
    ]
  },
  {
    id: 6,
    title: "Global inflation trends remain important for rate-cut expectations",
    region: "global",
    sector: "Macro Economy",
    company: "Central Banks",
    source: "Official inflation releases",
    sourceUrl: "https://www.imf.org/",
    trustedType: "Official data",
    publishedAt: "2026-04-20",
    tags: ["Inflation", "Rate Cut", "Economy"],
    summary:
      "Investors are tracking whether inflation is cooling enough for central banks to lower rates.",
    simple: {
      english:
        "If price increases slow down, central banks may feel safer about cutting interest rates.",
      hinglish:
        "Agar prices ka fast badhna slow ho gaya, toh central banks rates kam karne ke baare mein soch sakte hain.",
      marathi:
        "Jar prices vadnyacha veg kami jhala, tar central banks rates kami karaycha vichar karu shaktat."
    },
    highLevel:
      "If inflation cools, borrowing rates may come down later.",
    whyItMatters:
      "Lower rates can influence borrowing, investing, business expansion, and stock prices.",
    glossary: [
      {
        term: "Rate Cut",
        meaning: "Rate cut means the central bank lowers key interest rates."
      }
    ]
  }
];

module.exports = {
  newsItems
};
