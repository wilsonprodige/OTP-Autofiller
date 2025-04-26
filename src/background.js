chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'performAction1') {
      console.log('perform-action-1');
    } else if (request.action === 'performAction2') {
        console.log('perform-action-1');
    }
  })