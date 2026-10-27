// Start Vite preview on 127.0.0.1:5186, then use playwright-cli run-code --filename.
// Browser/transport regression only: does not assert native game commands executed.
async (page) => {
  await page.setViewportSize({width: 1600, height: 900});
  await page.addInitScript(() => {
    const chat = {draft:'', channel:'OOC', maxLength:500, channels:[
      {id:'OOC',label:'OOC'}, {id:'LOOC',label:'LOOC'}, {id:'Dead',label:'Dead'}],
      filters:[],messages:[],hasOlder:false,sendLabel:'Send message',filterLabel:'Filters',
      olderLabel:'Older',bottomLabel:'Latest',placeholder:'Message'};
    const state = {version:1,revision:0,title:'Lobby test',character:'Test character',balance:'',
      visible:true,rightWidth:460,infoHeight:100,round:'Waiting',roundTitle:'Round',players:'1',
      lobbyPlayers:'1',readyPlayers:'1',hideLabel:'Hide',errorLabel:'Action failed',newLabel:'New',
      licenseLabel:'License',song:'',background:null,actions:[],info:[],chat};
    window.lobbyCalls = [];
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = new URL(String(input), location.href);
      if (url.hostname !== 'webui.local') return original(input, init);
      const event = url.pathname.split('/').pop();
      const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(url.searchParams.get('data')), c => c.charCodeAt(0))));
      window.lobbyCalls.push({event, data});
      if (event === 'lobby-chat-channel') chat.channel = data.channel;
      const result = event === 'lobby-get-state' ? {...state, revision: ++state.revision} : {};
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(result))));
      queueMicrotask(() => window.dispatchEvent(new CustomEvent('nova:complete', {
        detail:{requestId:url.searchParams.get('requestId'),data:encoded}
      })));
      return Promise.resolve(new Response(null,{status:204}));
    };
  });
  await page.reload();
  await page.getByRole('button', {name:'OOC',exact:true}).click();
  const menu = page.getByRole('listbox');
  await menu.waitFor();
  const placement = await menu.evaluate(el => {
    const menu = el.getBoundingClientRect();
    const toggle = document.querySelector('.channel-toggle').getBoundingClientRect();
    return {inPanel: menu.left > innerWidth / 2, above: menu.bottom <= toggle.top,
      inside: menu.top >= 0 && menu.right <= innerWidth};
  });
  if (!Object.values(placement).every(Boolean)) throw Error(JSON.stringify(placement));
  if (await page.locator('select').count()) throw Error('Native select popup remains');
  await page.getByRole('option',{name:'LOOC',exact:true}).click();
  await page.getByRole('button',{name:'LOOC',exact:true}).waitFor();
  const input = page.getByRole('textbox',{name:'Message',exact:true});
  await input.fill('Test message');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  const sent = await page.evaluate(() => window.lobbyCalls.find(c => c.event === 'lobby-chat-send'));
  if (sent?.data.channel !== 'LOOC') throw Error('Send used stale channel: ' + JSON.stringify(sent));
  await input.focus();
  await page.keyboard.press('Tab');
  await page.getByRole('button',{name:'Dead',exact:true}).waitFor();
  await page.keyboard.press('Shift+Tab');
  await page.getByRole('button',{name:'LOOC',exact:true}).waitFor();
  await input.evaluate(el => {
    for (const event of [
      {key:'F1',code:'CapsLock',keyCode:112},
      {key:'F3',code:'F2',keyCode:114,ctrlKey:true},
      {key:'`',code:'Slash',keyCode:192},
      {key:'t',code:'ShiftRight',keyCode:84}, // Must remain text while composing.
      {key:'Shift',code:'KeyA',keyCode:16}, // Must not reinterpret the bad code.
    ]) el.dispatchEvent(new KeyboardEvent('keydown',{...event,bubbles:true,cancelable:true}));
  });
  const keys = await page.evaluate(() => window.lobbyCalls.filter(c => c.event === 'native-key').map(c => c.data));
  if (keys.length !== 3 || keys[0].code !== 'F1' || keys[1].code !== 'F3' || keys[1].modifiers !== 2 || keys[2].code !== 'Backquote')
    throw Error('CEF key normalization failed: ' + JSON.stringify(keys));
  await page.getByRole('button',{name:'LOOC',exact:true}).click();
  await page.getByRole('listbox').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('listbox').waitFor({state:'hidden'});
  return {placement,channelSend:'LOOC',tabCycle:'passed',cefVirtualKeys:keys,escapeDismiss:'passed'};
}
