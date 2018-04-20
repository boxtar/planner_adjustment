/**
 |------------------------------------
 | Resbud class 
 |------------------------------------
 */

class Resbud {

    constructor(name, longName, store) {
        // Resbud
        this.name = name;
        // Resbud (T)
        this.longName = longName;
        // Utility functions
        this.store = store;
        // List of current budget amounts
        this.oldBudget = [];
        // Object representing the new budget (should be called amendmentData... hindsight)
        this.newBudget = {
            total: 0,
            data: []
        };
        // List of periods relevant for this Resbud
        this.periods = [];
        // Save DOM Node so that can update when user changes new budget
        this.amendmentElement;
    }

    pushToOldBudget(amount, period) {
        this.oldBudget.push(amount);
        this.pushToPeriods(period);
    }

    getOldBudget() {
        return this.oldBudget.reduce((acc, curr) => acc + curr, 0);
    }

    pushToNewBudget(amount) {
        this.newBudget.push(amount);
    }

    getNewBudget() {
        if (this.newBudget.data.length > 0)
            return this.newBudget.data.reduce((acc, curr) => acc + curr, 0);
        return this.newBudget.total;
    }

    setNewBudgetTotal(total) {
        this.newBudget.total = total;
    }

    pushToPeriods(period) {
        this.periods.push(period);
    }

    getBudgetChange() {
        return this.getNewBudget() - this.getOldBudget();
    }

    getCode() {
        return this.name;
    }

    getCodeText() {
        return this.longName;
    }

    calculateResults() {
        // Clear out amendment data (means this can be re-used in same session)
        this.newBudget.data = [];
        let currBudg = this.getOldBudget();
        let newBudg = this.getNewBudget();
        let amendmentTotal = newBudg - currBudg;

        if (amendmentTotal !== 0) {
            if (currBudg === 0) {
                // Pro-rate; for the time-being
                let proRatedAmendedAmount = amendmentTotal / this.store.periods.length;
                for (let i = 0; i < this.store.periods.length; i++) {
                    this.newBudget.data.push(proRatedAmendedAmount);
                }
                this.periods = [...this.store.periods];
            } else {
                // Attribute correct percentage of total amendment amount to each period
                this.oldBudget.forEach(periodAmount => {
                    this.newBudget.data.push((periodAmount / currBudg) * amendmentTotal);
                });
            }
        }
    }

    buildSummaryReport(type) {
        // Resbud report container (table row)
        let rowElement = document.createElement('tr');

        // Add type field
        rowElement.appendChild(this.generateField(type));

        // Add resbud code field
        rowElement.appendChild(this.generateField(this.name));

        // Add resbud name field
        rowElement.appendChild(this.generateField(this.longName));

        // Add current/old budget
        rowElement.appendChild(this.generateField(this.getOldBudget()));

        // New Budget Field
        rowElement.appendChild(this.generateNewBudgetField(type));

        // Add change/amendment required
        this.amendmentElement = this.generateField(this.getBudgetChange())
        rowElement.appendChild(this.amendmentElement);

        return rowElement;
    }

    buildResultReport(type) {
        let row;
        let rows = [];
        
        // Create a table row for each period
        for (let i = 0; i < this.newBudget.data.length; i++) {
            row = document.createElement('tr');
            row.appendChild(this.generateField(type));
            row.appendChild(this.generateField(this.getCode()));
            row.appendChild(this.generateField(this.getCodeText()));
            row.appendChild(this.generateField(this.store.subProject));
            row.appendChild(this.generateField(this.newBudget.data[i]));
            row.appendChild(this.generateField(this.store.periods[i]));
            row.appendChild(this.generateField(this.store.description));
            rows.push(row);
        }
        
        return rows;
    }

    generateNewBudgetField(type) {
        // Unique ID for this Resbud
        let id = `${type}-${this.name.toLowerCase()}`;
        // Create New Budget Cell
        let newBudgetCell = this.generateField('');
        newBudgetCell.className = 'newBudgetInput';
        // Create New Budget Input Field to attach to cell
        let newBudgetInput = document.createElement('input');

        // Set options/attributes of input
        newBudgetInput.value = this.getNewBudget();
        newBudgetInput.type = 'text';
        newBudgetInput.id = `${id}-new-budget`;

        // data-binding
        newBudgetInput.onkeyup = e => {
            // Reset new budget data so that results can be re-calculated
            if (this.newBudget.data.length > 0) this.newBudget.data = [];;
            newBudgetInput.value = newBudgetInput.value.trim();
            if (newBudgetInput.value !== '-' && isNaN(newBudgetInput.value))
                newBudgetInput.value = this.getNewBudget();
            else
                this.setNewBudgetTotal(newBudgetInput.value);

            this.amendmentElement.innerHTML = this.getBudgetChange();
        };

        // Attach input to cell
        newBudgetCell.appendChild(newBudgetInput);
        return newBudgetCell;
    }

    generateField(value) {
        return this.store.utils.createElement('td', { innerHTML: value });
    }
};