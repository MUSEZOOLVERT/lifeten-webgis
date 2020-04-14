OpenLayers.Lang["es"] = {
    // OpenLayers
    'unhandledRequest': "Respuesta a petición no gestionada ${statusText}",
    'permalink': "Enlace permanente",
    'HTML code for web page':"Código HTML para la página Web",
    'overlays': "Capas superpuestas",
    'sameProjection': "El mapa de vista general sólo funciona si está en la misma proyección que el mapa principal",
    'readNotImplemented': "Lectura no implementada",
    'writeNotImplemented': "Escritura no implementada",
    'noFID': "No se puede actualizar un elemento para el que no existe FID.",
    'errorLoadingGML': "Error cargando el fichero GML ${url}",
    'browserNotSupported': "Su navegador no soporta renderización vectorial. Los renderizadores soportados actualmente son:\n${renderers}",
    'componentShouldBe': "addFeatures : el componente debe ser del tipo ${geomType}",
    'getFeatureError':
        "getFeatureFromEvent se ha llamado desde una capa sin renderizador. Esto normalmente quiere decir que " +
        "se ha destruido una capa, pero no el manejador asociado a ella.",
    'minZoomLevelError':
    "La propiedad minZoomLevel debe sólo utilizarse " +
    "con las capas que tienen FixedZoomLevels. El hecho de que " +
    "una capa wfs compruebe minZoomLevel es una reliquia del " +
    "pasado. Sin embargo, no podemos eliminarla sin discontinuar " +
    "probablemente las aplicaciones OL que puedan depender de ello. " +
    "Así pues estamos haciéndolo obsoleto --la comprobación " +
    "minZoomLevel se eliminará en la versión 3.0. Utilice el ajuste " +
    "de resolution min/max en su lugar, tal como se describe aquí: " +
    "http://trac.openlayers.org/wiki/SettingZoomLevels",
    'commitSuccess': "Transacción WFS: ÉXITO ${response}",
    'commitFailed': "Transacción WFS: FALLÓ ${response}",
    'googleWarning':
        "La capa Google no pudo ser cargada correctamente.<br><br>" +
        "Para evitar este mensaje, seleccione una nueva Capa Base " +
        "en el selector de capas en la esquina superior derecha.<br><br>" +
        "Probablemente, esto se debe a que el script de la biblioteca de " +
        "Google Maps no fue correctamente incluido en su página, o no " +
        "contiene la clave del API correcta para su sitio.<br><br>" +
        "Desarrolladores: Para ayudar a hacer funcionar esto correctamente, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>haga clic aquí</a>",
    'getLayerWarning':
        "La capa ${layerType} no pudo ser cargada correctamente.<br><br>" +
        "Para evitar este mensaje, seleccione una nueva Capa Base " +
        "en el selector de capas en la esquina superior derecha.<br><br>" +
        "Probablemente, esto se debe a que el script de " +
        "la biblioteca ${layerLib} " +
        "no fue correctamente incluido en su página.<br><br>" +
        "Desarrolladores: Para ayudar a hacer funcionar esto correctamente, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>haga clic aquí</a>",
    'scale': "Escala = 1 : ${scaleDenom}",
    "map":"mapa",
    "Map":"Mapa",
    "maps":"mapas",
    "Maps":"Mapas",
    "Yes":"Sí",
    "No":"No",

//labels for the graticule control
'W': 'O',
'E': 'E',
'N': 'N',
'S': 'S',
'graticule': 'Retícula',

// console message
'layerAlreadyAdded':
"Intentó añadir la capa: ${layerName} al mapa, pero ya había sido añadida previamente",

// console message
'reprojectDeprecated':
"Está usando la opción 'reproject' en la capa " +
"${layerName}. Esta opción es obsoleta: su uso fue diseñado " +
"para soportar la visualización de datos sobre mapas base comerciales, " +
"pero ahora esa funcionalidad debería conseguirse mediante el soporte " +
"de la proyección Spherical Mercator. Más información disponible en " +
"http://trac.openlayers.org/wiki/SphericalMercator.",

// console message
'methodDeprecated':
"Este método es obsoleto y se eliminará en la versión 3.0. " +
"Por favor utilice el método ${newMethod} en su lugar.",

// console message
'boundsAddError': "Debe proporcionar los valores x e y a la función add.",

// console message
'lonlatAddError': "Debe proporcionar los valores lon y lat a la función add.",

// console message
'pixelAddError': "Debe proporcionar los valores x e y a la función add.",

// console message
'unsupportedGeometryType': "Tipo de geometría no soportada: ${geomType}",

// console message
'pagePositionFailed':
"OpenLayers.Util.pagePosition falló: el elemento con id ${elemId} puede haberse colocado de manera errónea.",

// console message
'filterEvaluateNotImplemented': "evaluate no está implementado para este tipo de filtro.",

'end': "Fin",
 
    // Apps.DataObjectList
    'name':"Nombre",
    'erase':"Borrar",
    'showAll':"Mostrar todos",

    // Apps.DataObjectProviderMawes
    "noObjectsFound":"No se ha encontrado objetos",
    
    // Apps.MapViewer
    "mapNavigation": "Movimiento en el mapa",
    "mapInfo": "Localizar objetos en el mapa",
    "mapEraseObjects": "Borrar los objetos de búsqueda",
    "mapPreviousExtent": "Vista anterior",
    "mapNextExtent": "Vista posterior",
    "Open WMC file": "Abrir archivo WMC", 
    "New project": "Nuevo proyecto", 

    // Apps.FileDialog
    "Local file": "Archivo local", 
    "File": "Fichero",
    "Cancel": "Cancelar", 

    // Apps.PopupContentManager
    "info":"Información",

    // Apps.SoaMarkers
    "searchedObjects":"Objetos encontrados",

    // Apps.ViewerAppExt
    "objects":"Objetos",
    "layers":"Capas",
    "tools":"Herramientas",
    "searching":"Buscando",

    // HSLayers.Control.LayerSwitcher
    "Really remove?":"¿Realmente desea borrar?",
    "Reset project":"Resetear proyecto",
    "baseLayer":"Capas base",
    "Show legend":"Mostrar leyenda",
    "Hide legend":"Ocultar leyenda",
    "Remove layer":"Borrar capa",
    "Remove layers":"Borrar capas",
    "Layer metadata":"Metadato de la capa",
    "Download layer":"Descargar capa",
    "Transparency":"Transparencia",
    "LayerSwitcher:Confirm":"Confirmar",
    "LayerSwitcher:Really remove?":"¿Realmente desea borrar?",
    "Layer name":"Nombre de la capa",
    "Scale":"Escala",
    "Display metadata":"Mostrar metadata", 
    "Data source":"Fuente de datos", 
    "Opacity":"Opacidad",
    "Metadata":"Metadatos",

    // HSLayers.Control.Measure
    "Distance and Area":"Distancia y área",
    "Total perimeter":"Perímetro total",
    "Total area":"Área total",
    "Last polygon perimeter":"Perímetro del último polígono",
    "Last polygon area":"Área del último polígono",
    "Total distance":"Distancia total",
    "Last line":"Última línea",
    "Last segment":"Último segmento",

    // HSLayers.Control.Pin
    "Title":"Título",
    "Description":"Descripción",
    "Remove":"Borrar",
    "Content":"Contenido", 
    "Add to map":"Añadir a mapa", 

    // HSLayers.Control.ProjectionSwitcher
    "Projection switcher":"Selector de proyecciones",
    "Zoom to original state":"Zoom al estado original",

    // HSLayers.Control.Query
    "Query":"Consulta",
    "Nothing found":"No se ha encontrado nada",
    "Error":"Error",
    "WMS Layer supports only Point query":"Capas WMS solo soportan consultas puntuales", 

    // HSLayers.InfoPanel
    "Info":"Información",

    // HSLayers.Layer.MapServer
    "errorLoadingHSRS":"Errores al cargar HSRS", 

    // HSLayers.Layer.VectorPOI
    "searchedObjects":"Objetos encontrados",

    // HSLayers.MapPanel.HistoryButtons
    "Previous":"Previo",
    "Next":"Siguiente",

    // HSLayers.MapPanel
    "Type city or place":"Tipo de ciudad o lugar",
    "HSLayers MapPortal Example":"Ejemplo de portal HSLayers",
    "Click to go forward in the history of zooms":"Pinchar para ir a vista posterior", 
    "Click to go backwards in the history of zooms":"Pinchar para ir a vista anterior", 

    // HSLayers.MapViewer
    "New map composition":"Nueva composición de mapas", 
    "Layers":"Capas",
    "Print":"Imprimir",
    "Create new map composition":"Crear una nueva composición de mapas", 
    "Save":"Guardar",
    "Save map content to WMC file":"Guardar el contenido del mapa a un fichero WMC",
    "Save as":"Guardar como", 
    "Save map content to new WMC file":"Guardar contenido del mapa como archivo WMS nuevo",
    "Open":"Abrir",
    "Open new map composition":"Abrir nueva composición de mapas",
    "Create Web Map Context file":"Crear archivo Web Map Context",
    "No title":"Sin título",
    "Include base layers":"Incluir capas base",
    "Download":"Descarga",
    "Clear form":"Limpiar formulario",
    'Overwrite existing map?':"Sobreescribir mapa existente",
    "If you click [Yes], overwrite existing map. <br />If you click [No], only new layers will be add to existing map":"Sí: se sobreescribe el mapa existente.<br />No: sólo las capas nuevas se añadirán al mapa existente",
    "Are you sure, you want to create new project?<br />All unsaved data will be lost.":"¿Desea crear un proyecto nuevo? <br />Todos los datos no guardados se perderán",

    // HSLayers.OWS.WMS
    "Image format":"Formato de la imagen",
    "Query format":"Formato de consulta",
    "SRS":"Sistema de Referencia Espacial",
    "Use tiles":"Usa tiles",
    "Tile size":"Tamaño de los tiles",
    "Resample layer":"Re-muestrear capa",
    "Map projection and layer projection not match. Add the layer to map and use server-side resampling program?": "Las proyecciones de mapa y las de la capa no son iguales. Añade la capa al mapa y utiliza un programa de re-muestreo en el lado del servidor",

    // HSLayers.OWS
    "OWS":"OWS",
    "WMS":"WMS",
    "WFS":"WFS",
    "Clear":"Limpiar",
    "URL":"URL",
    "Connect":"Conectar",
    "Given URL failed.":"URL fallida",
    "Codes do not match":"Los códigos no coinciden",
    "To map":"Llevar al mapa",
    "Bad layer name": "Error en el nombre",
    "Layer [${layerName}] already exists.<br />Choose another layer name.":"La capa [${layerName}] ya existe. Elija otro nombre.",

    // HSLayers.Printer
    "Map title":"Título del mapa",
    "Paper format":"Formato del papel",
    "Map scale 1":"Escala del mapa 1:",
    "Landscape":"Horizontal",
    "Portrait":"Vertical",
    "Paper orientation":"Orientación del papel",
    "Aditional text":"Texto adicional",
    "Image":"Imagen",
    "Print":"Imprimir",
    "Configuring layers for printing":"Configurando las capas para imprimir",
    "Set map scale":"Establecer escala del mapa",
    "Draw area":"Dibujar área",

    // HSLayers.SensorPanel
    "selectPhenomenon":"Seleccionar fenómeno",
    "phenomenon":"Fenómeno",
    "dateFrom":"Desde la fecha",
    "timeFrom":"Desde la hora",
    "dateTo":"Hasta la fecha",
    "timeTo":"Hasta la hora",
    "generateChart": "Generar gráfico",
    "value":"Valor",
    "unit":"Unidad",
    "time":"Hora",
    "actualValues":"Valores reales",
    "chart":"Gráfico",
    "warning":"Advertencia",
    "allItemsAreRequired":"Todos los elementos son requeridos",

    // HSLayers.Control.Editing
    "saved" : "guardado",
    "deleted" : "borrado",
    "Edit layer" : "Editar capa",
    "Edit" : "Editar",
    "Select a layer":"Seleccione una capa",
    "Feature":"Fenómeno",
    "Delete":"Borrar",
    "Really remove selected feature?": "¿Seguro remover fenómeno seleccionado?",
    "Error":"Error", 
    "Settings" : "Ajustes",
    "Units" : "Unidades",
    "Distance" : "Distancia",
    "Active" : "Activo",
    "Snapping" : "Tolerancia",
    "Line color" : "Color de la línea",
    "Line width" : "Ancho de la capa",
    "Line" : "Línea",
    "Snap" : "Tolerancia",
    'Snap to self': "Snap con si mismo",
    'Split': "Partir en dos",
    "Snap layers" : "Snap capas",
    "Snap to self": "Snap con si mismo",
    "Editing": "Edición",

    // HSLayers.MapPortal
    'Select custom pre-defined scale': "Seleccionar escala costumizada predefinida",
    'Select other CRS, supported by the map':"Seleccionar otro Sistema de Referencia de Coordenadas soportado por el mapa",
    'Pan and zoom in the map using mouse': "Mover o hacer zoom en el mapa usando el ratón",
    'Measure line lenghts on the map.':"Medir la longitud de líneas en el mapa",
    'Measure areas on the map.':"Medir áreas en el mapa",
    'Query layers by clicking inthe map':"Consultar información haciendo clic sobre el mapa",
    'Add custom point with description to the map':"Añadir punto en el mapa",
    'Previous zoom':"Vista anterior",
    'Next zoom':"Vista posterior",

    // HSLayers.Layer.SearchParser
    "Search Results":"Resultados de la búsqueda",

    // HSLayers.WMCManager
    "Abstract":"Resumen",
    "Public":"Público",
    'GEMET':"GEMET",
    'Keywords':"Palabras clave",
    "Logo":"Logo",
    "Save to disk":"Guardar al disco",
    "Save to server":"Guardar al servidor",
    "Clear":"Limpiar",
    "No server response":"Sin respuesta del servidor",
    "File was not be saved to on the server":"Archivo no ha sido guardado en el servidor",
    "WMC Save error":"Error al guardar WMC",
    "Person":"Persona",
    "Organization":"Organización",
    "Position":"Posición",
    "Address":"Dirección",
    "City":"Ciudad",
    "State or Province":"Comunidad o provincia",
    "Postal code":"Código postal",
    "Country":"País",
    "Phone":"Teléfono",
    "e-mail":"Dirección electrónica",
    "Contact information":"Información de contacto",
    "Click to set":"Pinchar para definir",
    "Choose Image":"Elegir imagen",
    "Get from user profile":"Získat z uživatelského profilu",
    "Saving":"Ukládám",

    // Popup
    "More info": "Más información",

    // HSLayers.PrinterForm
    "Print by template": "Impresión con plantilla",
    "Template": "Plantilla",
    "Download as file": "Descargar a fichero",
    "Print to image": "Tisk do obrázku",
    "Image format": "Formát obrázku",
    "Extended information": "Información extendida",
    // HSLayers.PrinterDialog  
    "Print": "Impresión",
    "Text": "Texto"
};
