const {test}=require('node:test'),assert=require('node:assert/strict');
test('platform tools compile together as native Blocks with category colors and plain hover explanations',async()=>{
 const source=`
let layout=image.create(32,32)
layout.fillRect(0,24,32,8,1)
let platforms=labs.spritesFromShapes(SpriteKind.Food,layout,0,0,true)
let hero=sprites.create(img\`1111\n1111\n1111\n1111\`,SpriteKind.Player)
let tool=sprites.create(img\`2222\n2222\n2222\n2222\`,SpriteKind.Projectile)
let frames=[img\`1111\n1111\n1111\n1111\`]
labs.standOnPlatformsOfKind(hero,SpriteKind.Food)
labs.climbSpriteLadders(hero,SpriteKind.Food,40)
labs.fixedArcJump(hero,150,600)
labs.allowJumpAndClimb(hero,true)
labs.animatePlatformer(hero,frames,frames,frames,frames)
labs.swingHeldTool(hero,tool,frames,1000,16,100,true,frames)
labs.onJumpedOver(hero,SpriteKind.Enemy,function(count){info.changeScoreBy(count)})
let using=labs.isUsingTool(hero)
let climbing=labs.isClimbing(hero)
labs.rollDownPlatforms(tool,SpriteKind.Food,40)
labs.explorePlatforms(tool,SpriteKind.Food,SpriteKind.Food,25)
labs.showBuiltinHud(false,false,false)
`;
 const {options,result}=await require('./compiler-host.cjs').compileProgram(source);
 assert.ok(result.success,JSON.stringify(result.diagnostics));
 const info=pxtc.getBlocksInfo(pxtc.getApiInfo(result.ast,options.jres));
 const converted=pxtc.decompiler.decompileToBlocks(info,result.ast.getSourceFile('main.ts'),{snippetMode:false});
 assert.ok(converted.success,JSON.stringify(converted.diagnostics));assert.doesNotMatch(converted.outfiles['main.blocks'],/typescript_statement|typescript_expression/);
 const categories=require('./category-map.json');
 for(const id of ['labs_image_shapes','labs_platform_kind','labs_sprite_ladders','labs_fixed_jump','labs_jump_climb_enabled','labs_platform_animations','labs_held_tool','labs_jump_over_event','labs_using_tool','labs_is_climbing','labs_roll_platforms','labs_platform_wander','labs_builtin_hud']){
  const block=info.blocks.find(b=>b.attributes.blockId===id);assert.ok(block,id);assert.equal(block.attributes.blockNamespace,categories[id].namespace);assert.equal(block.attributes.color,categories[id].color);assert.ok(block.attributes.jsDoc.length>40,id+' explains behavior');assert.ok(converted.outfiles['main.blocks'].includes(id),id+' decompiles natively');
 }
});
