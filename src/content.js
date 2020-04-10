class Page {
   codeCells;
   static injectButton = this.getInjectButton();

   constructor() {
      this.codeCells = this.getInitialCodeCells();
      this.injectButtons();
   }

   initCellObserver() {
      new MutationObserver((mutations) => {
         for (let mutation of mutations) {
            const target = mutation.target;
            if (target.className && target.className.includes('cell code_cell') && !this.codeCells.includes(target)) {
               this.codeCells.push(target);
               console.log(this.codeCells);
               // call btn
            }
         }
      }).observe(document.body, { attributes: true, hildList: true, subtree: true });
   }


   isJupyterNotebook() {
      return true;
   }

   getInitialCodeCells() {
      return Array.from(document.getElementsByClassName('cell code_cell'));
   }

   getCodeCells() {
      return this.codeCells;
   }

   injectButtons() {
      for(let i = 0; i < this.codeCells.length; i++) {
         let inputElement = this.codeCells[i].firstChild;
         inputElement.insertAdjacentHTML('afterbegin', Page.injectButton);   
      }
   }

   static getInjectButton() {
      return '<div style="display: flex; justify-content: center; align-items: center;"> \
            <button id="notify-me">Click</button> \
            </div>'
   }
}

async function main() {
   const currentPage = new Page();
   currentPage.initCellObserver();
}

main();

