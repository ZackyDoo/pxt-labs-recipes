// Development-only cache of the original, pinned upstream packages.
// Student projects resolve these dependencies through MakeCode itself.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalog = require('../audit/addons.json');
const target = require('pxt-arcade/built/target.json');
const core = require('../pxt.json');
const directory = path.join(root, 'built/upstream');

async function pool(items, action) {
    let index = 0;
    await Promise.all(Array.from({length: 8}, async () => {
        while (index < items.length) await action(items[index++]);
    }));
}
async function get(pack, file) {
    if (!file || path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) throw Error('Invalid upstream path');
    const local = path.join(directory, pack.id, pack.commit, file);
    if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
    const url = `https://raw.githubusercontent.com/${pack.repo}/${pack.commit}/${file}`;
    const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw Error(`${pack.id}/${file}: HTTP ${response.status}`);
    const text = await response.text();
    fs.mkdirSync(path.dirname(local), {recursive: true});
    fs.writeFileSync(local, text);
    return text;
}
async function main() {
    const selected = catalog.filter(p => Object.hasOwn(core.dependencies, p.id));
    const configs = {};
    await pool(selected, async pack => {configs[pack.id] = JSON.parse(await get(pack, 'pxt.json'));});
    const packages = {};
    const jobs = [];
    for (const pack of selected) {
        const config = configs[pack.id], files = {}, dependencies = {};
        for (const [id, version] of Object.entries(config.dependencies || {})) {
            const repo = version.match(/(?:github:|https:\/\/github.com\/)([\w.-]+\/[\w.-]+)/)?.[1];
            if (!repo && target.bundledpkgs[id]) {dependencies[id] = '*'; continue;}
            const dep = selected.find(p => repo ? p.repo.toLowerCase() === repo.toLowerCase() : p.id === id || configs[p.id].name === id);
            if (!dep) throw Error(`Uncached dependency: ${pack.id} -> ${id}: ${version}`);
            dependencies[dep.id] = '*';
        }
        for (const file of config.files || []) {
            // Only source/resource data is needed for offline compilation; docs remain upstream.
            if (/\.(ts|jres|json|asm|cpp|h)$/.test(file)) jobs.push(async () => {files[file] = await get(pack, file);});
            else files[file] = '';
        }
        files['pxt.json'] = JSON.stringify({...config, dependencies});
        packages[pack.id] = files;
    }
    await pool(jobs, job => job());
    const output = {schema: 1, revisions: Object.fromEntries(selected.map(p => [p.id, p.commit])), packages};
    fs.writeFileSync(path.join(root, 'built/super-packages.json'), JSON.stringify(output));
    console.log(`Cached ${selected.length} original upstream packages for offline tests.`);
}
main().catch(error => {console.error(error.message); process.exitCode = 1;});
