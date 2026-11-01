// One layout for renderer viewports, player labels and touch controls.
export function raceViewports(width,height,count,top=0,bottom=58){
 const rows=count===2?1:2,columns=2,available=Math.max(100,height-top-bottom);
 return Array.from({length:count},(_,id)=>({id,x:id%columns*width/columns,y:top+Math.floor(id/columns)*available/rows,width:width/columns,height:available/rows}));
}

export function controlRegions(width,height,count,{split=false,top=0,bottom=58}={}){
 if(split&&count>1)return raceViewports(width,height,count,top,bottom).map(r=>({...r,y:r.y+r.height-Math.min(80,r.height-10)-6,height:Math.min(80,r.height-10)}));
 const columns=count===1?1:2,rows=Math.ceil(count/columns),w=width/columns;
 return Array.from({length:count},(_,id)=>({id,x:id%columns*w,y:height-bottom-(rows-Math.floor(id/columns))*86,width:w,height:80}));
}
