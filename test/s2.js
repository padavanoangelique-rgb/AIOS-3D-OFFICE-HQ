const { open } = require("./run.js");
(async () => {
  for (const phone of [false, true]) {
    const t = await open({ phone }), p = t.page, tag = phone ? "phone" : "desk";
    await p.waitForSelector("#office3d.ready", { timeout:15000 });
    await p.waitForSelector(".o3-name"); await p.waitForTimeout(800); await t.shot("s2-" + tag);
    console.log(tag, "name tags:", await p.locator(".o3-name").count(), "working:", await p.locator(".o3-name.working").count());
    const box = await p.locator(".o3-host canvas").boundingBox();
    await p.mouse.move(box.x + box.width*.6, box.y + box.height*.3); await p.mouse.wheel(0, -1500);
    await p.mouse.down(); await p.mouse.move(box.x + box.width*.4, box.y + box.height*.75, { steps:8 }); await p.mouse.up();
    await p.waitForTimeout(900); await t.shot("s2-" + tag + "-zoom");
    console.log(tag, "log:", t.log.filter(l => !l.includes("ERR_FAILED"))); await t.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
