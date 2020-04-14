# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.

from django.contrib.gis.db import models
from django.utils.encoding import smart_str
from djorm_pgarray.fields import ArrayField


class Institutioninfo(models.Model):
    _database = 'lifeten'
    institutionname = models.CharField(max_length=60, blank=True, db_column='name')
    institutionreference = models.CharField(max_length=30, blank=True, db_column='reference_name')
    institutionreferencemail = models.CharField(max_length=30, blank=True, db_column='reference_mail')
    institutionid = models.IntegerField(primary_key=True, db_column='id_pk')
    extendedname = models.TextField(blank=True, db_column='extended_name')
    office = models.TextField(blank=True)

    class Meta:
        db_table = u'institutioninfo'
        ordering = ['institutionname']
        verbose_name = 'Anagrafica istituzione'
        verbose_name_plural = 'Anagrafica istituzioni'

    def __unicode__(self):
        """Ottiene la rappresentazione testuale, visualizzata ad esempio nelle righe dell'interfaccia di amministrazione"""
        return smart_str(self.institutionname)
    def natural_key(self):
        """Funzione per ottenere la chiave naturale da usare durante la serializzazione"""
        return (self.extendedname, self.institutionreference)
    def fullname(self):
        """Funzione che serve per ottenere il nome completo"""
        if self.office:
            return ("%s - %s" % (self.institutionname, self.office))
        else:
            return (self.institutionname)


class Recorderinfo(models.Model):
    _database = 'lifeten'
    recorderid = models.IntegerField(primary_key=True, db_column='id_pk')
    recordermail = models.CharField(max_length=30, blank=True, db_column='mail')
    recordername = models.CharField(max_length=50, unique=True, blank=True, db_column='name')
    institutionid = models.ForeignKey(Institutioninfo, null=True, db_column='institutionid', blank=True)

    class Meta:
        db_table = u'recorderinfo'
        verbose_name = 'Anagrafica rilevatore'
        verbose_name_plural = 'Anagrafica rilevatori'

    def __unicode__(self):
        return smart_str(self.recordername)
    def natural_key(self):
        return self.recordername


class Datasetinfo(models.Model):
    _database = 'lifeten'
    datasetid = models.IntegerField(primary_key=True)
    datasetname = models.CharField(max_length=30, blank=True, db_column='name')
    institutionid = models.ForeignKey(Institutioninfo, null=True, db_column='institutionid', blank=True)
    datasetdateinterval = models.TextField(blank=True, db_column='date_interval')
    datasetextendedname = models.TextField(blank=True, db_column='extdended_name')
    datasetreference = models.TextField(blank=True, db_column='reference_name')
    datasetreferencemail = models.TextField(blank=True, db_column='reference_mail')
    datasetextratablename = models.CharField(max_length=40, blank=True, db_column='extratable_name')

    class Meta:
        db_table = u'datasetinfo'
        verbose_name = 'Anagrafica dataset'
        verbose_name_plural = 'Anagrafica dataset'

    def __unicode__(self):
        return smart_str(self.datasetextendedname)
    def natural_key(self):
        return (self.datasetextendedname, self.datasetdateinterval)


class Species(models.Model):
    _database = 'lifeten'
    species_pk = models.CharField(max_length=10, primary_key=True)
    class_field = models.CharField(max_length=30, db_column='class', blank=True)
    ordo = models.CharField(max_length=30, blank=True)
    familia = models.CharField(max_length=30, blank=True)
    genus = models.TextField(blank=True)
    scientificname = models.CharField(max_length=60, blank=True)
    vernacularname = models.CharField(max_length=60, blank=True)
    habdir_ii = models.NullBooleanField(null=True, blank=True)
    habdir_iv = models.NullBooleanField(null=True, blank=True)
    habdir_v = models.NullBooleanField(null=True, blank=True)
    redlisttn = models.CharField(max_length=3, blank=True)
    redlistit = models.CharField(max_length=3, blank=True)
    spec = models.CharField(max_length=12, blank=True)
    spec2004 = models.CharField(max_length=12, blank=True)
    birddir = models.CharField(max_length=6, blank=True)
    berna = models.CharField(max_length=3, blank=True)
    bonn = models.CharField(max_length=3, blank=True)
    euring = models.IntegerField(null=True, blank=True)
    cites = models.CharField(max_length=3, blank=True)
    sensitivity = models.SmallIntegerField(null=True, blank=True)
    spatialdisplay = models.IntegerField(null=True, blank=True)
    html_descr = models.TextField(blank=True)
    raster = models.NullBooleanField(null=True, blank=True)

    class Meta:
        db_table = u'species'
        verbose_name = 'Specie'
        ordering = ['scientificname']        
        verbose_name_plural = 'Specie faunistiche e floristiche'

    def __unicode__(self):
        return u'%s (%s)' % (self.scientificname,self.vernacularname)
    def natural_key(self):
        return (self.class_field, self.ordo, self.familia, self.genus,
                self.scientificname, self.vernacularname)


