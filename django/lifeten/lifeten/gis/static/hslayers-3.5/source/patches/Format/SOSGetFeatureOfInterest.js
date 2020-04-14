
OpenLayers.Format.SOSGetFeatureOfInterest.prototype.readers["gml"]["pos"] = function(node, obj) {
    // we need to parse the srsName to get to the 
    // externalProjection, that's why we cannot use
    // GML v3 for this
    if (!this.externalProjection) {
        // gml:lowerCorner and gml:upperCorner does not contain attribute srsName because
        // it is contained in parent element gml:Envelope
        var srsName = node.getAttribute("srsName");
        if (srsName) {
            this.externalProjection = new OpenLayers.Projection(srsName);
        }
    }
    OpenLayers.Format.GML.v3.prototype.readers.gml.pos.apply(this, [node, obj]);
};