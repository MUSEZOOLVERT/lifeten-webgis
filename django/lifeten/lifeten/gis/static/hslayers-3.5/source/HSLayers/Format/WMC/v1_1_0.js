/**
 * Read and write WMC version 1.1.0.
 * @class HSLayers.Format.WMC.v1_1_0
 *
 */
HSLayers.Format.WMC.v1_1_0 = OpenLayers.Class(OpenLayers.Format.WMC.v1_1_0, {

    initialize: function(options) {
        OpenLayers.Format.WMC.v1_1_0.prototype.initialize.apply(
            this, [options]
        );

        this.options = this.options ? this.options : {};

        this.namespaces.hsl = "http://hsrs.cz/context";
    },

    /**
     * Method: read
     * Read capabilities data from a string, and return a list of layers. 
     * 
     * Parameters: 
     * data - {String} or {DOMElement} data to read/parse.
     *
     * Returns:
     * {Array} List of named layers.
     */
    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        this.rootPrefix = root.prefix;
        var context = {
            version: root.getAttribute("version"),
            // HSLayers
            uuid: root.getAttribute("id")
        };
        this.runChildNodes(context, root);
        return context;
    },

    read_hsl_baseLayersIncluded: function(obj, node) {
        obj.baseLayersIncluded = (this.getChildValue(node) == "true" ? true : false);
    },

    read_hsl_layerStructure: function(obj, node) {
        obj.layerStructure = OpenLayers.Format.JSON.prototype.read(this.getChildValue(node));
    },


    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer context object.
     *
     * Parameters:
     * context - {Object} A layer context object.}
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer_v1: function(context) {
        var node = this.createElementDefaultNS(
            "Layer", null, {
                queryable: context.queryable ? "1" : "0",
                hidden: context.visibility ? "0" : "1"
            }
        );
        
        // required Server element
        node.appendChild(this.write_wmc_Server(context));

        // required Name element
        node.appendChild(this.createElementDefaultNS(
            "Name", context.name
        ));
        
        // required Title element
        node.appendChild(this.createElementDefaultNS(
            "Title", context.title
        ));

         // optional Abstract element
         if (context["abstract"]) {
             node.appendChild(this.createElementDefaultNS(
                 "Abstract", context["abstract"]
             ));
         }

         // optional DataURL element
         if (context.dataURL) {
             node.appendChild(this.write_wmc_URLType("DataURL", context.dataURL));
         }

        // optional MetadataURL element
        // !!! NOTE: this is different from original
        if (context.metadataURL) {
             node.appendChild(this.write_wmc_URLType("MetadataURL", context.metadataURL.href,{format: context.metadataURL.format}));
        }
        
        return node;
    },

    /**
     * Method: write_wmc_Layer
     * Create a Layer node given a layer context object.
     *
     * Parameters:
     * context - {Object} A layer context object.}
     *
     * Returns:
     * {Element} A WMC Layer element node.
     */
    write_wmc_Layer: function(context) {
        var node = this.write_wmc_Layer_v1(context);
        
        // min/max scale denominator elements go before the 4th element in v1
        if(context.maxScale) {
            var minSD = this.createElementNS(
                this.namespaces.sld, "sld:MinScaleDenominator"
            );
            minSD.appendChild(this.createTextNode(context.maxScale.toPrecision(16)));
            node.appendChild(minSD);
        }
        
        if(context.minScale) {
            var maxSD = this.createElementNS(
                this.namespaces.sld, "sld:MaxScaleDenominator"
            );
            maxSD.appendChild(this.createTextNode(context.minScale.toPrecision(16)));
            node.appendChild(maxSD);
        }

        // optional SRS element(s)
        if (context.srs) {
            for(var name in context.srs) {
                node.appendChild(this.createElementDefaultNS("SRS", name));
            }
        }

        // optional FormatList element
        node.appendChild(this.write_wmc_FormatList(context));

        // optional StyleList element
        node.appendChild(this.write_wmc_StyleList(context));
        
        // optional DimensionList element
        if (context.dimensions) {
            node.appendChild(this.write_wmc_DimensionList(context));
        }

        // OpenLayers specific properties go in an Extension element
        node.appendChild(this.write_wmc_LayerExtension(context));
        
        return node;
        
    },

    write_wmc_LayerExtension : function(context) {
        
        var node = OpenLayers.Format.WMC.v1_1_0.prototype.write_wmc_LayerExtension.apply(this,arguments);

        // HSL properties
        var properties = ["info_format","layer_title","path","capabilitiesURL","owsservice","projection","projections"];

        var child;
        for (var i = 0, len = properties.length; i < len; i++) {
            child = this.createHSPropertyNode(context, properties[i]);
            if (child) {
                node.appendChild(child);
            }
        }

        if (context.attribution) {
            node.appendChild(this.write_hsl_attribution(context));
        }

        node.app
    
        // return Extension
        return node;
    },

    /**
     * Method: createOLPropertyNode
     * Create a node representing an OpenLayers property.  If the property is
     *     null or undefined, null will be returned.
     *
     * Parameters:
     * object - {Object} An object.
     * prop - {String} A property.
     *
     * Returns:
     * {Element} A property node.
     */
    createHSPropertyNode: function(obj, prop) {
        var node = null;
        if(obj[prop] != null) {
            node = this.createElementNS(this.namespaces.hsl, "hsl:" + prop);
            node.appendChild(this.createTextNode(obj[prop].toString()));
        }
        return node;
    },

    /**
     * Write attribution from context object to WMC XML.
     * Attribution can be given as a string or as an object.
     *
     * Example:
     *
     * Input (context.attribution):
     *
     *   context.attribution {
     *       title : "Volcano portal",
     *       logo : {
     *           width : "100",
     *           height : "40",
     *           format : "img/png",
     *           href : "http://volcano.net/img/logo.png"
     *       }
     *       href : "http://volcano.net"
     *   }
     *
     * Output (return value):
     *   
     *   <hsl:attribution>
     *       <hsl:title> Volcano portal </hsl:title>
     *       <hsl:logo width="100" height="40">
     *           <hsl:format> image/png </hsl:format>
     *           <OnlineResource xlink:href="http://volcano.net/img/logo.png" />
     *       </hsl:logo>
     *       <OnlineResource xlink:href="http.volcano.net" />
     *   </hsl:attribution>
     */
    write_hsl_attribution : function(context) {
        // Attribution
        var attribution = this.createElementNS(this.namespaces.hsl, "hsl:attribution");

        // Just in case we are given a simple string
        if(typeof(context.attribution) == "string") {
            attribution.appendChild(this.createTextNode(context.attribution));
            return attribution;
        }

        // Title
        if(context.attribution.title) { 
            var title = this.createElementNS(this.namespaces.hsl, "hsl:title");
            title.appendChild(this.createTextNode(context.attribution.title));
            attribution.appendChild(title);
        }

        // LogoURL
        if(context.attribution.logo) {
            var logo = this.createElementNS(this.namespaces.hsl, "hsl:logo"); 
            if(context.attribution.logo.width) {
                logo.setAttribute("width",context.attribution.logo.width);
            }       
            if(context.attribution.logo.height) {
                logo.setAttribute("height",context.attribution.logo.height);
            }       

            // Format
            if(context.attribution.logo.format) {                        
                var format = this.createElementNS(this.namespaces.hsl, "hsl:format"); 
                format.appendChild(this.createTextNode(context.attribution.logo.format));
                logo.appendChild(format);
            }

            // OnlineResource
            if(context.attribution.logo.href) {
                logo.appendChild(this.write_wmc_OnlineResource(context.attribution.logo.href));
            }                   

            attribution.appendChild(logo);
        }

        // OnlineResource
        if(context.attribution.href) { 
            attribution.appendChild(this.write_wmc_OnlineResource(context.attribution.href));
        }

        return attribution;
    },

    read_hsl_info_format : function(layerContext, node) {
        layerContext.info_format = this.getChildValue(node);
    },

    read_hsl_owsservice : function(layerContext, node) {
        layerContext.owsservice = this.getChildValue(node);
    },

    read_hsl_layer_title : function(layerContext, node) {
        layerContext.layer_title = this.getChildValue(node);
    },

    read_hsl_path : function(layerContext, node) {
        layerContext.path = this.getChildValue(node);
    },

    read_hsl_capabilitiesURL : function(layerContext, node) {
        layerContext.capabilitiesURL = this.getChildValue(node);
    },

    read_hsl_projection : function(layerContext, node) {
        layerContext.projection = new OpenLayers.Projection(this.getChildValue(node));
    },

    read_hsl_projections : function(layerContext, node) {
        layerContext.projections = this.getChildValue(node).split(",").map(function(p) { 
                                        return new OpenLayers.Projection(p);
                                    });
    },

    /**
     * Read attribution section from WMC XML into a context object.
     * Attribution can be either a string or an object.
     *
     * Example:
     *
     * Input (node):
     *   
     *   <hsl:attribution>
     *       <hsl:title> Volcano portal </hsl:title>
     *       <hsl:logo width="100" height="40">
     *           <hsl:format> image/png </hsl:format>
     *           <OnlineResource xlink:href="http://volcano.net/img/logo.png" />
     *       </hsl:logo>
     *       <OnlineResource xlink:href="http.volcano.net" />
     *   </hsl:attribution>
     *
     * Output (context.attribution):
     *
     *   context.attribution {
     *       title : "Volcano portal",
     *       logo : {
     *           width : "100",
     *           height : "40",
     *           format : "img/png",
     *           href : "http://volcano.net/img/logo.png"
     *       }
     *       href : "http://volcano.net"
     *   }
     */
    read_hsl_attribution : function(context, node) {
        var attribution = {};

        // Check whether a simple string is given
        if (node.childNodes.length <= 1) {
            context.attribution = this.getChildValue(node);
            return;
        }

        var xml = new OpenLayers.Format.XML();

        // Title
        var title = xml.getElementsByTagNameNS(node, this.namespaces.hsl, "title");
        if (title.length > 0) {
            attribution.title = this.getChildValue(title[0]);
        }

        // Logo
        var logo = xml.getElementsByTagNameNS(node, this.namespaces.hsl, "logo");
        if (logo.length > 0) {
            attribution.logo = {
                width: logo[0].getAttribute("width"),
                height: logo[0].getAttribute("height")
            };

            // Logo format
            var format = xml.getElementsByTagNameNS(logo[0], this.namespaces.hsl, "format");            
            if (format.length > 0) {
                attribution.logo.format = this.getChildValue(format[0]);  
            }             
        }

        // OnLineResources
        // attribution.href & attribution.logo.href
        var hrefs = node.getElementsByTagName("OnlineResource");
        for (var i = 0; i < hrefs.length; i++) {
            if (hrefs[i].parentNode.nodeName == node.nodeName) { // attribution.href
                this.read_wmc_OnlineResource(attribution, hrefs[i]);
            }
            else if (hrefs[i].parentNode.nodeName == "hsl:logo") { // attribution.logo.href
                if (attribution.logo) { 
                    this.read_wmc_OnlineResource(attribution.logo, hrefs[i]);
                }
            }
        }

        context.attribution = attribution;
    },

   read_wmc_MetadataURL : function(layerContext, node) {

        var formatsNodes = node.getElementsByTagName("Format");
        layerContext.metadataURL =  {
            //format: (formatsNodes.length > 0 ? this.getChildValue(formatsNodes[0]) : undefined),
            format: node.getAttribute("format"),
            //type: node.getAttribute("type"),
            href: this.getOnlineResource_href(node)
        };

    },

    read_wmc_LogoURL: function(context,node) {
        var links = node.getElementsByTagName("OnlineResource");
        if (links.length > 0) {
            context.logoURL = {};
            this.read_wmc_OnlineResource(context.logoURL,links[0]);
        }
    },

    read_wmc_KeywordList: function(context,node) {
        context.keywords = [];
        var kwNodes = node.getElementsByTagName("Keyword");
        for (var i = 0; i < kwNodes.length; i++) {
            context.keywords.push(this.getChildValue(kwNodes[i]));
        }
    },

    read_wmc_ContactInformation: function(context,node) {
        context.contactInformation = {};
        this.runChildNodes(context.contactInformation,node);
    },
                                 
    read_wmc_ContactVoiceTelephone: function(context,node) {
        context.telephone = this.getChildValue(node);
    },

    read_wmc_ContactElectronicMailAddress: function(context,node) {
        context.email = this.getChildValue(node);
    },

    read_wmc_Address: function(context,node) {
        context.address = this.getChildValue(node);
    },

    read_wmc_ContactAddress: function(context,node) {
        context.contactAddress = {};
        this.runChildNodes(context.contactAddress,node);
    },

    read_wmc_ContactPersonPrimary: function(context,node) {
        context.contactPersonPrimary = {};
        this.runChildNodes(context.contactPersonPrimary,node);
    },

    read_wmc_ContactPerson: function(context,node) {
        if (node.firstChild) {
            context.contactPerson = this.getChildValue(node);
        }
    },

    read_wmc_ContactOrganization: function(context,node) {
        context.contactOrganization = this.getChildValue(node);
    },

    read_wmc_ContactPosition: function(context,node) {
        context.contactPosition = this.getChildValue(node);
    },

    read_wmc_AddressType: function(context,node) {
        if (node.childNodes.length){
            context.addressType = this.getChildValue(node);
        }
    },

    read_wmc_City: function(context,node) {
        context.city = this.getChildValue(node);
    },

    read_wmc_PostCode: function(context,node) {
        context.postCode = this.getChildValue(node);
    },
    read_wmc_Country: function(context,node) {
        context.country = this.getChildValue(node);
    },

    read_wmc_StateOrProvince: function(context,node) {
        context.stateOrProvince = this.getChildValue(node);
    },

    /**
     * create contatct info node
     */
    write_wmc_ContactInformation: function(context) {
        var node = this.createElementDefaultNS( "ContactInformation");
        if (context.contactPersonPrimary) {
            var contactPerson = this.createElementDefaultNS("ContactPersonPrimary");
            contactPerson.appendChild(this.createElementDefaultNS("ContactPerson",context.contactPersonPrimary.contactPerson));
            contactPerson.appendChild(this.createElementDefaultNS("ContactOrganization",context.contactPersonPrimary.contactOrganization));
            node.appendChild(contactPerson);
        }
        if (context.contactPosition) {
            node.appendChild(this.createElementDefaultNS("ContactPosition",context.contactPosition));
        }
        if (context.contactAddress) {
            var contactAddress = this.createElementDefaultNS("ContactAddress");
            contactAddress.appendChild(this.createElementDefaultNS("AddressType",context.contactAddress.addressType));
            contactAddress.appendChild(this.createElementDefaultNS("Address",context.contactAddress.address));
            contactAddress.appendChild(this.createElementDefaultNS("City",context.contactAddress.city));
            contactAddress.appendChild(this.createElementDefaultNS("StateOrProvince",context.contactAddress.stateOrProvince));
            contactAddress.appendChild(this.createElementDefaultNS("PostCode",context.contactAddress.postCode));
            contactAddress.appendChild(this.createElementDefaultNS("Country",context.contactAddress.country));
            node.appendChild(contactAddress);
        }
        if (context.telephone) {
            node.appendChild(this.createElementDefaultNS("ContactVoiceTelephone",context.telephone));
        }
        if (context.email) {
            node.appendChild(this.createElementDefaultNS("ContactElectronicMailAddress",context.email));
        }
        return node;
    },

    write_wmc_LegendURL : function(legend) {
        var node = this.createElementDefaultNS("LegendURL");
        if (typeof(legend) != "string") {
                if (legend.format) {

                    var format = this.createElementDefaultNS("Format");
                    node.appendChild(format);
                    format.appendChild(this.createTextNode(legend.format));
                }
                node.appendChild(this.write_wmc_OnlineResource(legend.href));
        }
        else {
            // required OnlineResource element
            node.appendChild(this.write_wmc_OnlineResource(legend));
        }
         return node;
    },

    write_wmc_Abstract : function(abstract) {
        var node = this.createElementDefaultNS("Abstract");
        node.appendChild(this.createTextNode(abstract));
        return node;
    },


    write_ol_MapExtension : function(context) {
        var node = this.createElementDefaultNS("Extension");
        
        var bounds = context.maxExtent;
        if(bounds) {
            var maxExtent = this.createElementNS(
                this.namespaces.ol, "ol:maxExtent"
            );
            this.setAttributes(maxExtent, {
                minx: bounds.left.toPrecision(18),
                miny: bounds.bottom.toPrecision(18),
                maxx: bounds.right.toPrecision(18),
                maxy: bounds.top.toPrecision(18)
            });
            node.appendChild(maxExtent);
        }

        // HSRS Code
        if (context.extension) {
            for (var i in context.extension) {
                var extNode = this.createElementNS(this.namespaces.hsl,"hsl:"+i);
                if (typeof(context.extension[i]) == "string") {
                    extNode.appendChild(this.createTextNode(context.extension[i]));
                }
                else if (typeof(context.extension[i]) == "boolean") {
                    extNode.appendChild(this.createTextNode(String(context.extension[i])));
                }
                else {
                    this.setAttributes(extNode,context.extension[i]);
                }
                node.appendChild(extNode);
            }
        }
        
        return node;
    },

    CLASS_NAME: "HSLayers.Format.WMC.v1_1_0" 

});
