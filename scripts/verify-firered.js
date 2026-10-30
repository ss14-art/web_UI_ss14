// Uses the same local Resources preview as verify-classic-arcades.js.
async (page) => {
    const failures = [];
    page.on('pageerror', e => failures.push(String(e)));
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) failures.push(r.url()); });
    await page.addInitScript(() => {
        const original = window.fetch.bind(window);
        window.fetch = (input, init) => {
            const url = new URL(String(input), location.href);
            // EmulatorJS checks for updates only on localhost. Simulate production's offline origin.
            if (url.hostname === 'cdn.emulatorjs.org') return Promise.resolve(new Response('{"version":"4.2.3"}'));
            if (!url.pathname.startsWith('/__bridge__/')) return original(input, init);
            const state = {game:'firered',title:'Pokémon FireRed',start:'Play',close:'Leave',loading:'Loading',ready:'Ready',failed:'Failed',retry:'Retry',controls:'Arrows · X/Z · Enter'};
            const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(state))));
            setTimeout(() => window.dispatchEvent(new CustomEvent('nova:complete',{detail:{requestId:url.searchParams.get('requestId'),data:encoded}})),0);
            return Promise.resolve(new Response('{}'));
        };
    });
    await page.setViewportSize({width:752,height:590});
    await page.goto('http://127.0.0.1:5189/dist/src/interfaces/arcade/index.html');
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.locator('.marquee').waitFor({state:'hidden',timeout:25000});
    const frame = page.frames().find(f => f.url().includes('/firered/index.html'));
    await frame.waitForSelector('canvas', {timeout:60000});
    await page.waitForTimeout(6000);
    await frame.locator('canvas').click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    if (failures.length) throw new Error(JSON.stringify(failures));
    return await frame.locator('canvas').evaluate(c => ({buffer:[c.width,c.height],rect:c.getBoundingClientRect().toJSON()}));
}
