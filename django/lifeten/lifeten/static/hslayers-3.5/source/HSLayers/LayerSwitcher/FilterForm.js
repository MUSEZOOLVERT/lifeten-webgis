/* Copyright (c) 2011 Help Service - Remote Sensing s.r.o.
 * Author(s): Michal Sredl <sredl ccss cz>
 *
 * This file is part of HSLayers.
 *
 * HSLayers is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * HSLayers is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 *  See http://www.gnu.org/licenses/gpl.html for the full text of the 
 *  license.
 */
HSLayers.namespace("HSLayers.LayerSwitcher");

/* Form with the FES filter

Current approach - every wfs layer has its own OL.filter.
We construct the dropdown lists based on this filter.
Then we update the filter of the layer as appropriate.

Possible future approach - create hsfilter, which will inherit from ext, and will be able to draw itself.
The point is, that this way we can easily draw any fes expression using the recursion of the fes grammer.
Here we would only call the draw() method of the "root" filter.
question - if we hook a callback function on the dropdown list, then when the callback function is called, 
is it the function of the particular INSTANTION that created the hook?

*/
HSLayers.LayerSwitcher.FilterForm = function(config) {

    // ******** config processing ********

    config = config || {};

    // Save the callee info for future use
    this.layer = config.layer;
    this.window = config.window;

    // Title
    // this.title = "Comparison Filter";

    // The stuff bellow may be moved to initComponent()

    // Process comparison operators list
    this.comparisonOperators = this.getComparisonOperators(config.layer.filterCapabilities);

    // Have a look for saved values
    if (config.filter) {
        this.savedPropertyName = config.filter.property;
        this.savedOperator = config.filter.type;
        this.savedValue = config.filter.value;
    }
    if (!this.savedOperator) {
        this.savedOperator = this.comparisonOperators[0];
    }

    // ********** Combo Boxes ***********

    // Property name
    var propertyData = [];
    for (i=0; i<config.layer.properties.length; ++i) {
        propertyData.push(config.layer.properties[i].name);
    }
    this.propertyNameCB = new Ext.form.ComboBox({
        value: this.savedPropertyName,
        typeAhead: true,
        triggerAction: 'all',
        mode: "local",
        width: 200,
        listWidth: 300,
        emptyText: 'Selet a property...',
        store: propertyData
    });

    // Comparison operator
    this.operatorCB = new Ext.form.ComboBox({
        value: this.savedOperator,
        typeAhead: true,
        triggerAction: 'all',
        mode: "local",
        width: 50,
        listWidth: 50,
        store: this.comparisonOperators
    });

    // Value
    this.valueTF = new Ext.form.TextField({
        value: this.savedValue,
        emptyText: 'Type in the value...',
        width: 200
    });

    // Composite field holds them all
    this.comparisonFilterCF = new Ext.form.CompositeField({
        // labelWidth: 200,
        fieldLabel: 'Comparison Filter',
        items: [this.propertyNameCB, this.operatorCB, this.valueTF]
    });

    // *************** Items **************

    this.items = [this.comparisonFilterCF];

    // ************** Buttons *************
    
    // OK
    this.okButton = new Ext.Button({
        text: OpenLayers.i18n('OK'),
        scope: this,
        handler: this.onOkButtonClickedFes,
        disabled: false
    });

    // Apply
    this.applyButton = new Ext.Button({
        text: OpenLayers.i18n('Apply'),
        scope: this,
        handler: this.onApplyButtonClickedFes,
        disabled: false
    });

    // Cancel
    this.cancelButton = new Ext.Button({
        text: OpenLayers.i18n('Cancel'),
        scope: this,
        handler: this.onCancelButtonClicked,
        disabled: false
    });

    // Buttons
    this.buttons = [
        this.cancelButton,
        this.applyButton,
        this.okButton
    ];

    // *************************************

    HSLayers.LayerSwitcher.FilterForm.superclass.constructor.call(this,config);
};

