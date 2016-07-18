$(document).ready(function() {

var myDataRef = new Firebase('https://wordkeeper.firebaseio.com/words/');
document.addEventListener('dblclick', keepSelect);
debugger
function keepSelect(){

  if (window.getSelection) {
     var address = document.URL;
     var text = window.getSelection().toString();

     //check for tabs returns and spaces
     var tab =  /\t /.test(text);
     var returns = /\r?\n|\r/.test(text);
     var space = /\s/g.test(text);

     if (!tab && !returns && !space){
       myDataRef.push({
         word: text,
         url: address
       });
     }

  }
};


});
