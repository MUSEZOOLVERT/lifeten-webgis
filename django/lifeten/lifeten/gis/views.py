# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from lifeten.gis.models import Occurrence, Species, AreeProtette, Comuni, Ato, Comunita
from lifeten.gis.models import Datasetinfo, Grid1X1, AreeEnte, Institutioninfo
from django.core import serializers
from django.db.models import Q
import operator

import cStringIO
import csv
import codecs
from types import UnicodeType

import logging
logger = logging.getLogger(__name__)
from lifeten.gis.export import ShpResponder, formats


class UnicodeWriter:
    """
    Una classe per scrive un file CSV.
    """

    def __init__(self, f, encoding="utf-8", **kwds):
        """
        Inizializzazione della classe

        :param f: oggetto file
        :param encoding: la codifica che si vuole utilizzare, di default 'utf-8'
        """
        # Redirect output to a queue
        self.queue = cStringIO.StringIO()
        self.writer = csv.writer(self.queue, **kwds)
        self.stream = f
        self.encoder = codecs.getincrementalencoder(encoding)()

    def writerow(self, row):
        """Scrive la singola riga del file CSV

        :param row: lista contenente i valori da scrivere
        """
        listValues = []
        for s in row:
            if type(s) == UnicodeType:
                listValues.append(s.encode("utf-8"))
            else:
                listValues.append(s)
        self.writer.writerow(listValues)
        #self.writer.writerow([s.encode("utf-8") for s in row])
        # Fetch UTF-8 output from the queue ...
        data = self.queue.getvalue()
        data = data.decode("utf-8")
        # ... and reencode it into the target encoding
        data = self.encoder.encode(data)
        # write to the target stream
        self.stream.write(data)
        # empty queue
        self.queue.truncate(0)

    def writerows(self, rows):
        """Scrive diverse righe nel file

        :param rows: lista di liste contenente i valori
        """
        for row in rows:
            self.writerow(row)


def _checkArea(idArea, areaType):
    """Ritorna la geometria da usare in base ad id e tipologia

    :param idArea: id of area
    :param tipe: type of area (accepted values are park and muni)
    """
    #:rtype: area or False
    if areaType == 'park':
        area = AreeProtette.objects.filter(id__exact=idArea).values()
    elif areaType == 'muni':
        area = Comuni.objects.filter(id__exact=idArea).values()
    if len(area) != 1:
        return False
    else:
        return area[0]


def _checkSensitivity(val):
    """Ritorna il nome della griglia chilometrica da utilizzare
    TODO: rendere la funzione più flessibile, facendole accettare in input qualsiasi valore e quindi creando una
    griglia ad hoc che abbia per lato quel valore.

    :param val: lato della griglia in chilometri (1,5 o 10)
    """
    if val == 1:
        return "grid_1x1"
    elif val == 5:
        return "grid_5x5"
    elif val == 10:
        return "grid_10x10"


def _checkNameType(specie):
    """Ritorna gli identificativi di una specie (nome scientifico, altrimenti nome comune, altrimenti chiave primaria)

    :param specie: nome o id della specie
    """
    risultati = Species.objects.filter(scientificname__exact=specie)
    if risultati.count() == 0:
        risultati = Species.objects.filter(vernacularname__exact=specie)
    if risultati.count() == 0:
        risultati = Species.objects.filter(species_pk__exact=specie)
    return risultati


def _checkMimetype(outformat):
    """Ritorna il mimetype per ogni tipologia di formato di output

    :param outformat: GIS output format, values supported:
        GeoJSON, GML, KML, ESRI Shapefile
    """
    if outformat == 'GeoJSON':
        return "application/json"
    elif outformat == 'GML':
        return "application/gml+xml"
    elif outformat == 'KML':
        return "application/vnd.google-earth.kml+xml"
    elif outformat == 'ESRI Shapefile':
        return "application/octec-stream"


def homepage(request):
    """Visualizza la pagina principale

    :param request: la richiesta http (non deve essere passata)
    """
    return render(request, "lifeten.html")
      


def webgis(request):
    """Visualizza il webgis

    :param request: la richiesta http (non deve essere passata)
    """    
#   Gestisce l'autenticazione dell'utente
    if request.user.is_authenticated():
        pass      
    else:
        user = authenticate(username='ospite', password='lifeten')    
        if user.is_active:
            login(request, user)
    return render(request, "webgis.html")


