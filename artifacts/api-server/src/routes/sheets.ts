import { Router } from "express";

const router = Router();

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing required Google API credentials");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!resp.ok) {
    throw new Error(`Token exchange failed: ${resp.status}`);
  }

  const data = await resp.json() as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token returned");
  return data.access_token;
}

router.get("/sheets/:spreadsheetId/:range", async (req, res) => {
  const { spreadsheetId, range } = req.params;
  const { valueRenderOption = "UNFORMATTED_VALUE", dateTimeRenderOption = "FORMATTED_STRING", alt } = req.query as Record<string, string>;

  try {
    const accessToken = await getAccessToken();
    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`);
    if (alt) url.searchParams.set("alt", alt);
    else {
      url.searchParams.set("valueRenderOption", valueRenderOption);
      url.searchParams.set("dateTimeRenderOption", dateTimeRenderOption);
    }

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `Sheets fetch failed: ${text}` });
    }

    const data = await resp.json();
    return res.json(data);
  } catch (err: any) {
    req.log.warn({ err }, "Sheets proxy unavailable");
    return res.status(503).json({ error: err.message || "Sheets proxy unavailable", values: [] });
  }
});

router.post("/sheets/:spreadsheetId/batchGet", async (req, res) => {
  const { spreadsheetId } = req.params;
  const { ranges, valueRenderOption = "UNFORMATTED_VALUE", dateTimeRenderOption = "FORMATTED_STRING" } = req.body as {
    ranges: string[];
    valueRenderOption?: string;
    dateTimeRenderOption?: string;
  };

  if (!Array.isArray(ranges) || ranges.length === 0) {
    return res.status(400).json({ error: "ranges must be a non-empty array" });
  }

  try {
    const accessToken = await getAccessToken();
    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet`);
    ranges.forEach((r) => url.searchParams.append("ranges", r));
    url.searchParams.set("valueRenderOption", valueRenderOption);
    url.searchParams.set("dateTimeRenderOption", dateTimeRenderOption);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `Sheets batch fetch failed: ${text}` });
    }

    const data = await resp.json();
    return res.json(data);
  } catch (err: any) {
    req.log.warn({ err }, "Sheets batch proxy unavailable");
    return res.status(503).json({ error: err.message || "Sheets batch proxy unavailable" });
  }
});

export default router;
