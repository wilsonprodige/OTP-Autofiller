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

async function  loadOtoFillerFloatingBtnScript(){

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });
    if (!tab.url?.startsWith('http')) return;

    try {

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['dist/css/app.css'] 
      })

       chrome.scripting.executeScript({
            target: {
                tabId: tab.id
            },
            files: ['dist/js/floatingBtn.js']
        }).then(()=>{
          console.log('script injected successfully')
        })
    } catch (error) {
        console.error('Injection failed:', error);
    }

    return;

}