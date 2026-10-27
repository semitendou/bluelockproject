"""Cloud-backed UI smoke tests against mocked Supabase (no production credentials/account writes)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
MODEL=(ROOT/'model.mjs').read_text().replace('export ','')
STORE=(ROOT/'cloud-store.mjs').read_text().replace('export ','')
APP='\n'.join(line for line in (ROOT/'app.js').read_text().splitlines() if not line.startswith('import '))
CSS=(ROOT/'styles.css').read_text()
STUB="""(seed)=>{
 window.__cloudDb=seed||null;window.__writes=[];window.__failWrites=false;window.__localWrites=0;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{window.__localWrites++;},removeItem:()=>{}}});
 window.supabase={createClient(url,key,opts){
  if(!url.includes('supabase.co')||!key.startsWith('sb_publishable_'))throw Error('Invalid config');
  const account={id:'test-user-id',email:'tester@example.test'};
  return {
   auth:{onAuthStateChange(handler){window.__authCb=handler;return {data:{subscription:{unsubscribe(){}}}};},
     async getSession(){return {data:{session:{user:account}},error:null};},
     async signInWithPassword(){return {data:{user:account,session:{user:account}},error:null};},
     async signUp(){return {data:{user:account,session:{user:account}},error:null};},
     async signOut(){window.__authCb?.('SIGNED_OUT',null);return {error:null};}},
   from(name){if(name!=='player_data')throw Error('Wrong table');return {
     select(){return {eq(field,id){if(field!=='user_id'||id!==account.id)throw Error('Wrong user filter');return {async maybeSingle(){return {data:window.__cloudDb?{data:window.__cloudDb}:null,error:null};}};}};},
     async upsert(row,opts){await new Promise(r=>setTimeout(r,10));if(window.__failWrites)return {error:{message:'Simulated network error'}};if(row.user_id!==account.id||opts.onConflict!=='user_id')throw Error('Wrong owner');window.__cloudDb=structuredClone(row.data);window.__writes.push(structuredClone(row.data));return {error:null};}
   };}
  };
 }};
}"""
def initialize(page,seed=None):
 page.set_content('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Project Ego test</title></head><body><div id="app"></div><div id="toast" role="status"></div></body></html>')
 page.evaluate(STUB,seed)
 page.add_style_tag(content=CSS)
 page.add_script_tag(content=MODEL+'\n'+STORE+'\n'+APP)
 page.locator('.status-chip').wait_for(state='attached',timeout=10000)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True,timezone_id='Pacific/Auckland')
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 initialize(page)
 assert page.locator('.sidebar-nav .nav-link').count()==9
 assert page.locator('.status-chip').inner_text().strip()=='SAVED TO CLOUD'
 page.locator('[data-action="new-task"]').first.click()
 page.locator('#modal-form input[name="name"]').fill('Test Supabase persistence')
 page.locator('#modal-form button[type="submit"]').click()
 page.wait_for_function("window.__writes.length===1")
 assert page.locator('.task-title').filter(has_text='Test Supabase persistence').count()==1
 page.locator('[data-task-check]').first.check()
 page.wait_for_function("window.__writes.length===2")
 assert page.locator('.topbar-ep').inner_text().startswith('25')
 assert page.evaluate('window.__localWrites')==0
 saved=page.evaluate('window.__cloudDb')
 page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));initialize(page,saved)
 assert page.locator('.task-row.is-done').count()==1
 page.locator('[data-view="settings"]').first.click()
 assert page.locator('text=Supabase').count()>0
 page.locator('[data-action="retry-save"]').click()
 page.wait_for_function('window.__writes.length===1')
 page.evaluate('window.__failWrites=true')
 page.locator('#settings-profile input[name="name"]').fill('FAILED SYNC')
 page.locator('#settings-profile button[type="submit"]').click()
 page.locator('.status-chip.cloud-error').wait_for(timeout=5000)
 assert 'SAVE FAILED' in page.locator('.status-chip').inner_text()
 page.evaluate('window.__failWrites=false')
 page.locator('[data-action="retry-save"]').click()
 page.locator('.status-chip.cloud-saved').wait_for(timeout=5000)
 assert page.evaluate("window.__cloudDb.profile.name")=='FAILED SYNC'
 assert len(errors)==0,errors
 print('CLOUD DESKTOP: PASS (load, save, persistence, no local progress, fail and retry)')
 mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,timezone_id='Pacific/Auckland',is_mobile=True,has_touch=True)
 m=mobile.new_page();errs=[];m.on('pageerror',lambda e:errs.append(str(e)));initialize(m,saved)
 assert m.locator('.mobile-nav').is_visible()
 for section in ['training','calendar','reading','projects','profile','evolution','achievements','settings','today']:
  m.locator(f'.mobile-nav [data-view="{section}"]').click()
  assert m.locator('main h1').count()==1
  width=m.evaluate('document.documentElement.scrollWidth');inner=m.evaluate('window.innerWidth');assert width<=inner+1,(section,width,inner)
 assert not errs,errs
 print('CLOUD MOBILE: PASS (9 sections, no overflow, no JS errors)')
 browser.close()
