const fs = require('fs');
const { generateKeyPair } = require('crypto');
generateKeyPair('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'selective-disclosure-issuer'
    }
}, (err, publicKey, privateKey) => {
    fs.writeFileSync("issuer/pub.pem", publicKey);
    fs.writeFileSync("verifier/pub.pem", publicKey);
    fs.writeFileSync("issuer/priv.pem", privateKey);
});

