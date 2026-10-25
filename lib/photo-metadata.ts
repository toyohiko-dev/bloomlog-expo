/** Read only JPEG EXIF GPS locally. No network, image upload, or implicit current-location fallback. */
export type PhotoCoordinates = { latitude:number; longitude:number; accuracy:number };
export function readJpegGps(buffer:ArrayBuffer):PhotoCoordinates|null {
 try {
  const v=new DataView(buffer); const n=v.byteLength;
  if(n<4||v.getUint16(0)!==0xffd8)return null;
  let p=2;
  while(p+4<=n){
   if(v.getUint8(p)!==0xff)return null;
   const marker=v.getUint8(p+1);p+=2;
   if(marker===0xda||marker===0xd9)break;
   if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
   const size=v.getUint16(p);if(size<2||p+size>n)return null;
   if(marker===0xe1&&size>=16&&v.getUint32(p+2)===0x45786966&&v.getUint16(p+6)===0){
    const base=p+8,end=p+size;const order=v.getUint16(base);if(order!==0x4949&&order!==0x4d4d)return null;const le=order===0x4949;
    const check=(offset:number,length:number)=>{if(offset<base||offset+length>end)throw Error('bounds');};
    const u16=(offset:number)=>{check(offset,2);return v.getUint16(offset,le);};
    const u32=(offset:number)=>{check(offset,4);return v.getUint32(offset,le);};
    if(u16(base+2)!==42)return null;
    function entries(offset:number){const count=u16(offset);if(count>512)throw Error('count');check(offset+2,count*12);return Array.from({length:count},(_,i)=>offset+2+i*12);}
    const gps=entries(base+u32(base+4)).find(e=>u16(e)===0x8825&&u16(e+2)===4&&u32(e+4)===1);if(!gps)return null;
    const tags=entries(base+u32(gps+8));
    function ref(tag:number){const e=tags.find(e=>u16(e)===tag);if(!e||u16(e+2)!==2||u32(e+4)!==2)return '';return String.fromCharCode(v.getUint8(e+8));}
    function degrees(tag:number){const e=tags.find(e=>u16(e)===tag);if(!e||u16(e+2)!==5||u32(e+4)!==3)throw Error('gps');const at=base+u32(e+8);const a=[0,1,2].map(i=>{const d=u32(at+i*8+4);if(!d)throw Error('denominator');return u32(at+i*8)/d;});if(a[1]>=60||a[2]>=60)throw Error('dms');return a[0]+a[1]/60+a[2]/3600;}
    const latRef=ref(1),lonRef=ref(3);if(!['N','S'].includes(latRef)||!['E','W'].includes(lonRef))return null;
    const latitude=degrees(2)*(latRef==='S'?-1:1),longitude=degrees(4)*(lonRef==='W'?-1:1);
    if(Math.abs(latitude)>90||Math.abs(longitude)>180)return null;
    // EXIF GPS usually has no dependable accuracy estimate; treat it conservatively.
    return {latitude,longitude,accuracy:100};
   }
   p+=size;
  }
 }catch{return null;}
 return null;
}
export async function readPhotoGps(file:Pick<File,'slice'>){return readJpegGps(await file.slice(0,512*1024).arrayBuffer());}
