const SHEETS = {
  guests: "Guests",
  rsvp: "RSVP",
  gifts: "Gifts",
  contributions: "Contributions",
  settings: "Settings",
  club: "Club",
};

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function rowsToObjects(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0].map((h) => String(h));
  return values.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, i) => {
      item[header] = row[i];
    });
    return item;
  });
}

function ensureHeaders(sh, headers) {
  if (sh.getLastRow() === 0) sh.appendRow(headers);
}

function settingsObject() {
  const values = sheet(SHEETS.settings).getDataRange().getValues();
  const map = {};
  values.forEach((row) => {
    if (row[0]) map[String(row[0])] = row[1];
  });
  return {
    clpName: map.clpName || "{{CLP_ACCOUNT_NAME}}",
    clpRut: map.clpRut || "{{CLP_RUT}}",
    clpBank: map.clpBank || "{{CLP_BANK}}",
    clpAccountType: map.clpAccountType || "{{CLP_ACCOUNT_TYPE}}",
    clpAccountNumber: map.clpAccountNumber || "{{CLP_ACCOUNT_NUMBER}}",
    clpEmail: map.clpEmail || "{{CLP_EMAIL}}",
    interacName: map.interacName || "{{INTERAC_NAME}}",
    interacEmail: map.interacEmail || "{{INTERAC_EMAIL}}",
    interacAutodeposit: String(map.interacAutodeposit) !== "false",
    zelleName: map.zelleName || "{{ZELLE_NAME}}",
    zelleContact: map.zelleContact || "{{ZELLE_EMAIL_OR_PHONE}}",
    wiseLink: map.wiseLink || "{{WISE_PAYMENT_LINK}}",
    wiseEmail: map.wiseEmail || "{{WISE_EMAIL}}",
    wiseQr: map.wiseQr || "",
    usdToClp: Number(map.usdToClp || 950),
    usdToCad: Number(map.usdToCad || 1.38),
  };
}

function writeSettings(settings) {
  const sh = sheet(SHEETS.settings);
  sh.clear();
  Object.keys(settings).forEach((key) => sh.appendRow([key, settings[key]]));
}

function publicGifts() {
  const contrib = rowsToObjects(sheet(SHEETS.contributions).getDataRange().getValues());
  const gifts = rowsToObjects(sheet(SHEETS.gifts).getDataRange().getValues());
  return gifts.map((gift) => {
    const confirmedUsd = contrib
      .filter((c) => c.giftId === gift.id && c.status === "confirmed")
      .reduce((sum, c) => sum + Number(c.amountUsdNormalized || 0), 0);
    const target = gift.targetUsd === "" || gift.targetUsd == null ? null : Number(gift.targetUsd);
    return {
      ...gift,
      targetUsd: target,
      confirmedUsd,
      status: target != null && confirmedUsd >= target ? "funded" : "active",
      sortOrder: Number(gift.sortOrder || 0),
    };
  });
}

function requireAdmin(token) {
  const expected = PropertiesService.getScriptProperties().getProperty("ADMIN_TOKEN");
  if (!expected || token !== expected) throw new Error("Unauthorized");
}

function doGet(e) {
  const action = (e.parameter.action || "").trim();
  if (action === "guest") {
    const code = String(e.parameter.code || "").trim();
    const guests = rowsToObjects(sheet(SHEETS.guests).getDataRange().getValues());
    const guest = guests.find((g) => String(g.id) === code) || null;
    return json({ guest });
  }
  if (action === "gifts") return json({ gifts: publicGifts() });
  if (action === "settings") return json({ settings: settingsObject() });
  if (action === "club") {
    const messages = rowsToObjects(sheet(SHEETS.club).getDataRange().getValues());
    return json({ messages });
  }
  return json({ ok: true, name: "InvitadosMatri" });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || "{}");
  const action = body.action;
  try {
    if (action === "rsvp") {
      const sh = sheet(SHEETS.rsvp);
      ensureHeaders(sh, ["id", "guestId", "displayName", "attending", "people", "children", "danceSong", "message", "createdAt"]);
      const r = body.record;
      sh.appendRow([
        r.id,
        r.guestId,
        r.displayName,
        r.attending,
        JSON.stringify(r.people || []),
        JSON.stringify(r.children || []),
        r.danceSong || "",
        r.message || "",
        r.createdAt,
      ]);
      return json({ ok: true });
    }
    if (action === "contribute") {
      const sh = sheet(SHEETS.contributions);
      ensureHeaders(sh, [
        "id",
        "giftId",
        "guestId",
        "name",
        "email",
        "amountOriginal",
        "currencyOriginal",
        "fxRateUsed",
        "amountUsdNormalized",
        "method",
        "dedication",
        "anonymous",
        "status",
        "createdAt",
        "confirmedAt",
      ]);
      const r = body.record;
      sh.appendRow([
        r.id,
        r.giftId,
        r.guestId,
        r.name,
        r.email,
        r.amountOriginal,
        r.currencyOriginal,
        r.fxRateUsed,
        r.amountUsdNormalized,
        r.method,
        r.dedication,
        r.anonymous,
        "pending",
        r.createdAt,
        "",
      ]);
      return json({ ok: true });
    }
    if (action === "clubPost") {
      const sh = sheet(SHEETS.club);
      ensureHeaders(sh, ["id", "guestId", "displayName", "message", "createdAt"]);
      const r = body.record;
      sh.appendRow([r.id, r.guestId, r.displayName, r.message, r.createdAt]);
      return json({ ok: true });
    }
    if (action === "adminList") {
      requireAdmin(body.token);
      return json({ contributions: rowsToObjects(sheet(SHEETS.contributions).getDataRange().getValues()) });
    }
    if (action === "adminStatus") {
      requireAdmin(body.token);
      const sh = sheet(SHEETS.contributions);
      const values = sh.getDataRange().getValues();
      const headers = values[0];
      const idIdx = headers.indexOf("id");
      const statusIdx = headers.indexOf("status");
      const confirmedIdx = headers.indexOf("confirmedAt");
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idIdx]) === String(body.id)) {
          sh.getRange(i + 1, statusIdx + 1).setValue(body.status);
          if (body.status === "confirmed") sh.getRange(i + 1, confirmedIdx + 1).setValue(new Date().toISOString());
        }
      }
      return json({ ok: true });
    }
    if (action === "adminSettings") {
      requireAdmin(body.token);
      writeSettings(body.settings);
      return json({ ok: true });
    }
    return json({ error: "Unknown action" });
  } catch (err) {
    return json({ error: String(err) });
  }
}
