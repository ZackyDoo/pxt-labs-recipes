const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compileProgram } = require('./compiler-host.cjs');

test('The actual PXT compiler accepts the Labs game and all Quick Blocks', async () => {
    const demo = fs.readFileSync(path.join(__dirname, '../examples/facing-demo.ts'), 'utf8');
    const { result } = await compileProgram(demo + `
labs.setFacing(player, LabsFacing.Up)
let direction = labs.facing(player)
let enemy = sprites.create(img\`2\`, SpriteKind.Enemy)
labs.patrol(enemy, 10, 10, 120, 10, 30)
labs.follow(enemy, player, 20, 16)
labs.giveHealth(player, 3)
let hp = labs.health(player)
let hit = labs.damage(player, 1, 500)
labs.knockback(enemy, player, 60, 100)
labs.setFirePoint(player, 8, -2, LabsFacing.Right)
labs.clearFirePoint(player)
`);
    assert.equal(result.success, true, JSON.stringify(result.diagnostics, null, 2));
    assert.ok(result.outfiles['binary.js'], 'Playable simulator JavaScript was not emitted');
});

test('An ordinary Arcade project compiles with the preserved upstream APIs', async () => {
    const { result } = await compileProgram(`
scene.setBackgroundColor(1)
let player = sprites.create(img\`8\`, SpriteKind.Player)
controller.moveSprite(player, 100, 100)
info.setScore(0)
game.onUpdate(function () { info.changeScoreBy(1) })
`);
    assert.equal(result.success, true, JSON.stringify(result.diagnostics, null, 2));
});

test('Rotating gun-tip firing compiles and converts to native editable Blocks',async()=>{
    const demo=fs.readFileSync(path.join(__dirname,'../examples/rotating-fire-demo.ts'),'utf8');
    const {options,result}=await compileProgram(demo);
    assert.equal(result.success,true,JSON.stringify(result.diagnostics));
    const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres));
    const converted=pxtc.decompiler.decompileToBlocks(info,result.ast.getSourceFile('main.ts'),{snippetMode:false});
    assert.equal(converted.success,true,JSON.stringify(converted.diagnostics));
    assert.match(converted.outfiles['main.blocks'],/type="labs_set_fire_point"/);
    assert.match(converted.outfiles['main.blocks'],/type="labs_shoot_forward"/);
    assert.doesNotMatch(converted.outfiles['main.blocks'],/typescript_statement|typescript_expression/);
});

test('The game converts back to editable Labs blocks without gray JavaScript blocks', async () => {
    const demo = fs.readFileSync(path.join(__dirname, '../examples/facing-demo.ts'), 'utf8');
    const { options, result } = await compileProgram(demo);
    assert.equal(result.success, true, JSON.stringify(result.diagnostics));
    const apis = pxtc.getApiInfo(result.ast, options.jres);
    const blocks = pxtc.getBlocksInfo(apis);
    const converted = pxtc.decompiler.decompileToBlocks(blocks, result.ast.getSourceFile('main.ts'), { snippetMode: false });
    assert.equal(converted.success, true, JSON.stringify(converted.diagnostics));
    const xml = converted.outfiles['main.blocks'];
    assert.match(xml, /type="labs_move_facing"/);
    assert.match(xml, /type="labs_shoot_forward"/);
    assert.doesNotMatch(xml, /typescript_statement|typescript_expression/);
});
