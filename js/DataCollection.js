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
    
    constructor (name, constants) {
        this.constants = constants;
        this.name = name;
        this.data = [];
        this.split = []; // SHould be moved up to App Class
    }
    
    /**
     * Extract relevant data from source array
     */
    init (source) {
        // Local var used in loop
        let resbud;
        
        // Loop over every record within given source
        source.forEach( record => {

            // Empty array or array with exactly 1 Resbud object in it:
            resbud = this.data.filter(resbud => resbud.name === record[this.constants.RESBUD]);
            
            if ( resbud.length === 1 ) {
                // If there is 1 entry then extract it
                resbud = resbud[0];  
            }
            else if ( resbud.length > 1 ) {
                // If there is more than 1 entry then we have a bug to fix
                throw "More than 1 Resbud object for " + record[this.constants.RESBUD] + " in Collection " + this.name + ".<br/>Duplicates should not be possible - See JPM."
            } else {
                // No entries means new Resbud encountered. Instantiate and push to data
                resbud = new Resbud(record[this.constants.RESBUD]);
                this.data.push(resbud);
            }
            
            // If there is a new budget amount on this record and new budget hasn't already been
            // set for this resbud then set it.
            if ( record[this.constants.NEW_BUDGET] !== 0 && resbud.newBudget.total === 0 )
                resbud.setNewBudget(record[this.constants.NEW_BUDGET]);

            // Push old budget amount onto Resbud
            resbud.pushOldBudget(record[this.constants.CURR_AMOUNT]);
                

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
    
    generateSummaryReport () {
        
        // Generate container for this Collections report
        let container = document.createElement('div');
        container.id = this.name.toLowerCase() + '-report-container';
        
        // Generate and append heading for report 
        let heading = document.createElement('h3');
        heading.appendChild(document.createTextNode(this.name + ' Summary:'));
        container.appendChild(heading);
        
        // Generate report table
        let report = document.createElement('table');
        report.id = this.name.toLowerCase() + '-report';
        
        // Add heading row
        report.appendChild(this.generateReportHeader());
        
        // Generate data for each Resbud 
        this.data.forEach( resbud => report.appendChild(resbud.generateSummaryReport(this.name)) );
        
        container.appendChild(report);
        
        return container;
        
    }
    
    generateReportHeader () {
        let headingRow = document.createElement('tr');
        
        headingRow.appendChild(this.generateHeadingField(this.constants.TYPE));
        headingRow.appendChild(this.generateHeadingField(this.constants.RESBUD));
        headingRow.appendChild(this.generateHeadingField('Current Budget'));
        headingRow.appendChild(this.generateHeadingField('New Budget'));
        headingRow.appendChild(this.generateHeadingField('Difference'));
        
        return headingRow;
    }
    
    generateHeadingField(value) {
        let el = document.createElement('th');
        el.appendChild(document.createTextNode(value));
        return el;
    }
};