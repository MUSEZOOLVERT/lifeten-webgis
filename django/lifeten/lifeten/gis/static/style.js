style_comuni = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    fillOpacity: 0,
    strokeColor: '#000000',
    strokeWidth: 1.5,
    strokeDashstyle: "dashdot"
  }),
  'select': new OpenLayers.Style({
    fillOpacity: 0,
    strokeColor: '#000000',
    strokeWidth: 3,
    strokeDashstyle: "dashdot"
  })
})

style_provi = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    fillOpacity: 0,
    strokeColor: '#000000',
    strokeWidth: 1.5
  }),
  'select': new OpenLayers.Style({
    fillOpacity: 0,
    strokeColor: '#000000',
    strokeWidth: 3
  })
})

style_valli = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    fillOpacity: 0,
    strokeColor: '#000000',
    strokeWidth: 1.5,
    strokeDashstyle: "dash"
  }),
  'select': new OpenLayers.Style({
    fillOpacity: 0,
    strokeColor: '#000000',
    strokeWidth: 3,
    strokeDashstyle: "dash"
  })
})

style_aree = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    strokeColor: '#1E4D2B',
    fillOpacity: 0,
    strokeWidth: 2
  },{
    rules: [
      new OpenLayers.Rule({
        minScaleDenominator: 300000,
	label: "${nome}"
      })
    ]
  }),
  'select': new OpenLayers.Style({
    strokeColor: '#1E4D2B',
    fillOpacity: 0,
    strokeWidth: 4
  },{
    rules: [
      new OpenLayers.Rule({
        minScaleDenominator: 300000,
	label: "${nome}"
      })
    ], context: {
      label: function(feature) {
	return feature.cluster.length;
      }
    }
  })
})

style_dolo = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    strokeColor: '#A52A2A',
    fillOpacity: 0,
    strokeWidth: 2
  }),
  'select': new OpenLayers.Style({
    strokeColor: '#A52A2A',
    fillOpacity: 0,
    strokeWidth: 4
  })
})

style_riserve = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    strokeColor: '#FF4F00',
    fillOpacity: 0,
    strokeWidth: 2
  }),
  'select': new OpenLayers.Style({
    strokeColor: '#FF4F00',
    fillOpacity: 0,
    strokeWidth: 4
  })
})

style_rete = new OpenLayers.StyleMap({
  'default': new OpenLayers.Style({
    strokeColor: '#E30022',
    fillOpacity: 0,
    strokeWidth: 2
  }),
  'select': new OpenLayers.Style({
    strokeColor: '#E30022',
    fillOpacity: 0,
    strokeWidth: 4
  })
})