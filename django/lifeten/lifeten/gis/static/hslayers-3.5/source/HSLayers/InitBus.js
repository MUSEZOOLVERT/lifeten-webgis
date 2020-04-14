/* Copyright (c) 2007-2009 Help Service - Remote Sensing s.r.o.
 * Author(s): Jachym Cepicky <jachym bnhelp cz>
 *
 * This file is part of HSLayers.
 *
 * HSLayers is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * HSLayers is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 *  See http://www.gnu.org/licenses/gpl.html for the full text of the 
 *  license.
 */
HSLayers.namespace("HSLayers.InitBus");

/**
 * InitBus is array of functions, which will be executed one-after-another
 * If the function needs XmlHttpRequest call, it will be running in a
 * assynchronous way.
 *
 * Purpose of the bus is to initialize the map components in organized way
 *
 * How it works:
 *
 * 1. use *register* for creating _fncs list of functions
 * 2. use *run* for calling each function
 * 3. first function will be called
 * 4. if the function is simple (no object && event is given), call it
 *    directly. When the function is done, 'function_done' event is
 *    triggered - _runFromEvent is called
 * 5. _runFromEvent is looking after index of next function in the bus and
 *    calling next function (run(idx))
 * 6. In case, the configuration of the function is object with event, the
 *    given event will be registered, so that after it is triggered,
 *    _runFromEvent will be called
 *
 * @class
 * @name HSLayers.InitBus
 * @augments OpenLayers.Class
 *
 * @example
 * var bus = new HSLayers.InitBus();
 *
 *      // register funciton, which is part of object, which will return DONE event
 *      bus.register(some_function, {
 *              object: object
 *              event: "DONE",
 *              scope: object // scope, the used for the function
 *      });
 *
 *      // register simple function
 *      bus.register(simple_function,{
 *              scope: some_object
 *      });
 *
 *      // run the bus
 *      bus.run();
 */
