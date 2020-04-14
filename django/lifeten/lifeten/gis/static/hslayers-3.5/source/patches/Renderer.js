/**
 * $Id: Renderer.js 3777 2009-12-29 21:29:47Z mavlk $
 * Author  : Martin Vlk <mavlk at helpforest dot cz>
 * Purpose : Implements label offset.
 *           See readme.txt for details.
 * Version : $Rev: 3777 $
 */

OpenLayers.Renderer.prototype.drawFeature = function(feature, style) {
    if(style == null) {
        style = feature.style;
    }
    if (feature.geometry) {
        var bounds = feature.geometry.getBounds();
        if(bounds) {
            if (!bounds.intersectsBounds(this.extent)) {
                style = {display: "none"};
            }
            var rendered = this.drawGeometry(feature.geometry, style, feature.id);
            if(style.display != "none" && style.label && rendered !== false) {
                this.drawText(feature.id, style, feature.geometry.getCentroid());
                var location = feature.geometry.getCentroid();  
                if(style.labelXOffset || style.labelYOffset) { 
                    xOffset = isNaN(style.labelXOffset) ? 0 : style.labelXOffset; 
                    yOffset = isNaN(style.labelYOffset) ? 0 : style.labelYOffset; 
                    var res = this.getResolution(); 
                    location.move(xOffset*res, yOffset*res); 
                } 
                this.drawText(feature.id, style, location); 
            } else {
                this.removeText(feature.id);
            }
            return rendered;
        }
    }
};

OpenLayers.Renderer.Canvas.prototype.drawFeature = OpenLayers.Renderer.prototype.drawFeature;
OpenLayers.Renderer.Elements.prototype.drawFeature = OpenLayers.Renderer.prototype.drawFeature;
OpenLayers.Renderer.SVG.prototype.drawFeature = OpenLayers.Renderer.prototype.drawFeature;
OpenLayers.Renderer.VML.prototype.drawFeature = OpenLayers.Renderer.prototype.drawFeature;

