export function externalVideoAvailable(channel,stream){return channel?.readyState==='open'&&!!stream?.getVideoTracks().some(track=>track.readyState==='live'&&!track.muted);}
export function setRemotePreview(video,stream){if(video.srcObject===stream)return;video.srcObject=stream;if(stream)video.play().catch(()=>{});}
