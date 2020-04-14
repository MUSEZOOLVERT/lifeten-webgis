
// la funzione restituisce in un array
// la larghezza e l'altezza della pagina reale(scroll compreso) e la larghezza e l'altezza della finestra visibile
// codice preso da http://www.good2know.it/javascript/funzione-per-le-dimensioni-della-pagina-reale-e-della-finestra-visualizzata-javascript
function getPageSize() {

  var xScroll, yScroll;

  // ---> RICAVO LE DIMENSIONI DELLA PAGINA <--- //

  // window.innerHeight : altezza della finestra visibile
  // window.innerWidth&nbsp; : larghezza della finestra visibile

  // window.scrollMaxY&nbsp; : dimensioni massime dello scroll verticale
  // window.scrollMaxX&nbsp; : dimensioni massime dello scroll orizzontale

  // document.body.offsetHeight : altezza di default del browser
  // document.body.offsetWidth&nbsp; : larghezza di default del browser

  // se esiste l'altezza della finestra e lo scroll verticale(quindi esiste anche la barra x lo scorrimento)
  // xScroll è la somma dello scroll orizzontale e della larghezza della finestra
  // yScroll è la somma dello scroll verticale e dell'altezza della finestra

  if (window.innerHeight && window.scrollMaxY) {
      xScroll = window.innerWidth + window.scrollMaxX;
      yScroll = window.innerHeight + window.scrollMaxY;
  }else if (document.body.scrollHeight > document.body.offsetHeight){
      xScroll = document.body.scrollWidth;
      yScroll = document.body.scrollHeight;
  }else{
      xScroll = document.body.offsetWidth;
      yScroll = document.body.offsetHeight;
  }

  var windowWidth, windowHeight;

  // ---> RICAVO LE DIMENSIONI DELLA FINESTRA <--- //

  // self.innerHeight : altezza di default della finestra
  // self.innerWidth&nbsp; : larghezza di default della finestra
  // (dimensioni non valide per Explorer 6)

  // document.documentElement.clientWidth&nbsp; : larghezza di default della finestra
  // document.documentElement.clientHeight : altezza di default della finestra
  // (dimensioni valide per Explorer 6)

  if (self.innerHeight) {
      if(document.documentElement.clientWidth){
	  windowWidth = document.documentElement.clientWidth;
      }else{
	  windowWidth = self.innerWidth;
      }
      windowHeight = self.innerHeight;
  }else if (document.documentElement && document.documentElement.clientHeight) {
      windowWidth = document.documentElement.clientWidth;
      windowHeight = document.documentElement.clientHeight;
  }else if (document.body) {
      windowWidth = document.body.clientWidth;
      windowHeight = document.body.clientHeight;
  }

  //per le pagine con l'altezza totale minore dell'altezza della finestra del browser
  if(yScroll < windowHeight){
      pageHeight = windowHeight;
  }else {
      pageHeight = yScroll;
  }

  //per le pagine con larghezza totale minore della larghezza della finestra del browser
  if(xScroll < windowWidth){
      pageWidth = xScroll;
  }else{
      pageWidth = windowWidth;
  }

  //creo l'array e lo ritorno
  arrayPageSize = new Array(pageWidth,pageHeight,windowWidth,windowHeight);
  return arrayPageSize;
}
