import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlayerData,writePlayerData } from '../cloud-store.mjs';
function fake({error=null,record=null}={}){
 const captured={};
 const client={from(name){captured.table=name;return {
   select(){return {eq(column,value){captured.filter=[column,value];return {async maybeSingle(){return {data:record?{data:record}:null,error};}};}};},
   async upsert(row,options){captured.row=row;captured.options=options;return {error};}
 };}};
 return {client,captured};
}
test('loads only signed-in user record using existing JSON column',async()=>{let {client,captured}=fake({record:{tasks:[{id:'x'}]}});const got=await loadPlayerData(client,'user-one');assert.equal(got.tasks[0].id,'x');assert.equal(captured.table,'player_data');assert.deepEqual(captured.filter,['user_id','user-one']);});
test('missing record yields null and must not overwrite old data on login',async()=>{const {client}=fake();assert.equal(await loadPlayerData(client,'u'),null);});
test('upsert retains JSON data keyed by user id',async()=>{const {client,captured}=fake();await writePlayerData(client,'user-two',{tasks:[{name:'test'}]});assert.equal(captured.row.user_id,'user-two');assert.equal(captured.row.data.tasks[0].name,'test');assert.equal(captured.options.onConflict,'user_id');assert.ok(captured.row.updated_at);});
test('database errors are not mistaken for successful saves',async()=>{const {client}=fake({error:{message:'RLS rejection'}});await assert.rejects(writePlayerData(client,'u',{}),/RLS rejection/);await assert.rejects(loadPlayerData(client,'u'),/RLS rejection/);});
test('unauthenticated calls cannot save or load',async()=>{const {client}=fake();await assert.rejects(writePlayerData(client,'',{}),/Sign in/);await assert.rejects(loadPlayerData(client,''),/Sign in/);});
