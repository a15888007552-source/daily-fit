import fs from 'node:fs';
import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
const keyPath=new URL('../private/access-key.txt',import.meta.url),dataPath=new URL('../private/journal.json',import.meta.url);
if(!fs.existsSync(keyPath))fs.writeFileSync(keyPath,randomBytes(32).toString('base64url'),{mode:0o600});
const key=Buffer.from(fs.readFileSync(keyPath,'utf8').trim(),'base64url'),plain=fs.readFileSync(dataPath),state=JSON.parse(plain);
if(!state.profile||!Array.isArray(state.entries))throw Error('Invalid journal');
const ids=new Set();for(const e of state.entries){if(ids.has(e.id))throw Error('Duplicate entry: '+e.id);ids.add(e.id);}
const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
const test=createDecipheriv('aes-256-gcm',key,iv);test.setAuthTag(encrypted.subarray(-16));if(!Buffer.concat([test.update(encrypted.subarray(0,-16)),test.final()]).equals(plain))throw Error('Readback failed');
fs.writeFileSync(new URL('../public/data/journal.enc.json',import.meta.url),JSON.stringify({v:1,algorithm:'AES-256-GCM',iv:iv.toString('base64'),ciphertext:encrypted.toString('base64')}));
console.log(`Encrypted ${state.entries.length} entries; exact decryption readback passed.`);
