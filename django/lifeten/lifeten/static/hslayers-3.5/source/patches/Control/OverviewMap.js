OpenLayers.Control.OverviewMap.prototype.autoPan = true;
/**
 * Author: Jachym
 * Purpose:  always do recenter the overview map
 */
OpenLayers.Control.OverviewMap.prototype.update = function () {
        if(this.ovmap == null) {
            this.createMap();
        }
        
        if(this.autoPan || !this.isSuitableOverview()) {
            this.updateOverview();
        }
        
        // update extent rectangle
        this.updateRectToMap();
};
