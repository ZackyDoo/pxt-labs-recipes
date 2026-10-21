const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function runtime(){
 const saved=new Map(),walls=new Set(),scene={tileMap:null};
 const context=vm.createContext({Math:Object.assign(Object.create(Math),{constrain:(v,a,b)=>Math.max(a,Math.min(b,v))}),
  settings:{writeNumber:(k,v)=>saved.set(k,v),readNumber:k=>saved.get(k),remove:k=>saved.delete(k)},
  control:{runInParallel:f=>f()},image:{create:(w,h)=>({width:w,height:h})},
  game:{currentScene:()=>scene},tiles:{getTileLocation:(x,y)=>({x,y}),tileAtLocationIsWall:p=>walls.has(p.x+','+p.y)},
  LabsFacing:{Up:0,Down:1,Left:2,Right:3},labs:{facing:s=>s.facing===undefined?3:s.facing}});
 vm.runInContext('Array.prototype.removeAt=function(i){this.splice(i,1)}',context);
 vm.runInContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../libs/inventory/inventory.ts'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../toolkit.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2017}}).outputText,context);
 return {...context,saved,walls,scene};
}
test('inventory additions are atomic, stack by name, free slots on removal, and isolate bags',()=>{
 const r=runtime(),api=r.labsInventory,a=api.create(1),b=api.create(2);
 assert.equal(api.add(a,'coin',null,3),true);assert.equal(api.add(a,'key',null),false);
 assert.equal(api.add(a,'coin',null,2),true);assert.equal(api.count(a,'coin'),5);
 assert.equal(api.remove(a,'coin',6),false);assert.equal(api.count(a,'coin'),5);
 assert.equal(api.remove(a,'coin',5),true);assert.equal(api.emptySlots(a),1);
 api.add(b,'key',null,1);api.add(a,'coin',null,1);const names=api.itemNames(a);names.push('fake');assert.equal(api.itemNames(a).length,1);
 api.clear(a);assert.equal(api.count(b,'key'),1);assert.equal(api.count(a,'coin'),0);
 assert.equal(api.add(a,'coin',null,-1),false);assert.equal(api.remove(null,'x'),false);
});
test('seeded streams repeat within inclusive bounds without changing ordinary randomness',()=>{
 const r=runtime(),a=r.labs.randomSource(12345),b=r.labs.randomSource(12345),other=r.labs.randomSource(-3);
 for(let i=0;i<1000;i++){const x=r.labs.randomInteger(a,6,1);assert.ok(x>=1&&x<=6);assert.equal(x,r.labs.randomInteger(b,1,6));r.labs.randomInteger(other,1,100);}
 assert.equal(r.labs.randomInteger(a,4,4),4);
});
test('achievements persist once, emit once, and reset only the requested key',()=>{
 const r=runtime(),events=[];r.labs.onAchievementUnlocked(n=>events.push(n));
 r.saved.set('other-game-setting',17);assert.equal(r.labs.unlockAchievement('first'),true);
 assert.equal(r.labs.unlockAchievement('first'),false);assert.equal(r.labs.achievementUnlocked('first'),true);
 assert.deepEqual(events,['first']);r.labs.resetAchievement('first');assert.equal(r.labs.achievementUnlocked('first'),false);
 assert.equal(r.saved.get('other-game-setting'),17);assert.equal(r.labs.unlockAchievement(''),false);
});
test('line of sight respects walls, wall corners, boundaries, angle and distance',()=>{
 const r=runtime(),a={x:8,y:8},b={x:40,y:8};assert.equal(r.labs.clearLineOfSight(a,b),true);
 r.scene.tileMap={scale:4,data:{width:5,height:5}};r.walls.add('1,0');assert.equal(r.labs.clearLineOfSight(a,b),false);
 r.walls.clear();assert.equal(r.labs.canSee(a,b,40,90),true);assert.equal(r.labs.canSee(a,b,20,90),false);
 a.facing=2;assert.equal(r.labs.canSee(a,b,40,90),false);assert.equal(r.labs.canSee(a,b,40,360),true);
 r.walls.add('1,0');assert.equal(r.labs.clearLineOfSight(a,{x:24,y:24}),false);
 assert.equal(r.labs.clearLineOfSight(a,{x:-1,y:8}),false);assert.equal(r.labs.clearLineOfSight(null,b),false);
});
