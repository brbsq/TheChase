// One continuous stadium oval. All camera, athlete and hurdle positions use it.
export const TRACK_RADIUS=56;
export const TRACK_STRAIGHT=180;
export const TRACK_LENGTH=2*TRACK_STRAIGHT+2*Math.PI*TRACK_RADIUS;
export function trackFrame(distance,lateral=0){
 let s=((distance+20)%TRACK_LENGTH+TRACK_LENGTH)%TRACK_LENGTH,x,z,tx,tz;
 if(s<180){x=0;z=30-s;tx=0;tz=-1;}
 else if((s-=180)<Math.PI*56){const a=Math.PI+s/56;x=56+56*Math.cos(a);z=-150+56*Math.sin(a);tx=-Math.sin(a);tz=Math.cos(a);}
 else if((s-=Math.PI*56)<180){x=112;z=-150+s;tx=0;tz=1;}
 else{const a=(s-180)/56;x=56+56*Math.cos(a);z=30+56*Math.sin(a);tx=-Math.sin(a);tz=Math.cos(a);}
 return {x:x-tz*lateral,z:z+tx*lateral,tx,tz,yaw:Math.atan2(-tx,-tz)};
}

// Preserve independent progress while keeping long race gaps in the shared view.
export function runnerProgress(distance,focus){return focus+12*Math.tanh((distance-focus)/12)+1.8;}
