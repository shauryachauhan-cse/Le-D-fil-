// A small perspective renderer shared by desktop and mobile. No WebGL or CSS 3D layers.
export function createRunwayScene(ctx,images){
 const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v)};
 let W,H,F,C,cy,sy,horizon,waterTexture=null,floorTexture=null,architecture=null;
 function view(p){let x=p[0]-C.x,z=p[2]-C.z;return [x*cy-z*sy,p[1]-C.y,x*sy+z*cy]}
 function project(p){return [W/2+p[0]*F/p[2],horizon-p[1]*F/p[2],p[2]]}
 function clip(poly){let out=[];for(let i=0;i<poly.length;i++){let a=poly[i],b=poly[(i+1)%poly.length],ai=a[2]>=.18,bi=b[2]>=.18;if(ai)out.push(a);if(ai!==bi){let u=(.18-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,.18])}}return out}
 function poly(points,fill,stroke){let p=clip(points.map(view));if(p.length<3)return;ctx.beginPath();p.forEach((v,i)=>{let q=project(v);i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
 function rect(x0,x1,z0,z1,y,fill,stroke){poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]],fill,stroke)}
 function line(a,b,color,width=1){let p=view(a),q=view(b);if(p[2]<.18&&q[2]<.18)return;if(p[2]<.18){let u=(.18-p[2])/(q[2]-p[2]);p=p.map((v,i)=>v+(q[i]-v)*u)}if(q[2]<.18){let u=(.18-q[2])/(p[2]-q[2]);q=q.map((v,i)=>v+(p[i]-v)*u)}p=project(p);q=project(q);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
 function point(x,y,z){let p=view([x,y,z]);return p[2]>.18?project(p):null}
 function billboard(img,sx,sw,x,z,height,width,brightness=1){if(!img)return;let b=point(x,0,z),top=point(x,height,z);if(!b||!top)return;let dh=b[1]-top[1],dw=width*F/b[2];if(dh<2||top[0]+dw<0||top[0]-dw>W)return;ctx.save();ctx.globalAlpha=brightness;ctx.drawImage(img,sx,0,sw,img.height,b[0]-dw/2,top[1],dw,dh);ctx.restore()}
 // Affine triangles subdivide an image plane so it follows the camera's turn.
 function texturedQuad(img,corners,nx=6,ny=4){if(!img)return;function at(u,v){let a=corners[0],b=corners[1],d=corners[3];return a.map((q,k)=>q+(b[k]-q)*u+(d[k]-q)*v)}function tri(v,uv){let p=v.map(view);if(p.some(q=>q[2]<.2))return;p=p.map(project);let [a,b,c]=uv,[A,B,D]=p,den=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);if(!den)return;let aa=((B[0]-A[0])*(c[1]-a[1])-(D[0]-A[0])*(b[1]-a[1]))/den,cc=((D[0]-A[0])*(b[0]-a[0])-(B[0]-A[0])*(c[0]-a[0]))/den,bb=((B[1]-A[1])*(c[1]-a[1])-(D[1]-A[1])*(b[1]-a[1]))/den,dd=((D[1]-A[1])*(b[0]-a[0])-(B[1]-A[1])*(c[0]-a[0]))/den;ctx.save();ctx.beginPath();ctx.moveTo(A[0],A[1]);ctx.lineTo(B[0],B[1]);ctx.lineTo(D[0],D[1]);ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,A[0]-aa*a[0]-cc*a[1],A[1]-bb*a[0]-dd*a[1]);ctx.drawImage(img,0,0);ctx.restore()}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let u=i/nx,v=j/ny,U=(i+1)/nx,V=(j+1)/ny,p=[at(u,v),at(U,v),at(U,V),at(u,V)],uv=[[u*img.width,v*img.height],[U*img.width,v*img.height],[U*img.width,V*img.height],[u*img.width,V*img.height]];tri([p[0],p[1],p[2]],[uv[0],uv[1],uv[2]]);tri([p[0],p[2],p[3]],[uv[0],uv[2],uv[3]])}}
 function curtain(x,z0,z1,open,side){let shift=side*open*1.8;for(let i=0;i<18;i++){let a=z0+(z1-z0)*i/18+shift,b=z0+(z1-z0)*(i+1)/18+shift,l=.35+.35*Math.sin(i*.9);poly([[x,0,a],[x,4.5,a],[x,4.5,b],[x,0,b]],`rgb(${Math.round(65*l)},${Math.round(24*l)},${Math.round(47*l)})`)}}
 function draw(time,w,h){W=w;H=h;F=Math.min(w*.9,h*.85);horizon=h*.42;let q=clamp((time-9)/10),turn=clamp((time-19)/5),yaw=Math.sin(q*Math.PI*2)*.16*Math.sin(q*Math.PI);C={x:Math.sin(q*Math.PI*18)*.015,y:1.67+Math.sin(q*Math.PI*18)*.022,z:.5+27.5*q};if(time>=19){C.x=7*ease((time-20.8)/3.2);C.z=28+6*ease((time-19)/1.8);C.y=1.67;yaw=Math.PI/2*ease((time-19)/2.7)}cy=Math.cos(yaw);sy=Math.sin(yaw);
 const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#070d18');sky.addColorStop(.5,'#263446');sky.addColorStop(1,'#04070c');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 // The room is a wall in world space; it becomes visible as the wearer turns right.
 if(images.runway&&!architecture){architecture=document.createElement('canvas');architecture.width=images.runway.width;architecture.height=Math.round(images.runway.height*.5);architecture.getContext('2d').drawImage(images.runway,0,0,images.runway.width,images.runway.height*.5,0,0,architecture.width,architecture.height)}
 texturedQuad(architecture,[[-42,28,43],[42,28,43],[42,0,43],[-42,0,43]],10,6);
 if(time>=19)texturedQuad(images.room,[[12,4.5,31],[12,4.5,37],[12,0,37],[12,0,31]],8,5);
 rect(-18,18,-5,46,-.06,'#080e18');
 // Water lies to either side of a clear raised runway.
 rect(-4.8,-1.55,-3,31,-.035,'#08273f');rect(1.55,4.8,-3,31,-.035,'#08273f');
 for(let z=43;z>-4;z-=.5){let stripe=Math.floor(z*2)%2===0?'#171e29':'#1c2430';rect(-1.5,1.5,z-.5,z,.035,stripe,'#ffffff07');for(let side of[-1,1])rect(side<0?-6.7:4.8,side<0?-4.8:6.7,z-.5,z,.025,'#111925')}
 rect(0,12,31,37,.035,'#20232b','#b99a6260');
 if(images.runway&&!waterTexture){waterTexture=document.createElement('canvas');waterTexture.width=waterTexture.height=256;let tx=waterTexture.getContext('2d');tx.drawImage(images.runway,0,images.runway.height*.57,images.runway.width*.10,images.runway.height*.25,0,0,256,256);floorTexture=document.createElement('canvas');floorTexture.width=128;floorTexture.height=256;floorTexture.getContext('2d').drawImage(images.runway,images.runway.width*.46,images.runway.height*.58,images.runway.width*.08,images.runway.height*.4,0,0,128,256)}
 if(waterTexture)for(let z=38;z>-4;z-=4){for(let side of[-1,1]){if(z>31)continue;let a=side<0?-4.8:1.55,b=side<0?-1.55:4.8;texturedQuad(waterTexture,[[a,-.01,z],[b,-.01,z],[b,-.01,z-4],[a,-.01,z-4]],2,3)}texturedQuad(floorTexture,[[-1.48,.04,z],[1.48,.04,z],[1.48,.04,z-4],[-1.48,.04,z-4]],2,3)}

 rect(0,12,31,37,.055,'#20232b','#b99a6260');if(floorTexture)texturedQuad(floorTexture,[[0,.06,37],[12,.06,37],[12,.06,31],[0,.06,31]],6,3);
 for(let side of[-1,1]){line([side*1.52,.06,-3],[side*1.52,.06,38],'#edc285',2);line([side*1.49,.061,-3],[side*1.49,.061,38],'#ffe3b866',4)}
 // Shimmering highlights are anchored in the water, so they move in perspective.
 for(let side of[-1,1])for(let i=0;i<190;i++){let z=-2+i*.17,x=side*(1.75+((i*43)%97)/97*2.8),wave=Math.sin(i*2.3+time*2.5),length=.05+((i*7)%11)*.026;line([x-length,.002,z],[x+length,.002,z+wave*.028],i%7===0?'#d3b78985':'#68b8de55',i%3===0?1.6:.7)}
 const items=[];for(let side of[-1,1])for(let i=0;i<22;i++){let z=1+i*1.35,x=side*(5.35+(i%2)*.38),d=view([x,.8,z])[2];items.push({type:'person',x,z,i,side,d});}for(let side of[-1,1])for(let i=0;i<9;i++){let z=1+i*4.1,x=side*6.9,d=view([x,3,z])[2];items.push({type:'column',x,z,i,side,d})}items.sort((a,b)=>b.d-a.d);
 for(let item of items){if(item.d<.25)continue;const {x,z,i,side}=item;if(item.type==='column'){poly([[x-.12,0,z],[x-.12,6,z],[x+.12,6,z],[x+.12,0,z]],'#a58956');line([x-.1,.1,z],[x-.1,5.9,z],'#f7d69d70',1);let top=point(side*3.8,6,z),base=point(side*1.9,0,z+1);if(top&&base){let g=ctx.createLinearGradient(top[0],top[1],base[0],base[1]);g.addColorStop(0,'#fff4db22');g.addColorStop(1,'#b7d8ef00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(top[0]-3,top[1]);ctx.lineTo(base[0]+80/item.d*5,base[1]);ctx.lineTo(base[0]-80/item.d*5,base[1]);ctx.closePath();ctx.fill()}}else{const im=images.crowd;if(im)billboard(im,((i+(side>0?3:0))%8)*im.width/8,im.width/8,x,z,1.72,.65,.93);let pulse=Math.pow(Math.max(0,Math.sin(time*3.3+i*8.17+side)),65);if(pulse>.4&&i%3===0){let p=point(x,1.3,z);if(p){ctx.save();ctx.globalAlpha=pulse;const r=Math.min(65,20+F/item.d*.07),gl=ctx.createRadialGradient(p[0],p[1],0,p[0],p[1],r);gl.addColorStop(0,'#fff');gl.addColorStop(.15,'#c5e9ffcc');gl.addColorStop(1,'#96ceff00');ctx.fillStyle=gl;ctx.fillRect(p[0]-r,p[1]-r,r*2,r*2);ctx.strokeStyle='#e5f6ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p[0]-r,p[1]);ctx.lineTo(p[0]+r,p[1]);ctx.moveTo(p[0],p[1]-r);ctx.lineTo(p[0],p[1]+r);ctx.stroke();ctx.restore()}}}}
 if(time>18){let open=ease((time-20)/2);curtain(3.8,31.5,34,open,-1);curtain(3.8,34,36.5,open,1);line([3.8,4.6,30],[3.8,4.6,38],'#ecc58c',5)}
 // Near-black edges retain the cinematic contrast without masking the central path.
 let v=ctx.createRadialGradient(w/2,h/2,w*.15,w/2,h/2,Math.max(w,h)*.7);v.addColorStop(0,'#02071000');v.addColorStop(1,'#020710a0');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
 return {x:C.x,y:C.y,z:C.z,yaw,people:44,flashes:true};
 }
 return {draw};
}
