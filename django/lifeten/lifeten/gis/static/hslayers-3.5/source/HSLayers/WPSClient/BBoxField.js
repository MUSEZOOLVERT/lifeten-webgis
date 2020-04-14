/**
 * HSLayers WPS client
 * @author Jachym Cepicky jachym at ccss cz
 */

Ext.namespace("HSLayers.WPSClient.BBoxField");

HSLayers.WPSClient.BBoxField = function(config) {

    config = config || {};
    this.inoutput = config.inoutput;
    this.wsp = config.wps;
    this.setMap(config.map);

    HSLayers.WPSClient.BBoxField.superclass.constructor.call(this,config);
};

Ext.extend(HSLayers.WPSClient.BBoxField, Ext.form.CompositeField,{

    /**
     * wps
     * @name HSLayers.WPSClient.BBoxField.inoutput
     * @type OpenLayers.WPS
     */
    inoutput: undefined,

    /**
     * wps capabilities of the whole server
     * @name HSLayers.WPSClient.ComplexField.wps
     * @type {Object}
     */
    wps: undefined,

    /**
     * map
     * @name HSLayers.WPSClient.ComplexField.map
     * @type {OpenLayers.Map}
     */
    map: undefined,

    /**
     * @private
     */
    _minx: undefined,

    /**
     * @private
     */
    _miny: undefined,

    /**
     * @private
     */
    _maxx: undefined,

    /**
     * @private
     */
    _maxy: undefined,

    /**
     * bounding box draw control
     * @private
     */
    _boxCtrl: undefined,

    /**
     * @function
     * @name HSLayers.WPSClient.ComplexField.setInputValue
     */ 
    setInputValue: function() {
        var value = {
                left: this._minx.getValue(),
                bottom: this._miny.getValue(),
                right: this._maxx.getValue(),
                top: this._maxy.getValue()
        };

        if (value.left && value.bottom && value.right && value.top) {
            console.log(this.map.getProjectionObject().getCode());
            this.inoutput.value = {
                crs: this.map.getProjectionObject().getCode(),
                bounds : value
            }; 
        }
        else {
            this.inoutput.value = undefined;
        }
    },

    /**
     * @function
     * @name HSLayers.WPSClient.ComplexField.setValue
     * @param {Object} bbox {minx:FLOAT, miny: FLOAT, maxx: FLOAT, maxy: FLOAT}
     */ 
    setValue: function(bbox) {
        this._minx.setValue(bbox.minx);
        this._miny.setValue(bbox.miny);
        this._maxx.setValue(bbox.maxx);
        this._maxy.setValue(bbox.maxy);
        this.setInputValue();
    },

    /**
     * @function
     */
    getValue: function() {
        this.setInputValue();
        return this.inoutput.value;
    },

    /**
     * @private
     */
    initComponent: function() {

        this._minx = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("East"),
            allowBlank: (this.inoutput.minOccurs > 0 ? false : true),
            width: 75
        });
        this._miny = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("South"),
            allowBlank: (this.inoutput.minOccurs > 0 ? false : true),
            width: 75
        });
        this._maxx = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("West"),
            allowBlank: (this.inoutput.minOccurs > 0 ? false : true),
            width: 75
        });
        this._maxy = new Ext.form.TextField({
            fieldLabel: OpenLayers.i18n("North"),
            allowBlank: (this.inoutput.minOccurs > 0 ? false : true),
            width: 75
        });

        this._drawBoxButton = new Ext.Button({
            text: OpenLayers.i18n("Draw box"),
            listeners: {
                click: this._onDrawBoxClicked,
                scope:this
            }
        });

        var config = {
            fieldLabel: (this.inoutput.title || this.inoutput.identifier) + (this.inoutput.minOccurs > 0 ? "<sup style=\"color:red\">*</sup>" : ""),
            allowBlank: (this.inoutput.minOccurs > 0 ? false : true),
            items: [this._minx,
                    this._miny,
                    this._maxx,
                    this._maxy,
                    this._drawBoxButton
            ]
        };

        Ext.apply(this, Ext.apply(this.initialConfig, config)); 
        HSLayers.WPSClient.BBoxField.superclass.initComponent.apply(this, arguments);

    },

    /**
     * on draw box button clicked handler
     * @private
     */
    _onDrawBoxClicked: function() {
        this._boxCtrl = new HSLayers.Control.DrawBox({onBoxDrawed: this._onDrawBoxDone});
        this._boxCtrl._field = this;
        this.map.addControl(this._boxCtrl);
        this._boxCtrl.activate();
    },

    /**
     * on draw box button done handler
     * @private
     */
    _onDrawBoxDone: function(position) {
        var minXY = this.map.getLonLatFromPixel(
                    new OpenLayers.Pixel(position.left, position.bottom));
        var maxXY = this.map.getLonLatFromPixel(
                    new OpenLayers.Pixel(position.right, position.top));
        this._field._minx.setValue(minXY.lon);
        this._field._miny.setValue(minXY.lat);
        this._field._maxx.setValue(maxXY.lon);
        this._field._maxy.setValue(maxXY.lat);
    },
    
    /**
    * setMap
    * @function
    * @name HSLayers.WPSClient.ComplexField.setMap
    * @param {OpenLayers.Map} ma    
    */
    setMap: function(map)  {
        this.map = map;
    },
    CLASS_NAME: "HSLayers.WPSClient.BBoxField"
});
