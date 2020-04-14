# -*- coding: utf-8 -*-
from django.contrib.gis import admin
from django.contrib.admin import SimpleListFilter
from models import Occurrence, AreeProtette, Institutioninfo
from models import Recorderinfo, Datasetinfo, Species
from models import AreeEnte


def make_RelatedOnlyFieldListFilter(attr_name, filter_title):
    class RelatedOnlyFieldListFilter(SimpleListFilter):
        """Filter that shows only referenced options, i.e. options having at least a single object."""
        title = filter_title
        parameter_name = attr_name

        def lookups(self, request, model_admin):
            related_objects = set([getattr(obj, attr_name) for obj in model_admin.model.objects.all()])
            return [(related_obj.id, unicode(related_obj)) for related_obj in related_objects]

        def queryset(self, request, queryset):
            if self.value():
                return queryset.filter(**{'%s__id__exact' % attr_name: self.value()})
            else:
                return queryset

    return RelatedOnlyFieldListFilter

admin.site.register(Occurrence, admin.OSMGeoAdmin)
admin.site.register(AreeProtette, admin.OSMGeoAdmin)
admin.site.register(Institutioninfo)
admin.site.register(Recorderinfo)
admin.site.register(Datasetinfo)
admin.site.register(Species)
admin.site.register(AreeEnte, admin.OSMGeoAdmin)
