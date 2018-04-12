/**
 |-----------------------------------------------------
 | DataCollection class
 | NOTE: This class uses Constants defined in main.js
 |
 | Imports:
 | import Resbud from Resbud.js
 |
 | Fields:
 | String name: Version (PBFEC, PBPRICE etc.)
 | Array split: Array holding percentage split per period
 | Array data: Array or Resbud objects.
 |-----------------------------------------------------
 */

class DataCollection {
    
    constructor (name) {
        this.name = name;
        this.data = [];
        this.split = []; // SHould be moved up to App Class
    }
    
    /**
     * Extract relevant data from source array
     */
    initialise (source) {
        // Local var used in loop
        let resbud;
        
        // Loop over every record within given source
        source.forEach( record => {
            
            // Empty array or array with exactly 1 Resbud object in it:
            resbud = this.data.filter(resbud => resbud.name === record[RESBUD]);
            
            if ( resbud.length === 1 ) {
                // If there is 1 entry then extract it
                resbud = resbud[0];  
            }
            else if ( resbud.length > 1 ) {
                // If there is more than 1 entry then we have a bug to fix
                throw "More than 1 Resbud object for " + record[RESBUD] + " in Collection " + this.name + ".<br/>Duplicates should not be possible - See JPM."
            } else {
                // No entries means new Resbud encountered. Instantiate and push to data
                resbud = new Resbud(record[RESBUD]);
                this.data.push(resbud);
            }
            
            // If there is a new budget amount on this record and new budget hasn't already been
            // set for this resbud then set it.
            if ( record[NEW_BUDGET] !== 0 && resbud.newBudget.total === 0 )
                resbud.setNewBudget(record[NEW_BUDGET]);

            // Push old budget amount onto Resbud
            resbud.pushOldBudget(record[CURR_AMOUNT]);
                

        }); 
    }
    
    processAmendmentAmounts () {
        let oldBudget, newBudget, oldData, newData;
        
        this.data.forEach( resbud => {
            oldBudget = resbud.oldBudget.total
            newBudget = resbud.newBudget.total
            oldData = resbud.oldBudget.data
            newData = resbud.newBudget.data
            
            // If there is a difference between old and new budget then there is work to do:
            if ( (oldBudget - newBudget) !== 0 ) {
                if (oldBudget === 0) {
                    // Make sure split is set and use it to populate new budget data
                    if (this.split.length === 0)
                        this.setSplit();
                    this.split.forEach( p => newData.push(newBudget * p) );
                } else {
                    // ( (record.amount / currResbud.currentBudgetTotal) * currResbud.newBudgetTotal ) - record.amount
                    oldData.forEach( n => newData.push( ( ( n / oldBudget ) * newBudget ) - n ) );
                }
            }
        });
    }
    
    // Should be moved up to App class
    setSplit () {
        // Get percentage split from the first Resbud with an old budget:
        for (let i = 0; i < this.data.length; i++) {
            this.split = this.data[i].getSplitPerPeriod();
            if (this.split.length > 0)
                break;
        }
        // If still empty (no budgets) then just apportion equally:
        if (this.split.length === 0) {
            let n = this.data.length;
            for (let i = 0; i < n; i++) {
                this.split.push( (100/n) / 100 );
            }
        }
    }
};