class Page {
   codeCells;
   // From local storage??
   notifyCells = [];
   selectedCell;
   runningCellQueue = [];

   constructor() {
      this.codeCells = this.getInitialCodeCells();
      this.selectedCell = this.getSelectedCell();
      console.log('selected cell', this.selectedCell);
      this.injectButton();
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
               this.toggleButton();
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
               // Next cell runs after completion of previous
               if (this.runningCellQueue[0]) {
                  this.runningCellQueue[0].startTime = new Date();
               }
               terminatedCell.observer.disconnect();
               console.log("cell finished running. runtime: ", this.msToTime(new Date() - terminatedCell.startTime));
            }
         }
      });
      observer.observe(runningCell, { attributes: true, childList: true, subtree: true });
      return observer;
   }


   static isJupyterNotebook() {
      return true;
   }

   getInitialCodeCells() {
      return Array.from(document.getElementsByClassName('cell code_cell'));
   }

   injectButton() {
      const toolbar = document.getElementById('maintoolbar-container');
      toolbar.insertAdjacentHTML('beforeend', this.getNotifyButton());
      this.addNotifyEventListener();
   }

   toggleButton() {
      const notifyButton = document.getElementById('notify-me');
      if (this.isSelectedCellNotified()) {
         // TODO toggle icons instead of text
         notifyButton.innerText = 'S';
      } else {
         notifyButton.innerText = 'U';
      }
   }

   addNotifyEventListener() {
      document.getElementById('notify-me').addEventListener('click', (e) => {
         if (this.isSelectedCellNotified()) {
            this.notifyCells.splice(this.notifyCells.indexOf(this.selectedCell), 1);
         } else {
            this.notifyCells.push(this.selectedCell);
         }
         console.log('clicked', this.notifyCells);

         this.toggleButton();
      });
   }

   isSelectedCellNotified() {
      return this.notifyCells.includes(this.selectedCell);
   }

   getSelectedCell() {
      return Array.from(document.getElementsByClassName('selected'))[0];
   }

   getNotifyButton() {
      return '<div class="btn-group jupyter-notifier"> \
                        <button id="notify-me" class="btn btn-default notify-me" title="notify me when cells terminates">U</button> \
                     </div>';
   }

   msToTime(duration) {
      if (!duration) {
         return '42h';
      }
      let seconds = Math.floor((duration / 1000) % 60);
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
   const currentPage = new Page();
   currentPage.initObservers();
}

main();

