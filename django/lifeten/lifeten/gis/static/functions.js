String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

function wait(state){
  if(state){
    pagesize = getPageSize(); // [pageWidth,pageHeight,windowWidth,windowHeigh]
    $('#spinner').css('top', pagesize[3]/2);
    $('#spinner').css('left', pagesize[4]/2);
    $('#spinner').show();
  }else{
    $('#spinner').hide();
  }
}

///////
//BEGIN LAYER COLORING FUNCTIONS
///////
  function color(){
    return "#000000".replace(/0/g,function(){return (~~(Math.random()*16)).toString(16);});
  }

  function shadeColor(color, percent) {
    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
  }
///////
//END LAYER COLORING FUNCTIONS
///////

///////
//BEGIN NULL VALUE CHECKERS
///////
  function checkNull(value) {
    if (value != null) {
      return "<td>" + value + "</td>";
    } else {
      return "<td></td>";
    }
  }

  function checkNull2(value) {
    if (value == null || value == "None") {
      return "-"
    } else {
      return value;
    }
  }

  function checkNull3(value) {
    if (value == null || value == "None") {
      return ""
    } else {
      return value;
    }
  }

  function checkNullDate(value) {
    if (value != null) {
      var newvalue = value.replace("[datetime.date(", "")
      newvalue = newvalue.replace("), datetime.date(", "  /  ")
      newvalue = newvalue.replace(")]", "")
      newvalue = newvalue.split(", ").join("-")
      return "<td>" + newvalue + "</td>";
    } else {
      return "<td></td>";
    }
  }

  function checkNullHtmlDescr(value){
    if (value != null) {
      return '<div><h4>Descrizione</h4>' + value + '</div>'
    } else {
      return '<div></div>'
    }
  }
///////
//END NULL VALUE CHECKERS
///////

