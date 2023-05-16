import React, { Component } from 'react';
import { convertBytes } from './helpers';
import moment from 'moment';
import EthCrypto from 'eth-crypto';
import bs58 from 'bs58';

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

class SharedFiles extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sharedFiles: [],
    };
  }

  async componentDidMount() {
    if (this.props.dstorage && this.props.dstorage.methods) {
      const sharedFilesCount = await this.props.dstorage.methods.fileCount().call();
      const sharedFiles = [];
      for (let i = 0; i < sharedFilesCount; i++) {
        const file = await this.props.dstorage.methods.filesById(i + 1).call();
        if (await this.props.dstorage.methods.canAccessFile(i + 1, this.props.account).call()) {
          const encryptedFileHash = await this.props.dstorage.methods.getEncryptedFileHash(i + 1, this.props.account).call();
          sharedFiles.push({ ...file, encryptedFileHash });
        }
      }

      this.setState({ sharedFiles });
    } else {
      console.error('dstorage prop is not provided or is null');
    }
  }

  // async decryptFile(file, privateKey) {
  //   try {
  //     console.log('Private Key:', privateKey);
  //     console.log('Encrypted File Hash (Before Parsing):', file.encryptedFileHash);

  
  //     // const decryptedFileHashHex = await EthCrypto.decryptWithPrivateKey(
  //     //   privateKey,
  //     //   EthCrypto.cipher.parse(file.encryptedFileHash)
  //     // );

  //     const decryptedFileHashHex = await EthCrypto.decryptWithPrivateKey(
  //       privateKey,
  //       JSON.parse(file.encryptedFileHash)
  //     );
      
  
  //     const decryptedFileHashBytes = Buffer.from(decryptedFileHashHex, 'hex');
  //     const decryptedFileHash = bs58.encode(decryptedFileHashBytes);
      
  
  //     return { ...file, fileHash: decryptedFileHash };
  //   } catch (error) {
  //     alert('Decryption failed. Please check your private key.');
  //     console.error('Decryption error:', error);
  //     return file;
  //   }
  // }
  
  async decryptFile(file, privateKey) {
   try {
  console.log('Encrypted File Hash (Before Parsing):', file.encryptedFileHash);
  const encryptedFileHashObj = JSON.parse(file.encryptedFileHash);
  console.log('Encrypted File Hash (After Parsing):', encryptedFileHashObj);
  const decryptedFileHashHex = await EthCrypto.decryptWithPrivateKey(
    privateKey,
    encryptedFileHashObj
  );
  console.log('Decrypted File Hash (Hex):', decryptedFileHashHex);
  const decryptedFileHashBytes = Buffer.from(decryptedFileHashHex, 'hex');
  const decryptedFileHash = bs58.encode(decryptedFileHashBytes);
  console.log('Decrypted File Hash:', decryptedFileHash);
  return { ...file, fileHash: decryptedFileHash };
} catch (error) {
  console.error('Decryption error:', error);
  return file;
}

  }

  async downloadFile(fileHash) {
    console.log('Downloading File Hash:', fileHash); // Add this line
    try {
      const file = await client.get(fileHash);

      const blob = new Blob([file.content], { type: file.type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'decrypted-file';
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
  }

  async handleDecryptAndDownload(file) {
    const privateKey = prompt('Please enter your private key');
    if (!privateKey) {
      alert('No private key provided');
      return;
    }

    const decryptedFile = await this.decryptFile(file, privateKey);

if (decryptedFile.fileHash) {
  this.downloadFile(decryptedFile.fileHash);
} else {
  console.error('Failed to decrypt file');
}
  }

  render() {
    const { sharedFiles } = this.state;

    return (
      <div className='container-fluid mt-5 text-center'>
        <div className='row'>
          <main role='main' className='col-lg-12 ml-auto mr-auto' style={{ maxWidth: '1024px' }}>
            <div className='content'>
              <p>&nbsp;</p>
              <h2>Shared Files</h2>
              <table className='table-sm table-bordered text-monospace' style={{ width: '1000px', maxHeight: '450px' }}>
                <thead style={{ fontSize: '15px' }}>
                  <tr className='bg-dark text-white'>
                 
                    <th scope='col' style={{ width: '200px' }}>name</th>
                    <th scope='col' style={{ width: '230px' }}>type</th>
                    <th scope='col' style={{ width: '90px' }}>size</th>
                    <th scope='col' style={{ width: '120px' }}>hash (encrypted)</th>
                    <th scope='col' style={{ width: '120px' }}>action</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedFiles.map((file, key) => (
                    <tr key={key}>
                      <td>{file.fileName}</td>
                      <td>{file.fileType}</td>
                      <td>{convertBytes(file.fileSize)}</td>
                      <td>{file.encryptedFileHash.substring(0, 10)}...</td>
                      <td>
                        <button onClick={() => this.handleDecryptAndDownload(file)}>
                          Decrypt & Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    );
  }
}

export default SharedFiles;

