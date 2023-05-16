import { ethers } from 'ethers';

// connect to your Ganache
let provider = new ethers.providers.JsonRpcProvider("http://localhost:7545");

let blockNumber = await provider.getBlockNumber();

let blocks = [];
for(let i = 0; i < 1000; i++) { // adjust this number as needed
    let block = await provider.getBlock(blockNumber - i);
    blocks.push(block);
}

let data = [];
for(let block of blocks) {
    for(let txid of block.transactions) {
        let tx = await provider.getTransaction(txid);
        data.push({
            time: new Date(block.timestamp * 1000),
            transaction: tx.hash,
            gasPrice: ethers.utils.formatEther(tx.gasPrice)
        });
    }
}
