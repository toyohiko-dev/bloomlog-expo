export type MemorySymbol={id:string;x:number;y:number;radius:number};
/** Display symbols may move, but every connector keeps the unchanged geographic anchor. */
export function separateMemorySymbols(input:readonly MemorySymbol[],bounds:{left:number;top:number;right:number;bottom:number},maxShift=70){
 const points=input.map(p=>({...p,anchorX:p.x,anchorY:p.y})).sort((a,b)=>a.id.localeCompare(b.id));
 for(let pass=0;pass<32;pass++){
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   const a=points[i],b=points[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.radius+b.radius+4;
   if(d>=min)continue;const ux=d?dx/d:Math.cos((i+j)*2.399),uy=d?dy/d:Math.sin((i+j)*2.399),shift=(min-d)/2;a.x-=ux*shift;a.y-=uy*shift;b.x+=ux*shift;b.y+=uy*shift;
  }
  for(const p of points){const d=Math.hypot(p.x-p.anchorX,p.y-p.anchorY);if(d>maxShift){p.x=p.anchorX+(p.x-p.anchorX)*maxShift/d;p.y=p.anchorY+(p.y-p.anchorY)*maxShift/d;}p.x=Math.max(bounds.left+p.radius,Math.min(bounds.right-p.radius,p.x));p.y=Math.max(bounds.top+p.radius,Math.min(bounds.bottom-p.radius,p.y));}
 }
 return points;
}
