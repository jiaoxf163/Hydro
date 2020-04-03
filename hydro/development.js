process.stdin.setEncoding('utf8');
process.stdin.on('data', async input => {
    try {
        let t = eval(input.toString().trim());
        if (t instanceof Promise) console.log(await t);
        else console.log(t);
    } catch (e) {
        console.warn(e);
    }
});
process.on('restart', async () => {
    console.log('Signal detected, restarting...');
    await global.Hydro.stop();
    await global.Hydro.destory();
    delete global.Hydro;
    delete require.cache;
    run();
});
const path = require('path');
const i18n = require('./lib/i18n');
i18n(path.resolve(__dirname, '..', 'locales', 'zh_CN.yaml'), 'zh_CN');


const EventEmitter = require('events');
global.bus = new EventEmitter();
async function run() {
    require('./service/db');
    await new Promise((resolve) => {
        global.bus.once('connected', () => {
            console.log('Database connected');
            resolve();
        });
    });
    let server = require('./service/server');

    require('./handler/ui');
    require('./handler/base');
    require('./handler/home');
    require('./handler/problem');
    require('./handler/record');
    require('./handler/judge');
    require('./handler/user');
    server.start();
}
run().catch(e => {
    console.error(e);
    process.exit(1);
});