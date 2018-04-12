/**
 |------------------------------------
 | Resbud class 
 |------------------------------------
 */

class Resbud {
    
    constructor (type, name) {
        this.type = type;
        this.name = name;
        this.budgetDifference = 0;
        this.oldBudget = {
            total: 0,
            data: []
        };
        this.newBudget = {
            total: 0,
            data: []
        };
    }
    
    /**
     * Push amount onto old budget data and update
     * old budget total accordingly.
     */
    pushOldBudget (amount) {
        this.oldBudget.data.push(amount);
        this.oldBudget.total += amount;
        // newBudget will most likely  be £0 the whole time and will be input after loading
        this.budgetDifference = this.newBudget.total - this.oldBudget.total;
    }
    
    setNewBudget (amount) {
        this.newBudget.total = amount;
    }
    
    getSplitPerPeriod () {
        if (this.oldBudget.total === 0)
            return [];
        else
            return this.oldBudget.data.map( n => n / this.oldBudget.total );
    }

    // getMarkup
};