///////
//BEGIN SPECIE'S TABULAR DETAIL 
///////

  function onFeatureSelect(feature, polygon) {
  /**
  * La funzione compone la tabella descrittiva della feature cartografica in essa passata
  * @param {String} feature       
  * @param {String} polygon    
  * @return                    Nessun valore di ritorno: la funzione agisce direttamente sull'HTML tramite di Jquery
  */   
    if (polygon == true) {
      nameTmp = feature.layer.name.replace('Presenza ','')
      nameSplit = nameTmp.split('(')[0]
      nameLayer = $.trim(nameSplit);
    } else {
      nameLayer = feature.layer.name.replace('Dati ','')
    }
    

    // Floating table for "informazione specie" in WebGIS page
    specieTable = '<table id="tablespecie" class="tablesorter">'+
    '<tr>'+
        '<td>Nome scientifico</td>'+
        '<td><b>' + checkNull2(infoSpecie[nameLayer][0].fields.scientificname) + '</td></b>' +
    '</tr>' +
    '<tr>' + 
        '<td>Nome comune</td>' +
        '<td><b>' + checkNull2(infoSpecie[nameLayer][0].fields.vernacularname) + '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>Classe</td>' +
        '<td><b>' + infoSpecie[nameLayer][0].fields.class_field + '</b></td>' + 
    '</tr>' + 
    '<tr>' +
        '<td>Ordine</td>' + 
        '<td><b>' + infoSpecie[nameLayer][0].fields.ordo + '</b></td></tr>' + 
    '<tr>' + 
        '<td>Famiglia</td>' + 
        '<td><b>' + checkNull2(infoSpecie[nameLayer][0].fields.familia) + '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>Genere</td>' + 
    '<td><b>' + checkNull2(infoSpecie[nameLayer][0].fields.genus) + '</b></td>' + 
    '</tr>' +
    '<tr>' + 
        '<td>Grado di minaccia nella lista rossa locale</td>' + 
        '<td><b>';
        switch (checkNull2(infoSpecie[nameLayer][0].fields.redlisttn))
        {
            case 'EX':
            specieTable += 'EX: Estinta';
            break;
            case 'EW':
            specieTable += 'EW: Estinta in natura';
            break;
            case 'CR':
            specieTable += 'CR: In grave pericolo di estinzione';
            break;
            case 'EN':
            specieTable += 'EN: In pericolo di estinzione';
            break;
            case 'VU':
            specieTable += 'VU: Vulnerabile';
            break;
            case 'NT':
            specieTable += 'NT: Quasi minacciata';
            break;
            case 'LC':
            specieTable += 'LC: Nessun pericolo';
            break;
            case 'DD':
            specieTable += 'DD: Nessun dato disponibile';
            break;
            case 'NE':
            specieTable += 'NE: Non valutata';
            break;
            default: "-";        
        }
    specieTable +=
        '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>Grado di minaccia nella lista rossa nazionale</td>' + 
        '<td><b>';
        switch (checkNull2(infoSpecie[nameLayer][0].fields.redlistit))
        {
            case 'EX':
            specieTable += 'EX: Estinta';
            break;
            case 'EW':
            specieTable += 'EW: Estinta in natura';
            break;
            case 'CR':
            specieTable += 'CR: In grave pericolo di estinzione';
            break;
            case 'EN':
            specieTable += 'EN: In pericolo di estinzione';
            break;
            case 'VU':
            specieTable += 'VU: Vulnerabile';
            break;
            case 'NT':
            specieTable += 'NT: Quasi minacciata';
            break;
            case 'LC':
            specieTable += 'LC: Nessun pericolo';
            break;
            case 'DD':
            specieTable += 'DD: Nessun dato disponibile';
            break;
            case 'NE':
            specieTable += 'NE: Non valutata';
            break;
            default: "-";                    
        }
    specieTable +=
        '</b></td>' + 
    '</tr>';      
    // Checks if a specie is in the "Aves" class: in that case only, adds the corresponding directives
    if (infoSpecie[nameLayer][0].fields.class_field == 'Aves')
    {
    specieTable += 
    '<tr>' + 
        '<td>Grado SPEC</td>' + 
        '<td><b>' + checkNull2(infoSpecie[nameLayer][0].fields.spec) + '</b></td></tr>' + 
    '<tr>' + 
        '<td>Grado SPEC, 2004</td>' + 
        '<td><b>' + checkNull2(infoSpecie[nameLayer][0].fields.spec2004) + '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>Direttiva Uccelli</td>' + 
        '<td><b>' + checkNull3(infoSpecie[nameLayer][0].fields.birddir) + '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>Convenzione di Bonn</td>' + 
        '<td><b>' + checkNull3(infoSpecie[nameLayer][0].fields.bon) + '</b></td>';
    } 
    specieTable +=
    '</tr>' + 
    '<tr>' + 
        '<td>Convenzione di Berna</td>' + 
        '<td><b> Allegato ' + checkNull3(infoSpecie[nameLayer][0].fields.berna) + '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>CITES</td>' + 
        '<td><b>' + checkNull3(infoSpecie[nameLayer][0].fields.cites) + '</b></td>' + 
    '</tr>' + 
    '<tr>' + 
        '<td>Direttiva Habitat</td>' +
        '<td><b>'; 
        
    // Allegati direttiva Habitat
    if (infoSpecie[nameLayer][0].fields.habdir_ii == true){
      specieTable += 'Allegato II';
    } else specieTable += '-'
    
    if (infoSpecie[nameLayer][0].fields.habdir_iv == true){
      if (infoSpecie[nameLayer][0].fields.habdir_ii == true){
        specieTable += ', ';
      }
      specieTable += 'Allegato IV';
    } else specieTable += '-'
    
    if (infoSpecie[nameLayer][0].fields.habdir_v == true){
      if (infoSpecie[nameLayer][0].fields.habdir_ii == true || infoSpecie[nameLayer][0].fields.habdir_iv == true){
        specieTable += ', ';
      }
      specieTable += 'Allegato V';
    } else specieTable += '-'

    specieTable += '</b></td></tr></table>';



    specieTable += checkNullHtmlDescr(infoSpecie[nameLayer][0].fields.html_descr);
    instiTable =  '<p>Per la specie ' + nameLayer + 
                  ' i fornitori della totalità dei dati sono i segueti</p><table id="tableinsti" class="tablesorter"><tr><td><b>Nome del dataset</b></td><td><b>Nome dell\'istituzione</b></td><td><b>Referente istituzione</b></td><td><b>Periodo rilievi</b></td></tr>';
    instiPresent = new Array();
    for (var i=0; i < instiSpecie[nameLayer].length; ++i) {
      instiTable += "<tr><td>"+instiSpecie[nameLayer][i].fields.datasetextendedname+"</td><td>"+instiSpecie[nameLayer][i].fields.institutionid[0]+"</td>";
      instiTable += checkNull(instiSpecie[nameLayer][i].fields.institutionid[1]);
      instiTable += checkNullDate(instiSpecie[nameLayer][i].fields.datasetdateinterval);
      if ($.inArray(instiSpecie[nameLayer][i].fields.institutionid[0], instiPresent) == -1) {
        instiPresent.push(instiSpecie[nameLayer][i].fields.institutionid[0]);
      }
    }
    instiTable += '</table><small>Per ottenere informazioni più precise sui dati di una particolare zona cliccare <a href="/viewdata" target="_blank">qui</a> e selezionare la specie e l\'area d\'interesse</small>';
    if (polygon == false) {
      // table for "informazione elemento"
      table = '<table id="tableinfo" class="tablesorter"><tr><td><b>Specie</b></td><td><b>Data</b></td><td><b>Località</b></td><td><b>Numero esemplari</b></td><td><b>Maschi</b></td> <td><b>Femmine</b></td><td><b>Tipologia di rilevamento</b></td><td><b>Programma monitoraggio</b></td><td><b>Nome del dataset</b></td> <td><b>Numero embrioni/uova</b></td> <td><b>Numero larve/girini</b></td> <td><b>Numero giovani</b></td> <td><b>Numero immaturi</b></td> <td><b>Numero subadulti</b></td> <td><b>Numero adulti</b></td> <td><b>Numero coppie</b></td> <td><b>Rilevatori</b></td></tr>';
      for (var i=0; i < feature.cluster.length; ++i){
        table += "<tr><td>"+feature.cluster[i].attributes.specie.split("|")[4]+"</td><td>"+checkNull2(feature.cluster[i].attributes.eventdate)+"</td><td>"+checkNull2(feature.cluster[i].attributes.locality)+"</td><td>"+checkNull2(feature.cluster[i].attributes.individualcount)+"</td><td>"
        if (feature.cluster[i].attributes.sex != "None"){
          sex_split = feature.cluster[i].attributes.sex.split(",");
          table += sex_split[0].replace("[","")+'</td> <td>'+sex_split[1].replace("]","");
        } else {
          table += ' - </td> <td> - ';
        }
        table +=  "</td><td>" + checkNull2(feature.cluster[i].attributes.basisofrecord) + 
                  "</td><td>" + checkNull2(feature.cluster[i].attributes.program) + 
                  "</td><td>" + checkNull2(feature.cluster[i].attributes.datasetid) + 
                  "</td><td>";
        
        if (feature.cluster[i].attributes.lifestage != "None"){
          life = feature.cluster[i].attributes.lifestage.split(",");
            table +=  life[0].replace("[","") + 
                      '</td> <td>' + life[1] + 
                      '</td> <td>' + life[2] + 
                      '</td> <td>' + life[3] + 
                      '</td> <td>' + life[4] + 
                      '</td> <td>' + life[5] + 
                      '</td> <td>' + life[6].replace("]","") + 
                      '</td> <td>';
        } else {
          table += ' - </td> <td> - </td> <td> - </td> <td> - </td> <td> - </td> <td> - </td> <td> - </td> <td>';
        }
        
        table +=  checkNull3(feature.cluster[i].attributes.recorder_1) + 
                  " " + checkNull3(feature.cluster[i].attributes.recorder_2) + 
                  " " + checkNull3(feature.cluster[i].attributes.recorder_3) + 
                  " " + checkNull3(feature.cluster[i].attributes.recorder_4) + 
                  "</td></tr>";
      }
      
      table += "</table>";
    }

  //   $("#credits").text('');
  //   $("#credits").append(credit);
    $("#tableinfo").tablesorter();
    $("#dataspecie").text('');
    $("#dataspecie").append(specieTable);
    $("#datainstitution").text('');
    $("#datainstitution").append(instiTable);
    if (polygon == false) {
      $("#datafeat").text('');
      $("#datafeat").append(table);
    }
    $("#infofeat").dialog('open');
    if (polygon == false) {
      $("#datatabs").tabs("option", "enabled");
    } else {
      $("#datatabs").tabs("option", "disabled", [0]);
      $("#datatabs").tabs("option", "active", 1);
    }
  }
