



class Background {
    isJupyterNotebook;

    constructor() {}

    async getValueFromStorage(key) {
        const value = new Promise((resolve, reject) => {
            chrome.storage.sync.get([key], (value) => resolve(value));
        });
        return await value;
    }

    onInstalledListener() {
        chrome.runtime.onInstalled.addListener(() => {
            chrome.storage.sync.set({ notifySound: true, notifyMessage: true });
        });
    }

    onMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            
                if (request.event === 'play-audio') {
                    console.log('Play Audio');
                    return;
                }
                if (request.event === 'show-notification') {
                    console.log('Show Notification');
                    return;
                }
            }
        );
    }

    onInit() {
        this.onInstalledListener();
        this.onMessageListener();
    }
}

function main() {
    const background = new Background();
    background.onInit();
}

main();