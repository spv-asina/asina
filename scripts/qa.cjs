const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + '/playwright');
const root = path.resolve(__dirname,'..');
const output=path.join(root,'qa');fs.mkdirSync(path.join(output,'screenshots'),{recursive:true});
const report={layoutChecks:[],checks:[],errors:[]};
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);pathname=pathname.replace(/^\/asina\//,'/');let file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)){res.writeHead(404,{'Content-Type':'text/html'});res.end(fs.readFileSync(path.join(root,'404.html')));return;}res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','css':'text/css','js':'text/javascript','svg':'image/svg+xml'})[path.extname(file).slice(1)]||'application/octet-stream');res.end(fs.readFileSync(file));});
(async()=>{
 await new Promise(resolve=>server.listen(8080,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||path.resolve(root,'../qa-runtime/browser/chromium'),args:['--no-sandbox','--disable-gpu'],headless:true});
 const base='http://127.0.0.1:8080/asina/';
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'light'});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 // Avoid dependence on external font delivery in deterministic fallback-layout tests.
 await context.route('https://fonts.googleapis.com/**',route=>route.abort());
 const pages=['index.html','cases.html','contacts.html','services.html','about.html','case-mgd.html','case-site-lexforma.html','privacy.html'];
 for(const width of [320,375,390,430,600,768,1024,1440,1920]){
   await page.setViewportSize({width,height:width<760?844:1000});
   for(const theme of ['light','dark']){
     for(const file of pages){
       await page.goto(base+file,{waitUntil:'domcontentloaded'});
       await page.evaluate(t=>{document.documentElement.dataset.theme=t;localStorage.setItem('asina-theme',t)},theme);
       const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main h1,main h2,main h3,main .btn,.demo-dock,.brief-card,.mobile-nav')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)}).map(e=>e.className||e.tagName)}));
       report.layoutChecks.push({width,theme,file,...layout});
       assert.ok(layout.scroll<=width+1,`${file} ${width} ${theme} horizontal overflow ${layout.scroll}`);
       assert.deepEqual(layout.overflow,[],`${file} ${width} ${theme} elements overflow`);
       if([390,1440].includes(width)&&['index.html','cases.html','contacts.html','case-mgd.html'].includes(file)){
         await page.evaluate(()=>document.querySelectorAll('.pending').forEach(e=>e.classList.remove('pending')));
         await page.screenshot({path:path.join(output,'screenshots',`${file.slice(0,-5)}-${width}-${theme}.png`),fullPage:true,animations:'disabled'});
       }
     }
   }
 }
 report.checks.push('144 layout combinations, no horizontal overflow');
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);
 await page.locator('.theme-toggle').click();const theme=await page.locator('html').getAttribute('data-theme');await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),theme);report.checks.push('Theme persists on reload');
 await page.locator('#tab-lecture').click();assert.match(await page.locator('.demo-result').innerText(),/Лекция → конспект/);
 await page.locator('#tab-lecture').press('ArrowRight');assert.equal(await page.locator('#tab-crm').getAttribute('aria-selected'),'true');report.checks.push('Demo tabs work by click and keyboard');
 await page.mouse.move(10,10);await page.waitForTimeout(200);const left=await page.locator('.chibi-pupils').getAttribute('style');await page.mouse.move(1400,700);await page.waitForTimeout(200);const right=await page.locator('.chibi-pupils').getAttribute('style');assert.notEqual(left,right);await page.locator('.mascot-button').click();assert.equal(await page.locator('.toast').isVisible(),true);report.checks.push('Mascot follows cursor and responds to click');
 await page.goto(base+'cases.html');
 assert.equal(await page.locator('.project-card:visible').count(),9);
 await page.locator('[data-filter=sites]').click();assert.match(page.url(),/category=sites/);
 assert.equal(await page.locator('.project-card:visible').count(),9);
 await page.locator('[data-more]').click();assert.equal(await page.locator('.project-card:visible').count(),11);
 await Promise.all([page.waitForURL('**/case-site-*.html'),page.locator('.project-card:visible').first().click()]);
 await page.waitForLoadState('domcontentloaded');
 await Promise.all([page.waitForURL('**/cases.html?category=sites'),page.locator('[data-back-catalog]').click()]);
 await page.waitForLoadState('domcontentloaded');
 assert.match(page.url(),/category=sites/);assert.equal(await page.locator('.project-card:visible').count(),11);
 report.checks.push('Catalog filters, load more, and return state work');
 await page.goto(base+'contacts.html');assert.equal(await page.locator('[data-step="1"] [data-next]').isDisabled(),true);await page.locator('[data-choice="Сайт"]').click();await page.locator('[data-step="1"] [data-next]').click();await page.locator('[data-step="2"] [data-next]').click();assert.match(await page.locator('.form-error').innerText(),/10 символов/);await page.locator('#brief-description').fill('Хочу удобный сайт с анимациями для моей компании.');await page.locator('[data-step="2"] [data-next]').click();assert.match(await page.locator('.brief-result').innerText(),/удобный сайт/);assert.match(await page.locator('[data-send]').getAttribute('href'),/^https:\/\/t.me\/spv_asina\?text=/);await page.reload();await page.locator('[data-step="1"] [data-next]').click();assert.match(await page.locator('#brief-description').inputValue(),/удобный сайт/);await page.locator('[data-clear]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('asina-brief')),null);report.checks.push('Brief validation, summary, local draft restore/deletion and Telegram handoff');
 // All migrated entry points render with one main heading and no script exceptions.
 for(const file of Object.keys(JSON.parse(fs.readFileSync(path.join(root,'content.json'))))){await page.goto(base+file);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.theme-toggle').count(),1);}
 report.checks.push('All 58 entry points rendered');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);assert.equal(await page.locator('.chibi-eyes').evaluate(e=>getComputedStyle(e).animationName),'none');await page.mouse.move(10,10);await page.waitForTimeout(100);assert.equal(await page.locator('.chibi-pupils').getAttribute('style'),null);report.checks.push('Reduced motion disables mascot animations and tracking');
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.route('https://fonts.googleapis.com/**',r=>r.abort());const mobile=await touch.newPage();await mobile.goto(base);await mobile.locator('.mascot-button').tap();assert.equal(await mobile.locator('.toast').isVisible(),true);await Promise.all([mobile.waitForURL('**/cases.html'),mobile.locator('.mobile-nav a[href="cases.html"]').tap()]);assert.match(mobile.url(),/cases.html/);report.checks.push('Touch mascot and mobile navigation');await touch.close();
 const nojs=await browser.newContext({javaScriptEnabled:false});await nojs.route('https://fonts.googleapis.com/**',r=>r.abort());const fallback=await nojs.newPage();await fallback.goto(base+'cases.html');assert.equal(await fallback.locator('.project-card:visible').count(),45);report.checks.push('All case links accessible without JavaScript');await nojs.close();
 const axePath=process.env.AXE_PATH||path.resolve(root,'../qa-runtime/node_modules/axe-core/axe.min.js');
 if(fs.existsSync(axePath)){
   report.accessibility=[];
   await page.emulateMedia({reducedMotion:'reduce'});
   for(const width of [390,1440]){
     await page.setViewportSize({width,height:1000});
     for(const theme of ['light','dark'])for(const file of ['index.html','cases.html','contacts.html','case-mgd.html']){
       await page.goto(base+file);await page.evaluate(t=>{document.documentElement.dataset.theme=t},theme);
       await page.addScriptTag({path:axePath});
       const result=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
       report.accessibility.push({width,theme,file,violations:result});
     }
   }
   const issues=report.accessibility.filter(r=>r.violations.length);
   assert.deepEqual(issues,[],'Accessibility violations');report.checks.push('16 axe WCAG A/AA scans, zero violations');
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base);
 for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.screenshot({path:path.join(output,'screenshots',`hero-desktop-${theme}.png`),animations:'disabled'});}
 await page.setViewportSize({width:390,height:844});
 for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.screenshot({path:path.join(output,'screenshots',`hero-mobile-${theme}.png`),animations:'disabled'});}
 assert.deepEqual(report.errors,[],'Browser script errors');
 await browser.close();server.close();report.status='PASS';fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,layoutChecks:report.layoutChecks.length,checks:report.checks,errors:report.errors},null,2));
})().catch(error=>{report.status='FAIL';report.errors.push(error.stack);fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.error(error);server.close();process.exit(1)});
