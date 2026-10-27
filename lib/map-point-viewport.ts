/** Fit the registered 4:5 artwork without changing normalized point coordinates. */
export function pointPickerLayout(width:number,height:number,zoom:number,x=.5,y=.5){
 const viewportWidth=Math.max(1,width),viewportHeight=Math.max(1,height);
 const scale=Math.min(3,Math.max(1,zoom));
 const mapWidth=Math.min(viewportWidth,viewportHeight*4/5)*scale;
 const mapHeight=mapWidth*5/4;
 return {width:mapWidth,height:mapHeight,left:Math.max(0,Math.min(mapWidth-viewportWidth,x*mapWidth-viewportWidth/2)),top:Math.max(0,Math.min(mapHeight-viewportHeight,y*mapHeight-viewportHeight/2))};
}
