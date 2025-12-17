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
    for (const [k, v] of Object.entries(langs || {})) {
      totals[k] = (totals[k] || 0) + v;
    }
  }

  const sum = Object.values(totals).reduce((a,b)=>a+b,0) || 1;
  const top = Object.entries(totals)
    .sort((a,b)=>b[1]-a[1])
    .slice(0, 10);

  const colors = [
    "#f1e05a", "#3178c6", "#3572A5", "#e34c26", "#563d7c",
    "#b07219", "#89e051", "#083fa1", "#555555", "#c6538c"
  ];

  const barMax = 300;
  let y = 48;
  let bars = "";
  let labels = "";

  top.forEach(([lang, bytes], i) => {
    const pct = bytes / sum;
    const w = Math.max(4, Math.round(barMax * pct));
    const color = colors[i % colors.length];

    bars += `<rect x="20" y="${y}" width="${w}" height="12" rx="6" fill="${color}"/>`;
    labels += `<text x="20" y="${y + 28}" font-size="12">${lang} ${(pct*100).toFixed(2)}%</text>`;
    y += 26;
  });

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="${y + 24}">
  <style>
    text { font-family: system-ui, -apple-system, BlinkMacSystemFont; fill: #333 }
  </style>
  <text x="20" y="24" font-size="18" font-weight="600">Most Used Languages</text>
  ${bars}
  ${labels}
</svg>
`;

  fs.writeFileSync("languages.svg", svg);
})();