def viewdata(request):
    """Visualizza la pagina viewdata

    :param request: la richiesta http (non deve essere passata)
    """
#   Gestisce l'autenticazione dell'utente
    if request.user.is_authenticated():
        pass      
    else:
        user = authenticate(username='ospite', password='lifeten')    
        if user.is_active:
            login(request, user)
    return render(request, "viewdata.html")



def viewspecie(request):
    """Visualizza la pagina viewspecie

    :param request: la richiesta http (non deve essere passata)
    """
#   Gestisce l'autenticazione dell'utente
    if request.user.is_authenticated():
        pass      
    else:
        user = authenticate(username='ospite', password='lifeten')    
        if user.is_active:
            login(request, user)
    return render(request, "viewspecies.html")


def viewcredits(request):
    """Visualizza la pagina credits

    :param request: la richiesta http (non deve essere passata)
    """
    return render(request, "credits.html")


def viewhelp(request):
    """Visualizza la pagina del help

    :param request: la richiesta http (non deve essere passata)
    """
    return render(request, "help.html")


@login_required
def dataFromSpecie(request, specie, idArea=None, tipe=None, ecsv=False):
    """Ritorna le occurence in json

    :param request: la richiesta http (non deve essere passata)
    :param specie: il nome della specie
    :param idArea: il codice dell'area
    :param tipe: la tipologia dell'area (muni o park)
    :param ecsv: se dev'essere esportato come CSV o meno
    """
    spec = _checkNameType(specie)
    pk = spec.values()[0]['species_pk']
    outName = specie.replace("'", "").replace(' ', '_')
    if idArea == 'default' or not idArea:
        risultati = Occurrence.objects.select_related().filter(specie__exact=pk)
    else:
        area = _checkArea(idArea, tipe)
        outName = '%s_%s' % (outName, area['nome'].replace("'", "").replace(' ', '_'))
        risultati = Occurrence.objects.select_related().filter(specie__exact=pk).filter(wkb_geometry__contained=area['geom'])
    if risultati.count() == 0:
        return HttpResponse("Nessun elemento per la specie richiesta trovato",
                            status=500)
    else:
        if ecsv:
            response = HttpResponse(mimetype='text/csv')
            response['Content-Disposition'] = 'attachment; filename=%s.csv' % outName
            writer = UnicodeWriter(response)
            writer.writerow(['SPECIE', 'DATA', 'NUMERO ESEMPLARI',
                             'TIPO RILEVAMENTO',
                             'PROGRAMMA MONITORAGGIO',
                             'MASCHI', 'FEMMINE'])
#            writer.writerows(risultati.extra({'x': 'ST_X(wkb_geometry)',
#                                              'y': 'ST_Y(wkb_geometry)'}
#                                          ).values_list('specie', 'eventdate',
            writer.writerows(risultati.extra({'male': 'sex[0]',
                                              'female': 'sex[1]'}).values_list(
                                              'specie', 'eventdate',
                                              'individualcount',
                                              'basisofrecord',
                                              'monitoringprogramme',
#                                              'coordinateuncertaintyinmeters',
                                              'male', 'female'
                                              ).order_by('eventdate'))
            return response
        else:
            return HttpResponse(serializers.serialize("json",
                                                      risultati.order_by('eventdate'),
                                                      indent=4,
                                                      use_natural_keys=True))


