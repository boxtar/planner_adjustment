/**
 * DataCollection class by Johnpaul McMahon
 *
 * This class represents a type (FEC, PRICE etc).
 * Each instance will contain and manage a list of
 * budgets (Resbud instances).
 *
 * Imports:
 * import Resbud from Resbud.js
 */

class DataCollection {
    /**
     * Constructor
     *
     * @param {String} name - type of collection (PBFEC, PBPRICE, IBFEC or IBPRICE)
     * @param {Object} store - useful data, constants and utils
     */
    constructor(name, store) {
        this.store = store;
        this.name = name;
        this.data = [];
        this.newAwardAmount = 0; // This gets set in saveAmendmentToAwardedAmount (when calculating results)
        this.reportTableElement; // Save DOM Element for displaying Resbuds
        this.newBudgetListElement; // Save <select> DOM Element to update the list easier
        this.newBudgetTotalElement; // Save this so that content can be updated on user inputting new budget
        this.amendmentTotalElement; // Save this so that content can be updated on user inputting new budget
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
            resbud = this.getResbuds().filter(
                resbud => resbud.getCode() === record[this.store.constants.RESBUD]
            );
            if (resbud.length === 1) {
                // If there is 1 entry then extract it
                resbud = resbud[0];
            } else if (resbud.length === 0) {
                // No entries means new Resbud encountered. Instantiate and push to collection
                resbud = record[this.store.constants.RESBUD];
                resbud = this.newResbud(resbud); // This step is required; used at bottom of function.
                this.addResbud(resbud);
            } else {
                // If there is more than 1 entry then we have a bug to fix
                throw "More than 1 Resbud object for " +
                    record[this.store.constants.RESBUD] +
                    " in Collection " +
                    this.name +
                    ".<br/>Duplicates should not be possible - See JPM.";
            }
            // Push old budget amount onto Resbud
            resbud.pushToOldBudget(
                record[this.store.constants.GBP_AMOUNT],
                record[this.store.constants.PERIOD]
            );
        });
    }

    addResbud(resbud) {
        this.data.push(resbud);
    }

    getResbuds() {
        return this.data;
    }

    // Returns a FEC or PRICE type (PBFEC, PBPRICE etc..)
    getType() {
        return this.name;
    }

    // Is this collection a FEC type?
    isOfTypeFec() {
        return this.store.constants.FEC_BUDGET_TYPES.includes(this.getType());
    }

    // Is this a collection a PRICE type?
    isOfTypePrice() {
        return this.store.constants.PRICE_BUDGET_TYPES.includes(this.getType());
    }

    /**
     * Calculate result data
     */
    calculateResults() {
        // Refresh so script can be re-used
        this.newAwardAmount = 0;

        this.getResbuds().forEach(resbud => {
            resbud.calculateResults();
            this.updateNewAwardAmount(resbud);
        });
    }

    // This was introduced on 23/05/2019 to allow for an Income vs Price
    // control check.
    updateNewAwardAmount(resbud) {
        // If this is FEC type and resbud is Income then record amendment
        if (this.isOfTypeFec() && resbud.getCode() == "XZ90") {
            // Old fec income amount + amendment = target income amount
            this.newAwardAmount = resbud.getOldBudget() + resbud.getAmendmentTotal();
        } else if (this.isOfTypePrice()) {
            // Old price budget + all price amendments = target price budget
            this.newAwardAmount += resbud.getOldBudget() + resbud.getAmendmentTotal();
        }
    }

    /**
     * Creates and returns a new Resbud instance
     *
     * @param {String} resbud - Resbud Code
     */
    newResbud(resbud) {
        return new Resbud(resbud, this.store.resbudMap[resbud], this.store);
    }

    /**
     * Builds the summary report that lets Users input new budget amounts.
     */
    buildSummaryReport() {
        // Build the container that will eventually be returned
        let container = this.store.utils.createElement("div", {
            id: this.name.toLowerCase() + "-report-container",
        });

        // Listen for budget change event (fired by Resbuds when User inputs new budgets)
        container.addEventListener(
            this.store.constants.BUDGET_CHANGE_EVENT,
            e => this.handleBudgetChangeEvent(e),
            false
        );

        // Generate and append heading for report
        container.appendChild(this.getHeadingElement());

        // Generate report table
        let report = this.generateTableElement(`${this.getType().toLowerCase()}-summary-report`);

        // Save report table to this instance for future referencing.
        // Example: appending new resbuds.
        this.reportTableElement = report;

        // Add header row to table
        report.appendChild(this.getHeaderRowForSummary());

        // Build the Total row now so that elements can be passed into resbuds for binding to events
        let totalRow = this.getFooterRowForSummary();

        // For each Resbud call it's buildSummaryReport method and append the returned
        // <tr> Element onto the report <table>.
        this.getResbuds().forEach(resbud => report.appendChild(resbud.buildSummaryReport(this.name)));

        // Add the totals row to the end of the table
        report.appendChild(totalRow);

        // Add the built report table to container
        container.appendChild(report);

        // Add drop-down list for adding a brand-new budget
        container.appendChild(this.buildAddNewBudgetElement());

        return container;
    }

    /**
     * Produces the table housing the results for exporting
     */
    buildResultsReport() {
        // Create the table Element
        let table = this.generateTableElement(`${this.getType().toLowerCase()}-results-table`);

        // Build out table rows for each Resbud
        let rows = [];
        this.getResbuds().forEach(resbud => (rows = [...rows, ...resbud.buildResultReport(this.getType())]));
        if (rows.length) {
            // Append table header row to table
            table.appendChild(this.buildResultsReportHeader());
            rows.forEach(row => table.appendChild(row));
        }
        return table;
    }

    getHeadingElement() {
        return this.store.utils.createElement("h2", {
            innerHTML: `${this.name}`,
            className: "title is-3",
        });
    }

    /**
     * Handle User input on New Budget input fields.
     * This handler simply updates the total cells in the footer of the report.
     *
     * @param {CustomEvent} e - Custom Event object fired by a Resbud
     */
    handleBudgetChangeEvent(e) {
        this.newBudgetTotalElement.innerHTML = this.calculateNewBudgetTotal();
        this.amendmentTotalElement.innerHTML = this.calculateAdjustmentTotal();
    }

    generateTableElement(id = "") {
        return this.store.utils.createElement("table", {
            className: "table",
            id,
        });
    }

    buildAddNewBudgetElement() {
        // Container div
        let newResbudContainer = this.store.utils.createElement("div", {
            className: "addBudgetContainer",
        });

        // Add Button
        let addResbudButton = this.store.utils.createElement("button", {
            innerHTML: "Add Budget",
            className: "button is-success",
        });

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
                this.reportTableElement.appendChild(newResbud.buildSummaryReport(this.getType()));
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
        // Select Container element
        let wrapper = this.store.utils.createElement("div", {
            className: "select",
        });
        // Select element
        let select = document.createElement("select");
        // Save copy of select element to this instance for future use
        this.newBudgetListElement = select;
        // Setup select list using filtered list of resbuds
        let option;
        for (const resbud in this.getFilteredResbudList()) {
            option = document.createElement("option");
            option.value = resbud;
            option.appendChild(document.createTextNode(this.store.resbudMap[resbud]));
            this.newBudgetListElement.appendChild(option);
        }
        wrapper.appendChild(select);
        return wrapper;
    }

    /**
     * Build Table Footer (Totals) row for Summary Report
     */
    getHeaderRowForSummary() {
        let headingRow = document.createElement("thead");
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.TYPE));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.RESBUD));
        headingRow.appendChild(this.buildHeadingCell("Resbud (T)"));
        headingRow.appendChild(this.buildHeadingCell("Current Budget"));
        headingRow.appendChild(this.buildHeadingCell("New Budget"));
        headingRow.appendChild(this.buildHeadingCell("Amendment"));
        return headingRow;
    }

    /**
     * Build Table Footer row for Summary Report.
     * Shows Totals in each column
     */
    getFooterRowForSummary() {
        let row = this.store.utils.createElement("tfoot");
        row.appendChild(this.store.utils.createElement("th"));
        row.appendChild(this.store.utils.createElement("th"));
        row.appendChild(
            this.store.utils.createElement("th", {
                innerHTML: "TOTALS",
            })
        );
        // Current/Old Budget
        row.appendChild(
            this.store.utils.createElement("th", {
                innerHTML: this.calculateCurrentBudgetTotal(),
            })
        );
        // New Budget - save a copy to instance for updating in future
        this.newBudgetTotalElement = this.store.utils.createElement("th", {
            innerHTML: this.calculateNewBudgetTotal(),
        });
        row.appendChild(this.newBudgetTotalElement);
        // Difference - save a copy to instance for updating in future
        this.amendmentTotalElement = this.store.utils.createElement("th", {
            innerHTML: this.calculateAdjustmentTotal(),
        });
        row.appendChild(this.amendmentTotalElement);
        return row;
    }

    calculateCurrentBudgetTotal() {
        let total = 0;
        if (this.getType() === this.store.constants.PRICE) {
            total = this.getResbuds()
                .map(r => r.getOldBudget())
                .reduce((acc, curr) => acc + curr, 0);
        } else {
            total = this.getResbuds()
                .map(r => (r.getCode() !== "XZ90" ? r.getOldBudget() : 0))
                .reduce((acc, curr) => acc + curr, 0);
        }
        return this.store.utils.roundToTwo(total);
    }

    calculateNewBudgetTotal() {
        let total = 0;
        if (this.getType() === this.store.constants.PRICE) {
            total = this.getResbuds()
                .map(r => r.getNewBudget())
                .reduce((acc, curr) => acc + curr, 0);
        } else {
            total = this.getResbuds()
                .map(r => (r.getCode() !== "XZ90" ? r.getNewBudget() : 0))
                .reduce((acc, curr) => acc + curr, 0);
        }
        return this.store.utils.roundToTwo(total);
    }

    /**
     * Returns the total of all adjustments for this collection.
     * There is a lot of rounding being applied here to stop the NaN issue.
     */
    calculateAdjustmentTotal() {
        let total = 0;
        if (this.getType() === this.store.constants.PRICE) {
            total = this.getResbuds()
                .map(r => this.getFormattedAdjustmentTotal(r))
                .reduce((acc, curr) => acc + curr, 0);
        } else {
            total = this.getResbuds()
                .map(r => (r.getCode() !== "XZ90" ? this.getFormattedAdjustmentTotal(r) : 0))
                .reduce((acc, curr) => acc + curr, 0);
        }
        return this.store.utils.roundToTwo(total);
    }

    // Makes calculateAdjustmentTotal more readable
    getFormattedAdjustmentTotal(r) {
        let round = this.store.utils.roundToTwo;
        return round(round(r.getNewBudget()) - round(r.getOldBudget()));
    }

    /**
     * Build Table Header row for Results Report
     */
    buildResultsReportHeader() {
        let headingRow = document.createElement("thead");
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.TYPE));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.RESBUD));
        headingRow.appendChild(this.buildHeadingCell("Resbud (T)"));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.SUB_PROJECT));
        headingRow.appendChild(this.buildHeadingCell("Amendment"));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.PERIOD));
        headingRow.appendChild(this.buildHeadingCell(this.store.constants.DESCRIPTION));
        return headingRow;
    }

    /**
     * Builds and returns a <th> element
     *
     * @param {String} value - Heading string
     */
    buildHeadingCell(value) {
        return this.store.utils.createElement("th", {
            innerHTML: value,
        });
    }

    exportData() {
        let exportData = [];
        this.getResbuds().forEach(resbud => exportData.push(resbud.exportData(this.getType())));
        return exportData;
    }

    /**
     * Returns a map of Resbud Codes to Resbud Names containing only those
     * that aren't already part of the Resbud List for this Collection
     */
    getFilteredResbudList() {
        let existingCodes = this.getResbuds().map(resbud => resbud.getCode());
        let filteredList = {};

        for (let code in this.store.resbudMap)
            if (!existingCodes.includes(code)) filteredList[code] = this.store.resbudMap[code];

        return filteredList;
    }
}
