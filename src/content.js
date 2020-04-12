class Page {
   codeCells;
   notifyCells = [];
   selectedCell;
   runningCellQueue = [];

   constructor() {
      this.codeCells = this.getInitialCodeCells();
      this.setSelectedCell();
   }

   static isJupyterNotebook() {
      return !!document.getElementById('notebook_panel') && !!document.getElementById('notebook') && !!document.getElementById('ipython-main-app');
   }

   initObservers() {
      this.initNewCellObserver();
      this.initSelectedCellObserver();
      this.initRunningCellObserver();
   }

   initNewCellObserver() {
      new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && target.className.includes('cell code_cell') && !this.codeCells.includes(target)) {
               this.codeCells.push(target);
            }
         }
      }).observe(document.getElementById('notebook'), { attributes: true, childList: true, subtree: true });
   }

   initSelectedCellObserver() {
      new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && target.className.includes('selected') && !target.className.includes('unselected') && this.selectedCell !== target) {
               this.selectedCell = target;
               console.log(target);
               this.toggleButton();
               this.toggleIcon();
            }
         }
      }).observe(document.getElementById('notebook'), { attributes: true, childList: true, subtree: true });
   }

   initRunningCellObserver() {
      new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && target.className.includes('running') && !this.runningCellQueue.some(cell => cell.element === target)) {
               const terminationObserver = this.initCellTerminationObserver(target);
               const runningCell = { element: target, startTime: new Date(), observer: terminationObserver };
               this.runningCellQueue.push(runningCell);
            }
         }
      }).observe(document.getElementById('notebook'), { attributes: true, childList: true, subtree: true });
   }

   initCellTerminationObserver(runningCell) {
      const observer = new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && !target.className.includes('running') && this.runningCellQueue.some(cell => cell.element === target)) {
               const terminatedCell = this.runningCellQueue.shift();
               if (this.notifyCells.includes(terminatedCell.element)) {
                  this.notifyCells.splice(this.notifyCells.indexOf(terminatedCell.element), 1);
                  if (this.selectedCell === terminatedCell.element) {
                     this.toggleIcon();
                  }
                  // Next cell runs after completion of previous
                  if (this.runningCellQueue[0]) {
                     this.runningCellQueue[0].startTime = new Date();
                  }
                  this.removeNotifyIndicator(terminatedCell.element);
                  const runtime = this.msToTime(new Date() - terminatedCell.startTime);
                  chrome.runtime.sendMessage({ event: 'cell-terminated', runtime });
               }
               terminatedCell.observer.disconnect();
            }
         }
      });
      observer.observe(runningCell, { attributes: true, childList: true, subtree: true });
      return observer;
   }

   getInitialCodeCells() {
      return Array.from(document.getElementsByClassName('cell code_cell'));
   }

   injectButton() {
      const toolbar = document.getElementById('maintoolbar-container');
      toolbar.insertAdjacentHTML('beforeend', this.getNotifyButton());
   }

   toggleButton() {
      const codeCell = this.isCodeCell(this.selectedCell);
      const buttonInjected = !!document.getElementById('jupyter-notifier-btn-wrapper');
      if (!buttonInjected) {
         this.injectButton();
         this.addNotifyEventListener();
      }
      if (!codeCell) {
         document.getElementById('jupyter-notifier-btn').className += ' disabled';
      } else {
         document.getElementById('jupyter-notifier-btn').classList.remove('disabled');
      }
   }

   toggleIcon() {
      if (!this.isCodeCell(this.selectedCell)) {
         return;
      }
      const notifyIcon = document.getElementById('jupyter-notifier-icon');
      if (this.isCellNotified(this.selectedCell)) {
         notifyIcon.className = 'fa fa-bell';
      } else {
         notifyIcon.className = 'fa fa-bell-slash';
      }
   }

   addNotifyEventListener() {
      document.getElementById('jupyter-notifier-btn').addEventListener('click', (e) => {
         const selectedCells = this.getSelectedCells();
         if (selectedCells.length >= 1) {
            this.handleMultipleSelection(selectedCells);
         } else {
            this.handleSingleSelection(this.selectedCell);
         }
      });
   }

   getSelectedCells() {
      return Array.from(document.getElementsByClassName('jupyter-soft-selected'));
   }

   handleMultipleSelection(selectedCells) {
      for (let selectedCell of selectedCells) {
         this.handleSingleSelection(selectedCell);
      }
   }

   handleSingleSelection(selectedCell) {
      if (!this.isCodeCell(selectedCell)) {
         return;
      }
      if (this.isCellNotified(selectedCell)) {
         this.notifyCells.splice(this.notifyCells.indexOf(selectedCell), 1);
         this.removeNotifyIndicator(selectedCell);
      } else {
         this.notifyCells.push(selectedCell);
         this.addNotifyIndicator(selectedCell);
      }
      this.toggleIcon();
   }

   isCellNotified(cell) {
      return this.notifyCells.includes(cell);
   }

   isCodeCell(selectedCell) {
      return selectedCell.className.includes('cell code_cell');
   }

   setSelectedCell() {
      const timer = setInterval(() => {
         console.log('Hello');
         const selectedCell = Array.from(document.getElementsByClassName('selected'))[0];
         console.log(selectedCell);
         if (selectedCell) {
            clearTimeout(timer);
            this.selectedCell = selectedCell;
            this.toggleButton();
         }
      }, 150);
      console.log("done");
   }

   getSelectedCell() {
      return Array.from(document.getElementsByClassName('selected'))[0];
   }

   addNotifyIndicator(selectedCell) {
      const target = selectedCell.getElementsByClassName('prompt input_prompt')[0];
      const parent = selectedCell.getElementsByClassName('prompt_container')[0];
      const wrapper = document.createElement('div');

      // Add styles
      wrapper.className = 'jupyter-notifier-icon-identifier-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';

      parent.replaceChild(wrapper, target);
      wrapper.appendChild(target);
      wrapper.insertAdjacentHTML('beforeend', this.getNotifyIndicator());
   }

   removeNotifyIndicator(selectedCell) {
      const child = selectedCell.getElementsByClassName('prompt input_prompt')[0];
      const parent = selectedCell.getElementsByClassName('prompt_container')[0];
      const indicator = selectedCell.getElementsByClassName('jupyter-notifier-bell-indicator')[0];
      const indicatorWrapper = selectedCell.getElementsByClassName('jupyter-notifier-icon-identifier-wrapper')[0];

      indicator.remove();
      parent.insertBefore(child, indicatorWrapper);
      indicatorWrapper.remove();
   }

   getNotifyIndicator() {
      return '<i style="opacity: 0.2;" class="jupyter-notifier-bell-indicator fa fa-bell"></i>'
   }

   getNotifyButton() {
      return '<div id="jupyter-notifier-btn-wrapper" class="btn-group"> \
                        <button id="jupyter-notifier-btn" class="btn btn-default notify-me" title="notify me when cells terminate"> \
                           <i id="jupyter-notifier-icon" class="fa fa-bell-slash"></i> \
                        </button> \
               </div>';
   }

   msToTime(duration) {
      if (!duration) {
         return '42h';
      }
      let seconds = Math.round((duration / 1000) % 60);
      let minutes = Math.floor((duration / (1000 * 60)) % 60);
      let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

      hours = (hours < 10) ? '0' + hours : hours;
      minutes = (minutes < 10) ? '0' + minutes : minutes;
      seconds = (seconds < 10) ? '0' + seconds : seconds;

      return hours + ':' + minutes + ':' + seconds;
   }
}

function main() {
   if (Page.isJupyterNotebook()) {
      console.log("Current tab is a jupyter notebook");
      const currentPage = new Page();
      currentPage.initObservers();
   }
}

main();