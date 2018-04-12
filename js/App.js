/**
 |---------------------------------------------
 | App class
 | 
 | Imports:
 | import DataCollection from DataCollection.js
 |
 | The main class - should only be 1 instance.
 | Will hold all data and expose required
 | functionality.
 |---------------------------------------------
 */

class App {

    constructor(store) {
        // Shared store. Only give what is required to other components (Flux-like architecture)
        this.store = store
        // Sub-project number
        this.store.subProject = 'test';
        // Description for each row - always the same
        this.store.description = '';
        // List of periods
        this.store.periods = new Set();
        // Percentage split of a Resbuds budget over the duration of project
        this.store.percentagesPerPeriod = [];
        // List of DataCollection's. Each collection holds a list of Resbuds
        this.store.collections = [];
    }

    /**
     * Initialise application data and hooks
     */
    init(input) {
        this.initialiseCollections(input);
        this.setSubProject(input[0][this.store.constants.SUB_PROJECT]);
        this.setDescription(input[0][this.store.constants.DESCRIPTION]);
        this.setPeriods(input);
    }

    /**
     * Initialise collections of Resbud data
     *
     * @param Array input - List of objects 
     * @return Void 
     */
    initialiseCollections (input) {
        
        console.log(input);
        
        // Locals
        let collection;
        let collections = new Set();
        
        // Get list of DataCollections to be created by parsing input for unique values in the TYPE column
        input.forEach( record => collections.add(record[this.store.constants.TYPE]) );
        
        collections.forEach( name => {
            
            collection = new DataCollection(name, this.store.constants);
            
            collection.init( input.filter( record => record[this.store.constants.TYPE] === collection.name ) );
            
            this.store.collections.push(collection);
            
        });
    }

    /**
     * Set the Collections
     *
     * @param Array collections 
     * @return Void 
     */
    setCollections(...collections) {
        collections.forEach(c => this.collections.push(c))
    }

    /**
     * Set the Sub Project
     *
     * @param String sp 
     * @return String this.subProject 
     */
    setSubProject(sp) {
        this.store.subProject = sp
    }

    /**
     * Set the Description
     *
     * @param String desc 
     * @return String this.description 
     */
    setDescription(desc) {
        this.store.description = desc
    }

    /**
     * Set the Periods
     *
     * @param Array p 
     * @return Array this.periods 
     */
    setPeriods(input) {
        input.forEach(record => this.store.periods.add(record[this.store.constants.PERIOD]));
    }
    
    
    generateSummaryReport () {
        this.store.collections.forEach( collection => document.getElementById(this.store.htmlHooks.REPORT).appendChild(collection.generateSummaryReport()));
        
    }

    renderInputReport() {
        let output = [];
        this.collections.forEach(collection => {
            output.push('<h3>', collection.name, ' Summary</h3>');
            output.push('<table>');
            output.push(this.getTableHeadingMarkup());
            collection.data.forEach(resbud => {
                output.push(this.getTableRowMarkup(
                    collection.name, 
                    resbud.name,
                    resbud.oldBudget.total,
                    resbud.newBudget.total
                ));
            });
            output.push('</table>');

            // Push Markup for adding a new Resbud
            output.push(this.getNewRowMarkup(collection.name));

            // inject the HTML
            this.setHtmlUsingId(this.reportHtmlHook, output.join(''));
        });
    }

    renderResults() {
        //
    }

    getTableHeadingMarkup() {
        let output = [];
        output.push('<tr>');
        output.push('<th>', 'Version', '</th>');
        output.push('<th>', 'Resbud', '</th>');
        output.push('<th>', 'Current Budget', '</th>');
        output.push('<th>', 'New Budget', '</th>');
        output.push('<th>', 'Change', '</th>');
        output.push('</tr>');
        return output.join('');
    }

    getNewRowMarkup(type) {
        let output = [];
        output.push(`<div id="${type.toLowerCase()}-new-row">`);
        output.push('<table>');
        output.push(this.getTableRowMarkup(type, '', 0, 0));
        output.push('</table>');
        output.push(`<p data-type="${type.toLowerCase()}">`, 'Add New Resbud', '</p>');
        output.push('</div>');
        return output.join('');
    }

    getTableRowMarkup(type, resbud, currentBudget, newBudget) {
        let output = [];
        output.push('<tr>');
        output.push('<td>', type, '</td>');
        output.push('<td>', resbud, '</td>');
        output.push('<td ' + redIfNegative(currentBudget) + '>', currentBudget, '</td>');
        output.push('<td class="newBudgetInput">', '<input type="number" id="', resbud, '" value="', newBudget, '">', '</td>');
        output.push('<td>', newBudget - currentBudget, '</td>');
        output.push('</tr>');
        return output.join('');
    }

    setHtmlUsingId(id, html = '') {
        document.getElementById(id).innerHTML = html;
    }

    appendToHtmlUsingId(id, html = '') {
        document.getElementById(id).innerHTML += html;
    }

};