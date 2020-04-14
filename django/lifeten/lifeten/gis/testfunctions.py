def _speciesCount(specTax,specName):
    """
    EN
    Counts species in database, using the count() method of Django's
    QuerySet API

    :param table text: 
    :param column text:
    :param subSet text: optional, if definied counts the values within
        the column parameter which corresponds exactly to the   
    /EN

    IT
    Conta gli oggetti del database, usando il metodo count() della API 
    QuerySet di Django

    :param table text: 
    :param column text:
    :param subSet text: optional, if definied counts the values within
        the column parameter which corresponds exactly to the      
    /IT
    options = {1 : specie,
        2 : genre,
        3 : clas,
    }

    def specie():
        return Species
    """
