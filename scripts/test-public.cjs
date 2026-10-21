const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function get(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.text();
}

async function main() {
    const html = await get('https://arcade.makecode.com/');
    const match = html.match(/https:\/\/cdn\.makecode\.com\/[^"\s<>]+\/target\.js/);
    if (!match) throw new Error('Public Arcade target URL not found; inspect the page before updating this script.');
    const source = await get(match[0]);
    // Parse JSON data only; do not evaluate downloaded JavaScript.
    const target = JSON.parse(source.replace(/^\s*var pxtTargetBundle\s*=\s*/, '').replace(/;\s*$/, ''));
    if (target.id !== 'arcade' || !target.bundledpkgs) throw new Error('Unexpected public target format');
    const targetPath = path.resolve(__dirname, '../built/public-target.json');
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, JSON.stringify(target));
    console.log('Public Arcade target:', JSON.stringify(target.versions));
    console.log('Source:', match[0]);
    const run = spawnSync(process.execPath, ['--test', 'tests/compiler.test.cjs', 'tests/catalog.test.cjs', 'tests/platform-tools.test.cjs', 'tests/super-pack.test.cjs'], {
        cwd: path.resolve(__dirname, '..'), stdio: 'inherit',
        env: { ...process.env, ARCADE_TARGET_JSON: targetPath }
    });
    if (run.error) throw run.error;
    process.exitCode = run.status === null ? 1 : run.status;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