///////
//END SPECIE'S TABULAR DETAIL 
///////

function onFeatureUnselect(feature) {
/**
 * La funzione, alla deselezione di una certa feature cartografica passata ad essa:
 *  - ne chiude l'accordion, se la feature è un elemento dell'accordion e lo stesso è aperto, impostandone lo stato su "disattivato";
 *  - ne rimuove i dati, se la feature è un elemento con dati;
 * @param {String} feature      Un array di stringhe che rappresentano gli identificativi dei bottoni da inizializzare     
 * @param {String} nome       Il nome del layer al quale il bottone è associato
 * @return                    Nessun valore di ritorno: la funzione agisce direttamente sull'HTML tramite di Jquery
*/ 
  $("#accordion").accordion({active:false});
  $("#datafeat").text('');
  if ($("#infofeat").dialog("isOpen")) {
    $("#infofeat").dialog("close");
  }
}


///////
//BEGIN OPENLAYERS RESPONSIVE BUTTON
///////
function setButton(ele, nome){
/**
 * Setta i bottoni di visualizzazione delle mappe alle rispettive icone (rendendoli cliccabili) a seconda che le cartografie siano nascoste o visibili
 * @param {[String]} ele      Un array di stringhe che rappresentano gli identificativi dei bottoni da inizializzare     
 * @param {String} nome       Il nome del layer al quale il bottone è associato
 * @return                    Nessun valore di ritorno: la funzione agisce direttamente sull'HTML tramite di Jquery
*/ 
  var buttons=$(ele);

  $.each(buttons, function(index, obj) { // Per ogni bottone identificato...
    var button_ = $(obj);
    if ( button_.text() == "Visualizza" ) {
      button_.button({                   // "button" è una reserved word di OpenLayers
        label: "Visualizza",
        text: false,
        icons: {
          primary: "showmaps"
        }
      });
    } else {
      button_.button({
        text: false,
        label: "Nascondi",
        icons: {
          primary: "hidemaps"
        }
      });
    }

    button_.click(function() {        // When button is clicked...
      var options;
      
      nome=(this).name;
      vect=map.getLayersByName(nome)[0];
      if ( $( this ).text() == "Visualizza" ) { // "Accende" (setta la visibilità a "true") la mappa
        options = {
          label: "Nascondi",
          text: false,
          icons: {
            primary: "hidemaps"
          }
	       };
        vect.setVisibility(true);
      } else {                                  // "Spegne" (setta la visibilità a "false") la mappa
        options = {
          label: "Visualizza",
          text: false,
          icons: {
            primary: "showmaps"
          }
        };
      vect.setVisibility(false);
      }
      $( this ).button( "option", options );
    });
  });
}
///////
//END OPENLAYERS RESPONSIVE BUTTON
///////

