// Same local preview server as verify-classic-arcades.js; native CEF remains a manual gate.
async (page) => {
    await page.addInitScript(() => {
        const fetchOriginal = window.fetch.bind(window);
        window.fetch = (input, init) => {
            const url = new URL(String(input), location.href);
            if (!url.pathname.startsWith('/__bridge__/')) return fetchOriginal(input, init);
            const labels = {start:'Play',close:'Leave',loading:'Loading',ready:'Ready',failed:'Failed',retry:'Retry',controls:'Arrows and WASD',audio:'Sound',muted:'Muted'};
            setTimeout(() => window.dispatchEvent(new CustomEvent('nova:complete', {detail:{requestId:url.searchParams.get('requestId'),data:btoa(JSON.stringify(labels))}})),0);
            return Promise.resolve(new Response('{}'));
        };
    });
    await page.route('**/assets/doom/*', async route => {
        const file = new URL(route.request().url()).pathname.split('/').pop();
        if (!['websockets-doom.js','websockets-doom.wasm','doom1.wad','default.cfg'].includes(file)) return route.abort();
        await route.fulfill({path:'D:/ss14gays/arcane/Resources/Doom/_Arcane/' + file,
            contentType:file.endsWith('.js') ? 'application/javascript' : file.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'});
    });
    await page.setViewportSize({width:840,height:700});
    await page.goto('http://127.0.0.1:5189/dist/src/interfaces/doom-arcade/index.html');
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.locator('.overlay').waitFor({state:'hidden',timeout:60000});
    const results = [];
    for (const [width,height] of [[840,700],[588,490],[480,400]]) {
        await page.setViewportSize({width,height});
        results.push(await page.locator('canvas').evaluate(c => {
            const r = c.getBoundingClientRect();
            const p = c.parentElement.getBoundingClientRect();
            if (r.left < p.left || r.top < p.top || r.right > p.right || r.bottom > p.bottom || r.bottom > innerHeight)
                throw new Error('DOOM canvas is clipped');
            return {viewport:[innerWidth,innerHeight],buffer:[c.width,c.height],display:[r.width,r.height]};
        }));
    }
    return results;
}
