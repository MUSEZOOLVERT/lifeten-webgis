/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD       
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. 

 * Author(s): Jachym Cepicky <jachym bnhelp cz>, Help Service - Remote
 * Sensing s.r.o.
 *
 * Purpose: Enable deleting features on DELETE button.
 *
 */

OpenLayers.Control.ModifyFeature.prototype.removeFeatureMessage = 
                                            "Really remove selected feature?";

/**
 * Method: handleKeypress
 * Called by the feature handler on keypress.  This is used to delete
 *     vertices. If the <deleteCode> property is set, vertices will
 *     be deleted when a feature is selected for modification and
 *     the mouse is over a vertex.
 *
 * Parameters:
 * {Integer} Key code corresponding to the keypress event.
 */
OpenLayers.Control.ModifyFeature.prototype.handleKeypress = function(evt) {
    var code = evt.keyCode;
    
    // check for delete key
    if(this.feature &&
        OpenLayers.Util.indexOf(this.deleteCodes, code) != -1) {
        var vertex = this.dragControl.feature;
            if(vertex &&
               OpenLayers.Util.indexOf(this.vertices, vertex) != -1 &&
               !this.dragControl.handlers.drag.dragging &&
               vertex.geometry.parent) {
                // remove the vertex
                vertex.geometry.parent.removeComponent(vertex.geometry);
                this.layer.events.triggerEvent("vertexremoved", {
                    vertex: vertex.geometry,
                    feature: this.feature,
                    pixel: evt.xy
                });
                this.layer.drawFeature(this.feature, this.standalone ?
                                       undefined :
                                       this.selectControl.renderIntent);
                this.modified = true;
                this.resetVertices();
                this.setFeatureState();
                this.onModification(this.feature);
                this.layer.events.triggerEvent("featuremodified", 
                                               {feature: this.feature});
            }
        // hsrs
        // remove whole feature, not only the vertex
        else {
            if (confirm(OpenLayers.i18n(this.removeFeatureMessage))) {
                var feature = this.feature;
                this.deactivate();
                this.layer.removeFeatures([feature]);
                this.activate();
            }
        }
        // !hsrs
    }
};