function addLayerToSelect(layer) {
 /**
 * La funzione aggiunge il layer vettoriale ai layer selezionabili, ovvero, nel selectControl di OpenLayers
 *
 * @param {String} layer      Il nome della variabile che contiene l'oggetto layer da aggiungere a quelli selezionabili
 * @return                    Nessun valore di ritorno
*/  
  if (selectControl.layers != null) {
    var newlayers = selectControl.layers;
    } else if (selectControl.layer != null) {
    var newlayers = new Array();
    newlayers.push(selectControl.layer)
    } else {
    var newlayers = new Array();
  }
  
  newlayers.push(layer);
  selectControl.setLayer(newlayers);
}

function addLayerRaster(name, id) {
  nome = "Habitat potenziale " + name + " <small>(Elaborazione Tattoni/MUSE - Azione A3)</small>";
  var nome_clean = "Elaborazione_Tattoni_MUSE__Azione_A3"
  var raster = new OpenLayers.Layer.WMS(nome, "http://217.199.4.93/cgi-bin/lifeten_raster", {
  layers: id,
  transparent: true
  }, {
  isBaseLayer: false,
  path: "LIFE+ T.E.N. data",
  opacity: 0.8
  });
  map.addLayers([raster]);
  $("#elenco_mappe").append('<tr id="'+ nome_clean +'"><td><button class="vis_button" id="'+ nome_clean +'" name="' +  nome +'">Nascondi</button></td><td><button class="rem_button" id="'+ nome_clean +'" name="' +  nome +'">Remove</button></td><td></td><td>'+ nome +'</td></tr>')
//   var OptionRemove = $("<option></option>").text(nome).val(nome);
//   $('#remove').append(OptionRemove);
  setButton(".vis_button#" + nome_clean);
  $( ".rem_button#" + nome_clean ).button({
    text: false,
    label: "Rimuovi",
    icons: {
      primary: "removemaps"
    }
  }).click(function(){
    removeLayer((this).name);
  });
}

