const fs = require("fs");
const fetch = require("node-fetch");

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
    if (!d.length) break;
    all.push(...d);
    page++;
  }
  return all.filter(r => !r.fork);
}

async function getLangs(url) {
  const r = await fetch(url, { headers });
  return await r.json();
}

const repos = await getRepos();
const totals = {};

for (const r of repos) {
  const langs = await getLangs(r.languages_url);
  for (const [k, v] of Object.entries(langs)) {
    totals[k] = (totals[k] || 0) + v;
  }
}

const sum = Object.values(totals).reduce((a,b)=>a+b,0);
const top = Object.entries(totals)
  .sort((a,b)=>b[1]-a[1])
  .slice(0,10);

let y = 30;
const rows = top.map(([k,v]) => {
  const p = ((v/sum)*100).toFixed(1);
  const line = `<text x="20" y="${y}">${k} ${p}%</text>`;
  y += 18;
  return line;
}).join("");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${y}">
<style>
text { font: 13px monospace; fill: #333 }
</style>
<text x="20" y="18">Languages (public + private)</text>
${rows}
</svg>
`;

fs.writeFileSync("languages.svg", svg);
