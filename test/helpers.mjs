// Gemeinsame Hilfen für die Tests: Testserver mit eigenem Datenordner, Testclient mit eigenem Speicher.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import server from "../server/server.js";
import {memoryStore} from "../app/js/store.js";
import {createSync} from "../app/js/sync.js";

export async function startServer(){
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),"torjaeger-test-"));
  const srv=server.createServer({dataDir});
  await new Promise(r=>srv.listen(0,"127.0.0.1",r));
  const base="http://127.0.0.1:"+srv.address().port;
  return{srv,base,dataDir,close:()=>new Promise(r=>{srv.close(r);srv.closeAllConnections&&srv.closeAllConnections();}).then(()=>fs.rmSync(dataDir,{recursive:true,force:true}))};
}
export async function api(base,method,url,body){
  const res=await fetch(base+url,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body===undefined?undefined:(typeof body==="string"?body:JSON.stringify(body))});
  let json=null;try{json=await res.json();}catch(e){}
  return{status:res.status,json};
}
// Ein "Gerät": eigener Speicher, eigene Geräte-ID, Netz an/aus.
export function makeDevice(base,deviceId){
  const dev={deviceId,online:true,store:memoryStore()};
  const fetchFn=(url,opts)=>dev.online?fetch(url,opts):Promise.reject(new TypeError("offline"));
  dev.sync=createSync({store:dev.store,deviceId,fetchFn,base});
  dev.ctx=t=>({deviceId,now:t});
  return dev;
}
