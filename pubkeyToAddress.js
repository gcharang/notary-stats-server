var crypto = require('./crypto');
var bs58check = require('bs58check');




function pubkeyToAddress(pubKey) {
    const hash160 = crypto.hash160(Buffer.from(pubKey, 'hex')).toString("hex")
    const address = bs58check.encode(Buffer.from('3c' + hash160, 'hex')).toString('hex')
    return address
}

exports.pubkeyToAddress = pubkeyToAddress;