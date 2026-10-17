import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
let server;
test.beforeAll(async()=>{
 server=createServer(async(req,res)=>{
  const path=decodeURIComponent((req.url||'/').split('?')[0]);
  const relative=path==='/'?'alpha.html':path.slice(1);
  if(relative.includes('..')){res.writeHead(403);res.end();return}
  try{const file=await readFile(resolve(process.cwd(),relative));const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'}[extname(relative)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime});res.end(file)}
  catch{res.writeHead(404);res.end('Not found')}
 });
 await new Promise(ok=>server.listen(4173,'127.0.0.1',ok));
});
test.afterAll(async()=>{await new Promise(ok=>server.close(ok))});
test('district loads and full welcome quest survives refresh',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/alpha.html');
 await expect(page.locator('#screen')).toBeHidden({timeout:20000});
 await page.evaluate(()=>{localStorage.removeItem('altera-alpha-demo-quest-v1');localStorage.removeItem('altera-alpha-demo-home-v1')});
 await page.goto('http://127.0.0.1:4173/alpha-interior.html?room=cafe');
 await expect(page.locator('#title')).toContainText('Kafé Varm');
 await expect.poll(()=>page.evaluate(()=>window.__alteraInteriorReady===true),{timeout:20000}).toBe(true);
 // Test the actual UI via a nearby avatar position, not by mutating quest storage.
 await page.evaluate(()=>window.__alteraTestSetPosition?.(2,-1.2));
 await expect(page.locator('#action')).toBeEnabled();
 await page.locator('#action').click();
 await expect(page.locator('#objective')).toContainText('Nordkaien');
 await page.goto('http://127.0.0.1:4173/alpha.html');
 await expect(page.locator('#screen')).toBeHidden({timeout:20000});
 await page.evaluate(()=>window.__alteraTestSetPosition?.(-5,-12));
 await expect(page.locator('#interact')).toBeEnabled();
 await page.locator('#interact').click();
 await expect(page.locator('#mission')).toContainText('tilbake');
 await page.goto('http://127.0.0.1:4173/alpha-interior.html?room=cafe');
 await expect.poll(()=>page.evaluate(()=>window.__alteraInteriorReady===true),{timeout:20000}).toBe(true);
 await page.evaluate(()=>window.__alteraTestSetPosition?.(2,-1.2));
 await page.locator('#action').click();
 await expect(page.locator('#objective')).toContainText('fullført');
 await page.goto('http://127.0.0.1:4173/alpha-interior.html?room=home');
 await expect.poll(()=>page.evaluate(()=>window.__alteraInteriorReady===true),{timeout:20000}).toBe(true);
 await page.evaluate(()=>window.__alteraTestSetPosition?.(2.8,-4.9));
 await page.locator('#action').click();
 await expect(page.locator('#objective')).toContainText('plassert');
 await page.reload();
 await expect(page.locator('#objective')).toContainText('plassert',{timeout:20000});
 expect(errors).toEqual([]);
});

test('avatar studio appearance carries into District 01 and café',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/alpha.html');
 await expect(page.locator('#screen')).toBeHidden({timeout:20000});
 await page.evaluate(()=>localStorage.setItem('altera-avatar-reference-v3',JSON.stringify({skin:'#f1c5a7',hair:'#21191b',eye:'#416b86',topColor:'#485e72',bottomColor:'#81766e',hairStyle:'Oppsatt',body:1.1})));
 await page.reload();await expect(page.locator('#screen')).toBeHidden({timeout:20000});
 await expect.poll(()=>page.evaluate(()=>window.__alteraTestAppearance?.().coat),{timeout:20000}).toBe(0x485e72);
 await page.goto('http://127.0.0.1:4173/alpha-interior.html?room=cafe');
 await expect.poll(()=>page.evaluate(()=>window.__alteraInteriorReady===true),{timeout:20000}).toBe(true);
 await expect.poll(()=>page.evaluate(()=>window.__alteraTestAppearance?.().coat),{timeout:20000}).toBe(0x485e72);
 expect(errors).toEqual([]);
});
