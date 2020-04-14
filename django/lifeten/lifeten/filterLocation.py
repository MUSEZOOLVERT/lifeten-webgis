def returnOverlappingLocations(request, specie, idParco=Null,idComune=Null,parcoFirst=Null):
	"""
	Ritorna una lista di aree protette o di comuni, filtrata nel primo caso
	sui comuni e nel secondo sulle aree protette. Il tutto chiaramente funziona se si è primariamente verificato che 
	sia 'idParco' che 'idComune' siano stati compilati (selezionati dal menu dropdown), sperabilmente tramite JQuery.
	In caso contrario, si fa un fallback solo sull'area protetta o solo sul comune.

	:param request: la richiesta HTTP, che NON deve essere passata
	:param request: il nome della specie sulla quale 
	:param idParco: il codice identificativo dell'area protetta
	:param idComune: il codice identificativo del comune
	:param parcoFirst: valore booleano che indica se il parco è stato selezionato per primo
	"""

	parks = returnLocationsFilteredBySpecie(specie, idArea, "park", json='FALSE')
	munis = returnLocationsFilteredBySpecie(specie, idArea, "muni", json='FALSE')	
	# Se l'utente ha selezionato prima il parco, un opportuno controllo di Jquery deve passare TRUE a questa variabile
	if parcoFirst:
		# Immagazzina in una variabile tutto il modello di Django (geometria compresa) relativo al parco con l'ID indicato
		parco = _checkArea(idParco, "park")
		# Filtra i comuni disponibili sul parco selezionato ...
		filtrati = Comuni.objects.values_list("nome", flat=True).filter(geom__intersects=parco['geom'])
		filtrati = [elem for elem in filtrati if filtrati in munis]
		# ... quindi ritorna in JSON i nomi dei soli comuni che risiedono all'interno di quel dato parco
		# Nel caso contrario, l'utente ha selezionato prima un certo comune, quindi desidera una lista con selezionabili i soli parchi intersecanti con quel dato comune
	else:
		comune = _checkArea(idComune, "muni")
		filtrati = AreeProtette.objects.values_list("nome", flat=True).filter(geom__intersects=comune['geom'])
		filtrati = [elem for elem in filtrati if filtrati in parks]
	# TEORICAMENTE se questa funzione fa quel che deve non dovrebbe essere necessario creare nulla di nuovo, solo dire a JQuery di usare come area l'ultima selezionata 
	# tra le due liste! 	
	return HttpResponse(serializers.serialize("json",filtrati.order_by('nome'),indent=4,use_natural_keys=True))

def returnLocationsFilteredBySpecie(request, specie, idArea, areaType, json=Null):
	"""
	Ritorna una lista di aree che contengono la specie selezionata.

	:param request: la richiesta HTTP, che NON deve essere passata
	:param specie: il nome della specie in basa alla quale si vuole eseguire il filtro
	:param idArea: il codice identificativo dell'area di interesse
	:param areaType: il tipo di area interessata dal filtro (aree_protette='park' o comuni='muni')
	:param json: indica se la funzione deve o meno ritornare un JSON dei risultati
	"""
	spec = _checkNameType(specie)
    pk = spec.values()[0]['species_pk']
	
	area = _checkArea(idArea, areaType)
	if areaType = "park":
		locationsFilteredBySpecie = AreeProtette.objects.values_list("nome", flat=True).filter(geom__intersects=Occurrence.objects.select_related().filter(specie__exact=pk))
	else if areaType = "muni":
		locationsFilteredBySpecie = AreeProtette.objects.values_list("nome", flat=True).filter(geom__intersects=Occurrence.objects.select_related().filter(specie__exact=pk))

	if json:
		return HttpResponse(serializers.serialize("json",locationsFilteredBySpecie.order_by('nome'),indent=4,use_natural_keys=True))
	else:
		return locationsFilteredBySpecie
