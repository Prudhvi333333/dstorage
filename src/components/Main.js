import React, { Component } from 'react';
import { convertBytes } from './helpers';
import moment from 'moment'
import Web3 from 'web3';
import { publicToAddress } from 'ethereumjs-util';
import keys from '../keys.json'; // Import your keys.json file
import EthCrypto from "eth-crypto";
import bs58 from 'bs58';


// Add this function to your code
function isAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}



class Main extends Component {

  

  // encryptFileHash = async (fileHash, publicKey) => {
  //   const messageHash = EthCrypto.hash.keccak256(fileHash); // Hashing the fileHash (CID)
    
  //   // Encrypting the message hash
  //   const encrypted = await EthCrypto.encryptWithPublicKey(
  //     publicKey, // by public-key which is derived from Ethereum address mapping in list.json file 
  //     messageHash // message
  //   );
  
  //   // We will return the encrypted object as a string
  //   return EthCrypto.cipher.stringify(encrypted);
  // };

  encryptFileHash = async (fileHash, publicKey) => {
    const messageHash = EthCrypto.hash.keccak256(fileHash);
  
    const encrypted = await EthCrypto.encryptWithPublicKey(
      publicKey,
      messageHash
    );
  
    // Ensure the encrypted object is a JSON string
    return JSON.stringify(EthCrypto.cipher.stringify(encrypted));
  };
  

  
  


  handleShareFile = async (fileId, fileHash) => {
    // Get the recipient's Ethereum address from the user
    const recipientAddress = window.prompt('Enter the recipient\'s Ethereum address:');
  
    // Validate the recipient's Ethereum address
    if (recipientAddress === this.props.account) {
      window.alert('You have entered your own Ethereum address.');
      return;
    }

    if (!isAddress(recipientAddress)) {
      window.alert('You have entered an invalid Ethereum address.');
      return;
    }
  
    // Get the recipient's public key from the keys.json file
    const recipientKeyObj = keys.find(keyObj => keyObj.address === recipientAddress);
  
    if (!recipientKeyObj || !recipientKeyObj.publicKey) {
      window.alert('Public key not found for the entered Ethereum address.');
      return;
    }
    
    const recipientPublicKey = recipientKeyObj.publicKey;
    
    try {
      // Encrypt the file hash with the recipient's public key
      const encryptedFileHash = await this.encryptFileHash(fileHash, recipientPublicKey);
    
      // Log the encrypted file hash
      console.log('Encrypted CID:', encryptedFileHash);
      console.log(this.props.account)
      // Call the shareFile function in the contract with the recipient address and encrypted file hash
      
      if (this.props.dstorage && this.props.dstorage.methods) {
        this.props.dstorage.methods.shareFile(fileId, recipientAddress,  encryptedFileHash).send({ from: this.props.account })

          .once('receipt', (receipt) => {
            console.log(receipt);
          });
      } else {
        console.error('dstorage or dstorage.methods is undefined');
      }
    } catch (e) {
      console.error(e);
      window.alert('An error occurred while sharing the file.');
    }
  };


  render() {
    return (
      <div className="container-fluid mt-5 text-center">
        <div className="row">
          <main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '1024px' }}>
            <div className="content">
              <p>&nbsp;</p>
              <div className="card mb-3 mx-auto bg-dark" style={{ maxWidth: '512px' }}>
                <h2 className="text-white text-monospace bg-dark"><b><ins>Share File</ins></b></h2>
                  <form onSubmit={(event) => {
                    event.preventDefault()
                    const description = this.fileDescription.value
                    this.props.uploadFile(description)
                  }} >
                      <div className="form-group">
                        <br></br>
                          <input
                            id="fileDescription"
                            type="text"
                            ref={(input) => { this.fileDescription = input }}
                            className="form-control text-monospace"
                            placeholder="description..."
                            required />
                      </div>
                    <input type="file" onChange={this.props.captureFile} className="text-white text-monospace"/>
                    <button type="submit" className="btn-primary btn-block"><b>Upload!</b></button>
                  </form>
              </div>
              <p>&nbsp;</p>
              <table className="table-sm table-bordered text-monospace" style={{ width: '1000px', maxHeight: '450px'}}>
                <thead style={{ 'fontSize': '15px' }}>
                  <tr className="bg-dark text-white">
                    <th scope="col" style={{ width: '10px'}}>id</th>
                    <th scope="col" style={{ width: '200px'}}>name</th>
                    <th scope="col" style={{ width: '230px'}}>description</th>
                    <th scope="col" style={{ width: '120px'}}>type</th>
                    <th scope="col" style={{ width: '90px'}}>size</th>
                    <th scope="col" style={{ width: '90px'}}>date</th>
                    <th scope="col" style={{ width: '120px'}}>uploader/view</th>
                    <th scope="col" style={{ width: '120px'}}>hash/view/get</th>
                    <th scope="col" style={{ width: '120px'}}>Share </th>
                  </tr>
                </thead>
                { this.props.files.map((file, key) => {
                  return(
                    <thead style={{ 'fontSize': '12px' }} key={key}>
                      <tr>
                        <td>{file.fileId}</td>
                        <td>{file.fileName}</td>
                        <td>{file.fileDescription}</td>
                        <td>{file.fileType}</td>
                        <td>{convertBytes(file.fileSize)}</td>
                        <td>{moment.unix(file.uploadTime).format('h:mm:ss A M/D/Y')}</td>
                        <td>
                        {file && file.uploader ? (
                          <a
                            href={"https://etherscan.io/address/" + file.uploader}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {file.uploader.substring(0, 10)}...
                          </a>
                        ) : (
                          'N/A'
                        )}
                         </td>
                        <td>
                        {file && file.fileHash ? (
                            <a
                              href={'https://ipfs.infura.io/ipfs/' + file.fileHash}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {file.fileHash.substring(0, 10)}...
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>
                        <button onClick={() => this.handleShareFile(file.fileId, file.fileHash)}>Share</button>

                        </td>
                      </tr>
                    </thead>
                  )
                })}
              </table>
            </div>
          </main>
        </div>
      </div>
    );
  }
}

export default Main;

