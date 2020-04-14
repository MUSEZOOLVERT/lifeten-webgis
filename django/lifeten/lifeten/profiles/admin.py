# -*- coding: utf-8 -*-

from django.contrib.gis import admin
from django import forms
from models import UserProfile
from lifeten.gis.models import Institutioninfo, AreeEnte

# per avere una lista di scelte nel form di admin

istitutions = [(i.pk, i.fullname()) for i in Institutioninfo.objects.all()]
istitutions.insert(0, (0, '------------------------'))

areas = [(i.gid, i.__unicode__()) for i in AreeEnte.objects.all()]
areas.insert(0, (0, '-------------'))


class UserProfileForm(forms.ModelForm):
    """
    Form per l'inserimento di un nuovo profilo
    """
    institution_id = forms.ChoiceField(required=None, choices=istitutions)
    area_id = forms.ChoiceField(required=None, choices=areas)

    class Meta:
        model = UserProfile


class UserProfileAdmin(admin.ModelAdmin):
    """
    Modello di amministrazione per il nuovo profilo
    """
    form = UserProfileForm
    list_display = ('user', 'institution', 'area')

try:
    admin.site.register(UserProfile, UserProfileAdmin)
except:
    pass
