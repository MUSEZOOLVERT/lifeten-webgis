HSLayers.namespace("HSLayers.Format","HSLayers.Format.KML");
HSLayers.Format.KML = OpenLayers.Class(OpenLayers.Format.KML, {

    /**
     * Method: fetchLink
     * Fetches a URL and returns the result
     * 
     * Parameters: 
     * href  - {String} url to be fetched
     * 
     */
    fetchLink: function(href) {
        var newhref = this.customizeExternalLink(href);
        if (newhref) {
            href = newhref;
        }
        var request = OpenLayers.Request.GET({url: href, async: false});
        if (request) {
            return request.responseText;
        }
    },

    /**
     * function to be redefined in the application
     * append needed parameters to external link url according to
     * https://developers.google.com/kml/documentation/kmlreference#viewformat
     * @param {String} href
     * @return {String} href
     */
    customizeExternalLink: function(href) {
        return href;
    },

    /**
     * Method: parseFeature
     * This function is the core of the KML parsing code in OpenLayers.
     *     It creates the geometries that are then attached to the returned
     *     feature, and calls parseAttributes() to get attribute data out.
     *
     * Parameters:
     * node - {DOMElement}
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>} A vector feature.
     */
    parseFeature: function(node) {
        // only accept one geometry per feature - look for highest "order"
        var order = ["MultiGeometry", "Polygon", "LineString", "Point"];
        var type, nodeList, geometry, parser;
        for(var i=0, len=order.length; i<len; ++i) {
            type = order[i];
            this.internalns = node.namespaceURI ? 
                    node.namespaceURI : this.kmlns;
            nodeList = this.getElementsByTagNameNS(node, 
                                                   this.internalns, type);
            if(nodeList.length > 0) {
                // only deal with first geometry of this type
                var parser = this.parseGeometry[type.toLowerCase()];
                if(parser) {
                    geometry = parser.apply(this, [nodeList[0]]);
                    if (this.internalProjection && this.externalProjection) {
                        geometry.transform(this.externalProjection, 
                                           this.internalProjection); 
                    }                       
                } else {
                    OpenLayers.Console.error(OpenLayers.i18n(
                                "unsupportedGeometryType", {'geomType':type}));
                }
                // stop looking for different geometry types
                break;
            }
        }

        // construct feature (optionally with attributes)
        var attributes;
        if(this.extractAttributes) {
            attributes = this.parseAttributes(node);

            /*
             * parse time attributes
             * by Stepan Kafka
             */
            timeAttributes = this.parseTime(node);
            for(var t in timeAttributes){
                 attributes[t] = timeAttributes[t];
            }

            /*
             * end of time parsing
             */
        }
        var feature = new OpenLayers.Feature.Vector(geometry, attributes);

        var fid = node.getAttribute("id") || node.getAttribute("name");
        if(fid != null) {
            feature.fid = fid;
        }

        return feature;
    },        

    /**
     * Method: parseTime
     *
     * Author: Stepan Kafka
     *
     * Parameters:
     * node - {DOMElement}
     *
     * Returns:
     * {Object} An time attributes object.
     */
    parseTime: function(node) {
        var attributes = {};
        var i;
        // search TimeStamp element
        var dataNodes = node.getElementsByTagName("TimeStamp");
        if(dataNodes.length) {
            var valueNode = dataNodes[0].getElementsByTagName("when");
            if (valueNode.length) {
                attributes['TimeStamp'] = {'when': this.getChildValue(valueNode[0])};
            } 
        }
        // search TimeSpan element
        var dataNodes = node.getElementsByTagName("TimeSpan");
        if(dataNodes.length) {
            attributes['TimeSpan'] = {};
            var valueNode = dataNodes[0].getElementsByTagName("begin");
            if (valueNode.length) {
                attributes['TimeSpan']['begin'] = this.getChildValue(valueNode[0]);
            } 
            var valueNode = dataNodes[0].getElementsByTagName("end");
            if (valueNode.length) {
                attributes['TimeSpan']['end'] = this.getChildValue(valueNode[0]);
            } 
       }
       return attributes;
    },

    CLASS_NAME: "HSLayers.Format.KML"
});
