class Background {
    isJupyterNotebook;
    sound = new Audio('./assets/sounds/zapsplat.mp3');

    constructor() { }

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
                this.sound.play();
                return;
            }
            if (request.event === 'show-notification') {
                this.showNotification('42h');
                return;
            }
            if (request.event === 'cell-terminated') {
                this.sound.play();
                this.showNotification(request.runtime);
            }
        }
        );
    }

    showNotification(runtime) {
        const timestamp = new Date().getTime();
        const notificationOptions = {
            type: 'basic',
            title: 'Cell Terminated!',
            message: 'Runtime: ' + runtime,
            iconUrl: './assets/icons/notifications-black-48dp.svg'
        }
        chrome.notifications.create('id ' + timestamp, notificationOptions);
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