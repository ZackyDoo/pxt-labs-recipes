const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function createRuntime() {
    const updates = [];
    const pressed = new Set();
    const scene = { data: {}, eventContext: { deltaTimeMillis: 16 } };
    let time = 0;
    const makeSprite = (width = 10, height = 20) => ({
        x: 80, y: 60, width, height, vx: 0, vy: 0, data: {}, flags: 0, rotation:0, sx:1, sy:1,
        image: { width, height },
        setPosition(x, y) { this.x = x; this.y = y; }
    });
    const context = vm.createContext({
        Math,
        controller: Object.fromEntries(['up', 'down', 'left', 'right'].map(d => [d, { isPressed: () => pressed.has(d) }])),
        game: { currentScene: () => scene, runtime: () => time, onUpdate: callback => updates.push(callback) },
        sprites: {
            Flag: { Destroyed: 1 },
            createProjectileFromSprite(image, from, vx, vy) {
                const sprite = makeSprite(image.width, image.height);
                sprite.vx = vx; sprite.vy = vy;
                return sprite;
            }
        }
    });
    vm.runInContext('Array.prototype.removeAt = function(i) { this.splice(i, 1); }', context);
    const source = fs.readFileSync(path.join(__dirname, '../recipes.ts'), 'utf8');
    vm.runInContext(ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2017 } }).outputText, context);
    return { ...context, makeSprite, pressed, tick(ms = 16) { time += ms; updates.forEach(fn => fn()); } };
}

test('Four directions fire beyond both image edges; offsets follow facing', () => {
    const r = createRuntime();
    const s = r.makeSprite();
    const projectileImage = { width: 4, height: 6 };
    for (const [direction, x, y, vx, vy] of [
        [r.LabsFacing.Up, 80, 44, 0, -100],
        [r.LabsFacing.Down, 80, 76, 0, 100],
        [r.LabsFacing.Left, 70, 60, -100, 0],
        [r.LabsFacing.Right, 90, 60, 100, 0]
    ]) {
        r.labs.setFacing(s, direction);
        const p = r.labs.shootForward(projectileImage, s, 100, r.LabsAnchor.Front, 3);
        assert.deepEqual([p.x, p.y, p.vx, p.vy], [x, y, vx, vy]);
    }
});

test('Facing persists at rest and explicit direction changes preserve image and velocity', () => {
    const r = createRuntime();
    const s = r.makeSprite();
    const image = s.image;
    r.labs.moveWithFacing(s, 70, 80);
    r.pressed.add('up'); r.tick();
    assert.equal(r.labs.facing(s), r.LabsFacing.Up);
    r.pressed.clear(); r.tick();
    assert.equal(r.labs.facing(s), r.LabsFacing.Up);
    assert.deepEqual([s.vx, s.vy], [0, 0]);
    r.labs.setFacing(s, r.LabsFacing.Left);
    assert.equal(s.image, image);
    assert.deepEqual([s.vx, s.vy], [0, 0]);
});

test('An attached off-center fire point and shot direction rotate with the gun, independent of projectile size', () => {
    const r=createRuntime(),s=r.makeSprite(24,12);
    r.labs.setFirePoint(s,10,-3,r.LabsFacing.Right);
    const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} should equal ${expected}`);
    for(const degrees of [0,45,90,180,270,-90,360,450]) {
        s.rotation=degrees*Math.PI/180;
        const c=Math.cos(s.rotation),t=Math.sin(s.rotation);
        for(const image of [{width:2,height:2},{width:12,height:8}]) {
            const p=r.labs.shootForward(image,s,100);
            near(p.x,80+10*c+3*t);near(p.y,60+10*t-3*c);
            near(p.vx,100*c);near(p.vy,100*t);
        }
    }
    // It remains attached after translating, resizing, and stopping the player.
    s.x=120;s.y=30;s.sx=2;s.sy=3;s.rotation=Math.PI/2;
    const p=r.labs.shootForward({width:4,height:4},s,100,r.LabsAnchor.Back,2);
    near(p.x,129);near(p.y,52);near(p.vx,0);near(p.vy,100);
    r.labs.clearFirePoint(s);r.labs.setFacing(s,r.LabsFacing.Up);
    const legacy=r.labs.shootForward({width:4,height:4},s,100,r.LabsAnchor.Center);
    assert.deepEqual([legacy.x,legacy.y,legacy.vx,legacy.vy],[120,30,0,-100]);
});

test('Artwork that points up at zero degrees fires from its rotated muzzle even while stationary',()=>{
    const r=createRuntime(),s=r.makeSprite();
    r.labs.setFirePoint(s,2,-8,r.LabsFacing.Up);s.rotation=Math.PI/2;
    r.labs.setFacing(s,r.LabsFacing.Left);
    const p=r.labs.shootForward({width:2,height:2},s,50);
    assert.ok(Math.abs(p.x-88)<1e-8);assert.ok(Math.abs(p.y-62)<1e-8);
    assert.ok(Math.abs(p.vx-50)<1e-8);assert.ok(Math.abs(p.vy)<1e-8);
});

test('Damage respects invulnerability and can resume after the timer', () => {
    const r = createRuntime();
    const s = r.makeSprite();
    r.labs.giveHealth(s, 3);
    assert.equal(r.labs.damage(s, 1, 500), true);
    assert.equal(r.labs.damage(s, 1, 500), false);
    assert.equal(r.labs.health(s), 2);
    r.tick(500);
    assert.equal(r.labs.damage(s, 1, 500), true);
    assert.equal(r.labs.health(s), 1);
});

