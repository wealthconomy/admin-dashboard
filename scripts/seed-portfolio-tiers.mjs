/**
 * Automated batch script to seed interest rate tiers for:
 * - WealthGoal (WEALTH_GOAL)
 * - WealthFam  (WEALTH_FAM)
 * - WealthFlow (WEALTH_FLOW)
 * - WealthGroup(WEALTH_GROUP)
 * 
 * Uses the exact 16-band time/amount/rate structure from WealthFix.
 * Leaves WealthFlex untouched.
 */

import https from "node:https";
import readline from "node:readline";

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://backend-5kr0.onrender.com";
const API_PREFIX = "/api/v1";

const PORTFOLIOS = [
  { type: "WEALTH_GOAL", prefix: "Goal", label: "WealthGoal" },
  { type: "WEALTH_FAM", prefix: "Family", label: "WealthFam" },
  { type: "WEALTH_FLOW", prefix: "Flow", label: "WealthFlow" },
  { type: "WEALTH_GROUP", prefix: "Group", label: "WealthGroup" },
];

/**
 * 16 bands patterned after WealthFix:
 * 4 amount bands x 4 duration bands
 */
const BANDS = [
  // 1) Starter (₦1k - ₦500k)
  { tierClass: "Starter Tier", amountLabel: "₦1k - ₦500k", minNaira: 1000, maxNaira: 500000, durationLabel: "30-90 Days", minDays: 30, maxDays: 90, rate: 12 },
  { tierClass: "Starter Tier", amountLabel: "₦1k - ₦500k", minNaira: 1000, maxNaira: 500000, durationLabel: "91-180 Days", minDays: 91, maxDays: 180, rate: 13.5 },
  { tierClass: "Starter Tier", amountLabel: "₦1k - ₦500k", minNaira: 1000, maxNaira: 500000, durationLabel: "181-365 Days", minDays: 181, maxDays: 365, rate: 15 },
  { tierClass: "Starter Tier", amountLabel: "₦1k - ₦500k", minNaira: 1000, maxNaira: 500000, durationLabel: ">365 Days", minDays: 366, maxDays: null, rate: 16.5 },

  // 2) Growth (₦501k - ₦1m)
  { tierClass: "Growth Tier", amountLabel: "₦501k - ₦1m", minNaira: 500001, maxNaira: 1000000, durationLabel: "30-90 Days", minDays: 30, maxDays: 90, rate: 13.5 },
  { tierClass: "Growth Tier", amountLabel: "₦501k - ₦1m", minNaira: 500001, maxNaira: 1000000, durationLabel: "91-180 Days", minDays: 91, maxDays: 180, rate: 15 },
  { tierClass: "Growth Tier", amountLabel: "₦501k - ₦1m", minNaira: 500001, maxNaira: 1000000, durationLabel: "181-365 Days", minDays: 181, maxDays: 365, rate: 16.5 },
  { tierClass: "Growth Tier", amountLabel: "₦501k - ₦1m", minNaira: 500001, maxNaira: 1000000, durationLabel: ">365 Days", minDays: 366, maxDays: null, rate: 18 },

  // 3) Premium (₦1m - ₦5m)
  { tierClass: "Premium Tier", amountLabel: "₦1m - ₦5m", minNaira: 1000001, maxNaira: 5000000, durationLabel: "30-90 Days", minDays: 30, maxDays: 90, rate: 15 },
  { tierClass: "Premium Tier", amountLabel: "₦1m - ₦5m", minNaira: 1000001, maxNaira: 5000000, durationLabel: "91-180 Days", minDays: 91, maxDays: 180, rate: 16.5 },
  { tierClass: "Premium Tier", amountLabel: "₦1m - ₦5m", minNaira: 1000001, maxNaira: 5000000, durationLabel: "181-365 Days", minDays: 181, maxDays: 365, rate: 18 },
  { tierClass: "Premium Tier", amountLabel: "₦1m - ₦5m", minNaira: 1000001, maxNaira: 5000000, durationLabel: ">365 Days", minDays: 366, maxDays: null, rate: 19.5 },

  // 4) Platinum (Above ₦5m)
  { tierClass: "Platinum Tier", amountLabel: "Above ₦5m", minNaira: 5000001, maxNaira: null, durationLabel: "30-90 Days", minDays: 30, maxDays: 90, rate: 16.5 },
  { tierClass: "Platinum Tier", amountLabel: "Above ₦5m", minNaira: 5000001, maxNaira: null, durationLabel: "91-180 Days", minDays: 91, maxDays: 180, rate: 18 },
  { tierClass: "Platinum Tier", amountLabel: "Above ₦5m", minNaira: 5000001, maxNaira: null, durationLabel: "181-365 Days", minDays: 181, maxDays: 365, rate: 20 },
  { tierClass: "Platinum Tier", amountLabel: "Above ₦5m", minNaira: 5000001, maxNaira: null, durationLabel: ">365 Days", minDays: 366, maxDays: null, rate: 22 },
];

