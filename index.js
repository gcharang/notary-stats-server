const Sequelize = require('sequelize');
const SmartChain = require("node-komodo-rpc");
const axios = require("axios")
const pubkeyToAddress = require("./pubkeyToAddress.js").pubkeyToAddress


const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'Notary_txns.sqlite',
});

const Transactions = sequelize.define('transactions', {
    txid: {
        type: Sequelize.STRING,
        unique: true,
    },
    txData: Sequelize.TEXT,
    chain: Sequelize.STRING,
    notaries: Sequelize.TEXT
});

txn_json = `{
"txid": "62c39be4dc6cae5effcd3bc55f1c40f7acfc528e199083658e373c1582941b76",
"version": 4,
"locktime": 0,
"confirmations": 300,
"notarized": true,
"height": 6850,
"lastNotarizedHeight": 7140,
"vin": [
{
"txid": "942a59d36f964a8e32862434c4085fd166b2518466bfb1834c6e217711b961dd",
"vout": 35,
"sequence": 4294967295,
"n": 0,
"scriptSig": {
"hex": "4730440220385d33baf4dbbaaeddf44d715c2b0dc8442a31283876c56d93b865ff8acf02880220536d7d6d3ccf2c6a529bcfcaa7bc50859980e78484ea719ec9573b38e1e4786c01",
"asm": "30440220385d33baf4dbbaaeddf44d715c2b0dc8442a31283876c56d93b865ff8acf02880220536d7d6d3ccf2c6a529bcfcaa7bc50859980e78484ea719ec9573b38e1e4786c[ALL]"
},
"addr": "RYNx9jA4WsbMoz4d5JKp66SyiLtXFYWFEw",
"valueSat": 10000,
"value": 0.0001,
"doubleSpentTxID": null
},
{
"txid": "d31a2235382746d6508532fad98917736254ef81f820d4d5a156cf19f3ff5c0f",
"vout": 3,
"sequence": 4294967295,
"n": 1,
"scriptSig": {
"hex": "483045022100b76b98c3f4918ffab561e31e9c7a3142d53a180646508471b136f1db0195f2ab02207d876bd24d9bb9a7bdb4d6bdbd86e0a139d39277fc98249d682c0b61f934bc4801",
"asm": "3045022100b76b98c3f4918ffab561e31e9c7a3142d53a180646508471b136f1db0195f2ab02207d876bd24d9bb9a7bdb4d6bdbd86e0a139d39277fc98249d682c0b61f934bc48[ALL]"
},
"addr": "RJ4gGibhHrs8XHLSyXLmcSTHgm9qMv7v6s",
"valueSat": 10000,
"value": 0.0001,
"doubleSpentTxID": null
},
{
"txid": "912b083b25f03aacfe5f8fb13e04c09b9bd8ac8fd1217c2902b84206a12af92a",
"vout": 40,
"sequence": 4294967295,
"n": 2,
"scriptSig": {
"hex": "483045022100d65bdd0dbac1a92570b6b873bed8c5f8a67a8fc0cbb6ec72535de85ee3926e590220013831ccbb0117d1061504a28bb2c5a9302f07b34f3aaa566bbfe2e574f68a7201",
"asm": "3045022100d65bdd0dbac1a92570b6b873bed8c5f8a67a8fc0cbb6ec72535de85ee3926e590220013831ccbb0117d1061504a28bb2c5a9302f07b34f3aaa566bbfe2e574f68a72[ALL]"
},
"addr": "RNZNFoaJHxP2CUjoS2RnDTeEnbdwzM4JFr",
"valueSat": 10000,
"value": 0.0001,
"doubleSpentTxID": null
},
{
"txid": "a3f70eb9476f311eea6532bec74241b689b402d1007099fefddd8ea59f8b2526",
"vout": 6,
"sequence": 4294967295,
"n": 3,
"scriptSig": {
"hex": "4730440220574fdaa640392df8a2ca2de1ba66a5ad56882ea382075f39dae447a65cf1ee4f02206480da9b3d9b9b1ed9c0f2a416e62738cb411c796108b7eec889f01bc861decf01",
"asm": "30440220574fdaa640392df8a2ca2de1ba66a5ad56882ea382075f39dae447a65cf1ee4f02206480da9b3d9b9b1ed9c0f2a416e62738cb411c796108b7eec889f01bc861decf[ALL]"
},
"addr": "REcUtZqF1VfEUzvePRJaqAEZAfq9Q2wCgK",
"valueSat": 10000,
"value": 0.0001,
"doubleSpentTxID": null
},
{
"txid": "de20ded19fcef62c46b6f46efdf59cc6962a08ad92c622372fd93e5d97c354b5",
"vout": 1,
"sequence": 4294967295,
"n": 4,
"scriptSig": {
"hex": "47304402207716ee73625f312ffe8a2b3d14fc12d991b343df3114df327ad2f28008dd3939022047b0a31778c660572add057d51d5f8d4b969f9e61fe711756c46864c9040e87001",
"asm": "304402207716ee73625f312ffe8a2b3d14fc12d991b343df3114df327ad2f28008dd3939022047b0a31778c660572add057d51d5f8d4b969f9e61fe711756c46864c9040e870[ALL]"
},
"addr": "RKxEVrfUxuT8LaYHJkzdRA51AraBFga8uJ",
"valueSat": 10000,
"value": 0.0001,
"doubleSpentTxID": null
},
{
"txid": "e64d0db8f08cbf5a55577cafc79d32ea8059c933fa39c384aa34e2b500d6af5c",
"vout": 0,
"sequence": 4294967295,
"n": 5,
"scriptSig": {
"hex": "483045022100b80c4c6ce8226e67c009b46233d27a9f174595473fc50160a87914a7f05b7c16022003422b92d256a92f4658d2abb382ad8f541c6b97fa31e53b79459da2a8f88d4801",
"asm": "3045022100b80c4c6ce8226e67c009b46233d27a9f174595473fc50160a87914a7f05b7c16022003422b92d256a92f4658d2abb382ad8f541c6b97fa31e53b79459da2a8f88d48[ALL]"
},
"addr": "RQhyMjQoSmhDcrDQHfLR2xra2UMMT8L1BL",
"valueSat": 10000,
"value": 0.0001,
"doubleSpentTxID": null
}
],
"vout": [
{
"value": "0.00045600",
"n": 0,
"scriptPubKey": {
"hex": "21020e46e79a2a8d12b9b5d12c7a91adb4e454edfae43c0a0cb805427d2ac7613fd9ac",
"asm": "020e46e79a2a8d12b9b5d12c7a91adb4e454edfae43c0a0cb805427d2ac7613fd9 OP_CHECKSIG",
"addresses": [
"RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"
],
"type": "pubkeyhash"
},
"spentTxId": null,
"spentIndex": null,
"spentHeight": null
},
{
"value": "0.00000000",
"n": 1,
"scriptPubKey": {
"hex": "6a4c72d6be8b29a372e93e0ae12409045505d9e8ce2b0d77cf858a54eb95a1012c6e00b81a0000076dfd837b866e7c3f031f7ebcb9b903b48f172241b0ee2a74b0e7d2abbe2d64545853434c41504f570002b900b817cbfe1babd99ae6d3c2544085947cf54b0191903c507314428bafd514000000",
"asm": "OP_RETURN d6be8b29a372e93e0ae12409045505d9e8ce2b0d77cf858a54eb95a1012c6e00b81a0000076dfd837b866e7c3f031f7ebcb9b903b48f172241b0ee2a74b0e7d2abbe2d64545853434c41504f570002b900b817cbfe1babd99ae6d3c2544085947cf54b0191903c507314428bafd514000000"
},
"spentTxId": null,
"spentIndex": null,
"spentHeight": null
}
],
"vjoinsplit": [],
"blockhash": "0048dc4462ca43be73f152e579f0c88014faa76f5971b08534af7061605fab79",
"blockheight": 6850,
"time": 1583985356,
"blocktime": 1583985356,
"valueOut": 0.000456,
"size": 880,
"valueIn": 0.0006,
"fees": 0.000144,
"fOverwintered": true,
"nVersionGroupId": 2301567109,
"nExpiryHeight": 0,
"valueBalance": 0,
"spendDescs": [],
"outputDescs": []
}`

