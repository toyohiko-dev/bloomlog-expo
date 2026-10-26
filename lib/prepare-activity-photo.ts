import {checkGeneratedPng} from './png-metadata';
import {readPhotoGps} from './photo-metadata';

const cache = new WeakMap<File, Promise<File>>();
const MAX_PIXELS = 20_000_000;
const MAX_BYTES = 3_000_000;
export class PhotoPreparationError extends Error {
  constructor() { super('写真を安全に変換できませんでした。JPEG・PNG・WebPの写真を選び直してください。入力は保持しています。'); }
}
/** GPS suggestions inspect the original File locally. Only these newly encoded pixels leave the device. */
export function prepareActivityPhoto(file: File): Promise<File> {
  const existing=cache.get(file); if(existing)return existing;
  const task=encode(file).catch(()=>{cache.delete(file);throw new PhotoPreparationError();});
  cache.set(file,task);return task;
}
async function encode(file:File):Promise<File>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024||typeof createImageBitmap!=='function')throw new PhotoPreparationError();
  await readPhotoGps(file);
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  let canvas:HTMLCanvasElement|null=null;
  try{
    if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>MAX_PIXELS)throw new PhotoPreparationError();
    let ratio=Math.min(1,4096/Math.max(bitmap.width,bitmap.height));
    canvas=document.createElement('canvas');
    for(let attempt=0;attempt<7;attempt++){
      canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
      const context=canvas.getContext('2d');if(!context)throw new PhotoPreparationError();
      context.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas!.toBlob(value=>value?resolve(value):reject(new PhotoPreparationError()),'image/png'));
      if(blob.type!=='image/png')throw new PhotoPreparationError();
      if(blob.size<=MAX_BYTES){
        await checkGeneratedPng(blob);
        return new File([blob],'memory.png',{type:'image/png'});
      }
      // Re-encode pixels, preserving alpha. Never fall back to the original or metadata-bearing bytes.
      ratio*=Math.min(.8,Math.sqrt(MAX_BYTES/blob.size)*.9);
    }
    throw new PhotoPreparationError();
  }finally{bitmap.close();if(canvas){canvas.width=0;canvas.height=0;}}
}
