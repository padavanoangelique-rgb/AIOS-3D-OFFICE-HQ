const { open } = require("./run.js");
(async () => {
  for (const phone of [false, true]) {
    const t = await open({ phone }), p = t.page, tag = phone ? "phone" : "desk";
    await p.waitForSelector("#office3d.ready", { timeout:15000 });
    await p.waitForTimeout(800); await t.shot("s1-" + tag);
    const box = await p.locator(".o3-host canvas").boundingBox();
    const cx = box.x + box.width/2, cy = box.y + box.height/2;
    await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx+90, cy+40, { steps:6 }); await p.mouse.up();
    await p.mouse.wheel(0, -900); await p.click("[data-o3=right]"); await p.waitForTimeout(900); await t.shot("s1-" + tag + "-moved");
    await p.click("[data-o3=home]"); await p.waitForTimeout(900);
    await p.click("[data-o3='2d']"); await p.waitForTimeout(300);
    console.log(tag, "2D visible:", await p.locator("#main .city").isVisible(), "office hidden:", await p.locator("#office3d").isHidden(), "pref:", await p.evaluate(() => localStorage.getItem("aios2-3d")));
    await t.shot("s1-" + tag + "-2d");
    await p.click("#nav [data-o3=on]"); await p.waitForTimeout(400);
    console.log(tag, "back in office:", await p.locator("#office3d").isVisible(), "nav buttons:", await p.locator("#nav button").count());
    await p.click("#nav [data-act=view][data-id=tasks]"); await p.waitForTimeout(200);
    console.log(tag, "nav to tasks leaves office:", await p.locator("#office3d").isHidden(), await p.locator("#main .kan").isVisible());
    console.log(tag, "log:", t.log); await t.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
