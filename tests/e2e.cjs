// End-to-end smoke test. Serve the repo first: python3 -m http.server 8123
// then run: node tests/e2e.cjs   (screenshots land in tests/output/)
// Image search is mocked, so no network access is required.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'output'); fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:8123';
process.chdir(OUT);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 880 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', m => { if (['error','warning'].includes(m.type())) logs.push(m.type()+': '+m.text()); });
  p.on('pageerror', e => logs.push('pageerror: ' + e.message + '\n' + e.stack));
  await p.goto(''+BASE+'/#/');
  // make a test PNG in-page
  const b64 = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 300; const x = c.getContext('2d');
    x.fillStyle = '#2b4c7e'; x.beginPath(); x.arc(200, 150, 120, 0, Math.PI*2); x.fill();
    x.fillStyle = '#f2d16b'; x.font = 'bold 120px sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('A+', 200, 155);
    x.strokeStyle = '#e0603c'; x.lineWidth = 14; x.beginPath(); x.arc(200,150,130,0,Math.PI*2); x.stroke();
    return c.toDataURL('image/png').split(',')[1];
  });
  const png = Buffer.from(b64, 'base64');
  fs.writeFileSync('test.png', png);
  await p.route('https://api.openverse.org/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ page_count: 3, results: Array.from({length: 8}, (_, i) => ({ id: 'id'+i, title: 'Test badge '+i, creator: 'Tester', license: 'by', license_version: '4.0', url: 'https://img.test/full'+i+'.png', thumbnail: 'https://img.test/thumb'+i+'.png', foreign_landing_url: 'https://example.org/'+i, source: 'flickr' })) }) }));
  await p.route('https://img.test/**', r => r.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: png }));

  await p.goto(''+BASE+'/#/new/tops/sweaters/hoodie/dropShoulder');
  await p.waitForSelector('.opt');
  await p.click('.opt >> nth=0');
  await p.waitForSelector('.stage-svg .els', { timeout: 5000, state: 'attached' });
  await p.waitForTimeout(600);
  await p.screenshot({ path: 'd1-empty.png' });
  await p.click('.dz-left [data-add]');
  await p.waitForSelector('.method-big');
  await p.waitForTimeout(900);
  await p.screenshot({ path: 'd2-method.png' });
  await p.click('.method-big[data-m="thick"]');
  await p.click('[data-next]');
  await p.fill('input[name=q]', 'badge');
  await p.press('input[name=q]', 'Enter');
  await p.waitForSelector('.result img');
  await p.waitForTimeout(500);
  await p.click('.result >> nth=0');
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'd3-search.png' });
  await p.click('.result-detail [data-add]');
  await p.waitForSelector('.stage .el', { timeout: 8000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'd4-added-thick.png' });
  for (const m of ['thin','print','patch','integrated']) {
    await p.click(`.method-opt input[value="${m}"]`, { force: true });
    await p.waitForTimeout(1300);
    const st = await p.$('.stage');
    await st.screenshot({ path: `m-${m}.png` });
  }
  // drag element
  const box = await (await p.$('.stage .el .hit')).boundingBox();
  await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await p.mouse.down(); await p.mouse.move(box.x + box.width/2 + 30, box.y + box.height/2 + 40, { steps: 5 }); await p.mouse.up();
  // scale handle
  const hd = await (await p.$('[data-handle="se"]')).boundingBox();
  await p.mouse.move(hd.x + 5, hd.y + 5); await p.mouse.down(); await p.mouse.move(hd.x + 60, hd.y + 60, { steps: 5 }); await p.mouse.up();
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'd5-moved.png' });
  // editor
  await p.click('[data-edit]');
  await p.waitForSelector('.editor-dialog .ed-view');
  await p.waitForTimeout(700);
  await p.screenshot({ path: 'e1-open.png' });
  // rect select
  await p.click('[data-tool="rect"]');
  const vp = await (await p.$('.ed-viewport')).boundingBox();
  await p.mouse.move(vp.x + vp.width*0.35, vp.y + vp.height*0.3); await p.mouse.down();
  await p.mouse.move(vp.x + vp.width*0.6, vp.y + vp.height*0.6, { steps: 6 }); await p.mouse.up();
  await p.click('[data-f="vintage"]');
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'e2-filter.png' });
  await p.click('[data-spanel="filters"] [data-commit]');
  // brush
  await p.click('[data-tool="brush"]');
  await p.mouse.move(vp.x + vp.width*0.3, vp.y + vp.height*0.7); await p.mouse.down();
  await p.mouse.move(vp.x + vp.width*0.7, vp.y + vp.height*0.75, { steps: 10 }); await p.mouse.up();
  // wand
  await p.keyboard.press('Control+d');
  await p.click('[data-tool="wand"]');
  await p.mouse.click(vp.x + vp.width*0.5, vp.y + vp.height*0.5);
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'e3-wand.png' });
  // vectorize
  await p.click('[data-stab="vector"]');
  await p.click('[data-vrun]');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'e4-vector.png' });
  await p.click('[data-spanel="vector"] [data-commit]');
  // transform + crop
  await p.click('[data-stab="transform"]');
  await p.click('[data-tf="rotR"]');
  await p.click('[data-tool="crop"]');
  await p.waitForTimeout(200);
  await p.screenshot({ path: 'e5-crop.png' });
  await p.click('[data-crop-apply]');
  await p.click('[data-stab="history"]');
  await p.waitForTimeout(200);
  await p.screenshot({ path: 'e6-history.png' });
  await p.click('.editor-dialog [data-apply]');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'd6-after-edit.png' });
  // garment tab, change color
  await p.click('.tabs [data-tab="garment"]');
  await p.click('[data-color="#2f5d50"]');
  await p.waitForTimeout(800);
  await p.screenshot({ path: 'd7-garment.png' });
  // export
  await p.click('[data-export]');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('[data-go]')]);
  const path = await dl.path();
  console.log('download', dl.suggestedFilename(), fs.statSync(path).size);
  // undo
  await p.keyboard.press('Control+z');
  await p.waitForTimeout(300);
  // reload persists?
  await p.reload(); await p.waitForTimeout(1500);
  const n = await p.$$eval('.stage .el', els => els.length);
  console.log('elements after reload', n);
  await p.screenshot({ path: 'd8-reload.png' });
  console.log(logs.join('\n'));
  await b.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
