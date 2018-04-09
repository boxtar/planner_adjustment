/**
 |--------------------------------------------------
 | Johnpaul McMahon
 | Planner Adjustment Script
 |--------------------------------------------------
 */

const TYPE = 'Version';
const FEC = 'PBFEC';
const PRICE = 'PBPRICE';
const RESBUD = 'Resbud';
const NEW_BUDGET = 'PCB Budget';
const CURR_AMOUNT = 'Curr. amount';
const SUB_PROJECT = 'Sub-Project';
const DESCRIPTION = 'Description';
const PERIOD = 'Period';


/**
 |------------------------------------
 | DataCollection class 
 |------------------------------------
 */

class DataCollection {
    
    constructor (name) {
        this.name = name;
        this.data = [];
        this.split = [];
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
                // No entries means new Resbud encountered. Instantiate and push to Collection
                resbud = new Resbud(record[RESBUD]);
                this.data.push(resbud);
            }
            
            resbud.pushOldBudget(record[CURR_AMOUNT]);
            
            // If there is a new budget amount on this record and new budget hasn't already been
            // set for this resbud then set it.
            if ( record[NEW_BUDGET] !== 0 && resbud.newBudget.total === 0 )
                resbud.setNewBudget(record[NEW_BUDGET]);

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
        this.oldBudget.data.push(amount)
        this.oldBudget.total += amount
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
};



/**
 |------------------------------------
 | Program entry point
 |------------------------------------
 */

try {
        
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        
        // When a file is chosen, the process kicks off from handleFileSelect function
        document.getElementById('dataInput').addEventListener('change', handleFileSelect, false);
    } else {
        
        throw "File API not supported by your browser <i>(Google Chrome is the best)</i>";
    }
    
} catch (err) {
    document.getElementById('app').innerHTML = "<div style=\"color: red\"><h2>ERROR: </h2><h4>" + err + "</h4></div>";
    console.error(err);
}


/**
 |---------------------
 | Functions
 |---------------------
 */
 
function handleFileSelect(e) {
    
    // Reset HTML hooks
    document.getElementById('report').innerHTML = '';
    document.getElementById('output').innerHTML = '';
    document.getElementById('status').innerHTML = '';
    
    let files = e.target.files; // FileList object
    
    if (files.length > 0) {
        
        console.log('We got stuff');
        
        // Use Papa to parse CSV file:
        let data = Papa.parse(files[0], {
            complete: (results, file) => startProcessing(results),
            skipEmptyLines: true,
            header: true,
            dynamicTyping: true
        });
    } else {
        console.log('We don\'t got stuff');
        document.getElementById('status').innerHTML += '<p>No file chosen</p>';
    }
        
    
    
}


function startProcessing(input) {
    
    try {
        
        // Setup master data source.
        // One property for FEC and one for PRICE.
        // Each property will be an array of records from the input.
        let data = {};
        data[FEC] = [];
        data[PRICE] = [];
        
        // Add each record to correct property within data object:
        input.data.forEach( record => {
            data[record[TYPE]].push(record);
        });
        
        // Values that don't change between Collections or Resbuds - Save Once, Use Many:
        let subProject = '';
        let description = '';
        let periods = new Set();
        let percentagesPerPeriod = [];

        // Setup new Collections for FEC and PRICE Types/Versions:
        let fecData = new DataCollection(FEC);
        let priceData = new DataCollection(PRICE);
        
        // Shove above collections into an array so can be looped over to DRY up source a bit
        let dataCollections = [fecData, priceData];
        
        // Initialise the Collections with the appropriate data:
        dataCollections.forEach( collection => collection.initialise(data[collection.name]) );
        
        
        
        console.log(dataCollections);
        
        
        let reportOutput = [];
        
        dataCollections.forEach( collection => {
            
            reportOutput.push('<h3>', collection.name, ' Summary</h3>');
            
            reportOutput.push('<table>');
            
            collection.data.forEach( resbud => {
                
                reportOutput.push('<tr>');
                reportOutput.push('<td>', collection.name, '</td>');
                reportOutput.push('<td>', resbud.name, '</td>');
                reportOutput.push('<td ' + redIfNegative(resbud.oldBudget.total) + '>', resbud.oldBudget.total, '</td>');
                reportOutput.push('<td>', '<input type="number" id="', resbud.name, '" value="', resbud.newBudget.total, '" ' + redIfNegative(resbud.newBudget.total) + '>', '</td>');
                reportOutput.push('</tr>');
                
                
                document.getElementById('report').innerHTML += collection.name + ' | ' + resbud.name + ' | ' + resbud.oldBudget.total + ' | ' +  '<input type="number" id="' + resbud.name + '" value="'+ resbud.newBudget.total +'">' + ' | ' + resbud.budgetDifference + '<br/>';
            });
            
            reportOutput.push('</table>');
        });
        
        console.log(reportOutput);
        document.getElementById('report').innerHTML = reportOutput.join('');
        
        
        let sourceData = false;
        if ( fecData.data.length > 0) sourceData = FEC;
        else if ( priceData.data.length > 0 ) sourceData = PRICE;
        else throw "Need to get Subproject and stuff from user";
            
        
        // Save Sub-Project and Description
        subProject = data[FEC][0][SUB_PROJECT];
        description = data[FEC][0][DESCRIPTION];
        
        // Save periods as a Set to avoid duplicates
        data[FEC].forEach(record => {
            periods.add(record[PERIOD]);
        });
        
        
        // Figures out the amendments to be posted each period
        fecData.processAmendmentAmounts();
        priceData.processAmendmentAmounts();

        let output = collectionToString(fecData, subProject, description, periods);
        output += collectionToString(priceData, subProject, description, periods);
        
        // Render to HTML
        document.getElementById('output').innerHTML = '<h1>Result</h1>';
        document.getElementById('output').innerHTML += output
    }
    catch (err) {
        document.getElementById('app').innerHTML = "<div style=\"color: red\"><h2>ERROR: </h2><h4>" + err + "</h4></div>";
        console.error(err);
    }
}


// Invokes resbudToString for each Resbud in given Collection
function collectionToString(collection, subProject, description, periods) {
    let output = collection.data.map(resbud => resbudToString(resbud, collection.name, subProject, description, periods));

    return output.join('');
}

function resbudToString(resbud, type, subProject, description, periods) {
    // Quick error checks
    let noOfAmendments = resbud.newBudget.data.length;
    if ( noOfAmendments !== 0 && noOfAmendments !== periods.size ) {
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
    if ( parseInt(number) < 0 )
        return 'style="color: red"';
    return '';
}
