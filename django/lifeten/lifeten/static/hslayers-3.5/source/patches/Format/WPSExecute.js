OpenLayers.Format.WPSExecute.prototype.writers.wps.Data = function(data) {
                var node = this.createElementNSPlus("wps:Data", {});
                if (data.literalData) {
                    this.writeNode("wps:LiteralData", data.literalData, node);
                } else if (data.complexData) {
                    this.writeNode("wps:ComplexData", data.complexData, node);
                } else if (data.boundingBoxData) {
                    this.writeNode("ows:BoundingBox", data.boundingBoxData, node);
                }
                return node;
            };

OpenLayers.Format.WPSExecute.prototype.writers.wps.ComplexData = function(complexData) {
                var node = this.createElementNSPlus("wps:ComplexData", {
                    attributes: {
                        mimeType: complexData.mimeType,
                        encoding: complexData.encoding,
                        schema: complexData.schema
                    } 
                });

                if (complexData.node) { 
                           node.appendChild(complexData.node); 
                } else { 
                    node.appendChild( 
                        this.getXMLDoc().createCDATASection(complexData.value) 
                    ); 
                }
                return node;
            };

OpenLayers.Format.WPSExecute.prototype.writers.wps.ResponseDocument =  function(responseDocument) {
                var node = this.createElementNSPlus("wps:ResponseDocument", {
                    attributes: {
                        storeExecuteResponse: responseDocument.storeExecuteResponse,
                        lineage: responseDocument.lineage,
                        status: responseDocument.status
                    }
                });
                if (responseDocument.outputs) {
                    for (var i = 0, len = responseDocument.outputs.length; i < len; i++) {
                        this.writeNode("wps:Output", responseDocument.outputs[i], node);
                    }
                }
                return node;
            };

OpenLayers.Format.WPSExecute.prototype.writers.wps.Output =  function(output) {
                var node = this.createElementNSPlus("wps:Output", {
                    attributes: {
                        asReference: output.asReference,
                        mimeType: output.mimeType,
                        encoding: output.encoding,
                        schema: output.schema
                    }
                });
                this.writeNode("ows:Identifier", output.identifier, node);
                this.writeNode("ows:Title", output.title, node);
                this.writeNode("ows:Abstract", output["abstract"], node);
                return node;
            };
OpenLayers.Format.WPSExecute.prototype.writers.wps.RawDataOutput =  function(rawDataOutput) {
                var node = this.createElementNSPlus("wps:RawDataOutput", {
                    attributes: {
                        mimeType: rawDataOutput.mimeType,
                        encoding: rawDataOutput.encoding,
                        schema: rawDataOutput.schema
                    }
                });
                this.writeNode("ows:Identifier", rawDataOutput.identifier, node);
                return node;
            };

    /**
     * APIMethod: read
     * Parse a WPS Execute and return an object with its information.
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Object}
     */
OpenLayers.Format.WPSExecute.prototype.read = function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var info = {};
        this.readNode(data, info);
        return info;
    };

    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
OpenLayers.Format.WPSExecute.prototype.readers = {
        "wps": {
            "ExecuteResponse": function(node, obj) {
                obj.executeResponse = {
                    lang: node.getAttribute("lang"),
                    statusLocation: node.getAttribute("statusLocation"),
                    serviceInstance: node.getAttribute("serviceInstance"),
                    service: node.getAttribute("service")
                };
                this.readChildNodes(node, obj.executeResponse);
            },
            "Process":function(node,obj) {
                obj.process = {};
                this.readChildNodes(node, obj.process);
            },
            "Status":function(node,obj) {
                obj.status = {
                    creationTime: node.getAttribute("creationTime")
                };
                this.readChildNodes(node, obj.status);

            },
            "ProcessSucceeded": function(node,obj) {
                obj.processSucceeded = true;
            },
            "ProcessOutputs": function(node, processDescription) {
                processDescription.processOutputs = [];
                this.readChildNodes(node, processDescription.processOutputs);
            },
            "Output": function(node, processOutputs) {
                var output = {};
                this.readChildNodes(node, output);
                processOutputs.push(output);
            },
            "Reference": function(node, output) {
                output.reference = {
                    href: node.getAttribute("href"),
                    mimeType: node.getAttribute("mimeType"),
                    encoding: node.getAttribute("encoding"),
                    schema: node.getAttribute("schema")
                };
            },
            "Data": function(node, output) {
                output.data = {};
                this.readChildNodes(node, output);
            },
            "LiteralData": function(node, output) {
                output.literalData = {
                    dataType: node.getAttribute("dataType"),
                    uom: node.getAttribute("uom"),
                    value: this.getChildValue(node)
                };
            },
            "ComplexData": function(node, output) {
                output.complexData = {
                    mimeType: node.getAttribute("mimeType"),
                    schema: node.getAttribute("schema"),
                    encoding: node.getAttribute("encoding"),
                    value: ""
                };
                
                // try to get *some* value, ignore the empty text values
                if (this.isSimpleContent(node)) {
                    for(var child=node.firstChild; child; child=child.nextSibling) {
                        switch(child.nodeType) {
                            case 3: // text node
                            case 4: // cdata section
                                output.complexData.value += child.nodeValue;
                        }
                    }
                }
                else {
                    for(var child=node.firstChild; child; child=child.nextSibling) {
                        if (child.nodeType == 1) {
                            output.complexData.value = child;
                        }
                    }
                }

            },
            "BoundingBox": function(node, output) {
                output.boundingBoxData = {
                    dimensions: node.getAttribute("dimensions"),
                    crs: node.getAttribute("crs")
                };
                this.readChildNodes(node, output.boundingBoxData);
            }
        },
        // FIXME: we should add Exception parsing here
        "ows": OpenLayers.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    };
