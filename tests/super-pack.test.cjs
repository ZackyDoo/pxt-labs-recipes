const test=require('node:test'),assert=require('node:assert/strict');
const {compileProgram}=require('./compiler-host.cjs');
test('the main install exposes all 32 tool libraries with no duplicate block IDs',async()=>{
 const {result,options}=await compileProgram(`
let hero=sprites.create(img\`11\n11\`,SpriteKind.Player)
sprites.setDataNumber(hero,"coins",1)
timer.after(10,function(){sprites.changeDataNumberBy(hero,"coins",1)})
let label=textsprite.create("Ready")
let menu=miniMenu.createMenu(miniMenu.createMenuItem("Play"))
miniMenu.close(menu)
blockSettings.writeNumber("level",1)
let bar=statusbars.create(20,4,StatusBarKind.Health)
bar.attachToSprite(hero)
bar.value=5
let barValue=bar.value
labs.fixedArcJump(hero,150,600)
`);
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres));
 const ids=new Set();for(const block of info.blocks){const id=block.attributes.blockId;if(!id)continue;assert.ok(!ids.has(id),'Duplicate block ID: '+id);ids.add(id);}
 const dependencies=require('../pxt.json').dependencies;
 assert.equal(require('../audit/addons.json').filter(p=>dependencies[p.id]).length,32);
 for(const id of ['pxt-raycasting','arcade-split-screen','arcade-shadowcasting'])assert.ok(dependencies[id]);
 const converted=pxtc.decompiler.decompileToBlocks(info,result.ast.getSourceFile('main.ts'),{snippetMode:false});
 assert.ok(converted.success,JSON.stringify(converted.diagnostics));
 assert.doesNotMatch(converted.outfiles['main.blocks'],/typescript_statement|typescript_expression/);
});
test('3D mode remains available and initializes only when explicitly used',async()=>{
 const {result}=await compileProgram('Render.setViewMode(ViewMode.raycastingView)\nlet firstPerson=Render.isViewMode(ViewMode.raycastingView)');
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 assert.match(result.outfiles['binary.js'],/function\s+Render_RayCastingRender_constructor/);
});
test('upstream block placement follows the standalone site without duplicate implementations',async()=>{
 const {result,options}=await compileProgram('let ready=true');
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres));
 for(const expected of require('../audit/toolbox-layout.json')){
  const block=info.blocks.find(b=>b.qName===expected.qName);assert.ok(block,expected.qName);
  assert.equal(block.attributes.blockNamespace,expected.category,expected.qName);
  if(expected.group)assert.equal(block.attributes.group,expected.group,expected.qName);
  assert.equal(!!block.attributes.blockHidden,expected.hidden,expected.qName);
  assert.ok(block.attributes.jsDoc?.trim(),expected.qName+' has a tooltip');
 }
 for(const expected of require('../audit/combined-layout.json')){
  const combined=info.blocks.filter(b=>b.namespace===expected.owner&&b.kind===2);
  assert.ok(combined.length,expected.owner);
  for(const block of combined)assert.equal(block.attributes.blockNamespace,expected.category,block.qName);
 }
 assert.doesNotMatch(result.outfiles['binary.js'],/function\s+Render_RayCastingRender_constructor/,'Importing the super extension does not initialize raycasting');
});
test('adding already-shared libraries directly still compiles with unique block IDs',async()=>{
 const {result,options}=await compileProgram('let hero=sprites.create(img`1`,SpriteKind.Player)\nsprites.setDataNumber(hero,"x",1)',{
  dependencies:{'arcade-sprite-data':'*','arcade-mini-menu':'*','arcade-split-screen':'*','pxt-raycasting':'*'}
 });
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres)),ids=new Set();
 for(const block of info.blocks){const id=block.attributes.blockId;if(!id)continue;assert.ok(!ids.has(id),id);ids.add(id);}
});
test('another extension can depend on the libraries already supplied by Labs',async()=>{
 const probe={
  'pxt.json':JSON.stringify({name:'compatibility-probe',dependencies:{device:'*','arcade-sprite-data':'*','arcade-mini-menu':'*','arcade-split-screen':'*','pxt-raycasting':'*'},files:['probe.ts']}),
  'probe.ts':'namespace compatibilityProbe { export function remember(sprite: Sprite) { sprites.setDataNumber(sprite,"probe",7); } }'
 };
 const {result}=await compileProgram('let hero=sprites.create(img`1`,SpriteKind.Player)\ncompatibilityProbe.remember(hero)',{
  dependencies:{'compatibility-probe':'*'},packages:{'compatibility-probe':probe}
 });
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 assert.doesNotMatch(result.outfiles['binary.js'],/function\s+Render_RayCastingRender_constructor/);
});
