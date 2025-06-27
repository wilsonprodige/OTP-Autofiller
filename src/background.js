// import { storage } from "./util/storage.js";
var _isauth ;
var checkInterval = null, lastCheckTime = null;
let watchInterval;
let pushChannel = null;
const VAPID_PUBLIC_KEY="BPMCs0Wu8wAAqhq8DnosQ0y2vtNzYAJKHOUU9TYyBeuhtvZLu5Mt8EsOu_WBxahjgTFDBhlCfhBGwPl-RkME-mY";

async function registerPush() {
  try {

    console.log('subscription----->',self?.registration);
    let subscription  = await self.registration.pushManager.getSubscription();
    if(!subscription) subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log(`Subscribed: ${JSON.stringify(subscription,0,2)}`, subscription);
    await chrome.storage.local.set({ pushSubscription: subscription });
    await sendSubscriptionToBackend(subscription);

    return subscription
  } catch (error) {
    console.error('Subscribe error: ', error);
  }

  // console.log('--push registration',navigator.serviceWorker);
  // const registration = await navigator.serviceWorker.ready;
  
  // try {

  //   var subscription = await registration.pushManager.getSubscription();
  
  //   if (subscription) return subscription;
  //   subscription = await registration.pushManager.subscribe({
  //     userVisibleOnly: true,
  //     applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  //   });

  //   await chrome.storage.local.set({ pushSubscription: subscription });
  //   await sendSubscriptionToBackend(subscription);
    
  //   console.log('Push subscription successful');
  //   return subscription;
  // } catch (error) {
  //   console.error('Push subscription failed:', error);
  // }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscriptionToBackend(subscription) {
  const tokenObj = await chrome.storage.local.get('token');
  console.log('send subscription--called->',tokenObj?.token);
  try {
    const response = await fetch('http://localhost:8000/api/push-notification/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenObj?.token}`
      },
      body: JSON.stringify({ subscription })
    });

    if (!response.ok) throw new Error('Failed to register subscription');
    console.log('response', response);
    return
  } catch (error) {
    console.error('Subscription error:', error);
  }
}

self.addEventListener('push', (event) => {
  const payload = event.data?.json();
  console.log('---event payload---',payload);
  
  if (payload?.data?.type === 'gmail-update') {
    // Handle Gmail update
    event.waitUntil(
      // handleGmailUpdate(payload.data.historyId)
      (payload)=>{console.log('event in --->',payload );}
    );
  }

  
  // event.waitUntil(
  //   self.registration.showNotification(payload.title || 'New Notification', {
  //     body: payload.body,
  //     data: payload.data,
  //     icon: '/icons/icon128.png'
  //   })
  // );
});


//--------floating btn script injection and persistance--------
const activeTabs = new Set();

chrome.tabs.onActivated.addListener(async ({tabId}) => {
  _isauth=  await chrome.storage.local.get('isAuthenticated');
  if(!_isauth) return;
  await loadOtoFillerFloatingBtnScript(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  _isauth= await chrome.storage.local.get('isAuthenticated');
  if(!_isauth) return;
  if (changeInfo.status === 'complete') {
    await loadOtoFillerFloatingBtnScript(tabId);
  }
});


async function  loadOtoFillerFloatingBtnScript(tab_id = null){
  var tab;

    if (tab_id != null) {
      tab = await chrome.tabs.get(tab_id);
    } else {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      tab = tabs[0];
    }

    if (!tab?.url) return null;
        
    const url = new URL(tab.url);
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    if (!tab.url?.startsWith('http')) return;
    if (url.protocol === 'chrome-extension:' || 
        url.hostname === 'chrome.google.com' ||
        url.hostname === 'webstore.google.com') {
        return null;
    }
    const hasPermission = await chrome.permissions.contains({
        origins: [url.origin + '/*']
    });
    if (!hasPermission) return null;

    try {

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['dist/css/floatingBtn.css'] 
      })

       chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            files: ['dist/js/floatingBtn.js','dist/js/chunk-vendors.js']
        }).then(()=>{
          console.log('script injected successfully')
        })
    } catch (error) {
        console.error('Injection failed:', error);
    }

    return;

}

