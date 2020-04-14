# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from lifeten.gis.models import Occurrence, Species, AreeProtette, Comuni
from lifeten.gis.models import Datasetinfo, Grid1X1, AreeEnte, Institutioninfo
from django.core import serializers
from django.db.models import Q
#from vectorformats.Formats import Django, GeoJSON
import operator

import cStringIO
import csv
import codecs
from types import UnicodeType

import logging
logger = logging.getLogger(__name__)
from lifeten.gis.export import ShpResponder, formats





def dataFromSpecieByArea(request, specie, ecsv=False, areas=None):
    """Ritorna le occurence in json, filtrate sull'intersezione di tutte le coppie [area,tipo] in ingresso

    :param request: la richiesta http (non deve essere passata)
    :param specie: il nome della specie
    :param areas: le aree assegnate, nella forma di un dizionario
    :param tipe: la tipologia dell'area (muni o park)
    :param ecsv: se dev'essere esportato come CSV o meno
    """
    spec = _checkNameType(specie)
    pk = spec.values()[0]['species_pk']
    outName = specie.replace("'", "").replace(' ', '_')
    if areas == 'default' or not areas:
        risultati = Occurrence.objects.select_related().filter(specie__exact=pk)
    else:
        risultati = Occurrence.objects.select_related().filter(specie__exact=pk)
        pieces = areas.split('/') # Even elements are the areas IDs, odd elements are the types

        
        i=0
        areaIDS = "IDS"
        areaTYPES = "TYPES"

        while i < len(pieces):
          area = _checkArea(i, i+1)
          outName = '%s_%s' % (outName, area['nome'].replace("'", "").replace(' ', '_'))
          risultati = risultati.filter(wkb_geometry__contained=area['geom'])
          
          areaIDS = areaIDS + "," + pieces(i)
          areaTYPES = areaTYPES + "," + pieces(i+1)
          i=i+2

    if risultati.count() == 0:
        return HttpResponse("Nessun elemento per la specie richiesta trovato",
                            status=500)
    else:
        if ecsv:
            response = HttpResponse(mimetype='text/csv')
            response['Content-Disposition'] = 'attachment; filename=%s.csv' % outName
            writer = UnicodeWriter(response)
            writer.writerow(['SPECIE', 
                              'DATA', 
                              'NUMERO ESEMPLARI',
                              'TIPO RILEVAMENTO',
                              'PROGRAMMA MONITORAGGIO',
                              'MASCHI',
                              'FEMMINE'])
            writer.writerows(risultati.extra({'male': 'sex[0]',
                                              'female': 'sex[1]'}).values_list(
                                              'specie', 'eventdate',
                                              'individualcount',
                                              'basisofrecord',
                                              'monitoringprogramme',
#                                              'coordinateuncertaintyinmeters',
                                              'male', 
                                              'female'
                                              ).order_by('eventdate'))
            return response
        else:
            return HttpResponse(serializers.serialize("json",
                                                      risultati.order_by('eventdate'),
                                                      indent=4,
                                                      use_natural_keys=True))


def returnContainedAreas(request,idArea=None,areaType=None,filterOn=None):
    """Ritorna un file json che contiene i nome delle aree protette

    :param request: la richiesta http (non deve essere passata)
    """
       
    if idArea == 'default' or not idArea:
      return HttpResponse("Ritorno la specie per tutto il Trentino", status=500)
    elif areaType!= ('muni' or 'park'):
      return HttpResponse("I tipi di area specificabile sono solo le aree protette ('park') o le municipalita' ('muni')", status=500)
    else:
      if filterOn == 'default' or not filterOn:
        return HttpResponse("E' necessario specificare un tipo di aree sulle quali effettuare il filtraggio", status=500)
      elif filterOn!= ('muni' or 'park'):
        return HttpResponse("I tipi di area specificabile sono solo le aree protette ('park') o le municipalita' ('muni')", status=500)
      else:
        if filterOn == areaType:
          area = area = _checkArea(idArea,areaType)
          return HttpResponse(serializers.serialize("json", area, fields=('nome','tipo'))) # Filtrare un'area su un'altra area dello stesso tipo ritorna l'area stessa....
        else:  
          area = _checkArea(idArea,areaType)
          aree = json.loads(returnRawAreas(filterOn))
          
          if filterOn == 'muni':
            aree_filtered = aree.filter(wkb_geometry__contained=area['wkb_geometry']) # MUST HAVE 'wkb_geometry' FIELD FOR EVERY MODEL DEFINITION! 
          else:
            aree_filtered = aree.filter(wkb_geometry__contained=area['geom'])

    return HttpResponse(serializers.serialize("json", aree_filtered, fields=('nome','tipo')))





def returnRawAreas(request,areaType=None):
    """Ritorna un file json che contiene i nome delle aree a seconda del tipo assegnato

    :param request: la richiesta http (non deve essere passata)
    """

    if areaType == 'default' or not areaType:
      return HttpResponse("E' essenziale specificare se si vuole la lista dei parchi naturali o delle aree", status=500)
    elif areaType == 'park':
      aree = AreeProtette.objects
    elif areaType == 'muni':
      aree = Comuni.objects
    else:
      return HttpResponse("I tipi di area specificabile sono solo le aree protette ('park') o le municipalita' ('muni')", status=500)  

    return HttpResponse(serializers.serialize("json", aree, fields=('nome','tipo','wkb_geometry')))
