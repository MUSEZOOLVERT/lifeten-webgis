# -*- coding: utf-8 -*-

# from django-shapes
# https://bitbucket.org/springmeyer/django-shapes/src/f3c93240c56e/shapes/views/export.py?at=default

import os
import zipfile
import tempfile
import glob
from django.http import HttpResponse
from django.utils.encoding import smart_str
from django.contrib.gis.db.models.fields import GeometryField
from django.contrib.gis.gdal import check_err, OGRGeomType

try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO

try:
    # a mysterious bug with ctypes and python26 causes crashes
    # when calling lgdal.OGR_DS_CreateLayer, so we default to
    # using the native python bindings to ogr/gdal if they exist
    # thanks Jared K, for reporting this bug & submitting alternative approach
    from osgeo import ogr, osr
    HAS_NATIVE_BINDINGS = True
except ImportError:
    HAS_NATIVE_BINDINGS = False
    from django.contrib.gis.gdal.libgdal import lgdal
    from django.contrib.gis.gdal import Driver, OGRGeometry, OGRGeomType
    from django.contrib.gis.gdal import SpatialReference, check_err, CoordTransform

import logging
logger = logging.getLogger(__name__)

formats = {'ESRI Shapefile': ['shp', 'shx', 'prj', 'dbf'], 'KML': 'kml',
           'GeoJSON': 'json', 'GML': 'gml'}


