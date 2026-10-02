// Aufrufe des Eltern-Bereichs an den Server (/api/admin/*). Jeder Aufruf trägt die Eltern-PIN,
// der Server prüft sie selbst. Ergebnis immer {ok, status, error, data}; status 0 = Server nicht erreichbar.
export function createAdminApi({base="",fetchFn,deviceId=""}={}){
  const doFetch=fetchFn||((...a)=>globalThis.fetch(...a));
  async function post(url,pin,body){
    let res;
    try{
      res=await doFetch(base+"/api/admin"+url,{method:"POST",headers:{"Content-Type":"application/json","X-Device":deviceId},body:JSON.stringify(Object.assign({pin},body||{})),cache:"no-store"});
    }catch(e){return{ok:false,status:0,error:"offline",data:null};}
    let json=null;try{json=await res.json();}catch(e){}
    return{ok:res.status===200,status:res.status,error:res.status===200?"":(json&&json.error)||"error",data:json,retryAfter:json&&json.retryAfter};
  }
  const id=x=>encodeURIComponent(x);
  return{
    verify:pin=>post("/verify",pin),
    backups:pin=>post("/backups",pin),
    devices:pin=>post("/devices",pin),
    renameDevice:(pin,dev,name)=>post(`/devices/${id(dev)}/rename`,pin,{name}),
    remove:(pin,profileId)=>post(`/profiles/${id(profileId)}/delete`,pin),
    reset:(pin,profileId)=>post(`/profiles/${id(profileId)}/reset`,pin),
    league:(pin,profileId,li,open)=>post(`/profiles/${id(profileId)}/league`,pin,{li,open:!!open}),
    restore:(pin,key)=>post("/restore",pin,{key}),
    changePin:(pin,newPin)=>post("/pin",pin,{newPin}),
    async config(){
      try{const r=await doFetch(base+"/api/config",{cache:"no-store",headers:{"X-Device":deviceId}});return{ok:r.status===200,status:r.status,data:await r.json()};}
      catch(e){return{ok:false,status:0,data:null};}
    }
  };
}
// Verständliche Meldung zu einem Fehlerergebnis.
export function adminError(r){
  if(r.status===0)return"Der Server ist gerade nicht erreichbar. Das geht nur mit Verbindung.";
  if(r.error==="bad_pin")return"Die PIN stimmt nicht.";
  if(r.error==="too_many")return`Zu viele Versuche. Bitte in ${r.retryAfter||60} Sekunden noch einmal.`;
  if(r.error==="no_pin")return"Es ist noch keine Eltern-PIN festgelegt.";
  if(r.error==="bad_new_pin")return"Die neue PIN braucht genau 4 Ziffern.";
  if(r.error==="exists")return"Ein Konto mit dieser Kennung gibt es schon.";
  if(r.error==="bad_league")return"Diese Liga gibt es nicht.";
  if(r.error==="no_state")return"Dieses Konto hat noch keinen Spielstand.";
  if(r.error==="unknown_backup"||r.error==="unknown_profile")return"Das gibt es auf dem Server nicht mehr.";
  return"Das hat nicht geklappt ("+(r.error||r.status)+").";
}
