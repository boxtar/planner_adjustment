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

    constructor() {
        // Fields within each record in input (to avoid hard-coding)
        this.typeField = 'Version';
        this.resbudField = 'Resbud';
        this.fecField = 'PBFEC';
        this.priceField = 'PBPRICE';
        this.subProjectField = 'Sub-Project';
        this.descriptionField = 'Description';
        this.periodField = 'Period';

        // Other vars to avoid hard-coding
        this.reportHtmlHook = 'report';
        this.resultsHtmlHook = 'result';
        
        // Sub-project number
        this.subProject = '';
        // Description for each row - always the same
        this.description = '';
        // List of periods
        this.periods = new Set();
        // Percentage split of a Resbud's budget over the duration of project
        this.percentagesPerPeriod = [];
        // List of DataCollection's. Each collection holds a list of Resbud's
        this.collections = [];
    }

    init(input) {
        this.initialiseCollections(input);
        this.setSubProject(input[0][this.subProjectField]);
        this.setDescription(input[0][this.descriptionField]);
        this.setPeriods(input);
    }

    /**
     * Initialise data
     *
     * @param Array input - List of objects 
     * @return Void 
     */
    initialiseCollections (input) {
        console.log(input);
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
        this.subProject = sp
    }

    /**
     * Set the Description
     *
     * @param String desc 
     * @return String this.description 
     */
    setDescription(desc) {
        this.description = desc
    }

    /**
     * Set the Periods
     *
     * @param Array p 
     * @return Array this.periods 
     */
    setPeriods(input) {
        input.forEach(r => this.periods.add(r[this.periodField]));
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