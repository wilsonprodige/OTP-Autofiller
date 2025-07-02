// import { storage } from "./util/storage.js";
var _isauth ;
var checkInterval = null, lastCheckTime = null;
let watchInterval;
let pushChannel = null;
const VAPID_PUBLIC_KEY=chrome.runtime.getManifest().env.API_KEY;
let watchRenewalTimer = null;
const _OAK =chrome.runtime.getManifest().env._OAK;

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
    
    event.waitUntil(
      handleGmailPushNotification(payload.data.historyId)
    );
  }

});

//--handle gmail push notif
async function handleGmailPushNotification(historyId) {
  try {
    
      const newMessages = await fetchRecentMessages(historyId);
      console.log('-new messages--->', newMessages);
      
      if (newMessages && newMessages.length > 0) {

        for (const msg of newMessages || []) {
         
          const otpData =await extractOTP(msg);
          
          if (otpData) {
            console.log('otp-data--->', otpData);

            chrome.tabs.query({ active: true }, (tabs) => {
              console.log('tabs---->', tabs);
              tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'NEW_OTP',
                  data: otpData
                });
              });
            });

            
          }
        }
        
      }
      
      return
    
  } catch (error) {
    console.error('Error handling Gmail push notification:', error);
  }
}

async function fetchRecentMessages(historyId) {

  const token = await getAuthToken();
  
  if (!token) {
    console.log('No auth token available');
    return null;
  }
  
  var _prev_history_id_obj = await chrome.storage.local.get('historyId');
  console.log('--history id---->', _prev_history_id_obj);
  
  if(!_prev_history_id_obj) return;

  try {
    const historyResponse = await fetch(`https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${_prev_history_id_obj?.historyId}&historyTypes=messageAdded`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!historyResponse.ok) {
      throw new Error('Failed to fetch history');
    }
    
    const historyData = await historyResponse.json();
    if (!historyData.history || historyData.history.length === 0) {
      return [];
    }
    const messageIds = [];
    historyData.history.forEach(history => {
      if (history.messagesAdded) {
        history.messagesAdded.forEach(msg => {
          messageIds.push(msg.message.id);
        });
      }
    });

    const messages = [];
    for (const messageId of messageIds) {
      const messageData = await getMessageDetails(token, messageId);
      if (messageData) {
        messages.push(messageData);
      }
    }

    await chrome.storage.local.set({historyId})
    
    return messages;
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    return null;
  }
}


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
  try{
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    if (!response.ok) throw new Error('Failed to fetch message',messageId);
    return await response.json();

  }
  catch(error){
    console.error('Email fetch error:', error);
    return null;
  }
  
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

async function extractOTP(message){
  
  var _email = message.payload.headers.find(h => h.name === 'From').value;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = _email.match(emailRegex);
  if (match && match[0]) _email = match[0];

  var body = getMailBody(message?.payload ?? '');
  if(!body){
    console.log('--no body--->');
    return null;
  }
  body = body.replace(/^-{2,}.*?-{2,}[\s\S]*?(?=\r?\n\r?\n)/, '');

  //ai mail processing
  try{
        var _prompt = `Analyze the email body and determine if it's an OTP or verification code email.
          If it is, extract the OTP (4–8 digit number), sender email, and confirm it's an OTP email.
          If it is NOT an OTP email, respond with "null".

          Example output:
          {
            "isOTPEmail": true,
            "otp": "123456"
          }

          Now process the following:
          Email Body:
          """
          ${body}
          """
        `;
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions',
          {
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              'Authorization':`Bearer ${_OAK}`
            },
            body:JSON.stringify({
                model: "gpt-4o-mini",
               messages:[
                { role: 'user', content: _prompt }
              ],
              temperature: 0
            })
           
          }
        );

        if (!aiResponse.ok) throw new Error('ai processing failed');

        const content = aiResponse.choices[0].message.content.trim();
        if (content.toLowerCase() === 'null') return null;
        const data = JSON.parse(content);

        return {
          otp: data ? data?.otp : 'Found in text',
          email: _email ,
          time: parseInt(message.internalDate),
          fullBody: body
        };

  }
  catch(error){
    console.log('ai request error :', error);
    const otpRegex = /(\b\d{4,8}\b)|(one-time pass(code|word))|(verification code)/i;
    if (otpRegex.test(body)) {
      const otpMatch = body.match(/\b\d{4,8}\b/);
      return {
        otp: otpMatch ? otpMatch[0] : 'Found in text',
        email: _email ,
        time: parseInt(message.internalDate),
        fullBody: body
      };

    }

  }
  
  
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
    const otpData =await extractOTP(details);
    
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
      
      (async ()=>{
        try{
          //monitoring init?
          var _monitoring_obj =  await chrome.storage.local.get('otp_monitoring');
          if(_monitoring_obj?.otp_monitoring) return;

          await registerPush();
          await  initGmailWatch();
          await chrome.storage.local.set({otp_monitoring:true});
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
        await chrome.storage.local.set({otp_monitoring:false});
      })
      break;
   
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
    
    const expirationTime = data.expiration ? parseInt(data.expiration) : Date.now() + (6 * 24 * 60 * 60 * 1000); 
    await chrome.storage.local.set({ 
      watchExpiration: expirationTime,
      historyId: data?.historyId,
      lastWatchRenewal: Date.now()
    });

    scheduleWatchRenewal(expirationTime);
    
    return
  } catch (error) {
    console.error('Error setting up watch:', error);
    //fallbackToPolling();
  }
}

function scheduleWatchRenewal(expirationTime) {
  
  if (watchRenewalTimer) {
    clearTimeout(watchRenewalTimer);
    watchRenewalTimer = null;
  }

  const renewalTime = new Date(expirationTime - (24 * 60 * 60 * 1000));
  const now = new Date();
  const delay = Math.max(0, renewalTime - now);

  console.log(`Scheduling watch renewal in ${Math.round(delay / (60 * 60 * 1000))} hours`);

  watchRenewalTimer = setTimeout(async () => {
    console.log('Automatically renewing Gmail watch...');
    await initGmailWatch();
  }, delay);
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

    if (watchRenewalTimer) {
      clearTimeout(watchRenewalTimer);
      watchRenewalTimer = null;
    }

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

