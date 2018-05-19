/**
 * Resbud class by Johnpaul McMahon
 * 
 * Each instance of this class represents a budget
 * within a given type (FEC, PRICE, INTERNAL BID FEC etc).
 */

class Resbud {
    /**
     * Constructor 
     * 
     * @param {String} name - resbud code (e.g. XA20)
     * @param {String} longName - resbud text (e.g. Salaries - Clinical)
     * @param {Object} store - useful data, constants and utils
     */
    constructor(name, longName, store) {
        // Resbud
        this.name = name;
        // Resbud (T)
        this.longName = longName;
        // Utility functions
        this.store = store;
        // List of current budget amounts
        this.oldBudget = [];
        // new budget total
        this.newBudget = 0;
        // List of amendment amounts per period
        this.amendmentData = [];
        // List of periods relevant for this Resbud
        this.periods = [];
        // Save DOM Node so that can update when user changes new budget
        this.amendmentElement;
        // Save ref to roundToTwo function for ease of use
        this.round = store.utils.roundToTwo;
    }

    /**
     * 
     * @param {Number} amount amount to push to old budget list
     * @param {Number|String} period period that amount being pushed relates to
     */
    pushToOldBudget(amount, period) {
        // Push the amount
        this.oldBudget.push(amount);
        // Push the period
        this.pushToPeriods(period);
        // Default new budget to current budget so update that too.
        this.newBudget += amount;
    }

    getOldBudget() {
        return this.oldBudget.reduce((acc, curr) => acc + curr, 0);
    }

    getNewBudget() {
        return this.newBudget;
    }

    getAmendmentTotal() {
        return this.amendmentData.reduce((acc, curr) => acc + curr, 0);
    }

    setNewBudgetTotal(total) {
        this.newBudget = total;
    }

    /**
     * Push a period onto the list maintained by this instance.
     * Each Resbud needs to maintain their own period list as they
     * aren't all the same.
     * 
     * @param {Number} period
     */
    pushToPeriods(period) {
        this.periods.push(period);
    }

    /**
     * Returns the change in budget.
     * There is a lot of rounding required in here.
     * The return value of this function should only be used for display purposes. NOT calculations.
     * 
     * @return {Number}
     */
    getBudgetChange() {
        let newBudg = this.round(this.getNewBudget());
        let oldBudg = this.round(this.getOldBudget());
        return this.round(newBudg - oldBudg);
    }

    /**
     * This returns the Resbud code that we're familiar with from Agresso.
     * 
     * @return {String}
     */
    getCode() {
        return this.name;
    }

    /**
     * This returns the Resbud (T) that we're familiar with from Agresso.
     * 
     * @return {String}
     */
    getCodeText() {
        return this.longName;
    }

    /**
     * The most important function of the entire Application!
     * Doesn't accept any parameters or return any value.
     * It creates the amendments required for each period of the
     * Resbud and pushes to amendmentData.
     * Results are retrieved from amendmentData.
     */
    calculateResults() {
        // Clear out amendment data (means this can be re-used in same session)
        this.amendmentData = [];
        let currBudg = this.getOldBudget();
        let newBudg = this.getNewBudget();
        let amendmentTotal = newBudg - currBudg;

        // Just using the rounded version to check if there is a change.
        // Hopefully this stops rogue Resbuds appearing in results.
        let roundedAmendmentCheck = this.store.utils.roundToTwo(newBudg) - this.store.utils.roundToTwo(currBudg)
        if (roundedAmendmentCheck !== 0) {
            if (currBudg === 0) {
                // Pro-rate; for the time-being
                let proRatedAmendedAmount = amendmentTotal / this.store.periods.length;
                for (let i = 0; i < this.store.periods.length; i++) {
                    this.amendmentData.push(proRatedAmendedAmount);
                }
                this.periods = [...this.store.periods];
            } else {
                // Attribute correct percentage of total amendment amount to each period
                this.oldBudget.forEach(periodAmount => {
                    this.amendmentData.push(
                        (periodAmount / currBudg) * amendmentTotal
                    );
                });
            }
        }
    }

    /**
     * Returns a list containing all amendment rows required for exporting.
     * The list returned is 2D. Each nested list contains all the data
     * required for each period.
     * 
     * @param {String} type - Version; PBFEC, PBPRICE etc.
     */
    exportData(type) {
        let exportData = [];
        if (this.getAmendmentTotal() !== 0) {
            for (let i = 0; i < this.amendmentData.length; i++) {
                exportData.push([
                    type,
                    this.getCode(),
                    this.getCodeText(),
                    this.store.subProject,
                    this.amendmentData[i],
                    this.periods[i],
                    this.store.description
                ]);
            }
        }
        return exportData;
    }

    /**
     * Creates and returns a table row (<tr>) which contains the
     * summarised info for the Resbud. It also contains an input
     * to let the User input new budget values.
     * 
     * @param {String} type - Version; PBFEC, PBPRICE etc.
     */
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
        rowElement.appendChild(this.generateField(
            this.round(this.getOldBudget())
        ));

        // New Budget Field
        rowElement.appendChild(this.generateNewBudgetField(type));

        // Add change/amendment required
        this.amendmentElement = this.generateField(
            this.getBudgetChange()
        );
        rowElement.appendChild(this.amendmentElement);

        return rowElement;
    }

    buildResultReport(type) {
        let row;
        let rows = [];

        // Create a table row for each period
        for (let i = 0; i < this.amendmentData.length; i++) {
            row = document.createElement('tr');
            row.appendChild(this.generateField(type));
            row.appendChild(this.generateField(this.getCode()));
            row.appendChild(this.generateField(this.getCodeText()));
            row.appendChild(this.generateField(this.store.subProject));
            row.appendChild(this.generateField(this.amendmentData[i]));
            row.appendChild(this.generateField(this.periods[i]));
            row.appendChild(this.generateField(this.store.description));
            rows.push(row);
        }

        return rows;
    }

    generateNewBudgetField(type) {
        // Create New Budget Cell
        let newBudgetCell = this.store.utils.createElement('td', {
            className: 'newBudgetInput',
        });

        // Create New Budget Input Field to attach to cell        
        let newBudgetInput = this.store.utils.createElement('input', {
            value: this.round(this.getOldBudget()),
            type: 'text',
            // step: '0.01',
        });

        // Attach input to cell
        newBudgetCell.appendChild(newBudgetInput);

        // data-binding
        newBudgetInput.onkeyup = () => {
            // Reset new budget data so that results can be re-calculated
            if (this.amendmentData.length > 0)
                this.amendmentData = [];

            // Simply sets the new budget total amount
            // TODO: validate input so that it only accepts valid numbers (beware of '-')
            // The regex inside replace removes all pound symbols and commas as they don't play well with parseFloat
            this.setNewBudgetTotal(parseFloat(newBudgetInput.value.replace(/[£,]/g, '')));

            // Update Amendment/Difference Element
            this.amendmentElement.innerHTML = this.getBudgetChange();

            // Fire Event so that subscribers can update DOM elements (or whatever) as required.
            newBudgetInput.dispatchEvent(new CustomEvent(this.store.constants.BUDGET_CHANGE_EVENT, {
                detail: {
                    message: this.getCode() + ': New budget changed',
                    code: this.getCode(),
                    codeText: this.getCodeText()
                },
                bubbles: true,
                cancelable: true
            }));
        };

        return newBudgetCell;
    }

    generateField(value) {
        return this.store.utils.createElement('td', {
            innerHTML: value
        });
    }
};