function addLayerFrom(name, url, poly, styleColor) {
  if (poly == false) {
    var nome = 'Dati ' + name;
    } else {
    var nome = 'Presenza ' + name + ' (griglia ' + poly + ' km)';
  }
  var nome_clean = nome.replaceAll(' ','_').replaceAll('(','').replaceAll(')','');
  //   var OptionRemove = $("<option></option>").text(nome).val(nome);
  var OptionExport = $("<option></option>").text(nome).val(nome_clean);
  //   $('#remove').append(OptionRemove);
  $('#export_layer').append(OptionExport);
  var kml = new OpenLayers.Protocol.HTTP({
    url: url,
    format: new OpenLayers.Format.GeoJSON()
  });
  var _CallBack = function(resp) {
    if(resp.code == 0) {
      alert(resp.priv._object.response);
      return false;
    }
  };
  
  var response = kml.read({
      callback: _CallBack
  });
  
  if (poly == false) {
    var stylemap = new OpenLayers.StyleMap({
      'default': new OpenLayers.Style({
        strokeColor: "${color}",
        fillColor: "${color}",
        label: "${label}",
        pointRadius: "${width}",
        fontColor: '#000000',
        fontSize: "${size}",
        fontFamily: "Courier New, monospace",
        labelOutlineColor: "white",
        labelOutlineWidth: 2
      }, 
      { 
      context: {
        size: function(feature) {
        featlen = feature.cluster.length;
        if (featlen > 20) {
          return 20 * map.zoom / 10;
        } else if (featlen < 5) {
          return 4 * map.zoom / 10;
        } else {
          return featlen-2 * map.zoom / 10;
        }
      },
      width: function(feature) {
        featlen = feature.cluster.length;
        if (featlen > 20) {
          return 22 * map.zoom / 10;
        } else if (featlen < 5) {
          return 6 * map.zoom / 10;
        } else {
          return featlen * map.zoom / 10;
        }
      },
      label: function(feature) {
        return feature.cluster.length;
      },
      color: function() {
        return shadeColor(styleColor, 20);
      }
    }}),
    'select': new OpenLayers.Style({
      strokeColor: "${color}",
      fillColor: "${color}",
      label: "${label}",
      pointRadius: "${width}"
      }, 
      {
      context: {
        size: function(feature) {
          featlen = feature.cluster.length;
          if (featlen > 20) {
            return 20 * map.zoom / 10;
          } else if (featlen < 5){
            return 4 * map.zoom / 10;
          } else {
            return featlen-2 * map.zoom / 10;
          }
        },
	width: function(feature) {
	  featlen = feature.cluster.length;
	  if (featlen > 20) {
	    return 24 * map.zoom / 10;
	  } else if (featlen < 5) {
	    return 10 * map.zoom / 10;
	  } else {
	    return featlen+4 * map.zoom / 10;
	  }
	},
	label: function(feature) {
	  return feature.cluster.length;
	},
	color: function() {
	  return shadeColor(styleColor, 30);
	}
      }})
    });
    var lifedata = new OpenLayers.Layer.Vector(nome , {
      protocol: kml,
      projection: map.displayProjection,
      strategies: [new OpenLayers.Strategy.Fixed(), new OpenLayers.Strategy.Cluster()],
      visibility: true,
      styleMap: stylemap
    });

    lifedata.events.on({
      "featureselected": function(e) {
	onFeatureSelect(e.feature, false);
      },
      "featureunselected": function(e) {
	onFeatureUnselect(e.feature);
      }
    });
    lifedata.events.register('loadstart', this, onloadstart_poi);
    lifedata.events.register('loadend', this, function(e){
	$("#spinner_poi").hide();
	if (e.object.features.length == 0) {
	  removeLayer(e.object.name);
	} else {
    $("#mappeprogetto").remove('.accordion_text');
	  $("#accordion").find('h3').filter(':contains(Esporta)').show();
	  $("#accordion").find('h3').filter(':contains(Mappe delle singole specie)').show();
	  $( "#accordion" ).accordion({active: 0});
	  $( "#layerswitcher" ).accordion({active: 2});
	  addLayerToSelect(e.object);
	  selectControl.activate();
	}
      }
    );
    $("#elenco_mappe").append('<tr id="'+ nome_clean +'"><td><button class="vis_button" id="'+ nome_clean +'" name="' +  nome +'">Nascondi</button></td><td><button class="rem_button" id="'+ nome_clean +'" name="' +  nome +'">Remove</button></td><td><div style="background-color:'+styleColor+';width:20px;height:20px;border:1px solid #000;border-radius:100%;"></div></td><td>'+ nome +'</td></tr>');
  } else {
    var stylemap_poly = new OpenLayers.StyleMap({
      'default': new OpenLayers.Style({
	strokeColor: "${color}",
	fillColor: "${color}",
	fillOpacity: 0.6
      }, { context: {
	color: function() {
	  return styleColor;
	}
      }
      }),
      'select': new OpenLayers.Style({
	strokeColor: "${color}",
	fillColor: "${color}",
	fillOpacity: 1,
	strokeWidth: 3
      }, { context: {
	color: function() {
	  return shadeColor(styleColor, 10);
	}
      }
      })
    });
    var lifedata = new OpenLayers.Layer.Vector(nome , {
      protocol: kml,
      projection: map.displayProjection,
      strategies: [new OpenLayers.Strategy.Fixed()],
      visibility: true,
      styleMap: stylemap_poly
    });
    lifedata.events.on({
      "featureselected": function(e) {
	onFeatureSelect(e.feature, true);
      },
      "featureunselected": function(e) {
	onFeatureUnselect(e.feature);
      }
    });
    lifedata.events.register('loadstart', this, onloadstart_poly);
    lifedata.events.register('loadend', this, function(e){
	$("#spinner_poly").hide();
	if (e.object.features.length == 0) {
	  removeLayer(e.object.name);
	} else {
	  $("#accordion").find('h3').filter(':contains(Esporta)').show();
    $("#accordion_text").remove();
	  $("#accordion").find('h3').filter(':contains(Mappe delle singole specie)').show();
	  $( "#accordion" ).accordion({active: 0});
	  $( "#layerswitcher" ).accordion({active: 2});
	  addLayerToSelect(e.object);
	  selectControl.activate();
	}
      }
    );
    $("#elenco_mappe").append('<tr id="'+ nome_clean +'"><td><button class="vis_button" id="'+ nome_clean +'" name="' +  nome +'">Nascondi</button></td><td><button class="rem_button" id="'+ nome_clean +'" name="' +  nome +'">Remove</button></td><td><div style="background-color:'+styleColor+';width:20px;height:20px;border:1px solid #000;"></div></td><td>'+ nome +'</td></tr>');
  }
  $( ".rem_button#" + nome_clean ).button({
    text: false,
    label: "Rimuovi",
    icons: {
      primary: "removemaps"
    }
  }).click(function(){
    removeLayer((this).name);
  });
  setButton(".vis_button#" + nome_clean);
  map.addLayers([lifedata]);
}

