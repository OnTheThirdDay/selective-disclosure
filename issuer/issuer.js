const fs = require('fs');
const crypto = require('crypto');

const { fix_order, generate_salts, generate_array, generate_tree } = require('../shared-lib');

const args = process.argv.slice(2);

const fn = args[0];
const fn_out = args[1];
const id_file = fs.readFileSync(fn);
const id_json = JSON.parse(id_file);

const raw_identification = id_json;

const order = fix_order(raw_identification);

const salts = generate_salts(raw_identification);

const array = generate_array(raw_identification, order, salts);

const tree = generate_tree(array);

tree.raw = raw_identification;
tree.order = order;
tree.salts = salts;

const private_key = fs.readFileSync(__dirname + '/priv.pem', 'utf-8');
const signer = crypto.createSign('sha256');
signer.update(tree.hash);
signer.end();
const signature = signer.sign({
    key: private_key,
    passphrase: 'selective-disclosure-issuer'
});
const buff = new Buffer.from(signature);
const base64data = buff.toString('base64');

tree.sig = base64data;

fs.writeFileSync(fn_out, JSON.stringify(tree));