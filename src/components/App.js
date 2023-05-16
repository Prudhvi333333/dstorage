import DStorage from '../abis/DStorage.json'
import React, { Component } from 'react';
import Main from './Main'
import Web3 from 'web3';
import SharedFiles from './SharedFiles';
import './App.css';
import fs from 'fs';
import EthCrypto from "eth-crypto"
import GunNetwork from './GunNetwork';


const EthereumjsUtil = require('ethereumjs-util');

const ipfsClient = require('ipfs-http-client');

const projectId ='2N2Nat7jXertchmpEonVoCHBiwV';
const projectSecret = 'e9f8835c0e76f0f650f00a77ed718cc4';
const auth =
'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = ipfsClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  apiPath: '/api/v0',
  headers: {
    authorization: auth,
  },
})


// const ipfsClient = require('ipfs-http-client')
// const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })




class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData();
    await this.createKeysJSON();
   
    
    // Start the Gun network
    await this.gunNetwork.start();
    // Listen for the custom event from the Main component
    window.addEventListener('shareFile', this.handleShareFile);

     
     // Add listener for account change
     window.ethereum.on('accountsChanged', async () => {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();
      this.setState({ account: accounts[0] });
      await this.loadBlockchainData();
    });
  }

  async componentWillUnmount() {
    // Remove the listener when the component is unmounted
    window.removeEventListener('shareFile', this.handleShareFile);
    // Stop the libp2p node
  if (this.libp2pNode) {
    await this.libp2pNode.stop();
  }
  }

  handleShareFile = async (event) => {
    const { fileHash, recipient } = event.detail;
    const encryptedFileHash = await this.encryptFileHash(fileHash, recipient);
    
      // Send the encrypted CID to the recipient
      await this.gunNetwork.sendEncryptedCid(fileHash, recipient);
    // Call the shareFile function in the contract with the recipient address and encrypted file hash
    // You will need to replace 'DStorage' and 'shareFile' with your contract and method names
    this.state.DStorage.methods.shareFile(encryptedFileHash, recipient).send({ from: this.state.account })
      .once('receipt', (receipt) => {
        console.log(receipt);
      });
  };

  // Implement a method to fetch the encrypted CIDs and decrypt them
  async loadEncryptedCids() {
    const cids = await this.gunNetwork.getReceivedCids();
    // Do something with the decrypted CIDs
  }
  
  encryptFileHash = async (fileHash, recipient) => {
    // Get the recipient's public key
    const recipientPublicKey = await this.getPublicKey(recipient);
  
    // Convert the file hash and public key to Buffer
    const fileHashBuffer = Buffer.from(fileHash, 'hex');
    const publicKeyBuffer = Buffer.from(recipientPublicKey, 'hex');
  
    // Encrypt the file hash with the recipient's public key
    const encryptedFileHash = EthCrypto.encryptWithPublicKey(publicKeyBuffer, fileHashBuffer);
  
    return encryptedFileHash;
  };
  
  getPublicKey = async (address) => {
    try {
      // Load the keys.json file
      // In a real world scenario, you should replace the file path with the correct path
      const keys = JSON.parse(fs.readFileSync('./keys.json', 'utf8'));
  
      // Find the user with the given address
      const user = keys.find(user => user.address === address);
  
      if (user) {
        // If the user is found, return their public key
        return user.publicKey;
      } else {
        // If the user is not found, return a placeholder value
        return 'placeholder_public_key';
      }
    } catch (e) {
      console.error(e);
      return 'placeholder_public_key';
    }
  };
  
  

  createKeysJSON = async () => {
    const users = [
      {
        address: '0xde279AB09aF6968Ed8d5a3aeE47F1C9aeC1740d9',
        privateKey: 'e8e8e9584eabad1eaf35a33770fee02af5f8d75465b3ace05d7187880f358c67',
      },
      {
        address: '0x40F8245f34cCd24085363c317F634CD50f45d716',
        privateKey: '7292a6a929552a060cd4ebe2b78dea044f8e82dec682e548246fdcdeb6e482ff',
      },
      {
        address: '0x4f1C437e9766A54dB3259474038E328078a319A3',
        privateKey: '085e3720d384946e0dd464cfc0903cec3f8a00dba37d177f25b4c81230bad6a5',
      },
    ];

    const keys = users.map(user => {
      const privateKeyBuffer = Buffer.from(user.privateKey, 'hex');
      const publicKeyBuffer = EthereumjsUtil.privateToPublic(privateKeyBuffer);
      const publicKey = publicKeyBuffer.toString('hex');

      return {
        publicKey,
        privateKey: user.privateKey,
        address: user.address,
      };
    });

    const jsonString = JSON.stringify(keys, null, 2);
    console.log(jsonString);
  };


  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        window.location.reload();
      });
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }
  

  // ... other imports and code

  async loadBlockchainData() {
    const web3 = window.web3;

    // Load account
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
  
    // Get the smart contract instance
    const networkId = await web3.eth.net.getId();
    console.log('networkId:', networkId); // Log networkId
    
    const networkData = DStorage.networks[networkId];
    console.log('networkData:', networkData); // Log networkData
    
    if (networkData) {
      const dstorage = new web3.eth.Contract(DStorage.abi, networkData.address);
      this.setState({ dstorage }, () => {
        console.log("DStorage contract loaded: ", this.state.dstorage);
      });
  
      // Load user files count
      const userFilesCount = await dstorage.methods.getUserFileCount(this.state.account).call();
      this.setState({ userFilesCount });
  
      // Load user files
      for (var i = 0; i < userFilesCount; i++) {
        const file = await dstorage.methods.getFile(this.state.account, i).call();
        console.log(file)
        const formattedFile = {
          fileId: file[0].toString(),
          fileName: file[4],
          fileDescription: file[5],
          fileType: file[3],
          fileSize: file[2].toString(),
          uploadTime: file[6].toString(),
          uploader: file[7],
          fileHash: file[1],
          // recipient: file[8], // the recipient of the file
          // fileData: file[9], // the encrypted file data
        };
        this.setState({
          files: [...this.state.files, formattedFile],
        });
      }
    } else {
      window.alert("DStorage contract not deployed to detected network.");
    }
  }

  uploadFile = (fileHash, fileSize, fileType, fileName, fileDescription) => {
    console.log('About to call uploadFile function...');
    this.state.dstorage.methods.uploadFile(fileHash, fileSize, fileType, fileName, fileDescription).send({ from: this.state.account })
      .on('receipt', function(receipt){
        console.log('File uploaded successfully!', receipt);
      })
      .on('error', function(error, receipt) {
        console.log('Error uploading file:', error);
      });
  }
  
  uploadFile = async (file) => {
    // Capture the file
    const reader = new window.FileReader();
  
    reader.readAsArrayBuffer(file);
    reader.onloadend = async () => {
        // Create Buffer from the file
        const buffer = await Buffer.from(reader.result);
  
        // Upload file to IPFS
        client.add(buffer, (error, result) => {
            if(error) {
                console.error(error);
                return;
            }
  
            // Call the contract method 'uploadFile'
            this.state.dstorage.methods.uploadFile(result[0].hash, file.size, file.type, file.name, 'File description')
                .send({ from: this.state.account })
                .on('transactionHash', (hash) => {
                    // File uploaded successfully
                    console.log('File uploaded successfully');
                })
                .on('error', (error) => {
                    console.error(error);
                });
        });
    };
  }
  
  shareFile = async (fileId, receiverAddress, encryptionKey) => {
    const encryptedFileHash = await this.encryptFileHash(encryptionKey); // You need to implement the encryption function
  
    this.state.dstorage.methods.shareFile(receiverAddress, fileId, encryptedFileHash)
        .send({ from: this.state.account })
        .on('transactionHash', (hash) => {
            console.log('File shared successfully');
        })
        .on('error', (error) => {
            console.error(error);
        });
  }
  

  // Get file from user
  captureFile = event => {
    event.preventDefault()

    const file = event.target.files[0]
    const reader = new window.FileReader()

    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
        type: file.type,
        name: file.name
      })
      console.log('buffer', this.state.buffer)
    }
  }

  checkAndEmitFileAccess = (fileId) => {
    if (!this.state.dstorage) {
      console.log("DStorage is not ready yet");
      return;
    }
    this.state.dstorage.methods.checkAndEmitFileAccess(fileId).call({ from: this.state.account })
      .then(result => {
        console.log(result);
        // handle the result
      })
      .catch(err => {
        console.error(err);
        // handle the error
      });
  }
  
  canAccessFile = (fileId) => {
    if (!this.state.dstorage) {
      console.log("DStorage is not ready yet");
      return;
    }
    this.state.dstorage.methods.canAccessFile(fileId).call({ from: this.state.account })
      .then(result => {
        console.log(result);
        // handle the result
      })
      .catch(err => {
        console.error(err);
        // handle the error
      });
  }
  

  uploadFile = description => {
    console.log("Submitting file to IPFS...")

    // Add file to the IPFS
    client.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      // Assign value for the file without extension
      if(this.state.type === ''){
        this.setState({type: 'none'})
      }

        // You would need to get the encrypted CID from somewhere, possibly from state
        const encryptedCID = this.state.encryptedCID;

        // You would also need to get the other parameters (fileSize, fileType, fileName)
        // You can get these from your file upload logic
        const fileSize = this.state.fileSize;
        const fileType = this.state.fileType;
        const fileName = this.state.fileName;

        if (this.props.dstorage && this.props.dstorage.methods) {
          this.props.dstorage.methods
            .uploadFile(encryptedCID, fileSize, fileType, fileName, description)
            .send({ from: this.props.account })
            .on('receipt', (receipt) => {
              console.log(receipt);
              // Here you might want to update your state to reflect the new file uploaded
            });
        } else {
          console.error('dstorage or dstorage.methods is undefined');
        }

      if(!this.state.dstorage) {
        console.log("DStorage is not ready yet");
        return;
      }
      this.state.dstorage.methods.uploadFile(result[0].hash, result[0].size, this.state.type, this.state.name, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({
         loading: false,
         type: null,
         name: null
       })
       window.location.reload()
      }).on('error', (e) =>{
        window.alert('Error')
        this.setState({loading: false})
      })
    })
  }

  

  constructor(props) {
    super(props)
    this.gunNetwork = new GunNetwork();
    this.state = {
      account: '',
      dstorage: null,
      files: [],
      loading: false,
      type: null,
      name: null,
      messages: []  // make sure this line is there,
        // Initialize a new GunNetwork instance
    }
    this.uploadFile = this.uploadFile.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }

  render() {
     // Render messages
   
    return (
      <div>
      {this.state.loading ? (
        <div id="loader" className="text-center mt-5">
          <p>Loading...</p>
        </div>
      ) : (
        <div>
          <Main
            files={this.state.files}
            captureFile={this.captureFile}
            uploadFile={this.uploadFile}
            dstorage={this.state.dstorage}
            account={this.state.account}
          />
          {this.state.dstorage ? <SharedFiles sharedFiles={this.state.sharedFiles} dstorage={this.state.dstorage}  account={this.state.account}/> : <div>Loading...</div>}

        </div>
      )}
    </div>
    );
  }
}

export default App;