@login_required
def kmlFromSpecie(request, specie, idInsti=None, idArea=None,
                  outformat='GeoJSON', zipp=False):
    """Ritorna le occurrence in kml

    :param request: la richiesta http (non deve essere passata)
    :param specie: il nome della specie
    :param idInsti: il codice dell'istituzione
    :param idArea: il codice dell'area
    :param outformat: il formato di output
    :param zipp: se l'output dev'essere contenuto in un archivio zip o meno
    """
    spec = _checkNameType(specie)
    if spec.count() != 1:
        return HttpResponse("Attenzione più di una specie trovata",
                            status=500)
    pk = spec.values()[0]['species_pk']
    error = "Per la specie %s" % spec.values()[0]['scientificname']
    if idInsti and idArea:
        area = AreeEnte.objects.filter(gid=idArea).values()[0]
        insti = Institutioninfo.objects.filter(institutionid=idInsti).values()[0]
        error += " si visualizza solo la mappa di presenza per l'istituto " \
                 "%s e per l'area %s" % (insti['institutionname'],
                                         area['ente'])
        risultati = Occurrence.objects.select_related().filter(Q(specie__exact=pk), Q(datasetid__institutionid__exact=idInsti) | (Q(wkb_geometry__contained=area['geom']) & ~Q(datasetid__institutionid__exact=idInsti))).kml()
    elif idInsti and not idArea:
        insti = Institutioninfo.objects.filter(institutionid=idInsti).values()[0]
        error += " si visualizza solo la mappa di presenza per l'istituto " \
                 "%s" % insti['institutionname']
        risultati = Occurrence.objects.select_related().filter(Q(specie__exact=pk), Q(datasetid__institutionid__exact=idInsti)).kml()
    else:
        risultati = Occurrence.objects.select_related().filter(specie__exact=pk).kml()
    if risultati.count() == 0:
        error += " in quanto non proprietario"
        return HttpResponse(error, status=500)
    else:
        if outformat == 'ESRI Shapefile':
            suff = 'shp'
        else:
            suff = formats[outformat]
        if zipp:
            mime = "application/zip"
        else:
            mime = _checkMimetype(outformat)
        outName = specie.replace("'", "").replace(' ', '_')
        shp_response = ShpResponder(risultati, proj_transform=4326,
                                    out_format=outformat, mimetype=mime,
                                    file_name=u"%s.%s" % (outName, suff),
                                    geo_field='wkb_geometry', zipped=zipp)
        return shp_response()
#        return render_to_kml("lifeten.kml", {"places":
#                                             risultati.order_by('eventdate')})


def polygonFromSpecie(request, specie, outformat='GeoJSON', zipp=False):
    """Ritorna i poligoni con la corretta risoluzione per una specie

    :param request: la richiesta http (non deve essere passata)
    :param specie: il nome della specie
    :param outformat: il formato di output
    :param zipp: se l'output dev'essere contenuto in un archivio zip o meno
    """
    spec = _checkNameType(specie)
    if spec.count() != 1:
        return HttpResponse("Attenzione più di una specie trovata",
                             status=500)
    pk = spec.values()[0]['species_pk']
    spatial = _checkSensitivity(spec.values()[0]['sensitivity'])
    outName = specie.replace("'", "").replace(' ', '_')
    if outformat == 'ESRI Shapefile':
        suff = 'shp'
    else:
        suff = formats[outformat]
    if zipp:
        mime = "application/zip"
    else:
        mime = _checkMimetype(outformat)
    shp_response = ShpResponder(Grid1X1.objects.raw("SELECT DISTINCT g.geom," \
                                                  "g.gid, count(occ.specie) " \
                                                  "AS count FROM (occurrence" \
                                                  " occ JOIN %s g ON (" \
                                                  "st_intersects(occ.wkb_geometry," \
                                                  " g.geom))) WHERE (" \
                                                  "occ.specie = '%s') GROUP " \
                                                  "BY g.gid;" % (spatial, pk)),
                              proj_transform=4326, out_format=outformat,
                              file_name=u"%s.%s" % (outName, suff),
                              zipped=zipp, mimetype=mime)
    return shp_response()


@login_required
def infoSpecieFromSpecie(request, specie):
    """Ritorna informazione riguardo la specie dal nome della specie

    :param request: la richiesta http (non deve essere passata)
    :param specie: il nome della specie
    """
    risultati = _checkNameType(specie)
    if risultati.count() == 0:
        return HttpResponse("Nessun elemento per la specie richiesta trovato",
                            status=500)
    else:
        return HttpResponse(serializers.serialize("json", risultati, indent=4,
                                                  use_natural_keys=True))


@login_required
def infoInstiFromSpecie(request, specie, idArea=None, tipe=None):
    """Ritorna informazioni riguardo l'istituzione di una specie dal nome
    della specie

    :param request: la richiesta http (non deve essere passata)
    :param specie: il nome della specie
    :param idArea: il codice dell'area
    :param tipe: la tipologia di area
    """
    spec = _checkNameType(specie)
    pk = spec.values()[0]['species_pk']