function request(urlStr, method, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || data}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data || e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(email, password) {
  console.log(`Authenticating ${email}...`);
  const res = /** @type {any} */ (
    await request(`${API_BASE_URL}${API_PREFIX}/auth/login`, "POST", {}, { email, password })
  );
  const token = res.data?.accessToken || res.accessToken;
  if (!token) throw new Error("No accessToken returned in login response.");
  return token;
}

async function getExistingTiers(token, portfolioType) {
  try {
    const res = /** @type {any} */ (
      await request(
        `${API_BASE_URL}${API_PREFIX}/admin/interest-tiers?portfolioType=${portfolioType}&limit=100`,
        "GET",
        { Authorization: `Bearer ${token}` }
      )
    );
    const items = res.data?.items || res.items || (Array.isArray(res.data) ? res.data : []);
    return items;
  } catch (err) {
    console.warn(`Could not check existing tiers for ${portfolioType}: ${err.message}`);
    return [];
  }
}

async function createTier(token, payload) {
  return request(
    `${API_BASE_URL}${API_PREFIX}/admin/interest-tiers`,
    "POST",
    { Authorization: `Bearer ${token}` },
    payload
  );
}

function promptLine(promptText) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(promptText, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  console.log("=".repeat(70));
  console.log("Wealthconomy - Automated Interest Tiers Seeder");
  console.log("=".repeat(70));
  console.log(`Target API: ${API_BASE_URL}${API_PREFIX}\n`);

  let token = process.env.ADMIN_TOKEN;
  let isDryRun = false;

  // Check args
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--token=")) token = arg.slice(8);
    if (arg === "--dry-run") isDryRun = true;
  }

  if (isDryRun) {
    console.log("[DRY RUN MODE] Simulating tier generation without sending network requests.\n");
  } else if (!token) {
    const email = process.env.ADMIN_EMAIL || (await promptLine("Admin Email: "));
    const password = process.env.ADMIN_PASSWORD || (await promptLine("Admin Password: "));
    if (!email || !password) {
      console.error("Email and password required.");
      process.exit(1);
    }
    token = await login(email, password);
    console.log("Authentication successful!\n");
  } else {
    console.log("Using provided admin bearer token.\n");
  }

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const port of PORTFOLIOS) {
    console.log(`\nProcessing ${port.label} (${port.type})...`);
    const existing = isDryRun ? [] : await getExistingTiers(token, port.type);
    if (!isDryRun) {
      console.log(`Found ${existing.length} existing tier(s) for ${port.label}.`);
    }

    for (const b of BANDS) {
      const tierName = `${port.prefix} ${b.tierClass} (${b.amountLabel}, ${b.durationLabel})`;
      const minAmountKobo = Math.round(b.minNaira * 100);
      const maxAmountKobo = b.maxNaira ? Math.round(b.maxNaira * 100) : null;

      // Duplicate check by name or identical range
      const alreadyExists = existing.some(
        (e) =>
          e.name === tierName ||
          (Number(e.minAmountKobo) === minAmountKobo &&
            (e.maxAmountKobo == null ? null : Number(e.maxAmountKobo)) === maxAmountKobo &&
            (e.minDurationDays ?? null) === b.minDays &&
            (e.maxDurationDays ?? null) === b.maxDays)
      );

      if (alreadyExists) {
        console.log(`  [SKIP] ${tierName} (already exists)`);
        totalSkipped++;
        continue;
      }

      const payload = {
        name: tierName,
        portfolioType: port.type,
        minAmountKobo,
        maxAmountKobo,
        minDurationDays: b.minDays,
        maxDurationDays: b.maxDays,
        annualRatePct: b.rate,
        isActive: true,
      };

      if (isDryRun) {
        console.log(`  [WOULD CREATE] ${tierName} -> ${b.rate}% P.A.`);
        totalCreated++;
        continue;
      }

      try {
        await createTier(token, payload);
        console.log(`  [CREATED] ${tierName} -> ${b.rate}% P.A.`);
        totalCreated++;
      } catch (err) {
        console.error(`  [FAILED] ${tierName}: ${err.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`Done! Created: ${totalCreated} tier(s). Skipped: ${totalSkipped} existing tier(s).`);
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
