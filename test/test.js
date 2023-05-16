const DStorage = artifacts.require("./DStorage.sol");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("DStorage", ([deployer, uploader, receiver]) => {
  let dstorage;

  before(async () => {
    dstorage = await DStorage.deployed();
  });

  describe("deployment", async () => {
    it("deploys successfully", async () => {
      const address = await dstorage.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("has a name", async () => {
      const name = await dstorage.name();
      assert.equal(name, "DStorage");
    });
  });

  describe("file", async () => {
    let result, fileCount;
    const fileHash = "QmV8cfu6n4NT5xRr2AHdKxFMTZEJrA44qgrBCr739BN9Wb";
    const fileSize = "1";
    const fileType = "TypeOfTheFile";
    const fileName = "NameOfTheFile";
    const fileDescription = "DescriptionOfTheFile";

    before(async () => {
      result = await dstorage.uploadFile(fileHash, fileSize, fileType, fileName, fileDescription, { from: uploader });
      console.log(result.logs)
      fileCount = await dstorage.fileCount();
    });

    it("upload file", async () => {
    //   assert.equal(fileCount.toNumber(), 1);
    //   for(let i = 0; i < result.logs.length; i++){
    //     const event = result.logs[i].args;
    //     console.log(event);
    // }

    const event = result.logs[1].args;
    assert.equal(event.fileId.toString(), fileCount.toString(), 'fileId is correct');

      console.log(fileCount);
      assert.equal(event.fileHash, fileHash, "Hash is correct");
      assert.equal(event.fileSize, fileSize, "Size is correct");
      assert.equal(event.fileType, fileType, "Type is correct");
      assert.equal(event.fileName, fileName, "Name is correct");
      assert.equal(event.fileDescription, fileDescription, "Description is correct");
      assert.equal(event.uploader, uploader, "Uploader is correct");
    
      await dstorage.uploadFile("", fileSize, fileType, fileName, fileDescription, { from: uploader }).should.be.rejected;
      await dstorage.uploadFile(fileHash, "", fileType, fileName, fileDescription, { from: uploader }).should.be.rejected;
      await dstorage.uploadFile(fileHash, fileSize, "", fileName, fileDescription, { from: uploader }).should.be.rejected;
      await dstorage.uploadFile(fileHash, fileSize, fileType, "", fileDescription, { from: uploader }).should.be.rejected;
      await dstorage.uploadFile(fileHash, fileSize, fileType, fileName, "", { from: uploader }).should.be.rejected;
    });
    
    it("lists file", async () => {
      const userFileCount = await dstorage.getUserFileCount(uploader);
      assert.equal(userFileCount.toNumber(), 1);
    
      const file = await dstorage.getFile(uploader, 0);
      const _fileId = file[0].toNumber();
      const _fileHash = file[1];
      const _fileSize = file[2];
      const _fileType = file[3];
      const _fileName = file[4];
      const _fileDescription = file[5];
      const _uploadTime = file[6];
      const _uploader = file[7];
    
      assert.equal(_fileId, fileCount.toNumber(), "id is correct");
      assert.equal(_fileHash, fileHash, "Hash is correct");
      assert.equal(_fileSize, fileSize, "Size is correct");
      assert.equal(_fileType, fileType, "Type is correct");
      assert.equal(_fileName, fileName, "Name is correct");
      assert.equal(_fileDescription, fileDescription, "Description is correct");
      assert.equal(_uploader, uploader, "Uploader is correct");
    });
  });

  describe("file sharing", async () => {
    describe("file sharing", async () => {
      it("shares file", async () => {
          const fileId = 1;
          const encryptedFileHash = "encryptedFileHash"; // This is just a placeholder for the actual encrypted file hash
  
          // Share file with receiver
          const result = await dstorage.shareFile(fileId, receiver, encryptedFileHash, { from: uploader });
  
          // Test event is emitted
          const event = result.logs[0].args;
          assert.equal(event.fileId.toNumber(), fileId, "fileId is correct");
          assert.equal(event.to, receiver, "receiver is correct");
  
          // Test encrypted file hash is stored correctly
          const storedEncryptedFileHash = await dstorage.getEncryptedFileHash(fileId, receiver);
          assert.equal(storedEncryptedFileHash, encryptedFileHash, "Encrypted file hash is stored correctly");
  
          // Check that receiver can access the file
          const canAccess = await dstorage.canAccessFile(fileId, receiver);
          assert.equal(canAccess, true, "Receiver should be able to access the file after it has been shared");
  
          // Check that uploader can still access the file
          const uploaderCanAccess = await dstorage.canAccessFile(fileId, uploader);
          assert.equal(uploaderCanAccess, true, "Uploader should still be able to access the file after it has been shared");
      });
  });
  
});


});