#    logger.debug('Area: %s - %s' % (idArea, tipe))
    if idArea == 'default' or not idArea:
        risultati = Datasetinfo.objects.select_related().filter(occurrence__specie__pk__exact=pk).distinct()
    else:
        area = _checkArea(idArea, tipe)
        iddati = Occurrence.objects.select_related().filter(specie__pk__exact=pk).filter(wkb_geometry__contained=area['geom']).values_list('datasetid').distinct()
        risultati = Datasetinfo.objects.select_related().filter(datasetid__in=iddati)
    if risultati.count() == 0:
        return HttpResponse("Nessun elemento per la specie richiesta trovato",
                            status=500)
    else:
        return HttpResponse(serializers.serialize("json", risultati, indent=4,
                                                  use_natural_keys=True))


@login_required
def returnClass(request):
    """Ritorna una lista di classi

    :param request: la richiesta http (non deve essere passata)
    """
    clas = Species.objects.distinct('class_field').filter(spatialdisplay__exact=1)
    return HttpResponse(serializers.serialize("json", clas,
                                              fields=('class_field')))


@login_required
def returnOrdo(request, clas):
    """Ritorna una lista di ordine per una classe

    :param request: la richiesta http (non deve essere passata)
    :param clas: la classe da considerare
    """
    ordo = Species.objects.filter(class_field__exact=clas).distinct('ordo').filter(spatialdisplay__exact=1)
    return HttpResponse(serializers.serialize("json", ordo, fields=('ordo')))


@login_required
def returnFamilia(request, ordo):
    """Ritorna una lista di familia per un ordine

    :param request: la richiesta http (non deve essere passata)
    :param ordo: l'ordine da considerate
    """
    fam = Species.objects.filter(ordo__exact=ordo).distinct('familia').filter(spatialdisplay__exact=1)
    return HttpResponse(serializers.serialize("json", fam, fields=('familia')))


@login_required
def returnGenus(request, familia):
    """Ritorna una lista di generi per una familia

    :param request: la richiesta http (non deve essere passata)
    :param familia: la familia da considerare
    """
    genus = Species.objects.filter(familia__exact=familia).distinct('genus').filter(spatialdisplay__exact=1)
    return HttpResponse(serializers.serialize("json", genus, fields=('genus')))


@login_required
def returnSpecie(request, genus):
    """Ritorna una lista di specie per un genere

    :param request: la richiesta http (non deve essere passata)  
    :param genus: il genere
    """
    specie = Species.objects.filter(genus__exact=genus).distinct('scientificname').filter(spatialdisplay__exact=1)
    return HttpResponse(serializers.serialize("json", specie,
                                              fields=('class_field',
                                                      'scientificname',
                                                      'vernacularname')))


@login_required
def returnListSpecie(request, idArea=None, tipe=None, ecsv=False):
    """Ritorna un file json che contiene i nomi delle specie

    :param request: la richiesta http (non deve essere passata)
    :param idArea: il codice dell'area
    :param tipe: la tipologia dell'area
    :param ecsv: se la risposta dev'essere un CSV o un json
    """
    species = Occurrence.objects.distinct('specie').values_list('specie_id')
    if idArea == 'default' or not idArea:
        specie = Species.objects.filter(species_pk__in=species).order_by(
                                        'class_field', 'ordo', 'familia'
                                        ).filter(spatialdisplay__exact=1)
        #specie = Species.objects.all().order_by('class_field', 'ordo', 
        #                                        'familia').filter(spatialdisplay__exact=1)
        outName = 'list_all_specie.csv'
    else:
        area = _checkArea(idArea, tipe)
        outName = 'list_specie_%s.csv' % area['nome'].replace("'", "").replace(
                                                                      ' ', '_')
        geo_query = Q(wkb_geometry__contained=area['geom'])
        temp = Occurrence.objects.filter(geo_query).distinct('specie')
        list_spec = []
        [list_spec.append(Q(species_pk__exact=t.specie_id)) for t in temp]
        specie = Species.objects.filter(species_pk__in=species).filter(
                                        spatialdisplay__exact=1).filter(
                                        reduce(operator.or_,list_spec)).order_by(
                                        'class_field', 'ordo', 'familia')
    if ecsv:
        response = HttpResponse(mimetype='text/csv')
        response['Content-Disposition'] = 'attachment; filename=%s' % outName
        writer = UnicodeWriter(response)
        writer.writerow(['CLASSE', 'ORDINE', 'FAMIGLIA', 'GENERE',
                         'NOME_SCIENTIFICO', 'NOME_COMUNE'])
        writer.writerows(specie.values_list('class_field', 'ordo', 'familia',
                                            'genus', 'scientificname',
                                            'vernacularname'))
        return response
    else:
        return HttpResponse(serializers.serialize("json", specie))


