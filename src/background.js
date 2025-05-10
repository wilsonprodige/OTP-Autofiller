import { storage } from "./util/storage.js";
var _isauth ;

chrome.runtime.onMessage.addListener( async (request, sender, sendResponse) => {
    if (request.action === 'performAction1') {
      console.log('perform-action-1');
    } else if (request.action === 'performAction2') {
        console.log('perform-action-1');
    }
    else if(request.action==='loadFloatingBtn'){
      await loadOtoFillerFloatingBtnScript();
    }
})

//--------floating btn script injection and persistance--------
const activeTabs = new Set();

chrome.tabs.onActivated.addListener(async ({tabId}) => {
  _isauth= await storage.get('isAuthenticated');
  if(!_isauth) return;
  await loadOtoFillerFloatingBtnScript(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  _isauth= await storage.get('isAuthenticated');
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