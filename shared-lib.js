// const { getRandomInt, base64_encode, fix_order, generate_salts, generate_array, split_and_merge, generate_tree, remove_children, generate_sub_proof, generate_proof, verify_tree, search_attribute_hash, verify_proof } = require('./shared-lib');

const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    },

    base64_encode(file) {
        const bitmap = fs.readFileSync(file);
        return new Buffer.from(bitmap).toString('base64');
    },

    fix_order(json_obj) {
        let order = [];
        for (let entry in json_obj) {
            order.push(entry);
        }

        return order;
    },

    generate_salts(json_obj) {
        let salts = [];
        for (let _ in json_obj) {
            salts.push(module.exports.getRandomInt(7 * 13 * 89 * 1024 * 4096).toString());
        }

        return salts;
    },

    generate_array(json_obj, order, salts) {
        let generated_array = [];
        for (let i = 0; i < order.length; ++i) {
            generated_array.push({ value: JSON.stringify({ [order[i]]: json_obj[order[i]] }), salt: salts[i] });
        }

        return generated_array;
    },

    split_and_merge(array) {
        let len = array.length;
        let root = null;
        if (len == 1) {
            const hash = crypto.createHash('sha256').update(array[0].value + array[0].salt).digest('base64');
            root = { is_leaf: true, count: 1, hash: hash, salt: array[0].salt };
        } else {
            let left = module.exports.split_and_merge(array.slice(0, Math.floor(len / 2)));
            let right = module.exports.split_and_merge(array.slice(Math.floor(len / 2)));
            const hash = crypto.createHash('sha256').update(left.hash + right.hash).digest('base64');
            root = { is_leaf: false, count: left.count + right.count, hash: hash, left_node: left, right_node: right };
        }
        return root;
    },

    generate_tree(array) {
        let root = module.exports.split_and_merge(array);

        return root;
    },

    remove_children(node) {
        return {
            "is_leaf": node.is_leaf,
            "hash": node.hash,
        };
    },

    generate_sub_proof(sub_tree, sub_orders) {
        if (sub_tree.count == 1) {
            return module.exports.remove_children(sub_tree);
        }
        return {
            "is_leaf": sub_tree.is_leaf,
            "hash": sub_tree.hash,
            "left_node": sub_orders.filter(e => e < Math.floor(sub_tree.count / 2)).length > 0 ? module.exports.generate_sub_proof(sub_tree.left_node, sub_orders.filter(e => e < Math.floor(sub_tree.count / 2))) : module.exports.remove_children(sub_tree.left_node),
            "right_node": sub_orders.filter(e => e >= Math.floor(sub_tree.count / 2)).length > 0 ? module.exports.generate_sub_proof(sub_tree.right_node, sub_orders.filter(e => e >= Math.floor(sub_tree.count / 2)).map(e => e - Math.floor(sub_tree.count / 2))) : module.exports.remove_children(sub_tree.right_node),
        }
    },

    generate_proof(tree, order_list, attributes) {
        let orders = attributes.map(e => order_list.indexOf(e));
        orders.filter(e => e >= 0);

        if (orders.length < 0) {
            return null;
        }

        return {
            "is_leaf": tree.is_leaf,
            "hash": tree.hash,
            "left_node": orders.filter(e => e < Math.floor(tree.count / 2)).length > 0 ? module.exports.generate_sub_proof(tree.left_node, orders.filter(e => e < Math.floor(tree.count / 2))) : module.exports.remove_children(tree.left_node),
            "right_node": orders.filter(e => e >= Math.floor(tree.count / 2)).length > 0 ? module.exports.generate_sub_proof(tree.right_node, orders.filter(e => e >= Math.floor(tree.count / 2)).map(e => e - Math.floor(tree.count / 2))) : module.exports.remove_children(tree.right_node),
        }
    },

    verify_tree(proof_tree) {
        if (!proof_tree.left_node && !proof_tree.right_node) {
            return true;
        }
        if (proof_tree.hash == crypto.createHash('sha256').update(proof_tree.left_node.hash + proof_tree.right_node.hash).digest('base64')) {
            return module.exports.verify_tree(proof_tree.left_node) && module.exports.verify_tree(proof_tree.right_node);
        } else {
            return false;
        }
    },

    search_attribute_hash(proof_tree, hash) {
        if (!proof_tree.left_node && !proof_tree.right_node) {
            if (proof_tree.hash == hash) {
                return true;
            }
            return false;
        }

        return module.exports.search_attribute_hash(proof_tree.left_node, hash) || module.exports.search_attribute_hash(proof_tree.right_node, hash);
    },

    verify_proof(proof, attribute, attribute_value, salt) {
        let hash = crypto.createHash('sha256').update(JSON.stringify({ [attribute]: attribute_value }) + salt).digest('base64');
        return module.exports.search_attribute_hash(proof, hash) && module.exports.verify_tree(proof);
    }
}