def returnListAree(request):
    """Ritorna un file json che contiene i nome delle aree protette

    :param request: la richiesta http (non deve essere passata)
    """
    aree = AreeProtette.objects.order_by('nome')
    return HttpResponse(serializers.serialize("json", aree, fields=('nome',
                                                                    'tipo')))


def returnListComuni(request):
    """Ritorna un file json che contiene i nomi delle municipalità

    :param request: la richiesta http (non deve essere passata)
    """
    aree = Comuni.objects.order_by('nome')
    return HttpResponse(serializers.serialize("json", aree, fields=('nome')))

def returnListAto(request):
    """Ritorna un file json che contiene i nomi delle municipalità

    :param request: la richiesta http (non deve essere passata)
    """
    aree = Ato.objects.order_by('nome')
    return HttpResponse(serializers.serialize("json", aree, fields=('nome')))

def returnListComunita(request):
    """Ritorna un file json che contiene i nomi delle municipalità

    :param request: la richiesta http (non deve essere passata)
    """
    aree = Comunita.objects.order_by('nome')
    return HttpResponse(serializers.serialize("json", aree, fields=('nome')))

def returnBBoxArea(request, idArea, tipe):
    """Ritorna l'estensione di un'area

    :param request: la richiesta http (non deve essere passata)
    :param idArea: il codice identificativo dell'area
    :param tipe: la tipologia dell'area
    """
    if tipe == 'park':
        area = AreeProtette.objects.filter(id__exact=idArea)
    elif tipe == 'muni':
        area = Comuni.objects.filter(id__exact=idArea)
    elif tipe == 'ato':
        area = Ato.objects.filter(id__exact=idArea)
    elif tipe == 'comunita':
        area = Comunita.objects.filter(id__exact=idArea)

    feat = area[0]
    feat.geom.transform(3857)
    return HttpResponse(str(feat.geom.extent).replace('(', '').replace(')', '').replace(' ',''))

def returnWMS(request, specie):
    """Ritorna se un layer WMS è presente

    :param request: la richiesta http (non deve essere passata)
    :param specie: la specie    
    """
    risultati = _checkNameType(specie)
    return HttpResponse(serializers.serialize("json", risultati, indent=4,
                                              use_natural_keys=True, fields=(
                                              'raster')))

#@login_required
#def webgis_new(request):
#    """Visualizza la webgis
#
#    :param request: la richiesta http (non deve essere passata)
#    """
#    return render(request, "webgis_new.html")

#@login_required
#def returnListGenere(request):
#    """Ritorna un file json con il nome dei generi
#
#    :param request: la richiesta http (non deve essere passata)    
#    """
#    genus = Species.objects.distinct('genus').filter(spatialdisplay__exact=1)
#    return HttpResponse(serializers.serialize("json", genus, fields=('genus')))

