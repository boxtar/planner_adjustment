/**
 * Johnpaul McMahon
 * Planner Adjustment helper script
 * 
 * Imports:
 * import App from App.js
 * 
 */


// Entry point
(function(){

    // Immutable store of shared read-only data
    const store = Object.freeze({
        constants: Object.freeze({
            TYPE:'Version',
            FEC:'PBFEC',
            PRICE:'PBPRICE',
            RESBUD:'Resbud',
            NEW_BUDGET:'PCB Budget',
            CURR_AMOUNT:'Curr. amount',
            SUB_PROJECT:'Sub-Project',
            DESCRIPTION:'Description',
            PERIOD:'Period',
        }),
        htmlHooks: Object.freeze({
            FILE_INPUT: 'dataInput',
            NO_FILE: 'noFile',
            INITIAL_CONTROLS: 'initialControls',
            REPORT: 'report',
            RESULT: 'result',
            STATUS: 'status',
            OUTPUT: 'output',
        }),
    });

    try {

        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {

            // When a file is chosen, the process kicks off from handleFileSelect function
            document.getElementById(store.htmlHooks.FILE_INPUT).addEventListener('change', getFileSelectedHander(store), false);

            // Or if user doesn't have a file, display empty report table so user can add manually
            document.getElementById(store.htmlHooks.NO_FILE).addEventListener('click', startProcessing, false);

        } else {

            throw "File API not supported by your browser <i>(Google Chrome is the best)</i>";
        }

    } catch (err) {
        document.getElementById('app').innerHTML = "<div style=\"color: red\"><h2>ERROR: </h2><h4>" + err + "</h4></div>";
        console.error(err);
    }

}());

// function handleReportClick(e) {
//     if (e.target.dataset.type == FEC.toLowerCase()) {
//         console.log('New PBFEC Row');
//     } else if (e.target.dataset.type == PRICE.toLowerCase()) {
//         console.log('New PBPRICE Row');
//     }
// }

// function handleReportKeyDown(e) {
//     let keyCode = e.keyCode || e.which;
//     if (keyCode === 13) {
//         console.log('Enter key pressed');
//         return false;
//     }
//     return true;
// }


/**
 |--------------------------------------------------
 | Callback used when user selects an input file.
 | Kick starts the process
 |--------------------------------------------------
 */

 function getFileSelectedHander(store) {
     return e => {
         // Reset HTML hooks
         document.getElementById(store.htmlHooks.REPORT).innerHTML = '';
         document.getElementById(store.htmlHooks.OUTPUT).innerHTML = '';
         document.getElementById(store.htmlHooks.STATUS).innerHTML = '';

         let files = e.target.files; // FileList object

         if (files.length > 0) {
             // Use Papa to parse CSV file:
             let data = Papa.parse(files[0], {
                 complete: (results, file) => startProcessing(results.data),
                 skipEmptyLines: true,
                 header: true,
                 dynamicTyping: true
             });
         } else {
             document.getElementById('status').innerHTML += '<p>No file chosen</p>';
         }
     };
 };

// function handleFileSelect(e) {
//     // Reset HTML hooks
//     document.getElementById('report').innerHTML = '';
//     document.getElementById('output').innerHTML = '';
//     document.getElementById('status').innerHTML = '';

//     let files = e.target.files; // FileList object

//     if (files.length > 0) {
//         // Use Papa to parse CSV file:
//         let data = Papa.parse(files[0], {
//             complete: (results, file) => startProcessing(results.data),
//             skipEmptyLines: true,
//             header: true,
//             dynamicTyping: true
//         });
//     } else {
//         document.getElementById('status').innerHTML += '<p>No file chosen</p>';
//     }

// }

/**
 |--------------------------------------------
 | Process input file which contains the 
 | current planner budgets that require
 | amending.
 |
 | input.data is an array of objects. Each 
 | object is a record/row in the input file.
 | The column heading is the key for each
 | value within the record.
 |--------------------------------------------
 */
function startProcessing(input) {

    document.getElementById(INITIAL_CONTROLS).style.display = "none";
    
    // filter out summary/blank rows
    let data = input.filter(row => row[PERIOD] != false);

    // Instantiate new App instance
    let app = new App();
    app.init(data);
    console.log(app);

    // app.setCollections(new DataCollection(FEC), new DataCollection(PRICE));
    

    // if (input.length > 0) {

    //     try {

    //         // Setup master data source.
    //         // One property for FEC and one for PRICE.
    //         // Each property will be an array of records from the input.
    //         // let data = {};
    //         // data[FEC] = [];
    //         // data[PRICE] = [];


    //         // Add each record from input file to correct property within data object:
    //         input.forEach(record => {
    //             data[record[TYPE]].push(record);
    //         });

    //         // Set Sub Project number
    //         app.setSubProject(data[FEC][0][SUB_PROJECT]);

    //         // Set Description (always the same)
    //         app.setDescription(data[FEC][0][DESCRIPTION]);

    //         // Set Periods - Use a Set to avoid duplicates
    //         let periods = new Set();

    //         data[FEC].forEach(record => {
    //             periods.add(record[PERIOD]);
    //         });

    //         app.setPeriods(periods);

    //         // // Set Collections of data
    //         // let dataCollections = [new DataCollection(FEC), new DataCollection(PRICE)];

    //         // Initialise the collections
    //         // dataCollections.forEach(collection => collection.initialise(data[collection.name]));

    //         app.collections.forEach(collection => collection.initialise(data[collection.name]));

    //         // app.setCollections(dataCollections);

            


    //         // Render out results
    //         // // Figures out the amendments to be posted each period
    //         // fecData.processAmendmentAmounts();
    //         // priceData.processAmendmentAmounts();

    //         // let output = collectionToString(fecData, subProject, description, periods);
    //         // output += collectionToString(priceData, subProject, description, periods);

    //         // // Render to HTML
    //         // document.getElementById('output').innerHTML = '<h1>Result</h1>';
    //         // document.getElementById('output').innerHTML += output

    //     } catch (err) {
    //         document.getElementById('app').innerHTML = "<div style=\"color: red\"><h2>ERROR: </h2><h4>" + err + "</h4></div>";
    //         console.error(err);
    //     }

    // }

    // // Render out report for review/amending
    // app.renderInputReport();


}


// Invokes resbudToString for each Resbud in given Collection
function collectionToString(collection, subProject, description, periods) {
    let output = collection.data.map(resbud => resbudToString(resbud, collection.name, subProject, description, periods));

    return output.join('');
}

function resbudToString(resbud, type, subProject, description, periods) {
    // Quick error checks
    let noOfAmendments = resbud.newBudget.data.length;
    if (noOfAmendments !== 0 && noOfAmendments !== periods.size) {
        console.error(noOfAmendments, '!==', periods.size);
        throw "resbudToString: resbud.newBudget.data.length !== periods.length<br/>Tell JPM to investigate.";
    }

    let output = [];
    let resbudCode = resbud.name;
    let resbudAmendments = resbud.newBudget.data

    for (let i = 0; i < noOfAmendments; i++) {
        output.push('<tr>');
        output.push('<td>', type, '</td>');
        output.push('<td>', resbudCode, '</td>');
        output.push('<td>', subProject, '</td>');
        output.push('<td>', resbudAmendments[i], '</td>');
        output.push('<td>', [...periods][i], '</td>');
        output.push('<td>', description, '</td>');
        output.push('</tr>');
    }

    return output.join('');
}

// Returns inline style string to color text red if given integer is less than 0
function redIfNegative(number) {
    if (parseInt(number) < 0)
        return 'style="color: red"';
    return '';
}