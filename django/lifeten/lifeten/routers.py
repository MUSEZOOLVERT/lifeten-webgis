# -*- coding: utf-8 -*-


class ExplicitRouter(object):
    """
    Serve per lavorare con database diversi; cerca sul modello l'attributo
    _database per sapere in quale database si trova quella specifica tabella
    """
    def db_for_read(self, model, **hints):
        db = getattr(model, '_database', 'default')
        return db

    def db_for_write(self, model, **hints):
        db = getattr(model, '_database', 'default')
        return db

    def allow_relation(self, obj1, obj2, **hints):
        db1 = getattr(obj1, '_database', 'default')
        db2 = getattr(obj2, '_database', 'default')
        val = db1 == db2
        return val

    def allow_syncdb(self, db, model):
        db1 = getattr(model, '_database', 'default')
        val = db == db1
        return val