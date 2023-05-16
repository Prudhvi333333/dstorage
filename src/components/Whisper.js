import Web3 from 'web3';

export default class Whisper {
    constructor(provider) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(provider));
        this.shh = this.web3.shh;
      }
      

  async isAvailable() {
    return await this.shh.isAvailable();
  }

  async sendMessage(ttl, topic, payload, priority, pow) {
    const message = {
      ttl: ttl,
      topic: topic,
      payload: payload,
      priority: priority,
      pow: pow,
    };
    return await this.shh.post(message);
  }

  subscribe(topic, onMessage) {
    this.shh.subscribe('messages', { topics: [topic] })
      .on('data', onMessage);
  }
}
