const test=require('node:test'),assert=require('node:assert/strict');
const {compileProgram}=require('./compiler-host.cjs');
test('the main install exposes the broad 2D toolkit with no duplicate block IDs',async()=>{
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
labs.fixedArcJump(hero,150,600)
`);
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres));
 const ids=new Set();for(const block of info.blocks){const id=block.attributes.blockId;if(!id)continue;assert.ok(!ids.has(id),'Duplicate block ID: '+id);ids.add(id);}
 const dependencies=require('../pxt.json').dependencies;
 assert.equal(Object.keys(dependencies).filter(id=>id!=='device').length,29);
 for(const id of ['pxt-raycasting','arcade-split-screen','arcade-shadowcasting'])assert.ok(!dependencies[id]);
 const converted=pxtc.decompiler.decompileToBlocks(info,result.ast.getSourceFile('main.ts'),{snippetMode:false});
 assert.ok(converted.success,JSON.stringify(converted.diagnostics));
 assert.doesNotMatch(converted.outfiles['main.blocks'],/typescript_statement|typescript_expression/);
});
