from django.db import models
from lifeten.gis.models import Institutioninfo, AreeEnte

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.encoding import smart_str


@receiver(post_save, sender=User)
def my_handler(sender, instance, created, **kwargs):
    "Aggiunge automaticamente user in UserProfile"
    if created:
        UserProfile(user=instance).save()


def validateUser(value):
    """Controlla che il valore di Institutioninfo esista"""
    if value != 0:
        try:
            Institutioninfo.objects.get(pk=int(value))
        except (TypeError, ValueError, Institutioninfo.DoesNotExist):
            raise ValidationError('Codice istituzione "%s" non valido' % value)
    else:
        return None


def validateArea(value):
    """Controlla che il valore di AreaEnte esista"""
    if value != 0:
        try:
            AreeEnte.objects.get(gid=int(value))
        except (TypeError, ValueError, AreeEnte.DoesNotExist):
            raise ValidationError('Codice area "%s" non valido' % value)
    else:
        return None


class UserProfile(models.Model):
    """Crea il modello del Profilo"""
    user = models.OneToOneField(User)
    institution_id = models.PositiveIntegerField(validators=[validateUser],
                                                 null=True, blank=True)
    area_id = models.PositiveIntegerField(validators=[validateArea],
                                          null=True, blank=True)

    def institution(self):
        """Funzione usata dall'admin per visualizzare il nome
        dell'instituzione"""
        try:
            return Institutioninfo.objects.get(pk=int(self.institution_id))
        except:
            return ''

    def area(self):
        """Funzione usata dall'admin per visualizzare il nome dell'area"""
        try:
            return AreeEnte.objects.get(gid=int(self.area_id))
        except:
            return ''

    def __unicode__(self):
        """Funzione che serve per ottenere la rappresentazione testuale"""
        return smart_str(self.user)