HSLayers.InitBus = OpenLayers.Class({

    /**
     * @private
     * @name HSLayers.InitBus.EVENT_TYPES
     */
    EVENT_TYPES: ["run","done","running","function_done"],

    /**
     * The InitBus was lounched to run
     * @name HSLayers.InitBus.run
     * @event
     */
    /**
     * All functions were called and are finished
     * @name HSLayers.InitBus.done
     * @event
     */
    /**
     * One particular function is to be lounched now
     * @name HSLayers.InitBus.running
     * @event
     */
    /**
     * Function is done, go to another
     * @name HSLayers.InitBus.function_done
     * @event
     */

    /**
     * events list of events
     * @type [OpenLayers.Events]
     */
    events: undefined,

    /**
     * Initialize
     * @constructor
     * @name HSLayers.InitBus.initialize
     * @param {Object} options
     */
    initialize: function(options) {

        OpenLayers.Util.extend(this, options);
        this.events = new OpenLayers.Events(this, null, this.EVENT_TYPES);
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME + "_");
        this._fncs = [];

        this.events.register("function_done",this,this._run_next);
    },

    /**
     * register new function. obj and evt parameters are optional and are
     * to be used only, if the function will be called in asynchronous way
     * (using ajax).
     *
     * @name HSLayers.InitBus.register
     * @function
     * @param {Function} fnc function to be executed
     * @param {Object} config configuration object
     * @param {Object} config.object which will call event, that will indicated, that the function is done
     * @param {String} config.evt event name, that will indicate, that the function is done
     * @param [{String}] config.args list of arguments
     * @param {Object} config.scope scope of the call
     */
    register : function(fnc,config) {
        this._fncs.push([fnc,config]);
    },

    /**
     * register new function at specified position. obj and evt parameters are optional and are
     * to be used only, if the function will be called in asynchronous way
     * (using ajax).
     *
     * @name HSLayers.InitBus.registerAt
     * @function
     * @param {Function} fnc function to be executed
     * @param {Integer} position default -1 (last one)
     * @param {Object} config configuration object
     * @param {Object} config.object object which will call event, that will indicated, that the function is done
     * @param {String} config.evt event name, that will indicate, that the function is done
     * @param [{String}] config.args list of arguments
     * @param {Object} config.scope of the call
     */
    registerAt : function(fnc,position,config) {
        position = position || -1;

        position = (position == -1 ? this._fncs.length : 0);

        this._fncs.splice(position, 0, [fnc,config]);
    },

    /**
     * unregister registered function
     *
     * @name HSLayers.InitBus.unregister
     * @function
     * @param {Function} fnc function to be executed
     * @param {Object} config
     * @param {Object} config.object object which will call event, that will indicated, that the function is done
     * @param {String} config.evt event name, that will indicate, that the function is done
     * @param [{Mixed}] config.args list of arguments
     * @param {Object} config.scope of the call
     */
    unregister : function(fnc,config) {
        // we will search the registered function index
        // initialize index on -1
        var idx = -1;

        for (var i = 0, len = this._fncs.length; i < len; i++) {
            var registered = this._fncs[i];
            if (registered[0] == fnc && registered[1] == config) {
                idx = i;
                break;
            }
        }
        if (idx > -1) {
            this._fncs.splice(idx,1);
        }
    },

    /**
     * run the list of registered functions
     *
     * @function
     * @name HSLayers.InitBus.run
     * @param {Integer} idx index of the function to call. 0 is default
     * @triggers run
     * @triggers done
     */
    run: function(idx) {
        idx = idx || 0;


        if (idx < this._fncs.length) {
            this.events.triggerEvent("run",{idx:idx, fnc: this._fncs[idx], bus: this});
            this._runfnc(this._fncs[idx]);
        }
        else {
            this.events.triggerEvent("done",{bus: this});
        }
    },

    /**
     * run function from event
     * @private
     */
    _runFromEvent: function(e) {

        var fnc = e.fnc[0];
        var config = e.fnc[1];

        if (config.object && config.event) {
            // unregister the event in the openlayers way
            if (config.object instanceof OpenLayers.Class) {
                config.object.events.unregister(config.event, {bus:this,fnc:fnc}, this._on_function_done_event);
            }
            // unregister the event in the Ext way
            if (window.Ext && config.object instanceof Ext.Observable) {
                config.object.un(config.event, this._on_function_done_event, {bus:this,fnc:fnc});
            }
        }

        // search the already completed function
        // and run next one (i+1)
        for (var i = 0; i < this._fncs.lengt; i++) {
            if (this._fncs == e.fnc) {

                // call next function
                this.run(i+1);
                break;
            }
        }
    },

    /**
     * run registered function
     *
     * @function
     * @private
     * @param {Array} fnc [function, object, event]
     * @name HSLayers.InitBus._runfnc
     */
    _runfnc: function(fnc) {

        var fnction = fnc[0];
        var config = fnc[1] || {};

        // register the event 
        if (config.object && config.event) {
            // register the event in the openlayers way
            if (config.object instanceof OpenLayers.Class ||
                config.object instanceof OpenLayers.Control) {
                config.object.events.register(config.event, {bus:this,fnc:fnc}, this._on_function_done_event);
            }
            // register the event in the Ext way
            if (window.Ext && config.object instanceof Ext.util.Observable) {
                config.object.on(config.event, this._on_function_done_event, {bus:this,fnc:fnc});
            }
        }
        
        // call the function
        if (config.scope){
            fnction.apply(config.scope,config.args || []);
        }
        else {
            fnction.apply(this,config.args || []);
        }

        // call the event directly, do not wait
        if (!(config.object && config.event)) {
            this.events.triggerEvent("function_done",{fnc:fnc});
        }
    },

    /**
     * @private
     */
    _on_function_done_event: function(e) {
        // this is {bus: HSLayers.InitBus, fnc: function}
        this.bus.events.triggerEvent("function_done", {fnc: this.fnc});
    },

    /**
     * @private
     */
    _run_next: function(e) {
        var idx = this._fncs.indexOf(e.fnc)+1;
        this.run(idx);
    },

    CLASS_NAME: "HSLayers.InitBus"
});
