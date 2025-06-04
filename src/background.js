// import { storage } from "./util/storage.js";
var _isauth ;
var checkInterval = null, lastCheckTime = null;



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
    const timeFilter = lastCheckTime ? `after:${Math.floor(lastCheckTime/1000)}` :`after:${Math.floor((new Date((Date.now() - 60) * 1000))/1000)}` ;
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(`is:unread AND ${timeFilter}`)}&maxResults=5`,
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
      time: new Date(parseInt(message.internalDate)).toLocaleString(),
      fullBody: body
    };
  }
  return null;
}

//---monitoring function
const checkForOtpEmails = async  ()=>{
  console.log('----check called--->',lastCheckTime ?? `${Math.floor((new Date((Date.now() - 60) * 1000))/1000)}`);
  const token = await new Promise(resolve => {
    chrome.identity.getAuthToken({ interactive: false }, resolve);
  });
  if(!token) console.log('---no token---');
  
  if (!token) return;
  
  const emails = await fetchRecentEmails(token);
  lastCheckTime = Date.now();
  console.log('---emails------>', emails);
  
  for (const msg of emails.messages || []) {
    const details = await getMessageDetails(token, msg.id);
    console.log('details', details);
    const otpData = extractOTP(details);
    
    if (otpData) {
      console.log('otp-data--->', otpData);
      //active: true
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
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

chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
  switch(request?.action){
    case 'START_OTP_MONITORING':
      if (checkInterval) clearInterval(checkInterval);
      checkInterval = setInterval(checkForOtpEmails , 2000); 
      checkForOtpEmails();
      break;
    case 'STOP_OTP_MONITORING':
      if (checkInterval) clearInterval(checkInterval);
      checkInterval = null;
      break;
    default:
      break;
  }
    
})