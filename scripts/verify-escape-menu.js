// Run with playwright-cli run-code --filename WebUI/scripts/verify-escape-menu.js.
// Start `npx vite preview --host 127.0.0.1 --port 5174` in WebUI first.
async (page) => {
  await page.setViewportSize({ width: 370, height: 581 });
  await page.addInitScript(() => {
    const entries = [
      ['patron-perks', 'Patron Perks', 'crown'], ['changelog', 'Changelog', 'scroll'],
      ['source-code', 'Source Code', 'code-branch'], ['call-vote', 'Call vote', 'check-to-slot'],
      ['rules', 'Rules', 'scale-balanced'], ['guidebook', 'Guidebook', 'book-open'],
      ['wiki', 'Wiki', 'globe'], ['feedback', 'Feedback', 'comment-dots'],
      ['bug-report', 'Report Bugs', 'bug'], ['admin-remarks', 'Admin Remarks', 'clipboard-list'],
      ['options', 'Options', 'gear'], ['character', 'Character Editor', 'user-pen'],
      ['disconnect', 'Disconnect', 'plug-circle-xmark'], ['quit', 'Quit', 'right-from-bracket'],
    ].map(([id, label, icon]) => ({id, label, icon, visible: id !== 'patron-perks', enabled: id !== 'admin-remarks',
      tooltip: id === 'admin-remarks' ? 'This functionality has been disabled by the server.' : null,
      tone: ['disconnect','quit'].includes(id) ? 'danger' : 'normal', badge: id === 'changelog' ? 'new' : null }));
    window.menuFixture = { title: 'Game Menu', newLabel: 'New', pendingLabel: 'Opening…', errorLabel: 'The menu action could not be completed.', retryLabel: 'Retry',
      groups: [['top',0,4],['information',4,10],['configuration',10,12],['session',12,14]].map(([id,start,end], i) => ({id, separatorBefore: i>0, actions: entries.slice(start,end)})) };
    window.menuCalls = [];
    const encode = value => btoa(unescape(encodeURIComponent(JSON.stringify(value))));
    window.pushMenu = () => window.dispatchEvent(new CustomEvent('nova:escape-menu-state', {detail: {data: encode(window.menuFixture)}}));
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = new URL(String(input), location.href);
      if (url.hostname !== 'webui.local') return original(input, init);
      const event = url.pathname.split('/').pop();
      window.menuCalls.push(event);
      setTimeout(() => {
        const requestId = url.searchParams.get('requestId');
        if (event === 'escape-menu-action' && window.failMenuAction) {
          window.dispatchEvent(new CustomEvent('nova:error', {detail:{requestId,data:'action-failed'}}));
        } else {
          const value = event === 'escape-menu-get-state' ? window.menuFixture : {success:true,closeMenu:false};
          window.dispatchEvent(new CustomEvent('nova:complete', {detail:{requestId,data:encode(value)}}));
        }
      }, 20);
      return Promise.resolve(new Response(null, {status:204}));
    };
  });
  await page.goto('http://127.0.0.1:5174/src/interfaces/escape-menu/index.html');
  await page.getByRole('button', {name:'Character Editor',exact:true}).waitFor();
  const normal = await page.evaluate(() => {
    const list=document.querySelector('.action-list');
    const buttons=[...document.querySelectorAll('.action-button')];
    const rects=buttons.map(b=>b.getBoundingClientRect());
    return {count:buttons.length, horizontalOverflow:document.documentElement.scrollWidth>innerWidth,
      listHeight:list.clientHeight, scrollHeight:list.scrollHeight, minRow:Math.min(...rects.map(r=>r.height)),
      overlaps:rects.some((r,i)=>i>0 && r.top<rects[i-1].bottom),
      styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.getAttribute('href'))};
  });
  if(normal.count!==13 || normal.overlaps || normal.horizontalOverflow || normal.minRow<40 || normal.scrollHeight>normal.listHeight+1) throw Error(JSON.stringify(normal));
  await page.screenshot({path:'output/playwright/escape-menu-ss220-normal.png'});
  await page.getByRole('button',{name:'Quit',exact:true}).focus();
  await page.keyboard.press('Tab');
  if(!await page.getByRole('button',{name:'Changelog, New',exact:true}).evaluate(el=>el===document.activeElement)) throw Error('Tab did not wrap');
  const before = await page.evaluate(()=>window.menuCalls.length);
  await page.getByRole('button',{name:/Admin Remarks/}).focus();
  await page.keyboard.press('Enter');
  if(await page.evaluate(()=>window.menuCalls.length)!==before) throw Error('Disabled dispatched');
  await page.evaluate(()=>window.failMenuAction=true);
  await page.getByRole('button',{name:'Wiki',exact:true}).click();
  await page.getByRole('alert').waitFor();
  if(await page.locator('[aria-busy="true"].action-button').count()) throw Error('Pending stuck');
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await page.getByRole('alert').waitFor({state:'hidden'});
  await page.evaluate(()=>{window.menuFixture.groups[0].actions[1].badge=null;window.pushMenu();});
  await page.locator('.action-button__badge').waitFor({state:'hidden'});
  await page.setViewportSize({width:318,height:290});
  await page.getByRole('button',{name:'Quit',exact:true}).scrollIntoViewIfNeeded();
  const small=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,
    scroll:document.querySelector('.action-list').scrollHeight>document.querySelector('.action-list').clientHeight,
    quitBottom:[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Quit')).getBoundingClientRect().bottom}));
  if(small.overflow || !small.scroll || small.quitBottom>290) throw Error(JSON.stringify(small));
  await page.screenshot({path:'output/playwright/escape-menu-ss220-small.png'});
  const unicodeLabel = 'Настройки персонажа «Ёж» — <b>не HTML</b>';
  await page.evaluate(label => {
    window.menuFixture.groups[2].actions[1].label = label;
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(window.menuFixture))));
    const total = Math.ceil(encoded.length / 1500);
    for (let index=0; index<total; index++) {
      const data = btoa(unescape(encodeURIComponent(JSON.stringify({chunkId:'localizationtest', index, total, eventType:'escape-menu-state', data:encoded.slice(index*1500,(index+1)*1500)}))));
      window.dispatchEvent(new CustomEvent('nova:chunk-event',{detail:{data}}));
    }
  }, unicodeLabel);
  await page.getByRole('button',{name:unicodeLabel,exact:true}).waitFor();
  if (await page.locator('.action-button__label b').count()) throw Error('Host text became HTML');
  await page.getByRole('button',{name:unicodeLabel,exact:true}).scrollIntoViewIfNeeded();
  if (await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Unicode label overflow');
  return {normal,small,keyboard:'passed',disabled:'passed',failureRecovery:'passed',liveBadge:'passed',unicodeChunkedPush:'passed',literalText:'passed'};
}
