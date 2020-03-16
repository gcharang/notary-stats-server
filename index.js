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
        primaryKey: true
    },
    txData: Sequelize.TEXT,
    chain: Sequelize.STRING,
    notaries: Sequelize.TEXT,
    height: Sequelize.INTEGER,
    unixTimestamp: Sequelize.INTEGER
});

const NotariesList = sequelize.define('notariesList', {
    pubkey: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    name: Sequelize.STRING,
    address: Sequelize.STRING,
    RICK: {
        type: Sequelize.INTEGER,
        defaultValue: '0'
    },
    MORTY: {
        type: Sequelize.INTEGER,
        defaultValue: '0'
    },
    TXSCLAPOW: {
        type: Sequelize.INTEGER,
        defaultValue: '0'
    },
    KMD: {
        type: Sequelize.INTEGER,
        defaultValue: '0'
    }
});

const State = sequelize.define('state', {
    name: {
        type: Sequelize.STRING, // lastBlock, totalNotarizations, 
        unique: true,
    },
    RICK: Sequelize.INTEGER,
    MORTY: Sequelize.INTEGER,
    TXSCLAPOW: Sequelize.INTEGER,
    KMD: Sequelize.INTEGER
});

const initSmartChain = async (name) => {
    try {
        return new SmartChain({
            name: name
        }).rpc();
        // let out = await t.getaddresstxids({ "addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"], "start": 6000, "end": 6500 })
        // let out = await t.getaddresstxids({ "addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"] })
        //console.log(out)
    } catch (error) {
        console.log(JSON.stringify(error.response.data))
    }
}

const isNotarizationTxn = async (transactionData) => {
    const transactionDataObj = typeof transactionData === 'object' && transactionData !== null ? transactionData : JSON.parse(transactionData)

    const isCorrectNumVins = 2 < transactionDataObj.vin.length && transactionDataObj.vin.length < 13
    let isAllVinsNotaries = true
    transactionDataObj.vin.forEach(async utxo => {
        const isNotary = await NotariesList.findOne({
            where: {
                address: utxo.addr
            }
        });
        isAllVinsNotaries = isAllVinsNotaries && isNotary
    })
    if (isCorrectNumVins && isAllVinsNotaries) {
        return true
    } else {
        return false
    }
}

const addTxnToDb = async (transactionData, chainName) => {
    const transactionDataObj = typeof transactionData === 'object' && transactionData !== null ? transactionData : JSON.parse(transactionData)
    const transactionDataStr = typeof transactionData === 'object' && transactionData !== null ? JSON.stringify(transactionData) : transactionData



    try {
        const transaction = await Transactions.create({
            txid: transactionDataObj.txid,
            txData: transactionDataStr,
            chain: chainName,
            notaries: transactionDataObj.vin.map(utxo => utxo.addr).toString(),
            height: transactionDataObj.height,
            unixTimestamp: transactionDataObj.time
        });
        console.log(`transaction: "${transaction.txid} " added to transactions db.`);

        transaction.get(notaries).split().forEach(async addr => {
            const notary = await NotariesList.findOne({
                where: {
                    address: addr
                }
            });
            notary.increment(chainName)
        })



    }
    catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            console.log(`transaction: "${transactionDataObj.txid}" already exists in the transactions db.`);
        } else {
            console.log(`Something went wrong with adding transaction: "${transactionDataObj.txid}" to transactions db \n` + e);
        }

    }
}


//transactionData = JSON.parse(txn_json);
//console.log(transactionData.vin.map(vin => vin.addr));
(async () => {
    await Transactions.sync();
    await NotariesList.sync();
    await State.sync();

    try {
        const response = await axios.get("https://raw.githubusercontent.com/KomodoPlatform/dPoW/testnet/iguana/testnet.json");
        const testnetJson = typeof response.data === 'object' && response.data !== null ? response.data : JSON.parse(response.data)

        testnetJson.notaries.forEach(async notary => {
            let notaryName = Object.keys(notary)[0]
            let pubkey = notary[notaryName]
            let address = pubkeyToAddress(pubkey)
            try {
                const notary = await NotariesList.create({
                    pubkey: pubkey,
                    name: notaryName,
                    address: address
                });
                console.log(
                    `notary ${notary.name} (${notary.address})  added to the DB.`
                );
            } catch (e) {
                if (e.name === 'SequelizeUniqueConstraintError') {
                    console.log(`notary ${notaryName} (${address}) already exists in the notary db.`);
                } else {
                    console.log(`Something went wrong with adding notary: "${notaryName} (${address})" to the notary db.\n` + e);
                }
            }
        });
    } catch (error) {
        console.error(`error: ${error}`);
    }

    try {
        let state = await State.create({
            name: "lastBlock",
            RICK: 0,
            MORTY: 0,
            TXSCLAPOW: 0,
            KMD: 0
        });
        console.log(
            `${state.name} created in State db`
        );

    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            console.log(`"lastBlock" already exists in the State db.`);

        } else {
            console.log(`Something went wrong with adding state: "${state.name}" to the State db.\n` + e);
        }
    }

    try {
        let state = await State.create({
            name: "totalNotarizations",
            RICK: 0,
            MORTY: 0,
            TXSCLAPOW: 0,
            KMD: 0
        });
        console.log(
            `${state.name} created in State db`
        );

    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            console.log(`"totalNotarizations" already exists in the State db.`);

        } else {
            console.log(`Something went wrong with adding state: "${state.name}" to the State db.\n` + e);
        }
    }
    const SmartChains = ["TXSCLAPOW", "RICK", "MORTY"]
    SmartChains.forEach(async name => {
        try {
            const rpc = new SmartChain({
                name: name
            }).rpc();
            const currBlockheight = await rpc.getinfo().blocks
            const txns = await rpc.getaddresstxids('{"addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"]}')
            txns.forEach(async txn => {
                if (await isNotarizationTxn(txn)) {
                    await addTxnToDb(txn, name)
                }
            })
            const chainObj = {}
            chainObj[name] = currBlockheight

            await State.update(chainObj, {
                where: {
                    name: "lastBlock"
                }
            });

            chainObj[name] = currBlockheight

            const totalNotarizations = await State.findOne({
                where: {
                    name: "totalNotarizations"
                }
            });
            totalNotarizations.increment(name)
        } catch (error) {
            console.log(`Something went wrong.Error: \n` + error);
        }
    })
    const notaryData = await NotariesList.findAll({ attributes: ["name", "address", "RICK", "MORTY", "TXSCLAPOW"] })
    console.log(JSON.stringify(notaryData))


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