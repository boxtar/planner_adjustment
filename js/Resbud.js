/**
 |------------------------------------
 | Resbud class 
 |------------------------------------
 */

class Resbud {
    
    constructor (name) {
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

    generateSummaryReport (type) {
        
        // Resbud report container (table row)
        let rowElement = document.createElement('tr');
        
        // Add type field
        rowElement.appendChild(this.generateField(type));
        
        // Add resbud code field
        rowElement.appendChild(this.generateField(this.name));
        
        // Add current/old budget
        rowElement.appendChild(this.generateField(this.oldBudget.total));
        
        // Add new budget
        rowElement.appendChild(this.generateField(this.newBudget.total));
        
        // Add change/amendment required 
        rowElement.appendChild(this.generateField( this.newBudget.total - this.oldBudget.total ));

        return rowElement;
    }
    
    generateField(value) {
        let el = document.createElement('td');
        el.appendChild(document.createTextNode(value));
        return el;
    }
};