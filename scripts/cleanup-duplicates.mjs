import https from "node:https";

const API_BASE_URL = "https://backend-5kr0.onrender.com/api/v1";
const token = process.argv[2] || process.env.ADMIN_TOKEN;

if (!token) {
  console.error("Token required: node scripts/cleanup-duplicates.mjs <token>");
  process.exit(1);
}

const PORTFOLIOS = [
  "WEALTH_FIX",
  "WEALTH_FLEX",
  "WEALTH_GOAL",
  "WEALTH_FAM",
  "WEALTH_FLOW",
];

function request(urlStr, method) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            const j = d ? JSON.parse(d) : {};
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(j);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${j.message || d}`));
            }
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function getAllTiersFor(p) {
  const items = [];
  let page = 1;
  while (true) {
    const res = await request(
      `${API_BASE_URL}/admin/interest-tiers?portfolioType=${p}&page=${page}&limit=50`,
      "GET"
    );
    const pageItems = res.data?.items || res.items || [];
    items.push(...pageItems);
    const pageCount = res.data?.pageCount || res.pageCount || 1;
    if (page >= pageCount || pageItems.length === 0) break;
    page++;
  }
  return items;
}

async function main() {
  console.log("Starting duplicate tiers cleanup...");
  let totalDeleted = 0;

  for (const p of PORTFOLIOS) {
    console.log(`\nChecking ${p}...`);
    const all = await getAllTiersFor(p);
    console.log(`Found ${all.length} tier(s) in ${p}.`);

    // Group by tier name
    const grouped = new Map();
    for (const t of all) {
      const key = t.name.trim();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(t);
    }

    for (const [name, list] of grouped.entries()) {
      if (list.length > 1) {
        // Sort newest first by updatedAt, fallback to createdAt
        list.sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt).getTime();
          const tb = new Date(b.updatedAt || b.createdAt).getTime();
          return tb - ta; // newest first
        });

        const toKeep = list[0];
        const duplicates = list.slice(1);

        console.log(`  Tier: "${name}" has ${list.length} copies:`);
        console.log(`    KEEPING: ID=${toKeep.id} Rate=${toKeep.annualRatePct}% (Updated: ${toKeep.updatedAt})`);

        for (const dup of duplicates) {
          console.log(`    DELETING DUPLICATE: ID=${dup.id} Rate=${dup.annualRatePct}% (Created: ${dup.createdAt})`);
          try {
            await request(`${API_BASE_URL}/admin/interest-tiers/${dup.id}`, "DELETE");
            console.log(`      ✓ Deleted ID=${dup.id}`);
            totalDeleted++;
          } catch (err) {
            console.error(`      ✗ Failed to delete ID=${dup.id}: ${err.message}`);
          }
        }
      }
    }
  }

  console.log(`\nCleanup finished! Successfully deleted ${totalDeleted} duplicate tier(s).`);
}

main().catch((err) => {
  console.error("Fatal cleanup error:", err);
  process.exit(1);
});
