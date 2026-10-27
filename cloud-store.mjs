/** Cloud-only player record adapter, retaining the existing player_data JSON schema. */
export async function loadPlayerData(client,userId){
  if(!client || !userId) throw new Error('Sign in before loading player data.');
  const {data,error}=await client.from('player_data').select('data').eq('user_id',userId).maybeSingle();
  if(error) throw new Error(`Unable to load cloud progress: ${error.message}`);
  return data?.data??null;
}
export async function writePlayerData(client,userId,record){
  if(!client || !userId) throw new Error('Sign in before saving progress.');
  const {error}=await client.from('player_data').upsert({user_id:userId,data:record,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error) throw new Error(`Unable to save cloud progress: ${error.message}`);
  return true;
}