Ext.extend(HSLayers.LayerSwitcher.FilterForm, Ext.form.FormPanel, { 

    /**
     * Layer to filter.
     *
     * @name HSLayers.LayerSwitcher.FilterForm.layer
     * @type should be {HSLayers.Layer.WFS}
     */
    layer: null,

    /**
     * Window where the form is displayed
     *
     * @name HSLayers.LayerSwitcher.FilterForm.window
     * @type {Ext.Window}
     */
    window: null,

    /**
     * Supported comparison operators.
     * Array of strings defined in OpenLayers.Filter.Comparison.
     *
     * @name HSLayers.LayerSwitcher.FilterForm.comparisonOperators
     * @type {Array} of {String}
     */
    comparisonOperators: null,

    /**
     * Property name which was selected by the user last time 
     * and saved in the filter. Default value to start with.
     *
     * @name HSLayers.LayerSwitcher.FilterForm.savedPropertyName
     * @type {String}
     */
    savedPropertyName: null,

    /**
     * An operator which was selected by the user last time 
     * and saved in the filter. Default value to start with.
     * 
     * @name HSLayers.LayerSwitcher.FilterForm.savedOperator
     * @type {String}
     */
    savedOperator: null,    

    /**
     * Desired value which was typed in by the user last time 
     * and saved in the filter. Default value to start with.
     * 
     * @name HSLayers.LayerSwitcher.FilterForm.savedValue
     * @type {String}
     */
    savedValue: null,

    /**
     * Combo box with property name
     *
     * @name HSLayers.LayerSwitcher.FilterForm.propertyNameCB
     * @type {Ext.form.ComboBox}
     */
    propertyNameCB: null,

    /**
     * Combo box with comparison operator
     *
     * @name HSLayers.LayerSwitcher.FilterForm.operatorCB
     * @type {Ext.form.ComboBox}
     */
    operatorCB: null,

    /**
     * Text field for the desired value of the property
     *
     * @name HSLayers.LayerSwitcher.FilterForm.valueTF
     * @type {Ext.form.TextField}
     */
    valueTF: null,

    /**
     * Composite field with property name, operator and value combo boxes
     *
     * @name HSLayers.LayerSwitcher.FilterForm.comparisonFilterCF
     * @type {Ext.form.CompositeField} 
     */
    comparisonFilterCF: null,

    /**
     * OK button. Create and apply the filter and hide the filter window.
     * 
     * @name HSLayers.LayerSwitcher.FilterForm.okButton
     * @type Ext.Button 
     */
    okButton: null,

    /**
     * Apply button. Create and apply the filter.
     * 
     * @name HSLayers.LayerSwitcher.FilterForm.applyButton
     * @type Ext.Button 
     */
    applyButton: null,

    /**
     * Cancel button. Hide the window.
     *
     * @name HSLayers.LayerSwitcher.FilterForm.cancelButton
     * @type Ext.Button
     */
    cancelButton: null,

    /**
     * Transform the comparison operators from filterCapabilities object
     * (which bears the values parsed out from the Capabilities xml)
     * to an array of the strings defined in OpenLayers.Filter.Comparison.
     *
     * Works with WFS 1.1.0 (1.0.0 is different and not implemented here)
     * 
     * @name HSLayers.LayerSwitcher.FilterForm.getComparisonOperators
     * @function
     * @param {Object} Filter capabilites as parsed by (patched) OpenLayers.Format.WFSCapabilities.v1_1_0
     * @return {Array} of {String}
     */
    getComparisonOperators: function(filterCapabilities) {

        if(this.layer.version=="1.1" ||this.layer.version=="1.1.0") {
            return this.getComparisonOperators110(filterCapabilities);
        }
        if(this.layer.version=="1.0" ||this.layer.version=="1.0.0") {
            return this.getComparisonOperators100(filterCapabilities);
        }
    },

    getComparisonOperators110: function(filterCapabilities) {
        var result = [];
        var inArray = filterCapabilities.scalarCapabilities.comparisonOperators.operators;

        for (var i=0; i<inArray.length; i++) {
            switch (inArray[i]) {
                case "LessThan":
                    result.push(OpenLayers.Filter.Comparison.LESS_THAN);
                    break;
                case "GreaterThan":
                    result.push(OpenLayers.Filter.Comparison.GREATER_THAN);
                    break;
                case "LessThanEqualTo":
                    result.push(OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO);
                    break;
                case "GreaterThanEqualTo":
                    result.push(OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO);
                    break;
                case "EqualTo":
                    result.push(OpenLayers.Filter.Comparison.EQUAL_TO);
                    break;
                case "NotEqualTo":
                    result.push(OpenLayers.Filter.Comparison.NOT_EQUAL_TO);
                    break;
                case "Like":
                    result.push(OpenLayers.Filter.Comparison.LIKE);
                    break;
                // todo - needs 2 values
                // case "Between": 
                //    result.push(OpenLayers.Filter.Comparison.BETWEEN);
                //    break;
                // todo - missing in OL.Filter
                // case "NullCheck":
                //     result.push();
                //     break;

            } // switch       
        } // for

        return result;
    },

    getComparisonOperators100: function(filterCapabilities) {
        var result = [];
        var inArray = filterCapabilities.scalarCapabilities.comparisonOperators.operators;

        for (var i=0; i<inArray.length; i++) {
            switch (inArray[i]) {
                case "Simple_Comparisons":
                    result.push(OpenLayers.Filter.Comparison.LESS_THAN);
                    result.push(OpenLayers.Filter.Comparison.GREATER_THAN);
                    result.push(OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO);
                    result.push(OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO);
                    result.push(OpenLayers.Filter.Comparison.EQUAL_TO);
                    // NOT_EQUAL_TO is not mentioned in FES 1.0
                    break;
                case "Like":
                    result.push(OpenLayers.Filter.Comparison.LIKE);
                    break;
                // todo - needs 2 values
                // case "Between": 
                //    result.push(OpenLayers.Filter.Comparison.BETWEEN);
                //    break;
                // todo - missing in OL.Filter
                // case "NullCheck":
                //     result.push();
                //     break;

            } // switch       
        } // for

        return result;
    },

    /**
     * Create simple filter object, save it, write it to SQL
     * and mergeNewParams() into the existing WFS request
     *
     * @name HSLayers.LayerSwitcher.FilterForm.onOkButtonClickedSql
     * @function
     */
    onOkButtonClickedSql: function() {
        
        // Do some checks
        // todo

        // Create filter
        var filter = {
            // try to keep the names compatible with OpenLayers.Filter.Comparison here
            // propertyName: this.propertyNameCB.getValue(),
            // operator: this.operatorCB.getValue(), 
            property: this.propertyNameCB.getValue(),
            type: this.operatorCB.getValue(), 
            value: this.valueTF.getValue()
        };

        // Save the filter
        this.layer.filter = filter;

        // Write filter to SQL
        var sql = filter.property + filter.type + filter.value;

console.log(sql);

        // Send the SQL
        this.layer.mergeNewParams({fes: sql}); // This is the output of the whole thing

        // Close Window
        // todo
    },

    /**
     * Create OpenLayers.Filter object, save it, write it to FES, 
     * mergeNewParams() into the existing WFS request and hide the window
     *
     * @name HSLayers.LayerSwitcher.FilterForm.onOkButtonClickedFes
     * @function
     */
    onOkButtonClickedFes: function() {

        // Apply the filter
        this.onApplyButtonClickedFes();

        // Hide the window
        this.window.hide();

    },

    /**
     * Create OpenLayers.Filter object, save it, write it to FES 
     * and mergeNewParams() into the existing WFS request
     *
     * @name HSLayers.LayerSwitcher.FilterForm.onApplyButtonClickedFes
     * @function
     */
    onApplyButtonClickedFes: function() {

        // Do some checks
        // todo

        // Create Filter
        var filter = new OpenLayers.Filter.Comparison({
            type: this.operatorCB.getValue(), 
            property: this.propertyNameCB.getValue(),
            value: this.valueTF.getValue()
        });

        // Save the filter
        this.layer.filter = filter;

        // Write filter to FES
        var v1xx = new OpenLayers.Format.Filter({version: this.layer.version});
        var xmlFormat = new OpenLayers.Format.XML();
        var filterElement = v1xx.write(filter);
        var fesXml = xmlFormat.write(filterElement);
        
console.log(fesXml);

        // Send the FES
        this.layer.mergeNewParams({fes: fesXml}); // This is the output of the whole thing
    },

    /**
     * Hide the window
     *
     * @name HSLayers.LayerSwitcher.FilterForm.onCancelButtonClicked
     * @function
     */
    onCancelButtonClicked: function() {

        // todo - restore the values of combo boxes from the saved filter 
        // or set them to defaults if no filter has been saved yet

        // Hide the window    
        this.window.hide();
    },

    CLASS_NAME: "HSLayers.LayerSwitcher.FilterForm"
});
