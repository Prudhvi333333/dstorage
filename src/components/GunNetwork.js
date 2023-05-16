import Gun from 'gun';
import 'gun/sea';

const gun = Gun();

class GunNetwork {
  constructor() {
    this.node = null;
    this.pair = Gun.SEA.pair();
  }

  async start() {
    this.node = gun;
    return this.node;
  }

  async encrypt(message, pub) {
    return Gun.SEA.encrypt(message, pub);
  }

  async decrypt(encrypted) {
    return Gun.SEA.decrypt(encrypted, this.pair);
  }

  async sendEncryptedCid(cid, recipientPub) {
    const encryptedCid = await this.encrypt(cid, recipientPub);
    this.node.get(recipientPub).get('encryptedCids').set(encryptedCid);
  }

  async getReceivedCids() {
    const encryptedCids = await new Promise((resolve) => {
      this.node.get(this.pair.pub).get('encryptedCids').val((cids) => resolve(cids));
    });

    const decryptedCids = {};
    for (let cid in encryptedCids) {
      decryptedCids[cid] = await this.decrypt(encryptedCids[cid]);
    }
    return decryptedCids;
  }

  async sendRequest(recipientPub, fileName, fileDescription) {
    const request = await this.encrypt({fileName, fileDescription}, recipientPub);
    this.node.get(recipientPub).get('requests').set(request);
  }

  async getRequests() {
    const encryptedRequests = await new Promise((resolve) => {
      this.node.get(this.pair.pub).get('requests').val((requests) => resolve(requests));
    });

    const decryptedRequests = {};
    for (let request in encryptedRequests) {
      decryptedRequests[request] = await this.decrypt(encryptedRequests[request]);
    }
    return decryptedRequests;
  }
}

export default GunNetwork;
