const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
function runtime(){
 function bitmap(width,height){const pixels=new Uint8Array(width*height);return{width,height,getPixel(x,y){return pixels[y*width+x]||0},setPixel(x,y,c){pixels[y*width+x]=c}}}
 const created=[],context=vm.createContext({Math:Object.assign(Object.create(Math),{idiv:(a,b)=>Math.floor(a/b)}),image:{create:bitmap},SpriteFlag:{Invisible:1},sprites:{create(image,kind){const sprite={image,kind,x:0,y:0,invisible:false,setPosition(x,y){this.x=x;this.y=y},setFlag(flag,value){this.invisible=value}};created.push(sprite);return sprite}}});
 vm.runInContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../shapes.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2017}}).outputText,context);
 return{...context,bitmap,created};
}
test('painted shapes retain their own pixels when one lies inside another bounding box',()=>{
 const r=runtime(),picture=r.bitmap(12,12);
 for(let n=0;n<12;n++){picture.setPixel(n,0,1);picture.setPixel(n,11,1);picture.setPixel(0,n,1);picture.setPixel(11,n,1)}
 picture.setPixel(5,5,2);picture.setPixel(6,5,3);
 const pieces=r.labs.spritesFromShapes(8,picture,20,30,true);
 assert.equal(pieces.length,2);assert.equal(pieces[0].image.getPixel(5,5),0,'The outer shape must not copy the disconnected inner art');assert.equal(pieces[1].image.getPixel(0,0),2);assert.equal(pieces[1].image.getPixel(1,0),3);
 assert.deepEqual([pieces[0].x,pieces[0].y,pieces[1].x,pieces[1].y],[26,36,26,35.5]);assert.ok(pieces.every(p=>p.kind===8&&p.invisible));assert.equal(picture.getPixel(5,5),2,'Input art stays editable and unchanged');
});
test('transparent gaps and diagonal contact separate shapes; empty layouts create no sprites',()=>{
 const r=runtime(),picture=r.bitmap(4,4);picture.setPixel(0,0,1);picture.setPixel(1,1,2);picture.setPixel(2,1,3);
 const pieces=r.labs.spritesFromShapes(9,picture);assert.equal(pieces.length,2);assert.equal(pieces[1].image.width,2);assert.ok(pieces.every(p=>!p.invisible));assert.equal(r.labs.spritesFromShapes(9,r.bitmap(4,4)).length,0);assert.equal(r.labs.spritesFromShapes(9,null).length,0);
});
