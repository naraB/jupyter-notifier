class Page {
   codeCells;

   constructor() {
      this.codeCells = this.getInitialCodeCells();
      // call btn
   }

   initCellObserser() {
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


}

function main() {
   const currentPage = new Page();
   currentPage.initCellObserser();
}

main();

