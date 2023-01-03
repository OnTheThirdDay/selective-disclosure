const fs = require('fs');

const { generate_proof } = require('../shared-lib');

const args = process.argv.slice(2);

const fn = args[0];
const fn_out = args[1];
const attrs = args.slice(2);

const tree = JSON.parse(fs.readFileSync(fn));

const proof = generate_proof(tree, tree.order, attrs);

proof.attributes = {};

attrs.forEach(a => proof.attributes[[a]] = { value: tree.raw[a], salt: tree.salts[tree.order.indexOf(a)] });

proof.sig = tree.sig;

fs.writeFileSync(fn_out, JSON.stringify(proof));