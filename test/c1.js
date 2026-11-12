const { open } = require("./run.js");
(async () => {
  for (const phone of [false, true]) {
    const t = await open({ phone, unlocked:true, init:() => localStorage.setItem("aios-owner-token", "test-not-a-real-key-000") }), p = t.page, tag = phone ? "phone" : "desk";
    const tapAt = (x, y) => phone ? p.touchscreen.tap(x, y) : p.mouse.click(x, y);
    const errs = () => t.log.filter(l => !l.includes("ERR_FAILED"));
    await p.waitForSelector("#office3d.ready", { timeout:15000 }); await p.waitForSelector(".o3-bld"); await p.waitForTimeout(1200);
    await t.shot("c1-" + tag);
    console.log(tag, "signs:", (await p.locator(".o3-bld .full").allTextContents()).join(" | "));
    console.log(tag, "HQ:", await p.locator(".o3-bld.hq small").textContent(), "| xp:", await p.locator(".o3-xp").textContent(), "| nav:", (await p.locator("#nav button:visible span").allTextContents()).join(","));
    // team list: assign businesses (synced through the new function)
    if (phone || true) await p.click("[data-o3=team]"); await p.waitForTimeout(200);
    console.log(tag, "team rows:", await p.locator(".o3-team .o3-pick").count(), "| docked panels:", await p.locator(".o3-team:visible, .o3-sheet:not(.o3-file):visible").count());
    await p.locator("select[data-o3-move=claude]").selectOption("ezbuilder");
    await p.locator("select[data-o3-move=maximus]").selectOption("majestic"); await p.waitForTimeout(500);
    console.log(tag, "room writes:", t.state.writes.filter(w => w.startsWith("city:")).join(" "));
    await p.click("[data-o3=team-close]");
    // tap a building: business file, add + delete a note
    const sg = await p.locator(".o3-bld", { hasText: phone ? "Closer" : "The Permit Closer" }).first().boundingBox();
    await tapAt(sg.x + sg.width/2, sg.y + sg.height + (phone ? 14 : 24)); await p.waitForTimeout(700);
    console.log(tag, "file:", await p.locator(".o3-file").isVisible() && await p.locator(".o3-file h2").textContent());
    await p.locator(".o3-file textarea").fill("Close 10 permits this month https://example.com/plan");
    await p.locator(".o3-add select").selectOption("goal"); await p.click("[data-o3=note-add]"); await p.waitForTimeout(500);
    console.log(tag, "notes shown:", await p.locator(".o3-note").count(), "| link:", await p.locator(".o3-note a").count(), "| sign:", await p.locator(".o3-bld", { hasText:"Closer" }).first().locator("small").textContent());
    await t.shot("c1-" + tag + "-file");
    await p.locator("[data-o3=note-del]").first().click(); await p.waitForTimeout(400);
    console.log(tag, "after delete:", await p.locator(".o3-note").count()); await p.click("[data-o3=file-close]");
    // quest stand
    const qs = await p.locator(".o3-bld.quest").boundingBox();
    await tapAt(qs.x + qs.width/2, qs.y + qs.height + (phone ? 8 : 14)); await p.waitForTimeout(600);
    console.log(tag, "quest card:", await p.locator(".o3-card").isVisible() && (await p.locator(".o3-card button").allTextContents()).join(","));
    await p.locator(".o3-card [data-act=quest]").click(); await p.waitForTimeout(300);
    console.log(tag, "quest write:", t.state.writes.filter(w => w.includes('"quest"')).join(" ")); await p.click("[data-o3=card-close]").catch(() => {});
    // agent: walk + card + talk
    await p.click("[data-o3=home]"); await p.waitForTimeout(1500);
    const nb = await p.locator(".o3-name", { hasText:"Giles" }).boundingBox();
    await tapAt(nb.x + nb.width/2, nb.y - (phone ? 9 : 14)); await p.waitForTimeout(3000);
    console.log(tag, "card:", await p.locator(".o3-card .who b").textContent(), "| buttons:", (await p.locator(".o3-card button").allTextContents()).join(","));
    await p.mouse.move(640, 400); await p.mouse.wheel(0, -2200); await p.waitForTimeout(900); await t.shot("c1-" + tag + "-agent");
    await p.locator(".o3-card [data-act=chat]").click(); await p.waitForTimeout(400);
    console.log(tag, "talk opens chat:", await p.locator("#main #chat").isVisible());
    await p.click("#nav [data-o3=on]"); await p.waitForTimeout(300); await p.click("[data-o3=home]"); await p.waitForTimeout(1300);
    const bb = await p.locator(".o3-badge").boundingBox();
    await tapAt(bb.x - 30, bb.y + 14); await p.waitForTimeout(400);
    console.log(tag, "board cards:", await p.locator(".o3-sheet:not(.o3-file) .card").count());
    // let agents stroll for a while, then look
    await p.click("[data-o3=home]"); await p.waitForTimeout(16000); await t.shot("c1-" + tag + "-later");
    console.log(tag, "errors:", errs()); await t.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