function onloadstart_poi(evt) {
  $("#spinner_poi").show();
};

function onloadstart_poly(evt) {
  $("#spinner_poly").show();
};

function removeLayer(nome) {
  var nome_clean = nome.replaceAll(' ','_').replaceAll('(','').replaceAll(')','').replaceAll('/','').replaceAll('<small>','');
  $("tr#"+nome_clean).remove();
  // controlla per doppi layer con lo stesso nome
  count=$("#export_layer option[value='" + nome_clean + "']").length;
//   $("#remove option[value='" + nome + "']").remove();
  $("#export_layer option[value='" + nome_clean + "']").remove();
  for (i=1; i<count; i++){
//     var OptionRemove = $("<option></option>").text(nome).val(nome);
    var OptionExport = $("<option></option>").text(nome).val(nome_clean);
//     $('#remove').append(OptionRemove);
    $('#export_layer').append(OptionExport);
  }
  var vlayer = map.getLayersByClass("OpenLayers.Layer.Vector").length
  var vect=map.getLayersByName(nome)[0];
  // rimuove dal select control
  for (i=0; i<selectControl.layers.length; i++) {
    if (selectControl.layers[i].name == vect.name){
      selectControl.layers.splice(i,1);
      break;
    }
  }
  vect.destroy()
  // nasconde il tab esporta
  var mp = $("#elenco_mappe").find('tr')
  if (mp.length == 0) {
    $("#accordion").find('h3').filter(':contains(Mappe delle singole specie)').hide();
    $("#layerswitcher").accordion("option", "active", 0);
  }

  if (vlayer == nLayers) {
    $("#accordion").find('h3').filter(':contains(Esporta)').hide();
  }
}

