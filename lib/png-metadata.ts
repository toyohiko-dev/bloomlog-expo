/** Inspect only generated PNG metadata containers, never photo GPS values. */
export function inspectPngChunks(bytes:Uint8Array){
 const signature=[137,80,78,71,13,10,26,10];if(bytes.length<45||bytes.length>60*1024*1024||signature.some((v,i)=>bytes[i]!==v))throw Error('invalid-png');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const chunks:string[]=[];let offset=8,width=0,height=0,ended=false;
 while(offset<bytes.length){if(offset+12>bytes.length)throw Error('truncated-png');const size=view.getUint32(offset);if(size>bytes.length-offset-12)throw Error('truncated-png');const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));if(!/^[A-Za-z]{4}$/.test(type))throw Error('invalid-png-chunk');if(chunks.length===0&&type!=='IHDR')throw Error('missing-png-header');if(type==='IHDR'){if(chunks.length||size!==13)throw Error('invalid-png-header');width=view.getUint32(offset+8);height=view.getUint32(offset+12);if(!width||!height)throw Error('invalid-png-size');}chunks.push(type);offset+=size+12;if(type==='IEND'){if(size!==0||offset!==bytes.length)throw Error('invalid-png-end');ended=true;break;}}
 if(!ended||!chunks.includes('IDAT'))throw Error('incomplete-png');
 const standardImageChunks=new Set(['IHDR','PLTE','IDAT','IEND','tRNS','sRGB','gAMA','cHRM','pHYs','iCCP']);
 return {width,height,chunks,unexpectedChunks:chunks.filter(type=>!standardImageChunks.has(type)),locationMetadataContainers:chunks.filter(type=>['eXIf','iTXt','tEXt','zTXt','caBX'].includes(type))};
}
export async function checkGeneratedPng(blob:Blob){const inspection=inspectPngChunks(new Uint8Array(await blob.arrayBuffer()));if(inspection.unexpectedChunks.length||inspection.locationMetadataContainers.length)throw Error('png-metadata-not-safe');return inspection;}
