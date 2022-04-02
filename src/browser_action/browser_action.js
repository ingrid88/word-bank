//Firebase.enableLogging(true);
 // $(function() {
var f = new Firebase('https://wordkeeper.firebaseio.com/words/');
$('.yo').append('this is so cool and awesome and cool and awesome!');
document.getElementById('cool').innerHTML ='this rd of';
// debugger

// if (typeof jQuery != 'undefined') {
//
//     alert("jQuery library is loaded!");
//
// }else{
//
//     alert("jQuery library is not found!");
//
// }

//debugger
f.on("value", function(snapshot) {

  var html = '';
  snapshot.forEach(function(child){
    var word = child.val();
    html += word.word + "<br>"
  });
  document.getElementById('contents').innerHTML = html;

  //$('.yo').append(html);
  var send = document.getElementById('send');
  send.addEventListener('click', sendEmail('ingspi@gmail.com', 'WordList', html));
});


// function sendEmail(){
//   // signed up for https://mandrillapp.com/
//   window.open('mailto:ingspi@gmail.com?subject=subject&body=body');
// };


function sendEmail(to, subject, content){
//$('.yo').append(html);
  document.getElementById('cool').innerHTML ='sent!';
  $.ajax({
    type: "POST",
    url: "https://mandrillapp.com/api/1.0/messages/send.json",
    data: {
      'key': 'Zktnh6lUlFh7J2zkkuGdjg',
      'message': {
        'from_email': 'ingspi@gmail.com',
        'to': [
          {
            'email': to,
            'name': 'kyle',
            'type': 'to'
          }
        ],
        'subject': subject,
        'html': content
      }
    }
  });
};
 // });


// document.addEventListener('dblclick', removeAll);
// document.addEventListener('dblclick', removeOne);