function ordo(){
  var classe = $('#class').val();
  $('#ordine').remove();
  newform = '<div id="ordine"><table><tr><td><b>Seleziona l\'ordine</b>:</td><td><form><select id="ordo" onchange=\'javascript:familia();\'><option value="default" selected="selected">Seleziona un ordine</option></select></form></td></tr></table></div>';
  $('#classe').append(newform);
  $.getJSON('/returnordo/'+classe, function(data) {
    var length = data.length;
    for(var j = 0; j < length; j++){
      var newOption = $("<option></option>").text(data[j].fields.ordo).val(data[j].fields.ordo);
      $('#ordo').append(newOption);
    }
  });
}

function familia(){
  var ordine = $('#ordo').val();
  $('#familia').remove();
  newform = '<div id="familia"><table><tr><td><b>Seleziona la famiglia</b>:</td><td><form><select id="fami" onchange=\'javascript:genus();\'><option value="default" selected="selected">Seleziona una familia</option></select></form></td></tr></table></div>';
  $('#ordine').append(newform);
  $.getJSON('/returnfamily/' + ordine, function(data) {
    var length = data.length;
    for(var j = 0; j < length; j++){
      var newOption = $("<option></option>").text(data[j].fields.familia).val(data[j].fields.familia);
      $('#fami').append(newOption);
    }
  });
}

