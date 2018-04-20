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

    constructor(name, duration, store) {
        this.store = store
        // this.constants = this.store.constants;
        // this.resbudMap = this.store.resbudMap;
        this.name = name;
        this.data = [];
        this.split = []; // SHould be moved up to App Class
        this.duration = duration;
        // this.utils = this.store.utils;
        this.reportTableElement; // Save DOM Element for displaying Resbuds
        this.newBudgetListElement; // Save <select> DOM Element to update the list easier
    }

    /**
     * Extract relevant data from source array
     * 
     * @param {Array} source - list of objects containing record data
     */
    init(source) {
        // Local var used in loop
        let resbud;
        // Loop over every record within input
        source.forEach(record => {
            // Empty array or array with exactly 1 Resbud object in it:
            resbud = this.getResbuds().filter(resbud => resbud.getCode() === record[this.store.constants.RESBUD]);
            if (resbud.length === 1) {
                // If there is 1 entry then extract it
                resbud = resbud[0];
            } else if (resbud.length === 0) {
                // No entries means new Resbud encountered. Instantiate and push to collection
                resbud = record[this.store.constants.RESBUD];
                resbud = this.newResbud(resbud);
                this.addResbud(resbud);
            } else {
                // If there is more than 1 entry then we have a bug to fix
                throw "More than 1 Resbud object for " + record[this.store.constants.RESBUD] + " in Collection " + this.name + ".<br/>Duplicates should not be possible - See JPM."
            }

            // If there is a new budget store.amount on this record and new budget hasn't already been
            // set for this resbud then set it.
            // if (record[this.store.constants.NEW_BUDGET] !== 0 && resbud.getNewBudget() === 0)
                // resbud.setNewBudgetTotal(record[this.store.constants.NEW_BUDGET]);

            // Push old budget amount onto Resbud
            resbud.pushToOldBudget(record[this.store.constants.CURR_AMOUNT], record[this.store.constants.PERIOD]);
        });
    }

    addResbud(resbud) {
        this.data.push(resbud);
    }

    getResbuds() {
        return this.data;
    }

    getType() {
        return this.name;
    }


    /**
     * Calculate result data
     */
    calculateResults() {
        this.getResbuds().forEach(resbud => resbud.calculateResults());
    }

    newResbud(resbud) {
        return new Resbud(resbud, this.store.resbudMap[resbud], this.store);
    }

    buildSummaryReport() {
        // Generate container for this Collections report
        let container = this.store.utils.createElement('div', { id: this.name.toLowerCase() + '-report-container' });
        // container.id = this.name.toLowerCase() + '-report-container';

        // Generate and append heading for report 
        container.appendChild(this.store.utils.createElement('h2', { innerHTML: this.name + ' Summary:', className: 'title is-4' }));

        // Generate report table
        let report = this.store.utils.createElement('table', { id: this.name.toLowerCase() + '-report', className: 'table' });
        this.reportTableElement = report; // Save report table to this instance

        // Add heading row to table
        report.appendChild(this.buildSummaryReportHeader());

        // Generate data for each Resbud 
        this.getResbuds().forEach(resbud => report.appendChild(resbud.buildSummaryReport(this.name)));

        // Add the built report table to container
        container.appendChild(report);

        // Add drop-down list for adding a brand-new budget
        container.appendChild(this.buildAddNewBudgetElement());

        return container;
    }

    buildResultsReport() {
        // Create the table Element
        let table = this.store.utils.createElement('table', {
            className: 'table',
            id: `${this.getType().toLowerCase()}-results-table`
        });

        // Build out table rows for each Resbud
        let rows = [];
        this.getResbuds().forEach(resbud => rows = [...rows, ...resbud.buildResultReport(this.getType())]);
        if (rows.length) {
            // Append table header row to table
            table.appendChild(this.buildResultsReportHeader());
            rows.forEach(row => table.appendChild(row));
        }
        return table;
    }

    buildAddNewBudgetElement() {
        // Container div
        let newResbudContainer = this.store.utils.createElement('div', { className: 'addBudgetContainer' });
        
        // Add Button
        let addResbudButton = this.store.utils.createElement('button', { innerHTML: 'Add Budget', className: 'button is-success' });

        // Append Select dropdown list
        newResbudContainer.appendChild(this.buildBudgetDropdownList(`Add new budget to ${this.name}: `));
        // Append Add Button
        newResbudContainer.appendChild(addResbudButton);

        // Add Button Onclick handler
        addResbudButton.onclick = () => {
            // Cache <select> element
            let select = this.newBudgetListElement;
            // Save selected resbud <option>, converted to upper case
            let inputValue = select.value.toUpperCase();
            // Double check valid option selected - overkill really...
            if (this.store.resbudMap.hasOwnProperty(inputValue)) {
                // Create a new Resbud instance
                let newResbud = this.newResbud(inputValue);
                // Push new Resbud to this Collection
                this.addResbud(newResbud);
                // Add Resbud info to the report table - this also sets up new budget input event
                this.reportTableElement.appendChild(newResbud.buildSummaryReport(this.name));
                // Now remove the selected option from the <select> list; don't want to add it again
                select.options.remove(select.selectedIndex);
            }
            // Reset selected option to first one in list
            select.selectedIndex = 0;
        };
        return newResbudContainer;
    }

    /**
     * Builds up the select list for adding a new Resbud
     * 
     * @param {String} labelValue - Label string/User prompt
     */
    buildBudgetDropdownList(labelValue) {
        let wrapper = this.store.utils.createElement('div', { className: 'select' });
        // let label = document.createElement('label');
        // label.style.display = 'block';
        // label.appendChild(document.createTextNode(labelValue));
        let select = document.createElement('select');

        this.newBudgetListElement = select;

        // Setup select list using filtered list of resbuds
        let option;
        for (const resbud in this.getFilteredResbudList()) {
            option = document.createElement('option');
            option.value = resbud;
            option.appendChild(document.createTextNode(this.store.resbudMap[resbud]));
            this.newBudgetListElement.appendChild(option);
        }

        // wrapper.appendChild(label);
        wrapper.appendChild(select);
        return wrapper;
    }

    /**
     * Build the table header row
     */
    buildSummaryReportHeader() {
        let headingRow = document.createElement('thead');
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.TYPE));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.RESBUD));
        headingRow.appendChild(this.buildHeadingCell('Resbud (T)'));
        headingRow.appendChild(this.buildHeadingCell('Current Budget'));
        headingRow.appendChild(this.buildHeadingCell('New Budget'));
        headingRow.appendChild(this.buildHeadingCell('Difference'));
        return headingRow;
    }

    buildResultsReportHeader() {
        let headingRow = document.createElement('thead');
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.TYPE));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.RESBUD));
        headingRow.appendChild(this.buildHeadingCell('Resbud (T)'));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.SUB_PROJECT));
        headingRow.appendChild(this.buildHeadingCell('Amendment'));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.PERIOD));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.DESCRIPTION));
        return headingRow;
    }

    /**
     * Re-use code for producing header row in generateReportHeader()
     * 
     * @param {String} value - Heading string
     */
    buildHeadingCell(value) {
        return this.store.utils.createElement('th', {
            innerHTML: value
        });
    }

    /**
     * Returns a map of Resbud Codes to Resbud Names containing only those
     * that aren't already part of the Resbud List for this Collection
     */
    getFilteredResbudList() {
        let existingCodes = this.getResbuds().map(resbud => resbud.getCode());
        let filteredList = {};

        for (let code in this.store.resbudMap)
            if (!existingCodes.includes(code))
                filteredList[code] = this.store.resbudMap[code];

        return filteredList;
    }
};