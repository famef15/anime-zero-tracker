function decodeHexEscapes(str) {
  // Convert \xNN sequences into decoded UTF-8 string
  // If there are consecutive \xNN bytes, collect them and decode as UTF-8 Buffer
  return str.replace(/(?:\\x[0-9A-Fa-f]{2})+/g, (match) => {
    const bytes = [];
    const hexRegex = /\\x([0-9A-Fa-f]{2})/g;
    let m;
    while ((m = hexRegex.exec(match)) !== null) {
      bytes.push(parseInt(m[1], 16));
    }
    return Buffer.from(bytes).toString('utf-8');
  });
}

const raw = '{"serverLeaderboard":[{"isLocal":true,"userId":9165405454,"name":"Liesajsor17919","displayName":"\\xE3\\x83\\x95\\xE3\\x83\\xAC\\xE3\\x83\\xBC\\xE3\\x83\\xA0"}],"player":{"name":"Liesajsor17919","userId":9165405454}}';

const decoded = decodeHexEscapes(raw);
console.log('Decoded string:', decoded);
const obj = JSON.parse(decoded);
console.log('Parsed successfully:', obj);