class Occurrence(models.Model):
    _database = 'lifeten'
    id = models.IntegerField(primary_key=True, db_column='occurrence_pk')
    specie = models.ForeignKey(Species, null=True, db_column='specie', blank=True)
    datasetrowid = models.IntegerField(null=True, blank=True)
    basisofrecord = models.CharField(max_length=50)
    eventdate = models.DateField(null=True, blank=True)
    coordinateuncertaintyinmeters = models.IntegerField(null=True, blank=True)
    individualcount = models.IntegerField()
    monitoringprogramme = models.CharField(max_length=100, blank=True)
    wkb_geometry = models.PointField(srid=25832)
    datasetid = models.ForeignKey(Datasetinfo, null=True, db_column='datasetid', blank=True)
    sex = ArrayField(blank=True, dbtype="int", dimension=2)
    recorder_1 = models.ForeignKey(Recorderinfo, null=True, related_name='+', db_column='recorder_1', blank=True)
    recorder_2 = models.ForeignKey(Recorderinfo, null=True, related_name='+', db_column='recorder_2', blank=True)
    recorder_3 = models.ForeignKey(Recorderinfo, null=True, related_name='+', db_column='recorder_3', blank=True)
    recorder_4 = models.ForeignKey(Recorderinfo, null=True, related_name='+', db_column='recorder_4', blank=True)
    lifestage = ArrayField(blank=True, dbtype="int", dimension=7)
    locality = models.CharField(max_length=1000, blank=True)
    eventtime = models.TimeField(null=True, blank=True)
    original_geom = models.GeometryField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'occurrence2'

class Grid10X10(models.Model):
    _database = 'lifeten'
    gid = models.IntegerField(primary_key=True)
    id = models.DecimalField(null=True, max_digits=10, decimal_places=0, blank=True)
    __xmin = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    __xmax = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    ymin = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    ymax = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    geom = models.MultiPolygonField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'grid_10x10'


class Grid1X1(models.Model):
    _database = 'lifeten'
    gid = models.IntegerField(primary_key=True)
    labelx = models.DecimalField(null=True, max_digits=65535,
                                 decimal_places=65535, blank=True)
    labely = models.DecimalField(null=True, max_digits=65535,
                                 decimal_places=65535, blank=True)
    codxy = models.CharField(max_length=16, blank=True)
    cody = models.CharField(max_length=11, blank=True)
    codx = models.CharField(max_length=13, blank=True)
    label = models.CharField(max_length=4, blank=True)
    geom = models.MultiPolygonField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'grid_1x1'


class Grid5X5(models.Model):
    _database = 'lifeten'
    gid = models.IntegerField(primary_key=True)
    id = models.DecimalField(null=True, max_digits=10, decimal_places=0, blank=True)
    __xmin = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    __xmax = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    ymin = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    ymax = models.DecimalField(null=True, max_digits=65535, decimal_places=65535, blank=True)
    geom = models.MultiPolygonField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'grid_5x5'

class AreeProtette(models.Model):
    _database = 'lifeten'
    id = models.IntegerField(primary_key=True)
    nome = models.TextField(db_column='name',blank=True)
    codice = models.TextField(blank=True)
    tipo_sic = models.CharField(max_length=2, blank=True)
    tipo = models.TextField(blank=True)
    geom = models.GeometryField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'aree_protette'

    def __unicode__(self):
        return smart_str(self.nome)

