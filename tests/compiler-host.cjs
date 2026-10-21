const fs = require('node:fs');
const path = require('node:path');
require('pxt-core');

async function compileProgram(source, extras = {}) {
    // Load Microsoft's published target, never the Labs site's generated target.
    const targetPath = process.env.ARCADE_TARGET_JSON || require.resolve('pxt-arcade/built/target.json');
    const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const root = path.resolve(__dirname, '..');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'pxt.json'), 'utf8'));
    const upstreamPath = path.join(root, 'built/super-packages.json');
    const upstream = fs.existsSync(upstreamPath) ? JSON.parse(fs.readFileSync(upstreamPath, 'utf8')) : {packages: {}};
    const offlineConfig = {...config, dependencies: {...config.dependencies}};
    for (const [id, version] of Object.entries(config.dependencies)) {
        if (!version.startsWith('github:')) continue;
        const revision = version.split('#')[1];
        if (!upstream.packages[id] || upstream.revisions[id] !== revision) throw Error('Run npm run cache:addons for '+id);
        offlineConfig.dependencies[id] = '*';
    }
    const extension = { 'pxt.json': JSON.stringify(offlineConfig) };
    for (const file of config.files) extension[file] = fs.readFileSync(path.join(root, file), 'utf8');
    target.bundledpkgs[config.name] = extension;
    Object.assign(target.bundledpkgs, upstream.packages);
    Object.assign(target.bundledpkgs, extras.packages || {});
    pxt.setAppTarget(target);
    const files = {
        'pxt.json': JSON.stringify({ name: 'Labs extension test', dependencies: { device: '*', [config.name]: '*', ...extras.dependencies }, files: ['main.ts', ...Object.keys(extras.files || {})], ...(extras.config || {}) }),
        'main.ts': source,
        ...extras.files
    };
    const host = {
        readFile(pkg, name) { return (pkg.level === 0 ? files : target.bundledpkgs[pkg.id] || {})[name]; },
        writeFile(pkg, name, contents) {
            if (pkg.level !== 0) throw new Error('Compiler attempted to write an upstream package');
            files[name] = contents;
        },
        downloadPackageAsync() { throw new Error('Compiler attempted an external package download'); },
        getHexInfoAsync() { throw new Error('Simulator test attempted native/cloud compilation'); },
        cacheStoreAsync() { return Promise.resolve(); },
        cacheGetAsync() { return Promise.resolve(null); }
    };
    const main = new pxt.MainPackage(host);
    const options = await main.getCompileOptionsAsync({ ...target.compile, isNative: false, hasHex: false });
    options.ast = true;
    const result = pxtc.compile(options);
    return { options, result };
}

module.exports = { compileProgram };