//gmail monitoring
async function fetchRecentEmails(token){
  try{
    const timeFilter = lastCheckTime ? `after:${Math.floor((lastCheckTime-2000)/1000)}` : `after:${Math.floor((Date.now() - 60000)/1000)}` ;
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(`is:unread ${timeFilter}`)}&maxResults=5`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch emails');
    return await response.json();
  }
  catch(error){
    console.error('Email fetch error:', error);
    return { messages: [] };
  }
}

async function getMessageDetails(token, messageId){
  const response = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return await response.json();
}

function getMailBody(payload){
  if (payload?.body && payload?.body?.data) {
    const data = payload.body.data;
    const decodedBytes = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    return decodedBytes;
  } else if (payload?.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        const data = part.body.data;
        const decodedBytes = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
        return decodedBytes;
      }
      else if(part.mimeType === "multipart/alternative" && part?.parts?.length){
        for (const subpart of part?.parts) {
          if (subpart?.mimeType === 'text/plain' && subpart?.body && subpart?.body.data) {
            const data = subpart?.body?.data;
            const decodedBytes = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
            return decodedBytes;
          }
        }
      }
    }
  }
  return null;
}

function extractOTP(message){
  // /(\b\d{4,8}\b)/,                        
  // /(code|otp|password)[: ]*(\d{4,8})/i,    
  // /(\b[a-z0-9]{4,8}\b)/i,                 
  // /(verification code is) (\d{4,8})/i
  const otpRegex = /(\b\d{4,8}\b)|(one-time pass(code|word))|(verification code)/i;
  
  var body = getMailBody(message?.payload ?? '');
  if(!body){
    console.log('--no body--->');
    return null;
  }
  body = body.replace(/^-{2,}.*?-{2,}[\s\S]*?(?=\r?\n\r?\n)/, '');
  
  //console.log('---body--->',body); 
  if (otpRegex.test(body)) {
   
    const otpMatch = body.match(/\b\d{4,8}\b/);
    var _email = message.payload.headers.find(h => h.name === 'From').value;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = _email.match(emailRegex);
    if (match && match[0]) _email = match[0];

    //console.log('---in--->',message.payload,_email); 

    return {
      otp: otpMatch ? otpMatch[0] : 'Found in text',
      email: _email ,
      time: parseInt(message.internalDate),
      fullBody: body
    };
  }
  return null;
}

//---monitoring function
const checkForOtpEmails = async  ()=>{
  console.log('----check called--->',lastCheckTime ? Math.floor((lastCheckTime - 2500)/1000) : Math.floor((Date.now() - 60000)/1000));
  const token = await new Promise(resolve => {
    chrome.identity.getAuthToken({ interactive: false }, resolve);
  });
  if(!token) console.log('---no token---');
  
  if (!token) return;
  
  const emails = await fetchRecentEmails(token);
  
  console.log('---emails------>', emails);
  
  for (const msg of emails.messages || []) {
    const details = await getMessageDetails(token, msg.id);
    console.log('details', details);
    const otpData = extractOTP(details);
    
    if (otpData) {
      console.log('otp-data--->', otpData);
      //active: true
      chrome.tabs.query({ active: true }, (tabs) => {
        console.log('tabs---->', tabs);
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'NEW_OTP',
            data: otpData
          });
        });
      });

      // await fetch(
      //   `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Authorization': `Bearer ${token}`,
      //       'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
      //   }
      // );
    }
  }
}

const handleGhlOtpFillComplete = async () =>{
  const tabs = await chrome.tabs.query({
    active: true
  });
  var tab= tabs[0] ?? null
  if(!tab?.url){
    console.log('no tab---->');
    return; 
  }

  chrome.scripting.executeScript({
          target: {
              tabId: tab.id
          },
          func:()=>{
            const vueInstance = document.getElementById('app')?.__vue__;
            if (!vueInstance) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'log',
                  data: 'Vue instance not found in page context'
                });
                console.error('Vue instance not found in page context');
                return;
            }
            vueInstance?.$children?.[9]?.$children?.[1]?.$children?.[2]?.$listeners['on-complete']();
            return;
          },
          world: 'MAIN' 
    }).then(results => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'log',
        data: {
          mes:'Script injection result:',
          res:results
        }
      });
      console.log('Script injection result:', results);
    }).catch(error => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'log',
        data: {
          mes:'Script injection error:',
          res:error
        }
      });
      console.error('Script injection error:', error);
    });

}

chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
  switch(request?.action){
    case 'START_OTP_MONITORING':
      // if (checkInterval) clearInterval(checkInterval);
      // checkInterval = setInterval(
      //   ()=>{
      //     lastCheckTime = Date.now();
      //     checkForOtpEmails();
      //   },
      //  2000); 
      //lastCheckTime = lastCheckTime ? parseInt(lastCheckTime+2000 : Date.now();
      //checkForOtpEmails();
      (async ()=>{
        try{
          await registerPush();
          await  initGmailWatch();
        }
        catch(error){
          console.log('--err', error);
        }
        
        
      })()
      break;
    case 'STOP_OTP_MONITORING':
      // if (checkInterval) clearInterval(checkInterval);
      // checkInterval = null;
      
      (async ()=>{
        var _token = await getAuthToken();
        await stopGmailWatch(_token);
      })
      break;

    case 'GHL_OTP_FILL_COMPLETE':
      //handleGhlOtpFillComplete();
      break;
    // case 'registerPush':
    //     var _subscription = await registerPush();
    //     return _subscription;
    //   break;
    default:
      break;
  }
    
})

//-------gmail push --------
async function initGmailWatch() {
  const token = await new Promise(resolve => {
    chrome.identity.getAuthToken({ interactive: false }, resolve);
  });
  console.log('--token--->', token);
  if (!token) return;

  try {

    if (pushChannel) {
      await stopGmailWatch(token);
    }

    // Start new watch
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topicName: 'projects/otp-autofiller/topics/Otp_Autofiller_events',
        labelIds: ['INBOX'],
        labelFilterAction: 'include'
      })
    });

    if (!response.ok) throw new Error('Watch setup failed');
    
    const data = await response.json();
    console.log('Gmail watch established:', data);
    
    // Store expiration time
    chrome.storage.local.set({ watchExpiration: data.expiration });

  } catch (error) {
    console.error('Error setting up watch:', error);
    //fallbackToPolling();
  }
}

async function stopGmailWatch(token) {
  try {
    await fetch('https://www.googleapis.com/gmail/v1/users/me/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    pushChannel = null;
  } catch (error) {
    console.error('Error stopping watch:', error);
  }
}

async function getAuthToken (){
  const token = await new Promise(resolve => {
    chrome.identity.getAuthToken({ interactive: false }, resolve);
  });
  if(!token) console.log('---no token---');
  
  if (!token) return;
  return token;
}

// chrome.gmail.onPush.addListener(async (message) => {
//   if (message.recipient === chrome.runtime.id) {
//     //await checkForOtpEmails();
//     console.log('message---->',message );
//   }
// });