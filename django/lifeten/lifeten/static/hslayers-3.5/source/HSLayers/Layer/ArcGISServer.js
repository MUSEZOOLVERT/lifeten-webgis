HSLayers.namespace("HSLayers.Layer");
HSLayers.Layer.ArcGISServer = OpenLayers.Class(OpenLayers.Layer.XYZ, {

    setMap: OpenLayers.Layer.Zoomify.prototype.setMap,

    calculateGridLayout: OpenLayers.Layer.Zoomify.prototype.calculateGridLayout,

    CLASS_NAME:"HSLayers.Layer.ArcGISServer"
});