transactionData = JSON.parse(txn_json);
//console.log(transactionData.vin.map(vin => vin.addr));
(async () => {

    try {
        const response = await axios.get("https://raw.githubusercontent.com/KomodoPlatform/dPoW/testnet/iguana/testnet.json");
        const testnetJson = typeof response.data === 'object' && response.data !== null ? response.data : JSON.parse(response.data)
        console.log(testnetJson.notaries.map(obj => pubkeyToAddress(Object.values(obj)[0])))
    } catch (error) {
        console.error(`error: ${error}`);
    }



    await Transactions.sync();
    try {
        const transaction = await Transactions.create({
            txid: transactionData.txid,
            txData: txn_json,
            chain: "TXSCLAPOW",
            notaries: transactionData.vin.map(vin => vin.addr).toString()
        });
        const test = await Transactions.findOne({
            where: {
                txid: "62c39be4dc6cae5effcd3bc55f1c40f7acfc528e199083658e373c1582941b76"
            }
        });
        console.log(`transaction: "${transactionData.txid}" added.`);
        console.log(test.get("notaries"))

    }
    catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            console.log(`transaction: "${transactionData.txid}" already exists in the db.`);
        } else {
            console.log(`Something went wrong with adding transaction: "${transactionData.txid}" \n` + e);
        }

    }

    try {
        const t = new SmartChain({
            name: "DEXP2P2"
        }).rpc();
        let out = await t.getaddresstxids("RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA")
        // let out = await t.getinfo()
        console.log(out)
    } catch (error) {
        console.log(JSON.stringify(error.response.data))
    }



})();




/*
const k = new SmartChain().rpc();


const r = new SmartChain({
    name: "RICK"
}).rpc();


const m = new SmartChain({
    name: "MORTY"
}).rpc();


const t = new SmartChain({
    name: "TXSCLAPOW"
}).rpc();
let out = await t.getaddresstxids('{"addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"]}')
console.log(out)
// getaddresstxids '{"addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"]}'
*/