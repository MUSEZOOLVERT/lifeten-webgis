var availableSpecie, availableGenere, datatable, pagesize, area, type, document_title;

function init(){
	document_title = document.title;
	sessvars.$.clearMem();
	pagesize = getPageSize();
	// Popola la lista delle aree protette
	$.getJSON('/returnlistaree/', function(data){
		for(var j = 0; j < data.length; j++){
			var newOption = $("<option></option>").text(data[j].fields.nome + ' ('+data[j].fields.tipo+')').val(data[j].pk);
	    $('#area').append(newOption);
	  	}
	});
	// Popola la lista dei comuni
	$.getJSON('/returnlistcomuni/', function(data){
	  for(var j = 0; j < data.length; j++){
	    var newOption = $("<option></option>").text(data[j].fields.nome).val(data[j].pk);
	    $('#comune').append(newOption);
	  }
	});
	$('#spinner').hide();
}



function table(){
	// INIZIO HEADER TABELLA //
	// NOME COMUNE, NOME SCIENTIFICO, GENERE, FAMIGLIA, ORDINE, CLASSE
    head = 'Lista delle specie per '
    head_area = ''
    datatable = '<table id="hor-zebra" class="tablesorter"> <thead> <tr  id="hor-zebra"> <th>Nome comune</th> <th>Nome scientifico</th> <th>Genere</th> <th>Familia</th> <th>Ordine</th> <th>Classe</th> </tr> </thead><tbody>'
    
    if($('#comune').val() == undefined) {
	    if ($('#area').val() != 'default'){
			area = $('#area').val();
			type = 'park';
			area_name = $('#area').find(":selected").text()
			head_area = ' per l\'area protetta <b>' + area_name + '</b>';
			$('#area').val(0);
			returnBbox(area, type)
	    } 
	    else {
			area = 'default';
	    }
	} else {
	    if ($('#area').val() != 'default' && $('#comune').val() != 'default'){
			alert('Selezionare solo uno tra areee protette e comuni');
			return 0;
	    } 
	    else if ($('#area').val() != 'default'){
			area = $('#area').val();
			type = 'park';
			area_name = $('#area').find(":selected").text()
			head_area = ' per l\'<b>area protetta ' + area_name + '</b>';
			$('#area').val(0);
			returnBbox(area, type)
	    } 
	    else if ($('#comune').val() != 'default'){
			area = $('#comune').val();
			type = 'muni';
			area_name = $('#comune').find(":selected").text()
			head_area = ' per il <b>comune ' + area_name + '</b>';
			$('#comune').val(0);
			returnBbox(area, type)
	    } 
	    else {
		area = 'default';
	    }		
	};
    
    $("#datatable").text('');
    $("#export").remove();
    $("#goto").remove();
    $("#datirequest").text()
    head = head + head_area;
    wait(true);
    // FINE HEADER TABELLA //

    // INIZIO DATI TABELLA //
    // Lista delle specie all'interno dell'area/comune
    $.getJSON('/returnlistspecie/' + area + '/' + type).done(function(data){
		for(var j = 0; j < data.length; j++){
		// NOME COMUNE, NOME SCIENTIFICO, GENERE, FAMIGLIA, ORDINE, CLASSE
		datatable += '<tr><td>'+checkNull2(data[j].fields.vernacularname)+'</td> <td>'+data[j].fields.scientificname+'</td> <td>'+data[j].fields.genus+'</td> <td>'+checkNull2(data[j].fields.familia)+'</td> <td>'+data[j].fields.ordo+'</td> <td>'+data[j].fields.class_field+'</td> </tr>';
	}

	datatable += '</tbody></table>';
	$("#datatable").append(head);
	$("#datatable").append(datatable);
	$("#hor-zebra").tablesorter({
		scrollHeight: pagesize[3] - 310,
		widgets: ['zebra']
	});
	// FINE DATI TABELLA //

	// Zoom all'area
	if (area_name != 'default') {
		var addr;
		if(area_name.indexOf('UNESCO')!=-1) {
			addr = "http://webgis.muse.it/webgis?layers=BTFFFFFTFFFFFFFFFFFFFFFT";
		} else if(area_name.indexOf('Biotopo')!=-1) {
			addr = "http://webgis.muse.it/webgis?layers=BTFFFFFFFFTFFFFFFFFFFFFT";
		} else if(area_name.indexOf('ZPS')!=-1) {
			addr = "http://webgis.muse.it/webgis?layers=BTFFFFFFTFFFFFFFFFFFFFFT";
		} else if(area_name.indexOf('SIC')!=-1) {
			addr = "http://webgis.muse.it/webgis?layers=BTFFFFTFFFFFFFFFFFFFFFFT";
		}
		$("#selectors").append('<td><a id="goto" href="' + addr + '" class="button">Vai a ' + area_name + '</a></td>');
	}
	// Esportazione dati, tramite la view returnlistspecie
	$("#selectors").append('<td><a id="export" href="javascript:exportData()" class="button">Esporta dati</a></td>')

	$( "a.button" ).button();
	wait(false);
    
    }).fail(function(data){
		wait(false);
		alert(data.responseText);
    });

}


    
// returnlistspecie restituisce di default un CSV, se JSON non è specificato!
function exportData() {
    window.location.href = '/returnlistspecie/' + area + '/' + type + '/True'
}
