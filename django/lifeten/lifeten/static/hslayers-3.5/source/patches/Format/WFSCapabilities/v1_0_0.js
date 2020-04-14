if (!OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ows) {
    OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ows = {};
}
if (!OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc) {
    OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc = {};
}

OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.namespaces.ogc="http://www.opengis.net/ogc";

/***************** Describe Feature Type URL ***********************/

OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.wfs.DescribeFeatureType = function(node,request) {
        request.describefeaturetype = {
            href: {}, // DCPType
            formats: [] // ResultFormat
        };
        this.readChildNodes(node, request.describefeaturetype);
};


/******************** Filter Capabilities **************************/


/**
 * Method: read_ogc_Filter_Capabilities
 */
OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc.Filter_Capabilities = function(node,obj) {
    var filterCapabilities = {};
    this.readChildNodes(node,filterCapabilities);
    obj.filterCapabilities = filterCapabilities;
};

/**
 * Method: read_ogc_Scalar_Capabilities
 */
OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc.Scalar_Capabilities = function(node,obj) {
    var scalarCapabilities = {};
    this.readChildNodes(node,scalarCapabilities);
    obj.scalarCapabilities = scalarCapabilities;
};

/**
 * Method: read_ogc_ComparisonOperators
 */
OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc.Comparison_Operators = function(node,obj) {
    var comparisonOperators = {
        operators: []
    };
    this.readChildNodes(node,comparisonOperators);
    obj.comparisonOperators = comparisonOperators;
};

/**
 * Method: read_ogc_Simple_Comparisons
 */
OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc.Simple_Comparisons = function(node,comparisonOperators) {
    comparisonOperators.operators.push("Simple_Comparisons");
};

/**
 * Method: read_ogc_Like
 */
OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc.Like = function(node,comparisonOperators) {
    comparisonOperators.operators.push("Like");
};

/**
 * Method: read_ogc_Between
 */
OpenLayers.Format.WFSCapabilities.v1_0_0.prototype.readers.ogc.Between = function(node,comparisonOperators) {
    comparisonOperators.operators.push("Between");
};

