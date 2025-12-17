const fs = require("fs");

const token = process.env.GH_TOKEN;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
};

async function getRepos() {
  let all = [], page = 1;
  while (true) {
    const r = await fetch(
      `https://api.github.com/user/repos?visibility=all&per_page=100&page=${page}`,
      { headers }
    );
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) break;
    all.push(...d);
    page++;
  }
  return all.filter(r => !r.fork);
}

async function getLangs(url) {
  const r = await fetch(url, { headers });
  return await r.json();
}

(async () => {
  const repos = await getRepos();
  const totals = {};

  for (const r of repos) {
    const langs = await getLangs(r.languages_url);
    for (const [lang, bytes] of Object.entries(langs || {})) {
      totals[lang] = (totals[lang] || 0) + bytes;
    }
  }

  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const MIN_PCT = 0.0035; // 0.35%

  const top = Object.entries(totals)
    .filter(([, bytes]) => bytes / sum >= MIN_PCT)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const colorMap = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Python: "#3572A5",
    Java: "#b07219",
    SCSS: "#c6538c",
    Handlebars: "#f7931e",
    EJS: "#a91e50",
    "Jupyter Notebook": "#DA5B0B",
  };

  const barWidth = 300;
  let x = 20;

  let stackedBar = "";
  let legend = "";

  const leftX = 20;
  const rightX = 220;
  let leftY = 52;
  let rightY = 52;

  top.forEach(([lang, bytes], i) => {
    const pct = bytes / sum;
    const w = Math.max(2, Math.round(barWidth * pct));
    const color = colorMap[lang] || "#999";

    // stacked bar
    stackedBar += `<rect x="${x}" y="32" width="${w}" height="10" rx="5" fill="${color}" />`;
    x += w;

    // 2-column legend
    const isLeft = i % 2 === 0;
    const cx = isLeft ? leftX : rightX;
    const cy = isLeft ? leftY : rightY;

    legend += `
      <circle cx="${cx}" cy="${cy}" r="4" fill="${color}" />
      <text x="${cx + 10}" y="${cy + 4}" font-size="12">
        ${lang} ${(pct * 100).toFixed(2)}%
      </text>
    `;

    if (isLeft) leftY += 20;
    else rightY += 20;
  });

  const height = Math.max(leftY, rightY) + 16;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="${height}">
  <style>
    text {
      font-family: system-ui, -apple-system, BlinkMacSystemFont;
      fill: #333;
    }
  </style>

  <text x="20" y="18" font-size="18" font-weight="600">
    Most Used Languages
  </text>

  ${stackedBar}
  ${legend}
</svg>
`;

  fs.writeFileSync("languages.svg", svg);
})();
