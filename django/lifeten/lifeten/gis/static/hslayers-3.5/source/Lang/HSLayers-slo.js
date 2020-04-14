OpenLayers.Lang["sk-SK"] = {
    // OpenLayers
    'unhandledRequest': "Nezpracovaná návratová hodnota ${statusText}",
    'permalink': "Odkaz na aktuálnu mapu",
    "HTML code for web page":"HTML kód pre vloženie do stránky",
    'overlays': "Prekryvné vrstvy",
    'sameProjection': "Prehľadová mapa pracuje správne iba vtedy pokiaľ je v rovnakom súradnicovom systéme ako hlavná mapa",
    'readNotImplemented': "Read nie je implementované.",
    'writeNotImplemented': "Write nie je implementované.",
    'noFID': "Nie je možné aktualizovať prvok, pre ktorý neexistuje FID.",
    'errorLoadingGML': "Chyba pri načítaní súboru GML ${url}",
    'browserNotSupported': "Váš prehliadač nepodporuje vykresľovanie vektorov. Momentálne podporované nástroje sú::\n${renderers}",
    'componentShouldBe': "addFeatures : Komponenta by mala byť ${geomType}",
    'getFeatureError': "getFeatureFromEvent bolo zavolané na vrstve, ktorá nemá vykreslovač. To obyčajne znamená, že " + "ste odstránili vrstvu, ale nie rutinu s ňou asociovanú.",
    'minZoomLevelError': "Vlastnosť minZoomLevel by sa mala používat iba " +
        "s potomkami FixedZoomLevels vrstvami. To znamená, že " +
        "vrstva wfs kontroluje, či minZoomLevel nie je zbytok z minulosti." +
        "Nie je to ovšem možné vybrať bez možnosti, aby sme rozbili " +
        "aplikácie postavené na OL, které by na tom mohli závisieť. " +
        "Preto túto vlastnosť nedoporučujeme používať --  kontrola minZoomLevel " +
        "bude odstránená vo verzi 3.0. Použite prosím " +
        "radšej nastavenie min/max podľa príkladu popísaného na: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",
    'commitSuccess': "WFS Transaction: ÚSPECH ${response}",
    'commitFailed': "WFS Transaction: CHYBA ${response}",
    'googleWarning': "Nepodarilo sa správne načítať vrstvu Google.<br><br>" +
        "Abyste sa zbavili tejto správy, zvoľte inú základnú vrstvu " +
        "v prepínači vrstev.<br><br>" +
        "To sa väčšinou stáva, pokiaľ " +
        "nebol načítaný skript, alebo neobsahuje správny " +
        "kľúč pre API pre túto stránku.<br><br>" +
        "Vývojári: Pre pomoc, aby toto fungovalo správne, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>kliknite sem</a>",
    'getLayerWarning':
        "The ${layerType} Layer was unable to load correctly.<br><br>" +
        "To get rid of this message, select a new BaseLayer " +
        "in the layer switcher in the upper-right corner.<br><br>" +
        "Most likely, this is because the ${layerLib} library " +
        "script was either not correctly included.<br><br>" +
        "Developers: For help getting this working correctly, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>click here</a>",
    'scale': "Mierka = 1 : ${scaleDenom}",
    'layerAlreadyAdded':
        "Pokúsili ste sa pridať vrstvu: ${layerName} do mapy, ale táto vrstva je už v mape načítaná.",
    'reprojectDeprecated':
        "Použil jste volbu 'reproject' " +
        "ve vrstve ${layerName}. Táto voľba nie je doporučená: " +
        "bola tu preto, aby bolo možné zobrazovať údaje z komerčných serverov, " + 
        "ale táto funkcia je teraz zaistená pomocou podpory " +
        "Spherical Mercator. Viac informácií nájdete na " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",
    'methodDeprecated':
        "Táto metóda nie je doporučená a bude odobraná vo verzi 3.0. " +
        "Prosím, použite radšej ${newMethod}.",
    'boundsAddError': "Pre prídavnú funkciu musíte zadať obidve súradnice x a y.",
    'lonlatAddError': "Pre prídavnú funkciu musíte zadať obidve súradnice lon a lat.",
    'pixelAddError': "Pre prídavnú funkciu musíte zadať obidve súradnice x a y.",
    'unsupportedGeometryType': "Nepodporovaný typ geometrie: ${geomType}",
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition selhalo: element s  id ${elemId} je asi umiestnený chybne.",
    'end': 'Koniec',
 
    // Apps.DataObjectList
    "name":"Názov",
    "erase":"Vymazať",
    "showAll":"Zobrazit všetko",

    // Apps.DataObjectProviderMawes
    "noObjectsFound":"Neboli nájdené žiadne objekty",
    
    // Apps.MapViewer
    "mapNavigation": "Pohyb v mape",
    "mapInfo": "Vyhľadať objekty z mapy",
    "mapEraseObjects": "Zmazať vyhľadané objekty",
    "mapPreviousExtent": "Predchádzajúci výrez",
    "mapNextExtent": "Nasledujúci výrez",
    "zoomIn": "Priblížiť",
    "zoomOut": "Oddialiť",
	"Open WMC file": "Otvoriť WMC súbor",
	"New project": "Nový projekt",

    // Apps.FileDialog
	"Local file": "Súbor na disku",
	"File": "Súbor",
	"Cancel": "Zrušiť",

	// Apps.PopupContentManager
    "info":"Info",

    // Apps.SoaMarkers
    "searchedObjects":"Objekty nenájdené",

    // Apps.ViewerAppExt
    "objects":"Objekty",
    "layers":"Vrstvy",
    "map":"Mapa",
    "tools":"Nástroje",
    "searching":"Vyhľadávanie",

    // HSLayers.Control.LayerSwitcher
    "Really remove?":"Skutočne zmazať vrstvu?",
    "Reset project":"Obnoviť projekt",
    "baseLayer":"Základné vrstvy",
    "Show legend":"Zobraziť legendu",
    "Hide legend":"Skryť legendu",
    "Remove layer":"Odobrať vrstvu",
    "Layer metadata":"Metaúdaje vrstvy",
    "Download layer":"Uložiť vrstvu",
    "Transparency":"Priehľadnosť",
    "LayerSwitcher:Confirm":"Potvrdiť",
    "LayerSwitcher:Really remove?":"Skutočne odstrániť vybranú vrstvu?",
    "Layer name":"Meno vrstvy",
    "Scale":"Mierka",
    "Display metadata":"Zobraziť metaúdaje",
    "Data source":"Zdroj údajov",
    "Opacity":"Priehľadnosť",
    "Remove layers":"Odstrániť vrstvy",
    "Remove layers added to the map":"Odstrániť vrstvy pridané do mapy",
    // HSLayers.Control.Measure
    "Distance and Area":"Vzdialenosť a plocha",
    "Total perimeter":"Celkový obvod",
    "Total area":"Celková plocha",
    "Last polygon perimeter":"Obvod posledného polygónu",
    "Last polygon area":"Plocha posledného polygónu",
    "Total distance":"Celková dĺžka",
    "Last line":"Posledná línia",
    "Last segment":"Posledný segment",
    "All":"Všetky",
    "None":"Žiadna",
    "Zoom to layer":"Přiblížiť na vrstvu",
    "Attribution":"Poskytovateľ údajov",

    // HSLayers.Control.Pin
    "Title":"Názov",
    "Description":"Popis",
    "Remove":"Odstrániť",
    "Content":"Obsah",
    "Add to map":"Pridat do mapy",

    // HSLayers.Control.ProjectionSwitcher
    "Projection switcher":"Prepínač projekcií",
    "Zoom to original state":"Zobraziť pôvodný stav",

    // HSLayers.Control.Query
    "Query results":"Výsledky dotazov",
    "Nr. of queryable layers":"Počet dotazovateľných vrstev",
    "Nothing found":"Nič nebolo nájdené",
    "Error":"Chyba",
    "WMS Layer supports only Point query":"Do vrstvy WMS sa je možné dotazovať iba klikom myši - nie obdĺžnikom",
    "Number of queryable layers is ":"Počet dotazovateľných vrstev je",
    "Screen":"Obrazovka",
    "degrees":"stupne",
    "Coordinates":"Súradnice",
    "Click in the map for query":"Kliknite do mapy",

    // HSLayers.InfoPanel
    "Info":"Info",

    // HSLayers.Layer.MapServer
    "errorLoadingHSRS":"Chyba pri načítaní vrstvy MapServer",

    // HSLayers.MapPanel.HistoryButtons
    "Previous":"Predchádzajúci",
    "Next":"Ďalší",

    // HSLayers.MapPanel
    "Type city or place":"Napíšte názov mesta nebo miesta",
    "HSLayers MapPortal Example":"Demo HSLayers Mapový portál",
    "Click to go forward in the history of zooms":"Predchádzajúci výrez",
    "Click to go backwards in the history of zooms":"Nasledujúci výrez",

    // HSLayers.MapViewer
    "New map composition":"Nová mapová kompozícia",
    "Layers":"Vrstvy",
    "Print":"Tlač",
    "Create new map composition":"Vytvoriť novú mapovú kompozíciu",
    "Save":"Uložiť",
    "Save map content to WMC file":"Uložiť mapovú kompozíciu",
    "Save as":"Uložiť ako",
    "Save map content to new WMC file":"Uložiť mapovú kompozíciu do nového súboru WMC",
    "Open":"Otvoriť",
    "Open new map composition":"Otvoriť mapovú kompozíciu",
    "Create Web Map Context file":"Vytvoriť novú mapovú kompozíciu",
    "No title":"Bez nadpisu",
    "Include base layers":"Zahrnúť základné vrstvy",
    "Download":"Uložiť",
    "Clear form":"Vymazať formulár",
    'Overwrite map?':"Prepísať mapu?",
    'Overwrite existing map?':"Prepísať aktuálnu mapu?",
    //"If you click [Yes], overwrite existing map. <br />If you click [No], only new layers will be add to existing map":"Kliknutím na [Ano] smažete aktuální mapovú kompozíciu. <br />Kliknutím na [Ne] budou pouze přidány nové vrstvy do existující mapy.",
    "Overwrite map": "Prepísať mapu",
    "Overwrite current map content with new map composition?":"Prepísať aktuálny obsah mapy novou mapovou kompozíciou?",
    "Add to map": "Pridať do mapy",
    "Are you sure, you want to create new project?<br />All unsaved data will be lost.":"Ste si istí vytvorením nového mapového projektu?<br />Všetky neuložené údaje budú vymazané",

    // HSLayers.OWS.WMS
    "Image format":"Formát obrázkov",
    "Query format":"Formát dotazov",
    "SRS":"Súr. systém",
    "Use tiles":"Dlaždicovať",
    "Tile size":"Veľkosť dlaždice",
    "Resample layer":"Prevzorkovať vrstvu",
    "Map projection and layer projection not match. Add the layer to map and use server-side resampling program?": "Mapová projekcia a projekcia mapy nie sú zhodné. Aj napriek tomu si želáte pridať vrstvu do mapy a použiť serverový program pre jej prevzorkovanie?",

    // HSLayers.OWS
    "OWS":"OWS",
    "WMS":"WMS",
    "WFS":"WFS",
    "Clear":"Vyčistiť",
    "URL":"URL",
    "Connect":"Spojiť",
    "Given URL failed.":"Vložená adresa nie je adresa webovej služby",
    "Codes do not match":"Súradnicový systém mapy a služby nie je zhodný",
    "To map":"Do mapy",
    "Bad layer name": "Nesprávne meno vrstvy",
    "Layer [${layerName}] already exists.<br />Choose another layer name.":"Vrstva [${layerName}] už existuje.<br />Prosím vložte iné meno vrstvy.",

    // HSLayers.Printer
    "Map title":"Nadpis mapy",
    "Paper format":"Formát papiera",
    "Map scale 1":"Mierka 1",
    "Landscape":"Vodorovne",
    "Portrait":"Zvislo",
    "Paper orientation":"Orientácia papiera",
    "Aditional text":"Prídavný text",
    "Image":"Obrázok",
    "Print":"Tlač",
    "Configuring layers for printing":"Nastavujem vrstvy pre tlač",
    "Set map scale":"Nastaviť mierku mapy",

    // HSLayers.SensorPanel
    "selectPhenomenon":"Vybrať fenomén",
    "phenomenon":"Fenomén",
    "dateFrom":"Dátum od",
    "timeFrom":"Čas od",
    "dateTo":"Dátum do",
    "timeTo":"Čas do",
    "generateChart": "Generovať graf",
    "value":"Hodnota",
    "unit":"Jednotka",
    "time":"Čas",
    "actualValues":"Aktuálne hodnoty",
    "chart":"Graf",
    "warning":"Varovanie",
    "allItemsAreRequired":"Sú požadované všetky prvky",

    // HSLayers.Control.Editing
    "saved" : "uložené",
    "deleted" : "zmazané",
    "Edit layer" : "Editačná vrstva",
    "Edit" : "Editácia",
    "Select a layer":"Vyberte vrstvu",
    "Feature":"Prvok",
    "Delete":"Vymazanie",
    "Really remove selected feature?": "Skutočne chcete zmazat vybraný prvok?",
    "Error":"Chyba", 
    "Settings" : "Nastavenie",
    "Units" : "Jednotky",
    "Distance" : "Vzdialenosť",
    "Active" : "Aktívne",
    "Snapping" : "Prichytávanie",
    "Line color" : "Farba línie",
    "Line width" : "Šírka línie",
    "Line" : "Línia",
    "Snap" : "Prichytávať",
    'Snap to self': "Prichytávať na seba",
    'Split': "Zlomiť pri prekrížení",
    "Snap layers" : "Prichytávanie k vrstvám",
    "Snap to self": "Prichytávať multi-objekty",
    "Editing": "Editácia",
    "Split": "Udržovať topológiu",


    // HSLayers.MapPortal
    'Select custom pre-defined scale': "Zvoľte preddefinovanú mierka",
    'Select other CRS, supported by the map':"Zvoľte iný súradnicový systém podporovaný mapou",
    'Pan and zoom in the map using mouse': "Posun a zäčšenie mapy pomocou myši",
    'Measure line lenghts on the map.':"Meranie dĺžok",
    'Measure areas on the map.':"Meranie plôch",
    'Query layers by clicking inthe map':"Dotaz na vrstvy zobrazené v mape",
    'Add custom point with description to the map':"Pridať vlastný bod s popisom do mapy",
    'Previous zoom':"Predchádzajúci výrez",
    'Next zoom':"Nasledujúci výrez",

    // HSLayers.Layer.SearchParser
    "Search Results":"Nájdené",

    // HSLayers.WMCManager
    "Abstract":"Abstrakt",
    "Public":"Verejná",
    'GEMET':"GEMET",
    'Keywords':"Kľúčové slová",
    "Logo":"Logo",
    "Save to disk":"Uložiť na disk",
    "Save to server":"Uložiť na server",
    "Clear":"Vyčistiť",
    "No server response":"Server neposkytol žiadnu odpoveď",
    "File was not be saved to on the server":"Súbor nebol uložený na server",
    "WMC Save error":"Chyba pri ukladaní mapovej kompozície",
    "Person":"Osoba",
    "Organization":"Organizácia",
    "Position":"Pozícia",
    "Address":"Adresa",
    "City":"Mesto",
    "State or Province":"Štát alebo provincia",
    "Postal code":"PSČ",
    "Country":"Štát",
    "Phone":"Telefón",
    "e-mail":"e-mail",
    "Contact information":"Kontaktné informácie",
    "Click to set":"Pre nastavenie kliknite",
    "Choose Image":"Zvoliť obrázok",
    "Get from user profile":"Získať z uživateľského profilu",
    "Saving":"Ukladám",

    // Popup
    "More info": "Viac informácií",
    
    // HSLayers.PrinterForm
    "Print by template": "Tlač podľa šablóny",
    "Template": "Šablóna",
    "Download as file": "Uložiť ako súbor",
    "Print to image": "Tlač do obrázku",
    "Image format": "Formát obrázku",
    
    // HSLayers.PrinterDialog  
    "Print": "Tlač"
    
};
