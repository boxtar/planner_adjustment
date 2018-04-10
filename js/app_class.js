/**
 |---------------------------------------------
 | App class
 |
 | The main class - should only be 1 instance.
 | Will hold all data and expose required
 | functionality.
 |---------------------------------------------
 */

class App {
    
    constructor (reportHtmlHook = '', resultsHtmlHook = '') {
        this.subProject = '';
        this.description = '';
        this.periods = [];
        this.percentagesPerPeriod = [];
        this.collections = [];
        this.reportHtmlHook = reportHtmlHook;
        this.resultsHtmlHook = resultsHtmlHook;
    }
    
    /**
     * Set the Collections
     *
     * @param Array collections 
     * @return Void 
     */
    setCollections (collections) {
        collections.forEach( c => this.collections.push( c ) )
    }
    
    /**
     * Set the Sub Project
     *
     * @param String sp 
     * @return String this.subProject 
     */    
    setSubProject (sp) { this.subProject = sp }
    
    /**
     * Set the Description
     *
     * @param String desc 
     * @return String this.description 
     */   
    setDescription (desc) { this.description = desc }
    
    /**
     * Set the Periods
     *
     * @param Array p 
     * @return Array this.periods 
     */   
    setPeriods (p) { this.periods = [...p] }
    
    renderInputReport () {
        
        let output = [];
        
        this.collections.forEach( collection => {
            output.push('<h3>', collection.name, ' Summary</h3>');
            output.push('<table>');
            
            collection.data.forEach( resbud => {
                output.push('<tr>');
                output.push('<td>', collection.name, '</td>');
                output.push('<td>', resbud.name, '</td>');
                output.push('<td ' + redIfNegative(resbud.oldBudget.total) + '>', resbud.oldBudget.total, '</td>');
                output.push('<td class="newBudgetInput">', '<input type="number" id="', resbud.name, '" value="', resbud.newBudget.total, '">', '</td>');
                output.push('</tr>');
            });
            
            output.push('</table>');
            
            this.setHtmlUsingId(this.reportHtmlHook, output.join(''));
        });
        
        
    }
    
    renderResults () {
        //
    }
    
    setHtmlUsingId (id, html = '') {
        document.getElementById(id).innerHTML = html;
    }
    
    appendToHtmlUsingId (id, html = '') {
        document.getElementById(id).innerHTML += html;
    }
    
};