class Ato(models.Model):
    _database = 'lifeten'
    id = models.IntegerField(primary_key=True)
    nome = models.CharField(db_column='name',max_length=80, blank=True)
    geom = models.GeometryField(db_column='wkb_geometry',srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'ato'
    def __unicode__(self):
        return smart_str(self.nome)

class Comunita(models.Model):
    _database = 'lifeten'
    id = models.IntegerField(primary_key=True)
    nome = models.CharField(db_column='name',max_length=80, blank=True)
    geom = models.GeometryField(db_column='wkb_geometry',srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'comunita_valle'
    def __unicode__(self):
        return smart_str(self.nome)

class Comuni(models.Model):
    _database = 'lifeten'
    id = models.IntegerField(primary_key=True)
    comu = models.SmallIntegerField(null=True, blank=True)
    nome = models.CharField(db_column='name',max_length=40, blank=True)
    altcom = models.IntegerField(null=True, blank=True)
    geom = models.MultiPolygonField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'comuni'

    def __unicode__(self):
        """Funzione che serve per ottenere la rappresentazione testuale"""
        return smart_str(self.nome)


class Habitat(models.Model):
    _database = 'lifeten'
    gid = models.IntegerField(primary_key=True)
    note = models.CharField(max_length=254, blank=True)
    codice = models.CharField(max_length=16, blank=True)
    vegetaz = models.CharField(max_length=254, blank=True)
    nome = models.CharField(max_length=254, blank=True)
    prior = models.CharField(max_length=1, blank=True)
    ii_codice = models.CharField(max_length=16, blank=True)
    ii_vegetaz = models.CharField(max_length=254, blank=True)
    ii_hab_it = models.CharField(max_length=254, blank=True)
    ii_prior = models.CharField(max_length=1, blank=True)
    anno = models.SmallIntegerField(null=True, blank=True)
    geom = models.MultiPolygonField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'habitat'

class AreeEnte(models.Model):
    """
    Classe per la tabella aree_ente, contiene le geometrie delle aree di 
    controllo dei diversi enti
    """
    _database = 'lifeten'
    gid = models.IntegerField(primary_key=True)
    ente = models.CharField(max_length=20, blank=True)
    geom = models.MultiPolygonField(srid=25832, null=True, blank=True)
    objects = models.GeoManager()

    class Meta:
        db_table = u'aree_ente'

    def __unicode__(self):
        return smart_str(self.ente)

######## INVENTARIO AZIONI DI TUTELA ATTIVA #########
actions=[
    ('AC01','AC01'),
    ('DA02','DA02'),
    ('ZU01','ZU01'),
    ('ZU02','ZU02'),
    ('PF04','PF04'),
    ('AA04','AA04'),
    ('ES02','ES02'),
    ('ES01','ES01'),
    ('PF02','PF02'),
    ('FO01','FO01'),
    ('PS01','PS01'),
    ('CA01','CA01'),
    ('VR01','VR01'),
    ('PF03','PF03'),
    ('PA02','PA02'),
    ('IT02','IT02'),
    ('FO03','FO03'),
    ('CO02','CO02'),
    ('CH01','CH01'),
    ('EP02','EP02'),
    ('FO05','FO05'),
    ('FO04','FO04'),
    ('AA03','AA03'),
    ('IT01','IT01'),
    ('EP01','EP01'),
    ('CO01','CO01'),
    ('PS02','PS02'),
    ('CA02','CA02'),
    ('PF01','PF01'),
    ('PA01','PA01'),
    ('CO03','CO03'),
    ('FO02','FO02'),
    ('AA02','AA02'),
    ('EP03','EP03'),
    ('AA01','AA01'),
    ('VR02','VR02'),
    ('ZU03','ZU03'),
    ('DA01','DA01'),
    ('FL01','FL01'),
    ('CA03','CA03'),
    ('CA04','CA03'),
    ('CH02','CH02'),
]

class Supportgeometries(models.Model):
    type_choices = [
        ('ATO','Ambiti Territoriali Omogenei'),
        ('ZPS','Zone di Protezione Speciale'),
        ('ZSC','Zone Speciali di Conservazione'),
        ('PARCHI','Parchi naturali'),
        ('COMUNI','Comuni'),
        ('RETI_RISERVE','Reti di Riserve'),
        ('COMUNITA_VALLE','Comunita'' di Valle'),
        ('PAT','Confini provinciali'),
    ]
    _database = 'inv'    
    type = models.CharField(max_length=128,choices=type_choices,verbose_name='Tipologia')
    attribute = models.CharField(max_length=128,verbose_name='Attributo')
    geom = models.PolygonField(srid=32632,verbose_name='Geometria')
    objects = models.GeoManager()

    class Meta:
        db_table = 'supportgeometries'
        verbose_name = 'Geometria di supporto'
        verbose_name_plural = 'Geometrie di supporto'