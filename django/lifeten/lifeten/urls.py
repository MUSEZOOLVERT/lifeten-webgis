from django.conf.urls import patterns, include, url
from django.contrib.gis import admin
from django.conf import settings

from lifeten.gis.views import *

admin.autodiscover()

urlpatterns = patterns('',

    # WEB PAGES
    url(r'^login/',  'django.contrib.auth.views.login',{'template_name': 'login.html'}),
    url(r'^login_simple/', 'django.contrib.auth.views.login', {'template_name': 'login_simple.html'}),
    url(r'^logout/', 'django.contrib.auth.views.logout', {'next_page': '/'}),
    url(r'^$', homepage),
    url(r'^lifeten/$', homepage),
    url(r'^webgis/$', webgis),
    url(r'^viewdata/$', viewdata),
    url(r'^viewspecie/$', viewspecie),
    url(r'^credits/$', viewcredits),
    url(r'^help/$', viewhelp),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),

    # GEOJSON FUNCTIONS
    url(r'^returnpolygonfromspecie/(?P<specie>[A-Za-z0-9_ ]+)/$',polygonFromSpecie, name='polygonfromspecie'),
    url(r'^returnpolygonfromspecie/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<outformat>[A-Za-z0-9_ ]+))(?:/(?P<zipp>[A-Za-z0-9_ ]+))/$', polygonFromSpecie, name='polygonfromspecie'), 
    url(r'^returnkmlfromspecie/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<idInsti>[A-Za-z0-9_ ]+))/$', kmlFromSpecie, name='kmlfromspecie'), 
    url(r'^returnkmlfromspecie/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<idInsti>[A-Za-z0-9_ ]+))(?:/(?P<idArea>[A-Za-z0-9_ ]+))/$', kmlFromSpecie, name='kmlfromspecie'),
    url(r'^returninfofromspecie/(?P<specie>[A-Za-z0-9_ ]+)/$', infoSpecieFromSpecie),
    url(r'^returndatafromspecie/(?P<specie>[A-Za-z0-9_ ]+)/$', dataFromSpecie),
    url(r'^returninstifromspecie/(?P<specie>[A-Za-z0-9_ ]+)/$', infoInstiFromSpecie),
    url(r'^returndatafromspecie/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<idArea>[A-Za-z0-9_ ]+))(?:/(?P<tipe>[A-Za-z0-9_ ]+))/$', dataFromSpecie),
    url(r'^returndatafromspecie/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<idArea>[A-Za-z0-9_ ]+))(?:/(?P<tipe>[A-Za-z0-9_ ]+))/(?P<ecsv>\w+)/$', dataFromSpecie),
    url(r'^returninstifromspecie/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<idArea>[A-Za-z0-9_ ]+))(?:/(?P<tipe>[A-Za-z0-9_ ]+))/$', infoInstiFromSpecie),

    url(r'^returnclass/$', returnClass),
    url(r'^returnordo/(?P<clas>\w+)/$', returnOrdo),
    url(r'^returnfamily/(?P<ordo>\w+)/$', returnFamilia),
    url(r'^returngenus/(?P<familia>\w+)/$', returnGenus),
    url(r'^returnspecie/(?P<genus>\w+)/$', returnSpecie),
    url(r'^returnlistaree/$', returnListAree),
    url(r'^returnlistcomuni/$', returnListComuni),
    url(r'^returnlistato/$', returnListAto),
    url(r'^returnlistcomunita/$', returnListComunita),
    url(r'^returnlistspecie/(?P<idArea>[A-Za-z0-9_ ]+)/(?P<tipe>\w+)/(?P<ecsv>\w+)/$', returnListSpecie),
    url(r'^returnlistspecie/(?P<idArea>[A-Za-z0-9_ ]+)/(?P<tipe>\w+)/$', returnListSpecie),
    url(r'^returnlistspecie/$', returnListSpecie),

    # EXPORT
    url(r'^export/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<outformat>[A-Za-z0-9_ ]+))(?:/(?P<zipp>[A-Za-z0-9_ ]+))(?:/(?P<idInsti>[A-Za-z0-9_ ]+))/$', kmlFromSpecie),
    url(r'^export/(?P<specie>[A-Za-z0-9_ ]+)(?:/(?P<outformat>[A-Za-z0-9_ ]+))(?:/(?P<zipp>[A-Za-z0-9_ ]+))(?:/(?P<idInsti>[A-Za-z0-9_ ]+))(?:/(?P<idArea>[A-Za-z0-9_ ]+))/$', kmlFromSpecie),
    url(r'^returnwms/(?P<specie>[A-Za-z0-9_ ]+)', returnWMS), 
    url(r'^returnbbox/(?P<idArea>[A-Za-z0-9_ ]+)/(?P<tipe>\w+)', returnBBoxArea),
    url(r'^returnbbox/(?P<idArea>[A-Za-z0-9_ ]+)/(?P<tipe>\w+)', returnBBoxArea),    
 #   url(r'^returncontainedareas/(?P<idArea>[A-Za-z0-9_ ]+)/(?P<areaType>[A-Za-z0-9_ ]+)/(?P<filterOn>[A-Za-z0-9_ ]+)/$', testfunctions.returnContainedAreas),    

) # END OF URL PATTERNS

if settings.DEBUG:
    # static files (images, css, javascript, etc.)
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {
        'document_root': settings.MEDIA_ROOT}))
