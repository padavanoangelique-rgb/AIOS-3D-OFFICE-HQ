const { open } = require("./run.js");
(async () => {
  for (const phone of [false, true]) {
    const t = await open({ phone, unlocked:true, init:() => localStorage.setItem("aios-owner-token", "test-not-a-real-key") }), p = t.page, tag = phone ? "phone" : "desk";
    const tapAt = (x, y) => phone ? p.touchscreen.tap(x, y) : p.mouse.click(x, y);
    t.state.over = { claude:{ status:"working", status_line:"Building the city" } };
    await p.waitForSelector("#office3d.ready", { timeout:15000 }); await p.waitForSelector(".o3-bld"); await p.waitForTimeout(1000);
    await t.shot("c1-" + tag);
    console.log(tag, "buildings:", await p.locator(".o3-bld .full").allTextContents());
    console.log(tag, "notes:", await p.locator(".o3-bld small").allTextContents(), "| xp:", await p.locator(".o3-xp").textContent(), "| nav:", await p.locator("#nav button:visible span").allTextContents());
    // assign rooms from the list
    await p.click("[data-o3=rooms]"); await p.waitForTimeout(200);
    console.log(tag, "rooms rows:", await p.locator(".o3-pick").count());
    await p.locator("select[data-o3-move=claude]").selectOption("ezbuilder");
    await p.locator("select[data-o3-move=maximus]").selectOption("majestic");
    await p.locator("select[data-o3-move=lou]").selectOption("permitaio");
    await p.waitForTimeout(500); await t.shot("c1-" + tag + "-rooms");
    await p.click("[data-o3=rooms-close]"); await p.waitForTimeout(300);
    console.log(tag, "saved:", await p.evaluate(() => localStorage.getItem("aios2-rooms")), "| notes:", await p.locator(".o3-bld small").allTextContents());
    // tap the ground: character walks, camera follows
    const box = await p.locator(".o3-host canvas").boundingBox();
    const you0 = await p.locator(".o3-name.you").boundingBox();
    await tapAt(box.x + box.width*.5, box.y + box.height*.86); await p.waitForTimeout(2500);
    await p.mouse.move(box.x + box.width*.5, box.y + box.height*.5); await p.mouse.wheel(0, -2600); await p.waitForTimeout(900);
    await t.shot("c1-" + tag + "-walk");
    // tap an agent: card with Talk / Profile / Move
    await p.click("[data-o3=home]"); await p.waitForTimeout(900);
    const nb = await p.locator(".o3-name", { hasText:"Giles" }).boundingBox();
    await tapAt(nb.x + nb.width/2, nb.y - (phone ? 9 : 14)); await p.waitForTimeout(4200);
    console.log(tag, "card:", await p.locator(".o3-card").isVisible() && await p.locator(".o3-card .who b").textContent(), "| buttons:", await p.locator(".o3-card button").allTextContents());
    await p.mouse.wheel(0, -2600); await p.waitForTimeout(900); await t.shot("c1-" + tag + "-agent");
    await p.locator(".o3-card [data-act=chat]").click(); await p.waitForTimeout(400);
    console.log(tag, "talk opens chat:", await p.locator("#main #chat").isVisible(), "| city hidden:", await p.locator("#office3d").isHidden());
    await p.click("#nav [data-o3=on]"); await p.waitForTimeout(300);
    await p.click("[data-o3='2d']"); await p.waitForTimeout(300);
    console.log(tag, "2D city:", await p.locator("#main .city").isVisible(), "| City nav lit:", await p.locator("#nav [data-o3=on].on").count());
    await p.click("#nav [data-o3=on]"); await p.waitForTimeout(300);
    // whiteboard still works
    await p.click("[data-o3=home]"); await p.waitForTimeout(1200);
    const bb = await p.locator(".o3-badge").boundingBox();
    await tapAt(bb.x - 30, bb.y + 14); await p.waitForTimeout(400);
    console.log(tag, "board sheet cards:", await p.locator(".o3-sheet .card").count());
    console.log(tag, "writes to backend:", t.state.writes.filter(w => !/whoami|tasks|threads|"thread"/.test(w)), "log:", t.log.filter(l => !l.includes("ERR_FAILED"))); await t.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
