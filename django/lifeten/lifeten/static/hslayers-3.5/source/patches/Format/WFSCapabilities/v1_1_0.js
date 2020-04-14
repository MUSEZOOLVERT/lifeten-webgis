/***************** Describe Feature Type URL ***********************/


if (!OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows) {
    OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows = {};
}
if (!OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ogc) {
    OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ogc = {};
}
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.namespaces.ogc="http://www.opengis.net/ogc";
/**
 * Method: read_cap_OperationsMetadata
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows.OperationsMetadata = function(node,obj) {
    var operationsMetadata = {};
    this.readChildNodes(node,operationsMetadata);
    obj.operationsMetadata = operationsMetadata;
};

/**
 * Method: read_cap_Operation
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows.Operation = function(node,obj) {
    var name = node.getAttribute("name");
    if (name) {
        var new_obj = {};
        this.readChildNodes(node,new_obj);
        obj[name.toLowerCase()] = new_obj;
    }
};

/**
 * Method: read_cap_DCP
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows.DCP = function(node,obj) {
    var dcp = {};
    this.readChildNodes(node,dcp);
    obj.dcp = dcp;
};

/**
 * Method: read_cap_HTTP
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows.HTTP = function(node,obj) {
    var http = {};
    this.readChildNodes(node,http);
    obj.http = http;
};

/**
 * Method: read_cap_Get
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows.Get = function(node,obj) {
    obj.get = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href"); 
};

/**
 * Method: read_cap_Post
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ows.Post = function(node,obj) {
    obj.post = this.getAttributeNS(node, "http://www.w3.org/1999/xlink", "href");
};


/******************** Filter Capabilities **************************/


/**
 * Method: read_ogc_Filter_Capabilities
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ogc.Filter_Capabilities = function(node,obj) {
    var filterCapabilities = {};
    this.readChildNodes(node,filterCapabilities);
    obj.filterCapabilities = filterCapabilities;
};

/**
 * Method: read_ogc_Scalar_Capabilities
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ogc.Scalar_Capabilities = function(node,obj) {
    var scalarCapabilities = {};
    this.readChildNodes(node,scalarCapabilities);
    obj.scalarCapabilities = scalarCapabilities;
};

/**
 * Method: read_ogc_ComparisonOperators
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ogc.Comparison_Operators = function(node,obj) {
    var comparisonOperators = {
        operators: []
    };
    this.readChildNodes(node,comparisonOperators);
    obj.comparisonOperators = comparisonOperators;
};

/**
 * Method: read_ogc_ComparisonOperator
 */
OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.readers.ogc.ComparisonOperator = function(node,comparisonOperators) {
    var op = this.getChildValue(node);
    if(op) {
        comparisonOperators.operators.push(op);
    }
};

///**
// * Method: read_cap_Name
// */
//OpenLayers.Format.WFSCapabilities.v1.prototype.read_cap_Name = 
//OpenLayers.Format.WFSCapabilities.v1_1_0.prototype.read_cap_Name = function(obj, node) {
//        var name = this.getChildValue(node);
//        if(name) {
//            var parts = name.split(":");
//            obj.name = parts.pop();
//            if(parts.length > 0) {
//                obj.featurePrefix = parts[0];
//                obj.featureNS = this.lookupNamespaceURI(node, parts[0]);
//            }
//        }
//    };
