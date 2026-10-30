// Serve Resources at http://127.0.0.1:5189; run with playwright-cli run-code --filename.
async (page) => {
    // The lightweight preview server lacks SVG MIME mapping; match the native host.
    await page.route('**/*.svg', async route => {
        const response = await route.fetch();
        await route.fulfill({response, contentType:'image/svg+xml'});
    });
    await page.setViewportSize({width: 840, height: 640});
    await page.addInitScript(() => {
        const original = window.fetch.bind(window);
        window.fetch = (input, init) => {
            const url = new URL(String(input), location.href);
            if (!url.pathname.startsWith('/__bridge__/')) return original(input, init);
            const game = new URLSearchParams(location.search).get('game');
            const state = {game, title: game, start:'Play', close:'Leave', loading:'Loading', ready:'Ready', failed:'Failed', retry:'Retry', controls:'Keyboard controls'};
            setTimeout(() => window.dispatchEvent(new CustomEvent('nova:complete', {detail: {requestId:url.searchParams.get('requestId'), data:btoa(JSON.stringify(state))}})), 0);
            return Promise.resolve(new Response('{}'));
        };
    });
    const errors = [];
    const remote = [];
    const missing = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('request', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith('http://127.0.0.1:5189/')) remote.push(r.url()); });
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) missing.push(r.url()); });
    const results = [];
    const sizes = {asteroids:[840,660],flappy_bird:[400,650],pacman:[520,720],prince_of_persia:[840,640],snake_game:[800,660],space_Invaders:[800,660],nu_pogodi:[936,607]};
    for (const [game, [width,height]] of Object.entries(sizes)) {
        await page.setViewportSize({width,height});
        errors.length = 0; remote.length = 0; missing.length = 0;
        await page.goto('http://127.0.0.1:5189/dist/src/interfaces/arcade/index.html?game=' + game);
        if (game !== 'nu_pogodi') await page.getByRole('button', {name:'Play', exact:true}).click();
        await page.locator('.marquee').waitFor({state:'hidden',timeout:25000});
        const frame = page.frames().find(f => f.url().includes('/arcade/' + game + '/'));
        const surface = game === 'nu_pogodi' ? '.game-container' : 'canvas';
        await frame.waitForSelector(surface, {timeout:20000});
        await page.waitForTimeout(2000);
        const canvas = await frame.locator(surface).first().evaluate(c => {
            const r = c.getBoundingClientRect();
            if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)
                throw new Error('Game surface is clipped: ' + JSON.stringify(r));
            return {width:r.width,height:r.height};
        });
        if (game === 'nu_pogodi') {
            if (await page.locator('footer').count()) throw new Error('Handheld must not have a web footer');
            await frame.evaluate(async () => {
                for (const src of ['assets/background.svg','assets/wolf_LeftUp.svg']) {
                    const image = new Image(); image.src = src; await image.decode();
                }
            });
            await frame.locator('#startBtn1').click();
        }
        await page.keyboard.press(game === 'pacman' ? 'n' : game === 'space_Invaders' ? 'c' : game === 'prince_of_persia' ? 'Enter' : 'Space');
        if (game === 'space_Invaders') await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(500);
        await page.setViewportSize({width:Math.floor(width * .7),height:Math.floor(height * .7)});
        await page.waitForTimeout(500);
        await frame.locator(surface).first().evaluate(c => {
            const r = c.getBoundingClientRect();
            if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1)
                throw new Error('Reduced game surface is clipped: ' + JSON.stringify(r));
        });
        if (errors.length || remote.length || missing.length)
            throw new Error(JSON.stringify({game,errors,remote,missing}));
        results.push({game,canvas,errors:[...errors],remote:[...remote],missing:[...missing]});
    }
    return results;
}
