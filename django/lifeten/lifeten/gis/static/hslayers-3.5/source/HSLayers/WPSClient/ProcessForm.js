/**
 * HSLayers WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient.ProcessForm");

HSLayers.WPSClient.ProcessForm = function(config) {

    config = config || {};

    this.process = config.process;
    this.wps = config.wps;
    this.setMap(config.map);

    HSLayers.WPSClient.ProcessForm.superclass.constructor.call(this,config);
};

Ext.extend(HSLayers.WPSClient.ProcessForm, Ext.form.FormPanel,{

    /**
     * map
     * @name HSLayers.WPSClient.ComplexField.map
     * @type OpenLayers.Map
     */
    map: undefined,

    /**
     * process
     * @name HSLayers.WPSClient.ProcessForm.process
     * @type OpenLayers.WPS.Process
     */
    process: undefined,

    /**
     * inputs
     * @name HSLayers.WPSClient.ProcessForm.inputs
     * @type [Ext.form.Field]
     */
    inputs: undefined,

    /**
     * setMap
     * @function
     * @name HSLayers.WPSClient.ComplexField.setMap
     * @param {OpenLayers.Map} map
     */
    setMap: function(map)  {
        this.map = map;
    },

    /**
     * @private
     */
    initComponent: function() {
        var config = {};

        config.title = this.process.title || this.process.identifier;
        config.height = 380;
        config.autoScroll = true;
        config.items = [];
        config.frame = true;

        var inputs = this._getInputFields(this.process);
        config.items.push(
            new Ext.form.FieldSet({
                title: OpenLayers.i18n("Inputs"),
                items: inputs
            }));

        this.outputs = this._getOutputFields(this.process);

        config.items.push(
            new Ext.form.FieldSet({
                title: OpenLayers.i18n("Outputs"),
                items: this.outputs
            }));

        config.buttons = [
                {
                    text: OpenLayers.i18n("Execute"),
                    handler: this.execute,
                    scope: this
                }
            ];

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.ProcessForm.superclass.initComponent.apply(this, arguments);
    },

    /**
     * render
     * @private
     */
    render: function() {
        HSLayers.WPSClient.ProcessForm.superclass.render.apply(this, arguments);
        this._mask = new Ext.LoadMask(this.body, {msg:OpenLayers.i18n("Please wait ...")});
    },

    /**
     * get inputs fields
     * @private
     */
    _getInputFields: function(process) {
        var inputs = [];
        this.inputs = [];

        // switch between Literal, Complex and BoundingBox input types
        for (var i = 0, len = process.dataInputs.length; i < len; i++) {
            var input = process.dataInputs[i];
            var wpsInput;
            if (input.literalData) {
                // select box for allowd values
                if (input.literalData.allowedValues) {
                    wpsInput = new HSLayers.WPSClient.LiteralFieldSelect({width:200, labelStyle: 'width:130px', inoutput: input, wps: this.wps, map:this.map}); 
                }
                // normal text-area based WPS input
                else {
                    wpsInput = new HSLayers.WPSClient.LiteralField({width:200, labelStyle: 'width:130px', inoutput: input, wps: this.wps, map:this.map}); 
                }
            }
            else if (input.complexData) {
                wpsInput = new HSLayers.WPSClient.ComplexField({inoutput: input, wps: this.wps, map:this.map}); 
            }
            else {
                wpsInput = new HSLayers.WPSClient.BBoxField({inoutput: input, wps: this.wps, map:this.map}); 
            }
            inputs.push(wpsInput);

            // abstract fieldset
            var abstract = inputs.push(new Ext.form.FieldSet({
                collapsible: true,
                collapsed: true,
                title: "&nbsp;",
                //title: wpsInput.fieldLabel,
                items: {html: input.abstract}
            }));

            wpsInput.on("focus",this.expand,abstract);
            wpsInput.on("blur",this.collapse,abstract);

            this.inputs.push(wpsInput);
        }
        return inputs;
    },

    /**
     * get output fields
     * @private
     */
    _getOutputFields: function(process) {
        var outputs = [];

        // switch between Literal, Complex and BoundingBox output types
        for (var i = 0; i < process.processOutputs.length; i++) {
            var output = process.processOutputs[i];
            if (output.literalOutput) {
                outputs.push(new HSLayers.WPSClient.LiteralField({width:200, labelStyle: 'width:130px', inoutput: output,map:this.map,disabled:true})); 
            }
            else if (output.complexOutput) {
                outputs.push(new HSLayers.WPSClient.ComplexOutputField({inoutput: output, map:this.map,disabled:true})); 
            }
            else if (output.boundingBoxOutput) {
                outputs.push(new HSLayers.WPSClient.BBoxField({inoutput: output,map:this.map,disabled:true})); 
            }
        }
        return outputs;
    },

    /**
     * execute
     * @name HSLayers.WPSClient.ProcessForm.execute
     * @function
     */
    execute: function() {
        if (!this.getForm().isValid()) {
            return;
        }
        this._mask.show();
        
        //for (var i = 0; i < this.inputs.length; i++) {
        //    this.inputs[i].setInputValue();
        //}

        for (i = 0; i < this.outputs.length; i++) {
            if (this.outputs[i] instanceof HSLayers.WPSClient.ComplexOutputField){
                this.outputs[i].inoutput.asReference = true;
            }
        }

        var data = this._createExecuteRequest();

        var format = new OpenLayers.Format.WPSExecute();
        var xml = format.write(data);

        OpenLayers.Request.POST({
            url: this.wps.capabilities.operationsMetadata.Execute.dcp.http.post[0].url,
            data: format.write(data),
            scope: this,
            success: this._onExecuted
        });

    },

    /**
     * onExecuted
     * @name HSLayers.WPSClient.ProcessForm._onExecuted
     * @function
     * @private
     */
    _onExecuted: function(xhr) {
        this._mask.hide();
        var format = new OpenLayers.Format.WPSExecute();
        var response = format.read(xhr.responseText);
        if (response.executeResponse.status.processSucceeded) {
            this._setOutputFields(response.executeResponse.processOutputs); 
        }
        else {
            Ext.MessageBox.show({
                title: OpenLayers.i18n('Execute request failed'),
                msg: OpenLayers.i18n('Something went terribly wrong, and we did not parse it yet.'),
                buttons: Ext.MessageBox.OK,
                icon: Ext.MessageBox.ERROR
            });
        }
    },

    /**
     * set output field values
     * @name HSLayers.WPSClient._setOutputFields
     * @function
     * @private
     */
    _setOutputFields: function(processOutputs) {
        for (var i = 0, len = this.outputs.length; i < len; i++) {
            var output = this.outputs[i];
            for (var j = 0, jlen = processOutputs.length; j < jlen; j++) {
                if (processOutputs[j].identifier == output.inoutput.identifier) {
                    var data = processOutputs[j];
                    output.setValue(data);
                    output.enable();
                }
            }
        }
    },

    /**
     * create execute request string
     * @function
     * @private
     * @name HSLayers.WPSClient.ProcessForm._createExecuteRequest
     */
    _createExecuteRequest: function() {
        var data = {
            identifier: this.process.identifier,
            dataInputs: [],
            responseForm: {
                responseDocument: {
                        outputs: []
                }
            }
        };

        for (var i = 0, len = this.inputs.length; i < len; i++) {
            var input = this.inputs[i];
            var inputdata = {
                identifier: input.inoutput.identifier,
                data: {}
            }
            if (input instanceof HSLayers.WPSClient.ComplexField) {
                var value =input.getValue();
                if (input.inoutput.asReference) {
                    inputdata.reference = {
                        href : value[0],
                        mimeType: value[1]
                    };
                }
                else {
                    inputdata.data = {
                        complexData: {
                            mimeType: value[1]
                        }
                    };

                    if (typeof(value) == "string") {
                        inputdata.data.complexData.value = value[0];
                    }
                    else {
                        inputdata.data.complexData.node = value[0];
                    }
                }

            }
            else if (input instanceof HSLayers.WPSClient.LiteralField ||
                     input instanceof HSLayers.WPSClient.LiteralFieldSelect) {
                inputdata.data  = { literalData : { value: input.getValue() } };
            }
            else {
                inputdata.data  = { boundingBoxData : input.getValue() };
            }

            if (inputdata.data) {
                data.dataInputs.push(inputdata);
            }
        }

        for (i = 0, len = this.outputs.length; i < len; i++) {
            var output = this.outputs[i];
            data.responseForm.responseDocument.outputs.push({
                                                identifier: output.inoutput.identifier,
                                                asReference : output.inoutput.asReference,
                                                mimeType: output.inoutput.mimeType
            });
        }

        return data;

    },

    CLASS_NAME: "HSLayers.WPSClient.ProcessForm"
});