function genus() {
  var familia = $('#fami').val();
  $('#genere').remove();
  newform = '<div id="genere"><table><tr><td><b>Seleziona il genere</b>:</td><td><form><select id="genus" onchange=\'javascript:specie();\'><option value="default" selected="selected">Seleziona un genere</option></select></form></td></tr></table></div>';
  $('#familia').append(newform);
  $.getJSON('/returngenus/'+familia, function(data) {
    var length = data.length;
    for(var j = 0; j < length; j++){
      var newOption = $("<option></option>").text(data[j].fields.genus).val(data[j].fields.genus);
      $('#genus').append(newOption);
    }
  });
}

function specie() {
  var genere = $('#genus').val();
  $('#specie').remove();
  newform = '<div id="specie"><table><tr><td><b>Seleziona la specie</b>:</td><td><form><select id="spec" onchange=\'javascript:richiedi();\'><option value="default" selected="selected">Seleziona una specie</option></select></form></td></tr></table></div>';
  $('#genere').append(newform);
  $.getJSON('/returnspecie/'+genere, function(data) {
    var length = data.length;
    for(var j = 0; j < length; j++) {
      var newOption = $("<option></option>").text(data[j].fields.scientificname + ' - ' + data[j].fields.vernacularname).val(data[j].pk);
      $('#spec').append(newOption);
    }
  });
}

function richiedi(){
  var id = $('#spec').val();
  var name = $("#spec option:selected").text();
  polyurl = "/returnpolygonfromspecie/" + id
  var styleColor = color();
  $.getJSON("/returninfofromspecie/" + id, function(data) {
    infoSpecie[name] = data;
    addLayerFrom(name, polyurl, data[0].fields.sensitivity, styleColor);
  });
  $.getJSON("/returnwms/" + name, function(data){
    if (data[0].fields.raster == 1 && user_insti == 5){
      addLayerRaster(name, id);
    }
  });
  $.getJSON("/returninstifromspecie/" + id, function(data) {
    instiSpecie[name] = data;
  });
  if (user_insti && ! user_area) {
    layerurl = "/returnkmlfromspecie/" + id + "/" + user_insti
    addLayerFrom(name, layerurl, false, styleColor);
  } else if (user_insti && user_area) {
    layerurl = "/returnkmlfromspecie/" + id + "/" + user_insti + "/" + user_area
    addLayerFrom(name, layerurl, false, styleColor);
  }  
  $('#ordine').remove();
  $('#class').val(0);
  setButton();
}

function returnBbox(A, T) {
  $.get('/returnbbox/' + A + '/' + T).done(function(data){
    sessvars.area_global = data;
  })
}


function gotoWebgis() {
  sessvars.$.clearMem();
  window.location.assign("/webgis");
}

function exportGeo(){
  nome = $('#export_layer').find(":selected").text();
  format = $('#export_format').find(":selected").text();
  vect = map.getLayersByName(nome)[0];
  url = vect.protocol.url;
  specie = url.split('/')[2];
  if (nome.search('Presenza') != -1){
    window.location.href = '/returnpolygonfromspecie/' + specie + '/' + format + '/True';
  } else {
    if (user_insti && ! user_area) {
      window.location.href = '/export/' + specie + '/' + format + '/True/' + user_insti;
    } else if (user_insti && user_area) {
      window.location.href = '/export/' + specie + '/' + format + '/True/' + user_insti + '/' + user_area;
    }
  }
}


function zoomToArea(area,type){
    var selValue = area.options[area.selectedIndex].value;

    $.get('/returnbbox/' + selValue + '/' + type).done(function(text){
      extent = text.split(",").map(Number);
      map.zoomToExtent(extent);
    });
}
  
