"use client";
// Unsaved files live only in this browser page's memory, never localStorage or the server.
const photos=new Map<string,File>();const MAX_BYTES=32*1024*1024;
const key=(owner:string,scope:string)=>JSON.stringify([owner,scope]);
export function readDraftPhoto(owner:string,scope:string):File|null{return photos.get(key(owner,scope))??null;}
export function keepDraftPhoto(owner:string,scope:string,photo:File|null){const id=key(owner,scope);photos.delete(id);if(!photo||photo.size>10*1024*1024)return;photos.set(id,photo);while(photos.size>6||[...photos.values()].reduce((sum,file)=>sum+file.size,0)>MAX_BYTES){const oldest=photos.keys().next().value;if(oldest===undefined)break;photos.delete(oldest);}}
