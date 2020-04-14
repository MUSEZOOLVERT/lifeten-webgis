/**
 * $Id: WFS.js 3155 2009-03-02 09:40:32Z mavlk $
 * Author  : Martin Vlk <mavlk at helpforest dot cz>
 * Purpose : Implements posibility to work with more vector layers for one control.
 *           See readme.txt for details.
 * Version : $Rev: 3155 $
 */

OpenLayers.Layer.WFS.prototype.display = function() { 
    if(this.vectorMode) { 
        OpenLayers.Layer.Vector.prototype.display.apply(this, arguments); 
    } else { 
        OpenLayers.Layer.Markers.prototype.display.apply(this, arguments); 
    } 
};
