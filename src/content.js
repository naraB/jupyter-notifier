class Page {
   codeCells;
   notifyCells = [];
   selectedCell;
   runningCellQueue = [];

   constructor() {
      this.codeCells = this.getInitialCodeCells();
      this.selectedCell = this.getSelectedCell();
      this.injectButton();
   }

   static isJupyterNotebook() {
      return document.title.includes('Jupyter Notebook') && !!Page.getNotebookName();
   }

   static getNotebookName() {
      return document.getElementById('notebook_name') ? document.getElementById('notebook_name').innerText : null;
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
               this.toggleIcon();
            }
         }
      }).observe(document.getElementById('notebook'), { attributes: true, childList: true, subtree: true });
   }

   initRunningCellObserver() {
      new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && target.className.includes('running') && !this.runningCellQueue.some(cell => cell.element === target) && this.notifyCells.includes(target)) {
               const terminationObserver = this.initTerminationCellObserver(target);
               const runningCell = { element: target, startTime: new Date(), observer: terminationObserver };
               console.log("cell is running", runningCell);
               this.runningCellQueue.push(runningCell);
            }
         }
      }).observe(document.getElementById('notebook'), { attributes: true, childList: true, subtree: true });
   }

   initTerminationCellObserver(runningCell) {
      const observer = new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && !target.className.includes('running') && this.runningCellQueue.some(cell => cell.element === target)) {
               const terminatedCell = this.runningCellQueue.shift();
               this.notifyCells.splice(this.notifyCells.indexOf(terminatedCell.element), 1);
               // Next cell runs after completion of previous
               if (this.runningCellQueue[0]) {
                  this.runningCellQueue[0].startTime = new Date();
               }
               this.removeNotifyIndicator(terminatedCell.element);
               const runtime = this.msToTime(new Date() - terminatedCell.startTime);
               chrome.runtime.sendMessage({ event: 'cell-terminated', runtime });
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
      this.addNotifyEventListener();
   }

   selectedCellContainsNotifyIndicator() {
      return !!this.selectedCell.getElementsByClassName('jupyter-notifier-bell-indicator')[0];
   }

   toggleIcon() {
      const notifyIcon = document.getElementById('jupyter-notifier-icon');
      if (this.isSelectedCellNotified()) {
         notifyIcon.className = 'fa fa-bell';
      } else {
         notifyIcon.className = 'fa fa-bell-slash';
      }
   }

   addNotifyEventListener() {
      document.getElementById('jupyter-notifier-btn').addEventListener('click', (e) => {
         if (this.isSelectedCellNotified()) {
            this.notifyCells.splice(this.notifyCells.indexOf(this.selectedCell), 1);
            this.removeNotifyIndicator();
         } else {
            this.notifyCells.push(this.selectedCell);
            this.addNotfiyIndicator();
         }
         this.toggleIcon();
      });
   }

   isSelectedCellNotified() {
      return this.notifyCells.includes(this.selectedCell);
   }

   getSelectedCell() {
      return Array.from(document.getElementsByClassName('selected'))[0];
   }

   addNotfiyIndicator() {
      const child = this.selectedCell.getElementsByClassName('prompt input_prompt')[0];
      const parent = this.selectedCell.getElementsByClassName('prompt_container')[0];
      const wrapper = document.createElement('div');

      // Add styles
      wrapper.className = 'jupyter-notifier-icon-identifier-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';
      wrapper.style.alignItems = 'center';

      parent.replaceChild(wrapper, child);
      wrapper.appendChild(child);
      wrapper.insertAdjacentHTML('beforeend', this.getNotifyIndicator());
   }

   removeNotifyIndicator(selectedCell = this.selectedCell) {
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
      return '<div class="btn-group"> \
                        <button id="jupyter-notifier-btn" class="btn btn-default notify-me" title="notify me when cells terminates"> \
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
   if (!Page.isJupyterNotebook()) {
      return;
   }
   console.log("Current tab is a jupyter notebook");
   const currentPage = new Page();
   currentPage.initObservers();
}

main();