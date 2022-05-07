//helpers.render = function(callback) {
  // We always start from index.html
  //fs.readFile(path.join(__dirname, '/../templates/index.html'), function(err, str) {
    //  if (!err && str) {
const str = '    <Constant ... lsafdf sf 1234 > </Constant>'

          let auxIndex = str.indexOf('<');
          let auxEndIndex = str.substring(auxIndex + 1).indexOf(' ');
          let word = 's'.substring(auxIndex + 1, auxEndIndex);


//       } else {
//           callback('Main index file not found.');
//       }
//   });
// }