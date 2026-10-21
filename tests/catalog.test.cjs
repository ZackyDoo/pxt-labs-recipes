const test=require('node:test'),assert=require('node:assert/strict');
const {compileProgram}=require('./compiler-host.cjs');
test('every Labs block has a tooltip, a unique ID and a dedicated namespaced category',async()=>{
 const {result,options}=await compileProgram('let ready = true');
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const api=pxtc.getApiInfo(result.ast,options.jres),info=pxtc.getBlocksInfo(api);
 const blocks=info.blocks.filter(b=>(b.attributes.blockId||'').startsWith('labs_'));
 assert.equal(blocks.length,55);
 const seen=new Set(),categories=new Set();
 for(const block of blocks){const a=block.attributes;assert.ok(!seen.has(a.blockId),a.blockId);seen.add(a.blockId);
  assert.ok(a.jsDoc?.trim().length>35,block.qName+' needs a useful tooltip');
  const category=a.blockNamespace||block.namespace;assert.match(category,/^labs[A-Z]/,block.qName);
  assert.ok(api.byQName[category],category+' exists in API metadata');categories.add(category);
 }
 assert.equal(categories.size,12);
 assert.equal(blocks.find(b=>b.attributes.blockId==='labs_is_facing').attributes.blockHidden,true);
});
test('inventory, achievements, sight, random and advanced mechanics compile and decompile together',async()=>{
 const {world,calls}=require('./classic-program.cjs');
 const {result,options}=await compileProgram(calls+`
let bag=labsInventory.create(8)
let added=labsInventory.add(bag,"coin",img\`5\`,2)
let count=labsInventory.count(bag,"coin")
let names=labsInventory.itemNames(bag)
let slots=labsInventory.emptySlots(bag)
let removed=labsInventory.remove(bag,"coin",1)
labsInventory.clear(bag)
let randomSource=labs.randomSource(123)
let roll=labs.randomInteger(randomSource,1,6)
let sight=labs.clearLineOfSight(hero,ledge)
let visible=labs.canSee(hero,ledge,80,120)
labs.onAchievementUnlocked(function(name){hero.sayText(name)})
let earned=labs.unlockAchievement("test")
let unlocked=labs.achievementUnlocked("test")
labs.resetAchievement("test")
labs.setCollisionBox(hero,4,4,0,0)
labs.moveOnGrid(hero,8,80)
labs.startMeleeAttack(hero,ledge,12)
let attacking=labs.isAttacking(hero)
labs.hopTo(hero,40,40)
labs.hudText("hello",0,0,1)
`);
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres));
 const converted=pxtc.decompiler.decompileToBlocks(info,result.ast.getSourceFile('main.ts'),{snippetMode:false});
 assert.ok(converted.success,JSON.stringify(converted.diagnostics));
 assert.doesNotMatch(converted.outfiles['main.blocks'],/typescript_statement|typescript_expression/);
});
test('room transitions accept standard Arcade tilemap data',async()=>{
 const {world,calls}=require('./classic-program.cjs');
 const {result}=await compileProgram(world+calls+'\nlabs.slideToRoom(hero,tiles.createTilemap(hex`0100010000`,img`.`,[img`.`],TileScale.Sixteen),30,30,LabsFacing.Right)');
 assert.ok(result.success,JSON.stringify(result.diagnostics));
});
