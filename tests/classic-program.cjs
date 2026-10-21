// Original test art, not extracted game assets.
const floor=Array(16).fill(Array(16).fill('5').join(' ')).join('\n');
const ladder=Array.from({length:16},(_,y)=>Array.from({length:16},(_,x)=>x===3||x===12||y%4===0&&x>3&&x<12?'9':'.').join(' ')).join('\n');
const data=Buffer.alloc(4+20*8);data.writeUInt16LE(20,0);data.writeUInt16LE(8,2);
for(let x=0;x<20;x++)data[4+7*20+x]=2;
for(let y=2;y<7;y++)data[4+y*20+5]=1;
const walls=Array.from({length:8},(_,y)=>Array.from({length:20},()=>y===7?'2':'.').join(' ')).join('\n');
const world=`tiles.setCurrentTilemap(tiles.createTilemap(hex\`${data.toString('hex')}\`,img\`${walls}\`,[img\`.\`,img\`${ladder}\`,img\`${floor}\`],TileScale.Sixteen))\n`;
const calls=`let hero = sprites.create(img\`2 2 2 2\n2 2 2 2\n2 2 2 2\n2 2 2 2\`, SpriteKind.Player)
let ledge = sprites.create(img\`7 7 7 7 7 7 7 7\n7 7 7 7 7 7 7 7\`, SpriteKind.Food)
hero.setPosition(32,80)
ledge.setPosition(60,90)
labs.forgivingJump(hero,150,350,100,120)
labs.climbLadders(hero,img\`${ladder}\`,50)
labs.standOnPlatform(hero,ledge)
controller.down.onEvent(ControllerButtonEvent.Pressed,function(){labs.dropThroughPlatforms(hero,250)})
game.onUpdate(function(){if(labs.isOnPlatform(hero))info.setScore(1)})
labs.moveFourDirections(hero,80)
labs.roomCamera(hero,160,120,200)
`;
const verification=world+`let nativeChecks = 0
let nativeFinished = false
let hero = sprites.create(img\`2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\n2 2 2 2 2 2 2 2\`,SpriteKind.Player)
let ledge = sprites.create(img\`7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7\n7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7\`,SpriteKind.Food)
ledge.setPosition(40,70)
hero.setPosition(40,84)
labs.standOnPlatform(hero,ledge)
hero.vy=-100
pause(250)
if (!labs.isOnPlatform(hero) && hero.bottom<ledge.top) nativeChecks+=1
hero.vy=100
pause(250)
if (labs.isOnPlatform(hero) && Math.abs(hero.bottom-ledge.top)<1) nativeChecks+=1
let beforeCarry=hero.x
ledge.vx=20
pause(150)
if(labs.isOnPlatform(hero)&&hero.x>beforeCarry+1)nativeChecks+=1
labs.dropThroughPlatforms(hero,250)
pause(150)
if(!labs.isOnPlatform(hero)&&hero.bottom>ledge.top)nativeChecks+=1
ledge.destroy()
hero.setPosition(24,106)
hero.vx=0
hero.vy=0
labs.forgivingJump(hero,150,350,100,120)
pause(150)
controller.A.setPressed(true)
pause(80)
if(hero.vy<0&&hero.y<106)nativeChecks+=1
controller.A.setPressed(false)
pause(500)
hero.setPosition(88,72)
hero.vy=0
labs.climbLadders(hero,img\`${ladder}\`,50)
controller.up.setPressed(true)
pause(120)
if(hero.ay==0&&hero.vy<0&&hero.y<72)nativeChecks+=1
controller.up.setPressed(false)
hero.x=120
pause(80)
if(hero.ay==350)nativeChecks+=1
hero.ay=0
hero.setPosition(24,40)
labs.moveFourDirections(hero,80)
controller.right.setPressed(true)
pause(80)
controller.up.setPressed(true)
pause(80)
if(hero.vx==0&&hero.vy<0&&labs.facing(hero)==LabsFacing.Up)nativeChecks+=1
controller.up.setPressed(false)
controller.right.setPressed(false)
pause(80)
labs.roomCamera(hero,160,120,100)
pause(100)
if(Math.abs(scene.cameraProperty(CameraProperty.X)-80)<1)nativeChecks+=1
hero.x=180
pause(200)
if(Math.abs(scene.cameraProperty(CameraProperty.X)-240)<1)nativeChecks+=1
nativeFinished=true
`;
module.exports={world,calls,verification};
