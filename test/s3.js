const { open } = require("./run.js");
(async () => {
  for (const phone of [false, true]) {
    const t = await open({ phone }), p = t.page, tag = phone ? "phone" : "desk";
    t.state.over = { maximus:{ status:"waiting", status_line:"Need your OK on the weekly plan" }, claude:{ status:"working", status_line:"Building the 3D office <b>stage 3</b>" }, nova:{ status:"working", status_line:"" } };
    await p.waitForSelector("#office3d.ready", { timeout:15000 });
    await p.evaluate(() => document.querySelector("[data-act=key]") && 0);
    await p.reload(); await p.waitForSelector(".o3-bub"); await p.waitForTimeout(700); await t.shot("s3-" + tag);
    console.log(tag, "bubbles:", await p.locator(".o3-bub").allTextContents(), "| off:", await p.locator(".o3-name.off").count(), "working:", await p.locator(".o3-name.working").count(), "waiting:", await p.locator(".o3-name.waiting").count(), "| html injected:", await p.locator(".o3-bub b").count());
    const box = await p.locator(".o3-host canvas").boundingBox();
    await p.mouse.move(box.x + box.width*.45, box.y + box.height*(phone ? .3 : .25)); await p.mouse.wheel(0, phone ? -1900 : -1400);
    await p.mouse.down(); await p.mouse.move(box.x + box.width*(phone ? .75 : .5), box.y + box.height*.7, { steps:8 }); await p.mouse.up();
    await p.waitForTimeout(1500); await t.shot("s3-" + tag + "-zoom");
    // frames keep coming while bots are active
    const fps = await p.evaluate(() => new Promise(r => { let n = 0; const c = document.querySelector(".o3-host canvas"), gl = c.getContext("webgl2"); const t0 = performance.now(); (function f(){ n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : r(n); })(); }));
    console.log(tag, "raf/s:", fps, "log:", t.log.filter(l => !l.includes("ERR_FAILED"))); await t.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
