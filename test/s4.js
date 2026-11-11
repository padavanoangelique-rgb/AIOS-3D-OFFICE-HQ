const { open } = require("./run.js");
(async () => {
  for (const phone of [false, true]) {
    const t = await open({ phone, unlocked:true, init:() => localStorage.setItem("aios-owner-token", "test-not-a-real-key") }), p = t.page, tag = phone ? "phone" : "desk";
    const tapAt = (x, y) => phone ? p.touchscreen.tap(x, y) : p.mouse.click(x, y);
    await p.waitForSelector("#office3d.ready", { timeout:15000 }); await p.waitForSelector(".o3-badge"); await p.waitForTimeout(900);
    await t.shot("s4-" + tag);
    console.log(tag, "badge:", await p.locator(".o3-badge").textContent());
    // tap a bot -> the dashboard's own drawer
    const nb = await p.locator(".o3-name", { hasText:"Claude" }).boundingBox();
    await tapAt(nb.x + nb.width/2, nb.y - (phone ? 14 : 22)); await p.waitForTimeout(400);
    console.log(tag, "drawer:", await p.locator("#drawer").isVisible() && await p.locator("#drawer .nm").textContent(), "| has Open chat:", await p.locator("#drawer [data-act=chat]").count());
    await t.shot("s4-" + tag + "-drawer");
    await p.click("#drawer [data-act=close]");
    // tap the whiteboard -> decision sheet
    const bb = await p.locator(".o3-badge").boundingBox();
    await tapAt(bb.x - 40, bb.y + 18); await p.waitForTimeout(400);
    console.log(tag, "sheet:", await p.locator(".o3-sheet").isVisible(), "cards:", await p.locator(".o3-sheet .card").count());
    await t.shot("s4-" + tag + "-sheet");
    await p.locator(".o3-sheet [data-act=resolve][data-state=approved]").first().click(); await p.waitForTimeout(900);
    console.log(tag, "write sent:", t.state.writes.filter(w => w.includes("resolve")), "| cards now:", await p.locator(".o3-sheet .card").count(), "badge:", await p.locator(".o3-badge").textContent());
    await p.locator(".o3-sheet [data-act=answer]").click(); await p.waitForTimeout(200);
    console.log(tag, "answer form (dashboard modal):", await p.locator("#modal form h3").textContent());
    await p.click("#modal [data-x=cancel]");
    await p.locator(".o3-sheet [data-act=chat]").first().click(); await p.waitForTimeout(400);
    console.log(tag, "chat opened:", await p.locator("#main #chat").isVisible(), "office hidden:", await p.locator("#office3d").isHidden());
    await p.click("#nav [data-o3=on]"); await p.waitForTimeout(300);
    await p.click("[data-o3=sheet-close]"); console.log(tag, "sheet closed:", await p.locator(".o3-sheet").isHidden());
    // tap a room floor -> camera flies there, names appear
    const sg = await p.locator(".o3-sign", { hasText:"CLOSER" }).boundingBox();
    await tapAt(sg.x + sg.width/2, sg.y + (phone ? 70 : 60)); await p.waitForTimeout(1200);
    console.log(tag, "zoomed (names readable):", !(await p.locator(".o3-ov.tiny").count()));
    await t.shot("s4-" + tag + "-room");
    console.log(tag, "log:", t.log.filter(l => !l.includes("ERR_FAILED"))); await t.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
