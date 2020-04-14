
OpenLayers.Format.SOSGetObservation.prototype.namespaces["swe"] = "http://www.opengis.net/swe/1.0.1";

OpenLayers.Format.SOSGetObservation.prototype.writers["sos"]["GetObservation"] = function(options) {
    var node = this.createElementNSPlus("GetObservation", {
        attributes: {
            version: this.VERSION,
            service: "SOS"
        } 
    }); 
    this.writeNode("offering", options, node);
    if (options.eventTime) {
        this.writeNode("eventTime", options, node);
    }
    for (var i = 0; i < options.procedures.length; i++) {
        this.writeNode("procedure", options.procedures[i], node);
    }
    for (var i = 0; i < options.observedProperties.length; i++) {
        this.writeNode("observedProperty", options.observedProperties[i], node);
    }
    if (options.foi) {
        this.writeNode("featureOfInterest", options.foi, node);
    }
    this.writeNode("responseFormat", options, node);
    if (options.resultModel) {
        this.writeNode("resultModel", options, node);
    }
    if (options.responseMode) {
        this.writeNode("responseMode", options, node);
    }
    return node; 
};

OpenLayers.Format.SOSGetObservation.prototype.writers["sos"]["eventTime"] = function(options) {
    var node = this.createElementNSPlus("eventTime");
    if (options.eventTime === "latest") {
        this.writeNode("ogc:TM_Equals", options, node);
    }
    if (options.eventTime.beginPosition && options.eventTime.endPosition) {
        this.writeNode("ogc:TM_During", options, node);
    }
    return node;
};

OpenLayers.Format.SOSGetObservation.prototype.writers["ogc"]["TM_During"] = function(options) {
    var node = this.createElementNSPlus("ogc:TM_During");
    this.writeNode("ogc:PropertyName", {property: "om:samplingTime"}, node);
    if (options.eventTime.beginPosition && options.eventTime.endPosition) {
        this.writeNode("gml:TimePeriod", options, node);
    }
    return node;
};

OpenLayers.Format.SOSGetObservation.prototype.writers["gml"]["TimePeriod"] = function(options) {
    var node = this.createElementNSPlus("gml:TimePeriod");
    this.writeNode("gml:beginPosition", {value: options.eventTime.beginPosition}, node);
    this.writeNode("gml:endPosition", {value: options.eventTime.endPosition}, node);
    return node;
};

OpenLayers.Format.SOSGetObservation.prototype.writers["gml"]["beginPosition"] = function(options) {
    var node = this.createElementNSPlus("gml:beginPosition", {value: options.value});
    return node;
};

OpenLayers.Format.SOSGetObservation.prototype.writers["gml"]["endPosition"] = function(options) {
    var node = this.createElementNSPlus("gml:endPosition", {value: options.value});
    return node;
};


OpenLayers.Format.SOSGetObservation.prototype.readers["gml"]["pos"] = 
    OpenLayers.Format.SOSGetFeatureOfInterest.prototype.readers["gml"]["pos"];

OpenLayers.Format.SOSGetObservation.prototype.readers["om"]["result"] = function(node, measurement) {
    var result = {};
    measurement.result = result;
    this.readChildNodes(node, result);    
};

OpenLayers.Format.SOSGetObservation.prototype.readers["swe"] = {
    "DataArray": function(node, result) {
        this.readChildNodes(node, result);            
    },
    "elementCount": function(node, result) {
        var count = {}
        result.count = count;
        this.readChildNodes(node, count);
    },
    "Count": function(node, count) {
        this.readChildNodes(node, count);
    },
    "value": function(node, object) {
        object.value = this.getChildValue(node);
    },
    "elementType": function(node, result) {
        var elementType = {};
        elementType.name = node.getAttribute("name");
        result.elementType = elementType;
        this.readChildNodes(node, elementType);        
    },
    "DataRecord": function(node, elementType) {
        elementType.fields = [];
        this.readChildNodes(node, elementType);        
    },
    "SimpleDataRecord": function(node, elementType) {
        elementType.fields = [];
        this.readChildNodes(node, elementType);        
    },
    "field": function(node, object) {
        var field = {};
        field.name = node.getAttribute("name");
        object.fields.push(field);
        this.readChildNodes(node, field);
    },
    "Time": function(node, field) {
        field.type = "Time";
        field.definition = node.getAttribute("definition");
        this.readChildNodes(node, field);
    },
    "uom": function(node, value) {
        value.uom = node.getAttribute("uom");
    },
    "encoding": function(node, result) {
        var encoding = {}
        result.encoding = encoding;
        this.readChildNodes(node, encoding);
    },
    "TextBlock": function(node, encoding) {
        var textBlock = {}
        textBlock.decimalSeparator = node.getAttribute("decimalSeparator");
        textBlock.tokenSeparator = node.getAttribute("tokenSeparator");
        textBlock.blockSeparator = node.getAttribute("blockSeparator");
        encoding.textBlock = textBlock;
    },
    "values": function(node, result) {
        result.values = this.getChildValue(node);
        // postprocessing
        result.processedValues = [];
        if (result.encoding && result.encoding.textBlock) {
            var values = result.values.split(result.encoding.textBlock.blockSeparator);
            for (var i = 0; i < values.length; i++) {
                if (values[i].trim() != "") {
                    var tokens = values[i].split(result.encoding.textBlock.tokenSeparator);
                    var record = [];
                    for (var j = 0; j < tokens.length; j++) {
                        record.push(tokens[j]);
                        // ToDo : process value for each token by type
                    }
                    result.processedValues.push(record);
                }
            }
        }
    }
};
