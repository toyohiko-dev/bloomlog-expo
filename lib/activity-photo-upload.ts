import {checkGeneratedPng} from './png-metadata';
/** Fail closed even for an old/malformed client; never accept an unprocessed original. */
export async function assertPreparedActivityPhoto(file:File){
  if(file.type!=='image/png'||file.size>3_000_000)throw Error('prepared-photo-required');
  const result=await checkGeneratedPng(file);
  if(result.width*result.height>20_000_000||Math.max(result.width,result.height)>4096)throw Error('prepared-photo-size');
}
