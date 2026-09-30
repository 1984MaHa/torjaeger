// Minimaler PNG-Leser und -Schreiber (8 Bit, RGB oder RGBA, ohne Zeilenversatz). Nur für die Hilfsskripte, nicht Teil der App.
import zlib from "node:zlib";
import fs from "node:fs";

export function readPNG(file){
  const b=fs.readFileSync(file);
  if(b.readUInt32BE(0)!==0x89504e47)throw new Error("kein PNG: "+file);
  let p=8,w=0,h=0,ct=0,bd=0;const idat=[];
  while(p<b.length){
    const len=b.readUInt32BE(p),type=b.toString("latin1",p+4,p+8),d=b.subarray(p+8,p+8+len);
    if(type==="IHDR"){w=d.readUInt32BE(0);h=d.readUInt32BE(4);bd=d[8];ct=d[9];if(d[12])throw new Error("interlaced nicht unterstützt");}
    else if(type==="IDAT")idat.push(d);
    else if(type==="IEND")break;
    p+=12+len;
  }
  if(bd!==8||(ct!==2&&ct!==6))throw new Error("nur 8 Bit RGB oder RGBA");
  const bpp=ct===6?4:3,raw=zlib.inflateSync(Buffer.concat(idat)),stride=w*bpp,out=Buffer.alloc(w*h*4);
  let prev=Buffer.alloc(stride),cur=Buffer.alloc(stride),q=0;
  for(let y=0;y<h;y++){
    const f=raw[q++];raw.copy(cur,0,q,q+stride);q+=stride;
    for(let i=0;i<stride;i++){
      const a=i>=bpp?cur[i-bpp]:0,up=prev[i],c=i>=bpp?prev[i-bpp]:0;let v=cur[i];
      if(f===1)v+=a;else if(f===2)v+=up;else if(f===3)v+=(a+up)>>1;
      else if(f===4){const pa=Math.abs(up-c),pb=Math.abs(a-c),pc=Math.abs(a+up-2*c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?up:c);}
      cur[i]=v&255;
    }
    for(let x=0;x<w;x++){const o=(y*w+x)*4,s=x*bpp;out[o]=cur[s];out[o+1]=cur[s+1];out[o+2]=cur[s+2];out[o+3]=bpp===4?cur[s+3]:255;}
    [prev,cur]=[cur,prev];
  }
  return{w,h,data:out};
}

const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc=buf=>{let c=0xffffffff;for(const x of buf)c=CRC[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
const chunk=(type,d)=>{const o=Buffer.alloc(12+d.length);o.writeUInt32BE(d.length,0);o.write(type,4,"latin1");d.copy(o,8);o.writeUInt32BE(crc(o.subarray(4,8+d.length)),8+d.length);return o;};

// Schreibt RGBA. Filter: je Zeile der günstigste aus Sub, Up und Paeth (für kleine Dateien bei flachen Bildern).
export function writePNG(file,{w,h,data}){
  const stride=w*4,raw=Buffer.alloc((stride+1)*h);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:(pb<=pc?b:c);};
  for(let y=0;y<h;y++){
    let best=null,bf=0,bs=Infinity;
    for(const f of[0,1,2,4]){
      const line=Buffer.alloc(stride);let s=0;
      for(let i=0;i<stride;i++){
        const x=data[y*stride+i],a=i>=4?data[y*stride+i-4]:0,up=y?data[(y-1)*stride+i]:0,c=(y&&i>=4)?data[(y-1)*stride+i-4]:0;
        const pred=f===0?0:f===1?a:f===2?up:paeth(a,up,c);
        const v=(x-pred)&255;line[i]=v;s+=v<128?v:256-v;
      }
      if(s<bs){bs=s;best=line;bf=f;}
    }
    raw[y*(stride+1)]=bf;best.copy(raw,y*(stride+1)+1);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  fs.writeFileSync(file,Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk("IHDR",ihdr),chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]));
}
