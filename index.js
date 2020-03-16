const Sequelize = require('sequelize');
const SmartChain = require("node-komodo-rpc");
const axios = require("axios")
const pubkeyToAddress = require("./pubkeyToAddress.js").pubkeyToAddress

const delaySec = s => new Promise(res => setTimeout(res, s * 1000));


const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    // SQLite only
    storage: 'db.sqlite',
});

const Transactions = sequelize.define('transactions', {
    txid: {
        type: Sequelize.STRING,
        unique: true,
        primaryKey: true
    },
    txData: Sequelize.TEXT,
    chain: Sequelize.STRING,
    notaries: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
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



const isNotarizationTxn = async (transactionData) => {
    const transactionDataObj = typeof transactionData === 'object' && transactionData !== null ? transactionData : JSON.parse(transactionData)

    const isCorrectNumVins = 2 < transactionDataObj.vin.length && transactionDataObj.vin.length < 13
    let isAllVinsNotaries = true

    for (const utxo of transactionDataObj.vin) {
        const isNotary = await NotariesList.findOne({
            where: {
                address: utxo.address
            }
        });
        isAllVinsNotaries = isAllVinsNotaries && isNotary
    }
    if (isCorrectNumVins && isAllVinsNotaries) {
        return true
    } else {
        return false
    }
}

const addTxnToDb = async (transactionData, chainName) => {
    const transactionDataObj = typeof transactionData === 'object' && transactionData !== null ? transactionData : JSON.parse(transactionData)
    const transactionDataStr = typeof transactionData === 'object' && transactionData !== null ? JSON.stringify(transactionData) : transactionData

    const notaryString = transactionDataObj.vin.map(utxo => utxo.address).toString()

    try {
        const transaction = await Transactions.create({
            txid: transactionDataObj.txid,
            txData: transactionDataStr,
            chain: chainName,
            notaries: notaryString,
            height: transactionDataObj.height,
            unixTimestamp: transactionDataObj.time
        });
        console.log(`transaction: "${transaction.txid}" added to transactions db.`);
        const notariesArray = transaction.get("notaries").split(",")

        for (const addr of notariesArray) {
            try {
                const notary = await NotariesList.findOne({
                    where: {
                        address: addr
                    }
                });
                await notary.increment(chainName)
            } catch (error) {
                console.log(`Something went wrong when incrementing Notarization count of "${addr}" \n` + error);
            }
        }

        const totalNotarizations = await State.findOne({
            where: {
                name: "totalNotarizations"
            }
        });
        await totalNotarizations.increment(chainName)
    }
    catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            console.log(`transaction: "${transactionDataObj.txid}" already exists in the transactions db.`);
        } else {
            console.log(`Something went wrong when dealing with transaction: "${transactionDataObj.txid}"  \n` + e);
        }

    }

}

const processSmartChain = async (name, start) => {
    console.log(`started processingFn for ${name}`)
    try {
        const chain = new SmartChain({
            name: name
        })
        const lastBlock = await State.findOne({
            where: {
                name: "lastBlock"
            }
        });

        const rpc = chain.rpc();
        const getInfo = await rpc.getinfo()
        const currBlockheight = getInfo.blocks
        let txnIds
        if (lastBlock[name] = 0) {
            txnIds = await rpc.getaddresstxids({ "addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"], "start": start, "end": currBlockheight })
        } else if (lastBlock[name] <= currBlockheight) {
            txnIds = await rpc.getaddresstxids({ "addresses": ["RXL3YXG2ceaB6C5hfJcN4fvmLH2C34knhA"], "start": lastBlock[name], "end": currBlockheight })
        } else {
            throw "Error: past processed blockheight greater than current"
        }
        console.log(`before txnIds loop in processingFn for ${name}`)

        for (const txnId of txnIds) {
            const txn = await rpc.getrawtransaction(txnId, 1)
            // await delaySec(0.05);
            if (await isNotarizationTxn(txn)) {
                await addTxnToDb(txn, name)
            }
        }
        console.log(`txnIds loop in processingFn for ${name} is done`)

        lastBlock[name] = currBlockheight
        await lastBlock.save()

        console.log(`end of try block in processingFn for ${name}`)
    } catch (error) {
        console.log(`Something went wrong.Error: \n` + error);
    }
    console.log(`finished processingFn for ${name}`)
}

(async () => {
    await Transactions.sync();
    await NotariesList.sync();
    await State.sync();

    try {
        const response = await axios.get("https://raw.githubusercontent.com/KomodoPlatform/dPoW/testnet/iguana/testnet.json");
        const testnetJson = typeof response.data === 'object' && response.data !== null ? response.data : JSON.parse(response.data)

        for (const notary of testnetJson.notaries) {

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
        }
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
    await processSmartChain("TXSCLAPOW", 0)
    await processSmartChain("MORTY", 303000)
    await processSmartChain("RICK", 303000)

    const notaryData = await NotariesList.findAll({ attributes: ["name", "address", "RICK", "MORTY", "TXSCLAPOW"] })
    console.log(JSON.stringify(notaryData))


})();

