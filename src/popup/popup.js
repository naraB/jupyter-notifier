document.addEventListener('DOMContentLoaded', () => {
    const popup = new Popup();
    popup.onInit();
});

class Popup {
    notifySound;
    notifyMessage;


    constructor(){}

    onInit() {
        this.loadData();
        this.addEventListeners();
    }

    async getValueFromStorage(key) {
        const value = new Promise((resolve, reject) => {
            chrome.storage.sync.get([key], (value) => resolve(value));
        });
        return (await value)[key];
    }

    async loadData() {
        this.notifySound = await this.getValueFromStorage('notifySound');
        this.notifyMessage = await this.getValueFromStorage('notifyMessage');
        this.updateView(this.notifySound, this.notifyMessage);
    }
    
    updateView(notifySound, notifyMessage) {
        $('#notifySound').prop('checked', notifySound);
        $('#notifyMessage').prop('checked', notifyMessage);
    }

    addNotifySoundEventListener() {
        $('#notifySound').on('click', (event) => {
            chrome.storage.sync.set({ notifySound: event.target.checked });
        });
    }

    addNotifyMessageEventListener() {
        $('#notifyMessage').on('click', (event) => {
            chrome.storage.sync.set({ notifyMessage: event.target.checked });
        });
    }

    addPlaySoundEventListener() {
        $('#playSound').on('click', (event) => {
            chrome.runtime.sendMessage({ event: "play-audio" });
        });
    }

    addShowNotificationEventListener() {
        $('#showNotification').on('click', (event) => {
            chrome.runtime.sendMessage({ event: "show-notification" });
        });
    }

    addEventListeners() {
        this.addNotifySoundEventListener();
        this.addNotifyMessageEventListener();
        this.addPlaySoundEventListener();
        this.addShowNotificationEventListener();
    }

}