## request using genus
#@login_required
#def dataFromGenus(request, idGenus, idArea, tipe=None, ecsv=False):
#    """Return the occurrence in json"""
#    spec = Species.objects.filter(genus__exact=idGenus)
#    outName = idGenus.replace("'", "").replace(' ', '_')
#    if idArea == 'default' or not idArea:
#        risultati = Occurrence.objects.filter(specie__in=spec)
#    else:
#        area = _checkArea(idArea, tipe)
#        risultati = Occurrence.objects.filter(specie__in=spec).filter(
#                                         wkb_geometry__contained=area['geom'])
#        outName = '%s_%s' % (outName, area['nome'].replace("'", "").replace(
#                                                                    ' ', '_'))
#    if risultati.count() == 0:
#        return HttpResponse("Nessun elemento per la specie richiesta trovato",
#                            status=500)
#    else:
#        if ecsv:
#            response = HttpResponse(mimetype='text/csv')
#            response['Content-Disposition'] = 'attachment; filename=%s.csv' % outName
#            writer = UnicodeWriter(response)
#            writer.writerow(['SPECIE', 'DATA', 'NUMERO ESEMPLARI', 'SESSO [M-F]',
#                             'TIPO RILEVAMENTO', 'PROGRAMMA MONITORAGGIO',
#                             'PRECISIONE (m)', 'LONG', 'LAT'])
#            writer.writerows(risultati.extra({'x': 'ST_X(wkb_geometry)',
#                                              'y': 'ST_Y(wkb_geometry)'}
#                                            ).values_list('specie', 'eventdate',
#                                              'individualcount', 'sex',
#                                              'basisofrecord',
#                                              'monitoringprogramme',
#                                              'coordinateuncertaintyinmeters',
#                                              'x', 'y').order_by('eventdate'))
#            return response
#        else:
#            return HttpResponse(serializers.serialize("json", 
#                                                  risultati.order_by('eventdate'),
#                                                  indent=4,
#                                                  use_natural_keys=True))
#
#
#@login_required
#def kmlFromGenus(request, idGenus):
#    """Return the occurrence in kml"""
#    spec = Species.objects.filter(genus__exact=idGenus)
#    risultati = Occurrence.objects.filter(specie__in=spec).kml()
##    list_spec = []
##    [list_spec.append(Q(specie__exact=s.species_pk)) for s in spec]
##    risultati = Occurrence.objects.filter(reduce(operator.or_,
##                                                 list_spec)).kml()
#    # TODO add check if only a feature is returned otherwise return an error
#    #if risultati.count() == 0:
#    if risultati.count() == 0:
#        return HttpResponse("Nessun elemento per la specie richiesta trovato",
#                            status=500)
#    else:
#        return render_to_kml("lifeten.kml", {"places": risultati.order_by('eventdate')})
#
#
#@login_required
#def infoSpecieFromGenus(request, idGenus):
#    """Return information about species from genus"""
#    spec = Species.objects.filter(genus__exact=idGenus)
#    risultati = Species.objects.filter(occurrence__specie__pk__in=spec)
#    if risultati.count() == 0:
#        return HttpResponse("Nessun elemento per la specie richiesta trovato",
#                            status=500)
#    else:
#        return HttpResponse(serializers.serialize("json", risultati))
#
#
#@login_required
#def infoInstiFromGenus(request, idGenus, idArea=None, tipe=None):
#    """Return information about institution from genus"""
#    spec = Species.objects.filter(genus__exact=idGenus)
#    if idArea == 'default' or not idArea:
#        risultati = Datasetinfo.objects.select_related().filter(occurrence__specie__pk__in=spec).distinct()
#    else:
#        area = _checkArea(idArea, tipe)
#        iddati = Occurrence.objects.select_related().filter(specie__in=spec).filter(wkb_geometry__contained=area['geom']).values_list('datasetid').distinct()
#        risultati = Datasetinfo.objects.select_related().filter(datasetid__in=iddati)
#    if risultati.count() == 0:
#        return HttpResponse("Nessun elemento per la specie richiesta trovato",
#                            status=500)
#    else:
#        return HttpResponse(serializers.serialize("json", risultati, indent=4,
#                                                  use_natural_keys=True))

#@login_required
#def oldviewdata(request, idSpecie=None):
#    """Return the occurrence in viewSamplings page"""
#    if idSpecie:
#        risultati = Occurrence.objects.select_related().filter(specie__exact=idSpecie)
#    else:
#        risultati = Occurrence.objects.select_related().all()
#    return render_to_response("viewsamplings.html", {"data": risultati,
#                                                     "table": "sampling"})

#@login_required
#def viewdatahttp(request, idSpecie=None):
#    """ Show all samplings records in a table. """
#    t = loader.get_template('newview.html')
#    if idSpecie:
#        risultati = Occurrence.objects.select_related().filter(specie__exact=idSpecie)
#    else:
#        risultati = Occurrence.objects.select_related().all()[:20]
#    output = cStringIO.StringIO()
#    x = 0
#    for row in risultati:
#        if (x % 2) == 0:
#            output.write('<tr  id="hor-zebra" class="odd">')
#        else:
#            output.write('<tr  id="hor-zebra">')
#        output.write('<td>%s</td>' % unicode(row.specie).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.datasetid).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.eventdate).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.coordinateuncertaintyinmeters).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.individualcount).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.monitoringprogramme).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.sex).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.recorder_1).encode('utf8'))
#        output.write('<td>%s</td>' % unicode(row.lifestage).encode('utf8'))
#        output.write('</tr>')
#        x += 1
#    html = output.getvalue()
#    output.close()
#    c = Context({
#        'html': html,
#        "table": "sampling"
#    })
#    return  HttpResponse(t.render(c))
