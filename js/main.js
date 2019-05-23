/**
 * Johnpaul McMahon
 * Planner Adjustment helper script
 *
 * Imports:
 * import App from App.js
 *
 */

// Entry point
(function() {
    /**
     * Shared store object.
     *
     * Will be controlled by App class which will pass
     * only what is required from the store to other
     * objects. This will allow the App class to
     * control the updating of the store.
     */
    const store = {
        constants: Object.freeze({
            TYPE: "Version",
            FEC_BUDGET_TYPES: ["PBFEC", "IBFEC"],
            PRICE_BUDGET_TYPES: ["PBPRICE", "IBPRICE"],
            RESBUD: "Resbud",
            NEW_BUDGET: "PCB Budget",
            GBP_AMOUNT: "Amount",
            CURR_AMOUNT: "Curr. amount",
            SUB_PROJECT: "Sub-Project",
            DESCRIPTION: "Description",
            PERIOD: "Period",
            BUDGET_CHANGE_EVENT: "newBudgetChanged",
        }),
        htmlHooks: Object.freeze({
            APP: "app",
            FILE_INPUT: "dataInput",
            NO_FILE: "noFile",
            INITIAL_CONTROLS: "initialControls",
            REPORT: "report",
            RESULT: "result",
            STATUS: "status",
            OUTPUT: "output",
        }),
        resbudMap: Object.freeze({
            XI10: "Animals",
            XU10: "Consumables",
            XP10: "Contingencies",
            XU11: "DA Consumables",
            XE11: "DA Equipment Maintenance",
            XE10: "Equipment",
            XF10: "Equipment Large Capital",
            XZ11: "Estates Costs",
            XQ10: "Exceptional Items",
            XZ90: "Income",
            XZ10: "Indirects",
            XS10: "Market Assessment",
            XW10: "Others",
            XJ10: "Patents",
            XA10: "Salaries - Clinical Academic",
            XA19: "Salary Recoups - Clinical",
            XA20: "Salaries - Research",
            XA29: "Salary Recoups - Research",
            XA30: "Salaries - Technical & Related",
            XA39: "Salary Recoups - Technical & Related",
            XA40: "Salaries - Modernisation of Pay",
            XA49: "Salary Recoups - Modernisation of Pay",
            XA50: "Salaries - Administrative",
            XA59: "Salary Recoups - Administrative",
            XA60: "Salaries - Others",
            XA69: "Salary Recoups - Others",
            XK10: "Sponsored Refurbishment",
            XG10: "Studentships",
            XT10: "Student Matric Fees",
            XR10: "Subcontract Costs",
            XZ12: "Technician Infrastructure Costs",
            XN10: "Travel Overseas",
            XM10: "Travel UK",
        }),
        utils: Object.freeze({
            createElement: (element, options = {}) => {
                element = document.createElement(element);
                Object.keys(options).forEach(option => {
                    element[option] = options[option];
                });
                return element;
            },
            removeAllChildren: element => {
                while (element.firstChild) element.removeChild(element.firstChild);
            },
            roundToTwo(num) {
                // see https://stackoverflow.com/a/18358056
                return +(Math.round(num + "e+2") + "e-2");
            },
        }),
    };

    try {
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // When a file is chosen, the process kicks off from handleFileSelect function
            document
                .getElementById(store.htmlHooks.FILE_INPUT)
                .addEventListener("change", getFileSelectedHandler(store), false);

            // Or if user doesn't have a file, display empty report table so user can add manually
            // document.getElementById(store.htmlHooks.NO_FILE).addEventListener('click', e => startProcessing([], store), false);
        } else {
            throw "File API not supported by your browser <i>(Google Chrome is the best)</i>";
        }
    } catch (err) {
        document.getElementById("app").innerHTML =
            '<div style="color: red"><h2>ERROR: </h2><h4>' + err + "</h4></div>";
        console.error(err);
    }
})();

/**
 |--------------------------------------------------
 | Callback used when user selects an input file.
 | Kick starts the process
 |--------------------------------------------------
 */

function getFileSelectedHandler(store) {
    return e => {
        let files = e.target.files; // FileList object
        if (files.length > 0) {
            // Use Papa to parse CSV file:
            let data = Papa.parse(files[0], {
                complete: (results, file) => startProcessing(results.data, store),
                skipEmptyLines: true,
                header: true,
                dynamicTyping: true,
            });
        } else {
            document.getElementById(store.constants.STATUS).innerHTML += "<p>No file chosen</p>";
        }
    };
}

/**
 |--------------------------------------------
 | Process input file which contains the 
 | current planner budgets that require
 | amending.
 |
 | input is an array of objects. Each 
 | object is a record/row in the input file.
 | The column heading is the key for each
 | value within the record.
 |--------------------------------------------
 */
function startProcessing(input, store) {
    document.getElementById(store.htmlHooks.INITIAL_CONTROLS).style.display = "none";

    if (input.length > 0) {
        try {
            // filter out summary/blank rows
            let data = input.filter(row => row[store.constants.PERIOD] != false);

            // Check for empty input which would mean no budgets in planner
            if (data.length === 0) throw "No budgets. Use RSO - 'RESBUD Costs per Period' enquiry";

            // Instantiate new App instance
            let app = new App(store);

            // Initialise App with the parsed data
            app.init(data);

            /**
             * Renders initial report for user to input new budgets
             * This also sets up the event for the user to
             * confirm new budgets and process results.
             */
            app.buildSummaryReport();
        } catch (err) {
            document.getElementById(store.htmlHooks.APP).innerHTML =
                '<div style="color: red"><h2>ERROR: </h2><h4>' + err + "</h4></div>";

            console.error(err);
        }
    }
}