class ShpResponder(object):
    """
    Classe per convertire una query di Djando in un geodato.

    Esempio::
        from export import ShpResponder

        shp_response = ShpResponder(Model.objects.all(), proj_transform=900913, file_name="prova.shp")

        urlpatterns = patterns('',
            (r'^export_shp/$', shp_response),
        )
    """
    def __init__(self, queryset, readme=None, geo_field=None,
                 proj_transform=None, mimetype='application/zip',
                 file_name='shp_download', out_format='ESRI Shapefile',
                 zipped=True):

        self.queryset = queryset
        self.readme = readme
        self.geo_field = geo_field
        self.proj_transform = proj_transform
        self.mimetype = mimetype
        self.file_name = smart_str(file_name)
        self.out_format = out_format
        self.zipped = zipped

    def __call__(self, *args, **kwargs):
        """
        Method that gets called when the ShpResponder class is used as a view.

        """
        suffix = self.file_name.split('.')[0]
        response = HttpResponse()
        tmp = self.write_shapefile_to_tmp_file(self.queryset)
        
        if self.zipped:
            zip_stream = self.zip_response(tmp, self.file_name, self.readme)
            size = len(zip_stream)
            response['Content-Disposition'] = 'attachment; filename=%s.zip' % suffix
        else:
            zip_stream = ''.join(open(tmp).readlines())
            size = os.path.getsize(tmp)
        response['Content-length'] = str(size)
        response['Content-Type'] = self.mimetype
        response.write(zip_stream)
        self.removeTmpFiles(tmp)
        return response

    def removeTmpFiles(self, fullpath):
        """Rimuove i file temporanei

        :param fullpath: percorso ai file
        """
        path = os.path.split(fullpath)[0]
        suff = os.path.split(fullpath)[1].split('.')[0]
        for filename in glob.glob(os.path.join(path, "%s.*" % suff)):
            logger.debug(filename)
            os.remove(filename)

    def get_attributes(self):
        """
        Ottiene i nomi degli attributi
        """
        # Todo: control field order as param
        fields = self.queryset.model._meta.fields
        attr = [f for f in fields if not isinstance(f, GeometryField)]
        return attr

    def get_geo_field(self):
        """
        Ottiene il nome del campo geometrico
        """
        fields = self.queryset.model._meta.fields
        geo_fields = [f for f in fields if isinstance(f, GeometryField)]
        geo_fields_names = ', '.join([f.name for f in geo_fields])

        if len(geo_fields) > 1:
            if not self.geo_field:
                raise ValueError("More than one geodjango geometry field " \
                                 "found, please specify which to use by name" \
                                 " using the 'geo_field' keyword. Available" \
                                 " fields are: '%s'" % geo_fields_names)
            else:
                geo_field_by_name = [fld for fld in geo_fields if fld.name == self.geo_field]
                if not geo_field_by_name:
                    raise ValueError("Geodjango geometry field not found " \
                                     "with the name '%s', fields available " \
                                     "are: '%s'" % (self.geo_field,
                                                    geo_fields_names))
                else:
                    geo_field = geo_field_by_name[0]
        elif geo_fields:
            geo_field = geo_fields[0]
        else:
            raise ValueError("No geodjango geometry fields found in this " \
                             "model queryset")
        return geo_field

    def write_shapefile_to_tmp_file(self, queryset):
        """
        Scrive il file Shapefile temporaneo
        
        :param queryset: il queryset
        """
        if self.out_format == 'ESRI Shapefile':
            tmp = tempfile.NamedTemporaryFile(suffix='.shp', mode='w+b')
        else:
            tmp = tempfile.NamedTemporaryFile(suffix='.%s' % formats[self.out_format],
                                              mode='w+b')
        
        # we must close the file for GDAL to be able to open and write to it
        tmp.close()
        args = tmp.name, queryset, self.get_geo_field()

        if HAS_NATIVE_BINDINGS:
            self.write_with_native_bindings(*args)
        else:
            self.write_with_ctypes_bindings(*args)

        return tmp.name

    def zip_response(self, shapefile_path, file_name, readme=None):
        """
        Crea il file zip da scaricare

        :param shapefile_path: percorso allo shapefile
        :param file_name: nome del file
        :param readme: include un file README se esiste
        """
        buffer = StringIO()
        zip = zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED)
        path = os.path.split(shapefile_path)[0]
        suff = os.path.split(shapefile_path)[1].split('.')[0]
        suffix = file_name.split('.')[0]
        for filename in glob.glob(os.path.join(path, "%s.*" % suff)):
            zip.write(filename, arcname=filename.replace('/tmp/%s' % suff,
                                                         suffix))
        if readme:
            zip.writestr('README.txt', readme)
        zip.close()
        buffer.flush()
        zip_stream = buffer.getvalue()
        buffer.close()

        return zip_stream

    def write_with_native_bindings(self, tmp_name, queryset, geo_field):
        """Scrive un file in un formato geografico da un geoqueryset; questa
        funzione usa le librerie Python di GDAL.

        Scritto da Jared Kibele e Dane Springmeyer.
        """
        dr = ogr.GetDriverByName(str(self.out_format))
        ds = dr.CreateDataSource(tmp_name)
        if ds is None:
            raise Exception('Could not create file!')

        if hasattr(geo_field, 'geom_type'):
            ogr_type = OGRGeomType(geo_field.geom_type).num
        else:
            ogr_type = OGRGeomType(geo_field._geom).num

        native_srs = osr.SpatialReference()
        if hasattr(geo_field, 'srid'):
            native_srs.ImportFromEPSG(geo_field.srid)
        else:
            native_srs.ImportFromEPSG(geo_field._srid)

        if self.proj_transform:
            output_srs = osr.SpatialReference()
            output_srs.ImportFromEPSG(self.proj_transform)
        else:
            output_srs = native_srs

        layer = ds.CreateLayer('lyr', srs=output_srs, geom_type=ogr_type)

        attributes = self.get_attributes()

        for field in attributes:
            field_defn = ogr.FieldDefn(str(field.name), ogr.OFTString)
            field_defn.SetWidth(255)
            if layer.CreateField(field_defn) != 0:
                raise Exception('Faild to create field')

        feature_def = layer.GetLayerDefn()

        for item in queryset:
            feat = ogr.Feature(feature_def)

            for field in attributes:
                value = getattr(item, field.name)
                try:
                    string_value = str(value)
                except UnicodeEncodeError, E:
                    string_value = ''
                feat.SetField(str(field.name), string_value)

            geom = getattr(item, geo_field.name)

            if geom:
                ogr_geom = ogr.CreateGeometryFromWkt(geom.wkt)
                if self.proj_transform:
                    ct = osr.CoordinateTransformation(native_srs, output_srs)
                    ogr_geom.Transform(ct)
                check_err(feat.SetGeometry(ogr_geom))
            else:
                pass

            check_err(layer.CreateFeature(feat))

        ds.Destroy()

    def write_with_ctypes_bindings(self, tmp_name, queryset, geo_field):
        """ Scrive un file in un formato geografico da un geoqueryset; questa
        funzione usa le librerie Python di GeoDjangos.
        """

        # Get the shapefile driver
        dr = Driver(self.out_format)

        # Creating the datasource
        ds = lgdal.OGR_Dr_CreateDataSource(dr._ptr, tmp_name, None)
        if ds is None:
            raise Exception('Could not create file!')

        # Get the right geometry type number for ogr
        if hasattr(geo_field, 'geom_type'):
            ogr_type = OGRGeomType(geo_field.geom_type).num
        else:
            ogr_type = OGRGeomType(geo_field._geom).num

        # Set up the native spatial reference of geometry field using the srid
        if hasattr(geo_field, 'srid'):
            native_srs = SpatialReference(geo_field.srid)
        else:
            native_srs = SpatialReference(geo_field._srid)

        if self.proj_transform:
            output_srs = SpatialReference(self.proj_transform)
        else:
            output_srs = native_srs

        # create the layer
        # this is crashing python26 on osx and ubuntu
        layer = lgdal.OGR_DS_CreateLayer(ds, 'lyr', output_srs._ptr, ogr_type,
                                         None)

        # Create the fields
        attributes = self.get_attributes()

        for field in attributes:
            fld = lgdal.OGR_Fld_Create(str(field.name), 4)
            added = lgdal.OGR_L_CreateField(layer, fld, 0)
            check_err(added)

        # Getting the Layer feature definition.
        feature_def = lgdal.OGR_L_GetLayerDefn(layer)

        # Loop through queryset creating features
        for item in self.queryset:
            feat = lgdal.OGR_F_Create(feature_def)

            # For now, set all fields as strings
            # TODO: catch model types and convert to ogr fields
            # http://www.gdal.org/ogr/classOGRFeature.html

            # OGR_F_SetFieldDouble
            #OFTReal => FloatField DecimalField

            # OGR_F_SetFieldInteger
            #OFTInteger => IntegerField

            #OGR_F_SetFieldStrin
            #OFTString => CharField

            # OGR_F_SetFieldDateTime()
            #OFTDateTime => DateTimeField
            #OFTDate => TimeField
            #OFTDate => DateField

            for idx, field in enumerate(attributes):
                value = getattr(item, field.name)
                try:
                    string_value = str(value)
                except UnicodeEncodeError, E:
                    # pass for now....
                    # http://trac.osgeo.org/gdal/ticket/882
                    string_value = ''
                lgdal.OGR_F_SetFieldString(feat, idx, string_value)

            # Transforming & setting the geometry
            geom = getattr(item, geo_field.name)

            # if requested we transform the input geometry
            # to match the shapefiles projection 'to-be'
            if geom:
                ogr_geom = OGRGeometry(geom.wkt, output_srs)
                if self.proj_transform:
                    ct = CoordTransform(native_srs, output_srs)
                    ogr_geom.transform(ct)
                # create the geometry
                check_err(lgdal.OGR_F_SetGeometry(feat, ogr_geom._ptr))
            else:
                # Case where geometry object is not found because of null
                # value for field effectively looses whole record in shapefile
                # if geometry does not exist
                pass

            # creat the feature in the layer.
            check_err(lgdal.OGR_L_SetFeature(layer, feat))

        # Cleaning up
        check_err(lgdal.OGR_L_SyncToDisk(layer))
        lgdal.OGR_DS_Destroy(ds)
        lgdal.OGRCleanupAll()