// Calibration belongs to the camera session, not its most recent detection frame.
export function cameraSessionReady({input,count,camera,channel,phoneState}){
 if(input==='keyboard')return true;
 if(input==='camera')return !!camera?.running&&!!camera.calibrated&&camera.count===count;
 return input==='phone'&&channel?.readyState==='open'&&!!phoneState?.calibrated&&phoneState.players?.length===count;
}
