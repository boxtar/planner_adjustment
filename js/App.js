/**
 * App class by Johnpaul McMahon
 * 
 * There should only be 1 instance of this class.
 * It will receive a store object from instantiator
 * and will control the displaying and updating of all
 * data.
 * 
 * Imports:
 * import DataCollection from DataCollection.js
 */

class App {

    /**
     * 
     * @param {Object} store
     */
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
     * Initialise App and setup Collections of Resbuds
     * 
     * @param {Array} input
     */
    init(input) {
        this.setSubProject(input[0][this.store.constants.SUB_PROJECT]);
        this.setDescription(input[0][this.store.constants.DESCRIPTION]);
        this.setPeriods(input);
        this.initialiseCollections(input);
    }

    /**
     * Initialise Collections of Resbud objects
     *
     * @param {Array} input - List of objects 
     */
    initialiseCollections(input) {
        let collection;
        let collections = new Set();

        // Get list of DataCollections to be created by parsing input for unique values in the TYPE column
        input.forEach(record => collections.add(record[this.store.constants.TYPE]));

        collections.forEach(name => {
            collection = new DataCollection(name, this.getMonthlyDuration(), {
                ...this.store,
                subProject: this.store.subProject,
                description: this.store.description,
                periods: [...this.store.periods],
            });
            collection.init(input.filter(record => record[this.store.constants.TYPE] === collection.getType()));
            this.store.collections.push(collection);
        });
    }

    /**
     * Set the Sub Project
     *
     * @param {String} sp 
     */
    setSubProject(sp) {
        this.store.subProject = sp
    }

    /**
     * Set the Description
     *
     * @param {String} desc
     */
    setDescription(desc) {
        this.store.description = desc
    }

    /**
     * Set the Periods
     *
     * @param {Array} input - Array of data to be scanned for unique period values 
     * @return Array this.periods 
     */
    setPeriods(input) {
        input.forEach(record => this.store.periods.add(record[this.store.constants.PERIOD]));
    }

    /**
     * Returns array of DataCollection objects
     */
    getCollections() {
        return this.store.collections
    }

    /**
     * Use the size of the period list Set to get duration in months.
     * Will be correct if at least one of the existing Resbuds contains
     * amounts in all periods of the project.
     */
    getMonthlyDuration() {
        return this.store.periods.size;
    }

    /**
     * Kick starts the process of calculating the amendment results
     * and displays the results
     */
    calculateResults() {
        this.getCollections().forEach(
            collection => collection.calculateResults()
        );
        this.buildResultsReport().scrollIntoView();
    }

    /**
     * Creates and injects Summary Report Element to DOM
     */
    buildSummaryReport() {
        
        // Get Parent element
        let reportContainer = document.getElementById(this.store.htmlHooks.REPORT);
        
        // Re-used box element (gets re-assigned multiple times)
        let box = this.store.utils.createElement('div', {
            className: 'box'
        });
        
        // Add box to container
        reportContainer.appendChild(box);
        
        // Add field to display sub-project
        box.appendChild(this.buildSubProjectField());

        // Add field to display duration
        box.appendChild(this.buildDurationField());

        // Add field to display first period
        box.appendChild(this.buildFirstPeriodField());
        
        // Add page refresh button
        box.appendChild(this.buildReloadButton());

        // Add table with data for each DataCollection
        // this.store.collections.forEach(collection => {
            // reportContainer.appendChild(collection.buildSummaryReport());
        // });
        // this.store.collections.forEach(collection => collectionReports.push(collection.buildSummaryReport()));
        this.store.collections.forEach(collection => {
            
            box = this.store.utils.createElement('div', { className: 'box' });
            box.appendChild(collection.buildSummaryReport());
            reportContainer.appendChild(box);
        });

        // Add button with event for calculating results
        let getResultsButton = this.store.utils.createElement('button', {
            innerHTML: 'Fetch Results',
            id: 'get-results-button',
            className: 'button is-info',
        });
        getResultsButton.onclick = () => this.calculateResults();
        
        box = this.store.utils.createElement('div', { className: 'box' });
        box.appendChild(getResultsButton);

        // Add the button to container element
        reportContainer.appendChild(box);
    }
    
    buildResultsReport() {
        // Get handle to results DOM node
        let container = document.getElementById(this.store.htmlHooks.OUTPUT);
        
        // Box container 
        let box = this.store.utils.createElement('div', { className: 'box' });
        
        // Clear all elements from container (start fresh)
        this.store.utils.removeAllChildren(container);
        
        box.appendChild(
            this.store.utils.createElement('h2', {
                innerHTML: 'Results:',
                className: 'title is-3'
            })
        );
        
        // Build out results for each Collection
        this.getCollections().forEach(collection => box.appendChild(collection.buildResultsReport()));
        
        container.appendChild(box);
        
        return container;
    }

    /**
     * Returns DOM Element containing sub-project number
     * 
     * @return {Element}
     */
    buildSubProjectField() {
        return this.store.utils.createElement('h3', {
            innerHTML: `<span class="has-text-weight-semibold">Sub-Project:</span> ${this.store.subProject}`,
            style: 'margin: 3px',
        });
    }

    /**
     * Returns DOM Element containing duration in months
     * 
     * @return {Element}
     */
    buildDurationField() {
        return this.store.utils.createElement('h3', {
            innerHTML: `<span class="has-text-weight-semibold">Duration:</span> ${this.getMonthlyDuration()} months`,
            style: 'margin: 3px',
        });
    }

    /**
     * Returns DOM Element containing the first period
     * 
     * @return {Element}
     */
    buildFirstPeriodField() {
        return this.store.utils.createElement('h3', {
            innerHTML: `<span class="has-text-weight-semibold">First Period:</span> ${[...this.store.periods][0]}`,
            style: 'margin: 3px',
        });
    }
    
    buildReloadButton() {
        let button = this.store.utils.createElement('button', { innerHTML: 'Restart', className: 'button is-danger is-outlined' });
        button.onclick = e => location.reload();
        return button;
    }
};