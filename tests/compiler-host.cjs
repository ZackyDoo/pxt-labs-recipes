const fs = require('node:fs');
const path = require('node:path');
require('pxt-core');

async function compileProgram(source) {
    // Load Microsoft's published target, never the Labs site's generated target.
    const targetPath = process.env.ARCADE_TARGET_JSON || require.resolve('pxt-arcade/built/target.json');
    const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const root = path.resolve(__dirname, '..');
    const config = JSON.parse(fs.readFileSync(path.join(root, 'pxt.json'), 'utf8'));
    const extension = { 'pxt.json': JSON.stringify(config) };
    for (const file of config.files) extension[file] = fs.readFileSync(path.join(root, file), 'utf8');
    target.bundledpkgs[config.name] = extension;
    pxt.setAppTarget(target);
    const files = {
        'pxt.json': JSON.stringify({ name: 'Labs extension test', dependencies: { device: '*', [config.name]: '*' }, files: ['main.ts'] }),
        'main.ts': source
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
