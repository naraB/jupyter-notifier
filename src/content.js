class Page {
   codeCells;
   // From local storage??
   notifyCells = [];
   selectedCell;

   constructor() {
      this.codeCells = this.getInitialCodeCells();
      this.selectedCell = this.getSelectedCell();
      this.injectButton();
   }

   initObservers() {
      this.initNewCellObserver();
      this.initSelectedCellObserver();
   }

   initNewCellObserver() {
      new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && target.className.includes('cell code_cell') && !this.codeCells.includes(target)) {
               this.codeCells.push(target);
            }
         }
      }).observe(document.body, { attributes: true, childList: true, subtree: true });
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
      }).observe(document.getElementById('notebook'), { attributes: true, childList: true, subtree: true});
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
         this.toggleButton();
      });
   }

   isSelectedCellNotified() {
      return this.notifyCells.includes(this.selectedCell);
   }

   getSelectedCell() {
      return document.getElementsByClassName('selected');
   }

   getNotifyButton() {
      return '<div class="btn-group jupyter-notifier"> \
                        <button id="notify-me" class="btn btn-default notify-me" title="notify me when cells terminates">U</button> \
                     </div>';
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

