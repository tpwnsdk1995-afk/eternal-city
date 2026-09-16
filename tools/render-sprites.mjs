// Pre-render a GLB character into the game's 8×6 sprite sheet (dirs × [idle, walk×3, aim, death]).
// Mirrors the 2003 workflow where the original game rendered 3D models into oblique sprites.
// Needs node ≥ 18 with playwright (+ Chromium) resolvable; three.js is fetched from jsdelivr at run time.
//
//   node tools/render-sprites.mjs <model.glb> <out.png> [frame=48] [heightPx=34] [elevationDeg=52] [yawOffsetDeg=90]
//
// heightPx is the *projected* standing height in the frame (camera tilted by elevationDeg). yawOffsetDeg
// compensates for the model's rest facing: tripo output faces the camera at +90°, glTF convention (+z) is 0.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';

const [glbPath, outPath, frameArg = '48', heightArg = '34', elevArg = '52', yawOffArg = '90'] = process.argv.slice(2);
const FRAME = Number(frameArg);
const HEIGHT_PX = Number(heightArg);
const ELEV = Number(elevArg);
const YAW_OFF = Number(yawOffArg);
const SS = 4; // supersample

const html = `<!doctype html><html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const FRAME=${FRAME}, SS=${SS}, R=FRAME*SS, HEIGHT_PX=${HEIGHT_PX}, ELEV=${ELEV}*Math.PI/180, OFF=${YAW_OFF}*Math.PI/180;
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(R,R); renderer.setClearColor(0x000000,0); renderer.outputColorSpace=THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xe8eef8,0x50505a,1.8));
scene.add(new THREE.AmbientLight(0xffffff,0.5));
const key=new THREE.DirectionalLight(0xfff3e0,2.4); key.position.set(-2,4,3); scene.add(key);
const fill=new THREE.DirectionalLight(0xc8d4ff,0.9); fill.position.set(3,2,2); scene.add(fill);
const rim=new THREE.DirectionalLight(0x9fb4ff,0.8); rim.position.set(1,3,-3); scene.add(rim);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,100);
const gltf=await new GLTFLoader().loadAsync('/model.glb');
const root=gltf.scene;
root.traverse(o=>{ if(o.isMesh&&o.material){ o.material.roughness=Math.min(0.9,(o.material.roughness??0.7)+0.15); } });
// normalise: feet at y=0, centred
const box=new THREE.Box3().setFromObject(root); const size=box.getSize(new THREE.Vector3()); const h=size.y;
root.position.sub(new THREE.Vector3((box.min.x+box.max.x)/2, box.min.y, (box.min.z+box.max.z)/2));
const tilt=new THREE.Group(); tilt.add(root); const pivot=new THREE.Group(); pivot.add(tilt); scene.add(pivot);
const mixer=gltf.animations.length?new THREE.AnimationMixer(root):null;
const clip=gltf.animations.find(c=>/walk/i.test(c.name))||gltf.animations[0]||null;
const action=mixer&&clip?mixer.clipAction(clip):null; if(action){action.play();}
// frustum: projected standing height h·cos(ELEV) → HEIGHT_PX pixels
const unitsPerPx=h*Math.cos(ELEV)/HEIGHT_PX; const half=(FRAME/2)*unitsPerPx;
cam.left=-half; cam.right=half; cam.top=half; cam.bottom=-half; cam.updateProjectionMatrix();
const sheet=document.createElement('canvas'); sheet.width=FRAME*6; sheet.height=FRAME*8; const sctx=sheet.getContext('2d');
const tmp=document.createElement('canvas'); tmp.width=FRAME; tmp.height=FRAME; const tctx=tmp.getContext('2d');
tctx.imageSmoothingEnabled=true; tctx.imageSmoothingQuality='high';
// camera looks from the south, tilted down by ELEV; target below mid-height so the feet sit low in the frame
const d=10; const target=new THREE.Vector3(0,h*0.40,0);
cam.position.set(0, target.y+Math.sin(ELEV)*d, Math.cos(ELEV)*d); cam.lookAt(target);
// Dir 0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE (S = facing the camera)
const yawFor=[Math.PI/2, Math.PI/4, 0, -Math.PI/4, -Math.PI/2, -3*Math.PI/4, Math.PI, 3*Math.PI/4].map(a=>a+OFF);
function shot(col,row){ renderer.render(scene,cam);
  tctx.clearRect(0,0,FRAME,FRAME); tctx.drawImage(renderer.domElement,0,0,R,R,0,0,FRAME,FRAME);
  // soft 1px dark contour so the tiny figure reads against busy ground
  sctx.save(); sctx.filter='brightness(0)'; sctx.globalAlpha=0.55;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) sctx.drawImage(tmp,col*FRAME+dx,row*FRAME+dy);
  sctx.restore(); sctx.drawImage(tmp,col*FRAME,row*FRAME); }
for(let dir=0;dir<8;dir++){
  pivot.rotation.set(0,yawFor[dir],0); tilt.rotation.set(0,0,0); root.position.y=0;
  const dur=clip?clip.duration:1;
  const phases=[0.25,0.0,0.5,0.25]; // idle = legs passing (0.25); steps at 0 / 0.5; pass again
  for(let f=0;f<4;f++){ if(action){ action.time=phases[f]*dur; mixer.update(0);} shot(f,dir); }
  // aim: idle pose for now (a dedicated aim clip can replace this later)
  if(action){ action.time=0.25*dur; mixer.update(0);} shot(4,dir);
  // death: fall backwards about the body's own lateral axis, sunk slightly into the ground
  tilt.rotation.set(-Math.PI/2*0.9,0,0); root.position.y=-h*0.04; shot(5,dir);
  tilt.rotation.set(0,0,0); root.position.y=0;
}
window.__sheet=sheet.toDataURL('image/png'); window.__meta={height:h,size:size.toArray(),anims:gltf.animations.map(a=>a.name)};
</script></body></html>`;

const glb = readFileSync(glbPath);
const server = createServer((req, res) => {
  if (req.url === '/model.glb') { res.setHeader('Content-Type', 'model/gltf-binary'); res.end(glb); return; }
  res.setHeader('Content-Type', 'text/html'); res.end(html);
}).listen(8123);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
page.on('pageerror', (e) => console.error('[page]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });
await page.goto('http://localhost:8123/');
await page.waitForFunction(() => window.__sheet, null, { timeout: 180000 });
const data = await page.evaluate(() => window.__sheet);
console.log(JSON.stringify(await page.evaluate(() => window.__meta)));
writeFileSync(outPath, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
server.close();
console.log('wrote', outPath);
