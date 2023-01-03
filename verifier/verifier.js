const fs = require('fs');
const crypto = require('crypto');

const { verify_proof } = require('../shared-lib');

const args = process.argv.slice(2);

const fn_proof = args[0];
const fn_pubkey = args[1];
const attrs = args.slice(2);

const proof = JSON.parse(fs.readFileSync(fn_proof));
const pubkey = fs.readFileSync(fn_pubkey);

let verification_proof = true;

const verification_sig = crypto.verify('sha256', proof.hash, pubkey, new Buffer.from(proof.sig, 'base64'));

if (verification_sig) {
    console.log("--- Signature is verified. ---");
} else {
    console.log("--- Signature is INVALID! ---");
    return;
}

attrs.forEach(attr => {
    let verified = verify_proof(proof, attr, proof.attributes[attr].value, proof.attributes[attr].salt);
    if (verified) {
        console.log("Verified: the value of " + attr + " is " + proof.attributes[attr].value);
    } else {
        console.log("UNABLE TO VERIFY: " + attr + " and corresponding value " + proof.attributes[attr].value);
    }
    verification_proof = verification_proof && verified;
});

if (verification_proof && verification_sig) {
    console.log("--- All the attributes provided are verified. ---");
}