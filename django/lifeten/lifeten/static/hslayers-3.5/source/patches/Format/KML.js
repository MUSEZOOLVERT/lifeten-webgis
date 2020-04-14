    /**
     * Method: parseData
     * Read data from a string, and return a list of features. 
     * 
     * Parameters: 
     * data    - {String} or {DOMElement} data to read/parse.
     * options - {Object} Hash of options
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features.
     */
OpenLayers.Format.KML.prototype.parseData = function(data, options) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }

        this.internalns = data.firstChild.namespaceURI ? 
                    data.firstChild.namespaceURI : this.kmlns;

        // Loop throught the following node types in this order and
        // process the nodes found 
        var types = ["Link", "NetworkLink", "Style", "StyleMap", "Placemark","Document","Folder"];
        for(var i=0, len=types.length; i<len; ++i) {
            var type = types[i];

            var nodes = this.getElementsByTagNameNS(data, "*", type);

            // skip to next type if no nodes are found
            if(nodes.length == 0) { 
                continue;
            }

            switch (type.toLowerCase()) {

                // Fetch external links 
                case "link":
                case "networklink":
                    this.parseLinks(nodes, options);
                    break;

                // parse style information
                case "style":
                    if (this.extractStyles) {
                        this.parseStyles(nodes, options);
                    }
                    break;
                case "stylemap":
                    if (this.extractStyles) {
                        this.parseStyleMaps(nodes, options);
                    }
                    break;

                // parse features
                case "placemark":
                    this.parseFeatures(nodes, options);
                    break;
                // parse document
                case "document":
                    this.parseDocumentAndFolder(nodes, options);
                    break;
                // parse folder
                case "folder":
                    this.parseDocumentAndFolder(nodes, options);
                    break;
            }
        }
        
        return this.features;
    };

    /**
     * Method: parseDocumentAndFolder
     * Parses metadata attributes from this KML
     *
     * Parameters:
     * nodes    - {Array} of {DOMElement} data to read/parse. (should be one)
     * options  - {Object} Hash of options
     */
OpenLayers.Format.KML.prototype.parseDocumentAndFolder = function(nodes,options) {
        var node = nodes[0];
        var params = {};

        for (var i = 0, len = node.childNodes.length; i < len; i++) {
            var elem = node.childNodes[i];
            var nodeName = elem.nodeName;

            // get clear node name, without namespace
            nodeName = nodeName.search(":") > -1 ? nodeName.split(":")[1] : nodeName;

            switch(nodeName) {
                case "open":
                case "visibility":
                        params[nodeName]= !!elem.firstChild.nodeValue;
                        break;
                case "name":
                case "address":
                case "phoneNumber":
                case "styleUrl":
                case "snipped":
                case "description":
                        params[nodeName] = elem.firstChild.nodeValue;
                        break;
                // TODO: more elements to be parsed
            }
        }
       
        if (node.nodeName.search("Document") > - 1) {
            this["document"] = params;
        }
        else if (node.nodeName.search("Folder") > - 1) {
            this.folder = params;
        }
    };
