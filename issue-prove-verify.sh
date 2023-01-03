#!/bin/bash
sh remove-sample-files.sh
node generate_rsa.js
node issuer/issuer.js example-id/id.json example-id/id.issued.json
node holder/holder.js example-id/id.issued.json example-id/id.proof.json sex date_of_birth
node verifier/verifier.js example-id/id.proof.json verifier/pub.pem sex date_of_birth