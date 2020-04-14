Ext4.define('HSLayers.ContextBrowser.Model', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: 'uuid',
            mapping: "id",
            type:"string"
        },
        'title',
        'abstract',
        {
            name:'extent',
            type: Ext4.data.Types.Extent
        },
        {
            name:'time',
            mapping: 'updated',
            type: 'date',
            dateFormat:"Y-m-d\\TH:i:s"
        }
    ],
    idProperty: 'id'
});


// Add a new Field data type which stores a VELatLong object in the Record.
Ext4.data.Types.Extent = {
    convert: function(v, data) {
        return new OpenLayers.Extent(data[0],data[1],data[2],data[3]);
    },
    type: 'Extent'
};
