const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function runtime(){
 const pressed=new Set(),handlers=[],sprites=[];let now=0;
 const current={data:{},tileMap:{data:{},scale:4},ladderTiles:new Set(),eventContext:{deltaTimeMillis:16,registerFrameHandler:(priority,fn)=>handlers.push({priority,fn})}};
 const camera={x:0,y:0};
 const flags={Destroyed:1,Invisible:2,GhostThroughSprites:4,GhostThroughWalls:8};
 class Hitbox{constructor(parent,width,height,ox,oy){Object.assign(this,{parent,width,height,ox,oy,hash:parent.calcDimensionalHash()});}isValid(){return this.hash===this.parent.calcDimensionalHash();}}
 const context=vm.createContext({Math:Object.assign(Object.create(Math),{constrain:(v,lo,hi)=>Math.max(lo,Math.min(v,hi))}),controller:{...Object.fromEntries(['left','right','up','down','A'].map(k=>[k,{isPressed:()=>pressed.has(k)}])),moveSprite(){}},
  game:{runtime:()=>now,currentScene:()=>current,onUpdate:fn=>handlers.push({priority:20,fn}),Hitbox},Fx8:n=>n,SpriteFlag:flags,
  scene:{PHYSICS_PRIORITY:15,cameraFollowSprite(){},centerCameraAt(x,y){camera.x=x;camera.y=y;}},
  tiles:{getTileLocation:(x,y)=>({x,y}),tileAtLocationEquals:l=>current.ladderTiles.has(l.x+','+l.y)},
  control:{runInParallel:fn=>fn()},randint:(lo,hi)=>lo,
  sprites:{Flag:flags,allOfKind:kind=>sprites.filter(s=>s.kind()===kind&&!(s.flags&flags.Destroyed))},TileDirection:{Center:0,Bottom:1},CollisionDirection:{Bottom:1}});
 vm.runInContext('Array.prototype.removeAt=function(i){this.splice(i,1)}',context);
 for(const f of ['recipes.ts','classic.ts'])vm.runInContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2017}}).outputText,context);
 function sprite(x=50,y=20,w=8,h=8,pixel=()=>1){const s={x,y,width:w,height:h,vx:0,vy:0,ay:0,data:{},flags:0,rotation:0,grounded:false,onLadder:false,belowLadder:false,image:{width:w,height:h,getPixel:pixel},revision:1,calcDimensionalHash(){return this.revision;},setFlag(flag,on){this.flags=on?this.flags|flag:this.flags&~flag;},isHittingTile(){return this.grounded;},tileKindAt(direction){return direction===1?this.belowLadder:this.onLadder;},setPosition(x,y){this.x=x;this.y=y;}};
  s.spriteKind=0;s.kind=()=>s.spriteKind;s.setImage=i=>{s.image=i;s.width=i.width;s.height=i.height;s.revision++};s.image.clone=()=>({width:w,height:h,getPixel:pixel,flipX(){}});
  for(const [name,axis,sign,size] of [['left','x',-1,'width'],['right','x',1,'width'],['top','y',-1,'height'],['bottom','y',1,'height']])Object.defineProperty(s,name,{get(){return this[axis]+sign*this[size]/2},set(v){this[axis]=v-sign*this[size]/2}});sprites.push(s);return s;}
 return {...context,pressed,camera,current,handlers,sprite,tick(ms=16){now+=ms;current.eventContext.deltaTimeMillis=ms;for(const h of handlers.filter(h=>h.priority<15).sort((a,b)=>a.priority-b.priority))h.fn();for(const s of sprites){s.vy+=s.ay*ms/1000;s.x+=s.vx*ms/1000;s.y+=s.vy*ms/1000;}for(const h of handlers.filter(h=>h.priority>15).sort((a,b)=>a.priority-b.priority))h.fn();}};
}
test('forgiving jump allows a late edge press, buffers a landing press, cuts on release and prevents midair retriggers',()=>{
 const r=runtime(),s=r.sprite();r.labs.forgivingJump(s,150,0,100,120);s.grounded=true;r.tick();s.grounded=false;r.tick(50);r.pressed.add('A');r.tick(16);assert.equal(s.vy,-150);r.pressed.delete('A');r.tick();assert.equal(s.vy,-75);r.pressed.add('A');r.tick();assert.equal(s.vy,-75);
 const q=runtime(),p=q.sprite();q.labs.forgivingJump(p,150,0);q.pressed.add('A');q.tick();assert.equal(p.vy,0);p.grounded=true;q.tick();q.tick();assert.equal(p.vy,-150,'Press before landing becomes a jump on the next frame');
});
test('platform kinds include platforms made after the character and prune destroyed platforms',()=>{
 const r=runtime(),s=r.sprite(50,20);r.labs.standOnPlatformsOfKind(s,9);const p=r.sprite(50,50,40,8);p.spriteKind=9;s.vy=100;r.tick(250);assert.equal(r.labs.isOnPlatform(s),true);p.flags=1;r.tick();assert.equal(r.labs.isOnPlatform(s),false);
});
test('sprite ladders align a climber, stop at the upper surface and release gravity in a gap',()=>{
 const r=runtime(),s=r.sprite(52,66),ladder=r.sprite(50,50,6,40);ladder.spriteKind=9;s.ay=300;r.labs.climbSpriteLadders(s,9,40);r.pressed.add('up');r.tick();assert.equal(s.x,50);assert.equal(s.ay,0);assert.equal(r.labs.isClimbing(s),true);
 s.bottom=30.1;r.tick();assert.equal(s.bottom,30);assert.equal(s.ay,300);assert.equal(r.labs.isClimbing(s),false);
 s.y=90;r.tick();assert.equal(s.ay,300);assert.equal(r.labs.isClimbing(s),false,'No ladder may bridge an unpainted gap');
});
test('fixed jumps retain their arc after A releases and keep takeoff horizontal speed',()=>{
 const r=runtime(),s=r.sprite();r.labs.fixedArcJump(s,150,600);s.grounded=true;r.tick();s.vx=45;r.pressed.add('A');r.tick();assert.ok(s.vy<-130);s.grounded=false;r.pressed.delete('A');s.vx=-45;r.tick();assert.equal(s.vx,45);assert.ok(s.vy<-120,'Release does not cut the jump in half');
});
test('heavy items disable jumping and release a ladder without changing walking speed',()=>{
 const r=runtime(),s=r.sprite(),ladder=r.sprite(50,25,8,40);ladder.spriteKind=9;r.labs.forgivingJump(s,150,350);r.labs.climbSpriteLadders(s,9,40);r.pressed.add('up');r.tick();assert.equal(s.ay,0);r.labs.allowJumpAndClimb(s,false);s.vx=30;r.pressed.add('A');r.tick();assert.equal(s.ay,350);assert.equal(s.vx,30);assert.ok(s.vy>=0);
});
test('jump-over events count unique obstacles once on landing and separate kinds',()=>{
 const r=runtime(),s=r.sprite(50,30),a=r.sprite(50,30),b=r.sprite(50,30),lower=r.sprite(50,60);a.spriteKind=7;b.spriteKind=8;lower.spriteKind=7;
 let seven=0,eight=0;r.labs.onJumpedOver(s,7,n=>seven+=n);r.labs.onJumpedOver(s,8,n=>eight+=n);r.labs.fixedArcJump(s,100,0);s.grounded=true;r.tick();r.pressed.add('A');r.tick();s.grounded=false;r.pressed.clear();for(let i=0;i<8;i++)r.tick();assert.equal(seven,0);s.grounded=true;s.vy=0;r.tick();assert.equal(seven,1,'Do not count an obstacle on a lower floor');assert.equal(eight,1);r.tick();assert.equal(seven,1);
});
test('one-way art platforms allow upward passage, stop a fall, carry the rider and allow drop-through',()=>{
 const r=runtime(),s=r.sprite(50,56),p=r.sprite(50,50,40,8);r.labs.standOnPlatform(s,p);s.vy=-100;r.tick(200);assert.equal(r.labs.isOnPlatform(s),false);s.vy=100;r.tick(100);assert.equal(s.bottom,p.top);assert.equal(r.labs.isOnPlatform(s),true);
 const x=s.x;p.vx=20;r.tick(100);assert.equal(s.x,x+2);r.labs.dropThroughPlatforms(s,250);r.tick(200);assert.ok(s.bottom>p.top);assert.equal(r.labs.isOnPlatform(s),false);
 p.flags=1;r.tick();assert.equal(s.data.__labsClassicActor_v1.platforms.length,0);
});
test('rolling follows a slope, drops at its end, lands on the next level and reverses',()=>{
 const r=runtime(),p=r.sprite(50,54,40,8,(x,y)=>y>=Math.floor(x/8)?1:0),lower=r.sprite(55,94,80,8),s=r.sprite(50,40);p.spriteKind=9;lower.spriteKind=9;
 r.labs.rollDownPlatforms(s,9,30);let right=false,landed=false;
 for(let i=0;i<250;i++){r.tick();if(s.vx>0)right=true;if(s.data.__labsClassicActor_v1.support===lower&&s.vx<0){landed=true;break}}
 assert.equal(right,true);assert.equal(landed,true);
});
test('platform explorers can climb upward and step onto the higher platform',()=>{
 const r=runtime(),lower=r.sprite(50,104,80,8),upper=r.sprite(50,64,80,8),ladder=r.sprite(50,80,6,40),s=r.sprite(52,96);lower.spriteKind=9;upper.spriteKind=9;ladder.spriteKind=10;
 r.labs.explorePlatforms(s,9,10,40,100);let climbed=false,landed=false;
 for(let i=0;i<240;i++){r.tick();if(s.vy<0)climbed=true;if(s.data.__labsClassicActor_v1.support===upper){landed=true;break}}
 assert.equal(climbed,true);assert.equal(landed,true);for(let i=0;i<20;i++)r.tick();assert.ok(s.bottom<=upper.top+1,'Walk away instead of immediately descending the same ladder');
});
test('held tools follow their owner, alternate positions, expire and restore earlier controls',()=>{
 const r=runtime(),s=r.sprite(50,80),tool=r.sprite(),frame=tool.image;
 r.labs.swingHeldTool(s,tool,[frame],200,16,50,true);r.tick();assert.equal(r.labs.isUsingTool(s),true);assert.equal(s.data.__labsClassicActor_v1.jumpClimbEnabled,false);assert.equal(tool.y,s.y-16);
 r.tick(50);assert.equal(tool.y,s.y);assert.equal(tool.x,s.x+16);
 r.tick(200);assert.equal(r.labs.isUsingTool(s),false);assert.equal(s.data.__labsClassicActor_v1.jumpClimbEnabled,true);assert.ok(tool.flags&2);assert.ok(tool.flags&4);
 r.labs.allowJumpAndClimb(s,false);r.labs.swingHeldTool(s,tool,[frame],20);r.tick(50);assert.equal(s.data.__labsClassicActor_v1.jumpClimbEnabled,false,'Expiring a tool must not enable controls that were already disabled');
});
test('a blank optional held-tool pose keeps the normal platformer picture visible',()=>{
 const r=runtime(),s=r.sprite(50,80),tool=r.sprite(),frame=s.image,blank=r.sprite(0,0,8,8,()=>0).image;
 r.labs.animatePlatformer(s,[frame],[frame],[frame],[frame]);r.labs.swingHeldTool(s,tool,[frame],200,16,100,true,[blank]);r.tick();assert.equal(s.image.getPixel(0,0),1);
});
test('painted sloping platform tops support uphill walking instead of treating the image as a flat rectangle',()=>{
 const r=runtime(),p=r.sprite(50,60,32,16,(x,y)=>y>=15-Math.floor(x/2)?1:0),s=r.sprite(40,44);s.vy=100;s.ay=100;r.labs.standOnPlatform(s,p);r.tick(200);assert.equal(r.labs.isOnPlatform(s),true);const initial=s.bottom;s.vx=20;for(let i=0;i<10;i++)r.tick(16);assert.equal(r.labs.isOnPlatform(s),true);assert.ok(s.bottom<initial);
});
test('ladder controls pause gravity while climbing and restore it on exit and jump',()=>{
 const r=runtime(),s=r.sprite();s.ay=350;s.onLadder=true;r.labs.climbLadders(s,{},50);r.pressed.add('up');r.tick();assert.equal(s.ay,0);assert.equal(s.vy,-50);r.pressed.clear();r.tick();assert.equal(s.vy,0);s.onLadder=false;r.tick();assert.equal(s.ay,350);
 s.onLadder=true;r.labs.forgivingJump(s,150,350);r.pressed.add('up');r.tick();r.pressed.add('A');r.tick();assert.equal(s.ay,350);assert.ok(s.vy<0);
});
test('ladder grip checks actual feet and releases above the top even when a whole neighboring tile is a ladder',()=>{
 const r=runtime(),s=r.sprite(50,30);s.ay=350;r.current.ladderTiles.add('3,2');r.labs.climbLadders(s,{},50);r.pressed.add('up');r.tick();assert.equal(s.ay,0,'Feet can enter a ladder before the center does');
 s.y=20;s.belowLadder=true;r.pressed.clear();r.tick();assert.equal(s.ay,350,'A ladder below cleared feet must not leave the actor hovering');
});
test('adventure controls give the newly pressed axis priority without diagonal speed and keep facing at rest',()=>{
 const r=runtime(),s=r.sprite();r.labs.moveFourDirections(s,80);r.pressed.add('right');r.tick();assert.deepEqual([s.vx,s.vy],[80,0]);r.pressed.add('up');r.tick();assert.deepEqual([s.vx,s.vy],[0,-80]);assert.equal(r.labs.facing(s),r.LabsFacing.Up);r.pressed.delete('up');r.tick();assert.deepEqual([s.vx,s.vy],[80,0]);r.pressed.clear();r.tick();assert.deepEqual([s.vx,s.vy],[0,0]);assert.equal(r.labs.facing(s),r.LabsFacing.Right);
});
test('grid movement remembers a queued turn while both buttons remain held, turns exactly on a lane and stops on release',()=>{
 const r=runtime(),s=r.sprite(3,5);r.labs.moveOnGrid(s,8,100,0,5);r.pressed.add('right');r.tick(10);assert.equal(s.x,4);
 r.pressed.add('up');for(let i=0;i<3;i++)r.tick(10);assert.equal(s.x,7);assert.equal(s.y,5);
 r.tick(10);assert.equal(s.x,8);assert.equal(s.vx,0);assert.equal(s.vy,-100);assert.equal(s.y,4);
 r.pressed.clear();r.tick(10);assert.equal(s.vx,0);assert.equal(s.vy,0);assert.equal(r.labs.isFacing(s,r.LabsFacing.Up),true);
});
test('melee attacks lock movement, reject retriggers and expose the attached weapon only during the swing window',()=>{
 const r=runtime(),s=r.sprite(40,40),weapon=r.sprite();r.labs.moveOnGrid(s,8,100);r.labs.setFacing(s,r.LabsFacing.Right);
 r.labs.startMeleeAttack(s,weapon,12,80,120,50);assert.equal(r.labs.isAttacking(s),true);
 r.pressed.add('left');r.tick(40);r.labs.startMeleeAttack(s,weapon,99,80,120,50);assert.equal(s.data.__labsClassicActor_v1.reach,12,'A second attack must not restart the swing');assert.equal(s.vx,0);assert.ok(weapon.flags&r.SpriteFlag.Invisible);assert.equal(r.labs.facing(s),r.LabsFacing.Right);
 r.tick(40);assert.equal(weapon.flags&r.SpriteFlag.Invisible,0);assert.equal(weapon.flags&r.SpriteFlag.GhostThroughSprites,0);assert.equal(weapon.x,s.x+12);
 r.tick(120);assert.ok(weapon.flags&r.SpriteFlag.Invisible);assert.equal(r.labs.isAttacking(s),true);
 r.tick(50);assert.equal(r.labs.isAttacking(s),false);assert.equal(s.vx,-100);
});
test('grid controls can turn away from a wall after a shove leaves the character between lanes',()=>{
 const r=runtime(),s=r.sprite(248,152);r.labs.moveOnGrid(s,8,80,0,5);const a=s.data.__labsClassicActor_v1;a.axis=2;a.queuedAxis=2;r.labs.setFacing(s,r.LabsFacing.Down);s.grounded=true;r.pressed.add('right');r.tick(16);
 assert.equal(s.y,149);assert.equal(s.vy,0);assert.equal(s.vx,80);
});
test('a queued turn uses the upcoming lane rather than snapping backward during a long frame',()=>{
 const r=runtime(),s=r.sprite(78,149);r.labs.moveOnGrid(s,8,80,0,5);const a=s.data.__labsClassicActor_v1;a.axis=1;a.queuedAxis=1;r.labs.setFacing(s,r.LabsFacing.Left);r.pressed.add('up');r.tick(75);
 assert.equal(s.x,72);assert.equal(s.vx,0);assert.equal(s.vy,-80);
});
test('collision box survives changed animation images without allocating another box on every frame',()=>{
 const r=runtime(),s=r.sprite(40,40,16,16);r.labs.setCollisionBox(s,8,8,4,8);r.tick();const first=s._hitbox;
 assert.deepEqual([first.width,first.height,first.ox,first.oy],[8,8,4,8]);r.tick();assert.equal(s._hitbox,first);
 s.revision++;r.tick();assert.notEqual(s._hitbox,first);assert.deepEqual([s._hitbox.width,s._hitbox.height,s._hitbox.ox,s._hitbox.oy],[8,8,4,8]);
});
test('hops follow an arc, cannot restart mid-hop, land exactly and restore the original wall setting',()=>{
 const r=runtime(),s=r.sprite(10,20);r.labs.hopTo(s,50,20,12,500);r.labs.hopTo(s,90,20,12,500);
 r.tick(250);assert.equal(s.x,30);assert.equal(s.y,8);assert.ok(s.flags&r.SpriteFlag.GhostThroughWalls);
 r.tick(250);assert.equal(s.x,50);assert.equal(s.y,20);assert.equal(s.flags&r.SpriteFlag.GhostThroughWalls,0);
 s.setFlag(r.SpriteFlag.GhostThroughWalls,true);r.labs.hopTo(s,70,40,12,500);r.tick(500);assert.ok(s.flags&r.SpriteFlag.GhostThroughWalls);
});
test('existing knockback takes priority over grid controls without changing facing',()=>{
 const r=runtime(),s=r.sprite(40,40),source=r.sprite(20,40);r.labs.moveOnGrid(s,8,100);r.labs.setFacing(s,r.LabsFacing.Up);r.labs.knockback(s,source,120,133);r.pressed.add('left');r.tick(16);
 assert.equal(s.vx,120);assert.equal(s.vy,0);assert.equal(r.labs.facing(s),r.LabsFacing.Up);
 r.tick(150);r.tick(16);assert.equal(s.vx,-100);
});
test('room camera stays fixed inside a room, slides across boundaries and reconfigures without duplicate handlers',()=>{
 const r=runtime(),s=r.sprite(20,20);r.labs.roomCamera(s,160,120,200);r.tick();assert.deepEqual(r.camera,{x:80,y:60});s.x=159;r.tick();assert.equal(r.camera.x,80);s.x=170;r.tick();assert.equal(r.camera.x,80);r.tick(100);assert.equal(r.camera.x,160);r.tick(100);assert.equal(r.camera.x,240);const count=r.handlers.length;r.labs.roomCamera(s,80,60,0);assert.equal(r.handlers.length,count);r.tick();assert.deepEqual(r.camera,{x:200,y:30});
});
