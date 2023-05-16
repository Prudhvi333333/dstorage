pragma solidity >=0.5.0;

contract DStorage {
    string public name = "DStorage";
    uint256 public fileCount = 0;
    mapping(address => mapping(uint256 => File)) public files;
    mapping(address => uint256) public userFileCounts;
    mapping(uint256 => address[]) public sharedFiles;
    mapping(uint256 => address) public fileToUploader;
    mapping(uint256 => File) public filesById;
    mapping(uint256 => mapping(address => string)) private encryptedFileHashes;

    event UploadProgress(
    uint256 userFileCount,
    string fileHash,
    address uploader
);

    event FileShared(uint256 fileId, address to, string encryptedFileHash);


    event FileAccessChecked(uint256 fileId, address user, bool canAccess);

    struct File {
        uint256 fileId;
        string fileHash;
        uint256 fileSize;
        string fileType;
        string fileName;
        string fileDescription;
        uint256 uploadTime;
        address payable uploader;
    }

    event FileUploaded(
        uint256 fileId,
        string fileHash,
        uint256 fileSize,
        string fileType,
        string fileName,
        string fileDescription,
        uint256 uploadTime,
        address payable uploader
    );

    constructor() public {}

function uploadFile(
        string memory _fileHash,
        uint256 _fileSize,
        string memory _fileType,
        string memory _fileName,
        string memory _fileDescription
    ) public {
        require(bytes(_fileHash).length > 0);
        require(bytes(_fileType).length > 0);
        require(bytes(_fileDescription).length > 0);
        require(bytes(_fileName).length > 0);
        require(msg.sender != address(0));
        require(_fileSize > 0);

        fileCount++;
        uint256 userFileCount = userFileCounts[msg.sender]++;

        emit UploadProgress(userFileCount, _fileHash, msg.sender);

        files[msg.sender][userFileCount] = File(
            fileCount,
            _fileHash,
            _fileSize,
            _fileType,
            _fileName,
            _fileDescription,
            now,
            msg.sender
        );

        filesById[fileCount] = files[msg.sender][userFileCount]; // This line was missing
        fileToUploader[fileCount] = msg.sender;

        emit FileUploaded(
            fileCount,
            _fileHash,
            _fileSize,
            _fileType,
            _fileName,
            _fileDescription,
            now,
            msg.sender
        );
    }


    function getUserFileCount(address user) public view returns (uint256) {
        return userFileCounts[user];
    }

    function getFile(address user, uint256 index)
        public
        view
        returns (
            uint256,
            string memory,
            uint256,
            string memory,
            string memory,
            string memory,
            uint256,
            address
        )
    {
        File memory file = files[user][index];
        return (
            file.fileId,
            file.fileHash,
            file.fileSize,
            file.fileType,
            file.fileName,
            file.fileDescription,
            file.uploadTime,
            file.uploader
        );
    }

    function shareFile(uint256 fileId, address to, string memory encryptedFileHash) public {
    require(fileId > 0 && fileId <= fileCount, "File does not exist");
    require(filesById[fileId].uploader == msg.sender, "Only the uploader can share the file");

    encryptedFileHashes[fileId][to] = encryptedFileHash;
    sharedFiles[fileId].push(to);

    emit FileShared(fileId, to, encryptedFileHash);
}


     function getEncryptedFileHash(uint256 fileId, address user) public view returns (string memory) {
        return encryptedFileHashes[fileId][user];
    }

    function checkAndEmitFileAccess(uint256 fileId, address user) public returns (bool) {
    bool canAccess = canAccessFile(fileId, user);

    emit FileAccessChecked(fileId, user, canAccess);

    return canAccess;
}


 function canAccessFile(uint256 fileId, address user) public view returns (bool) {
    if (filesById[fileId].uploader == user) {
        return true;
    }

    address[] memory sharedTo = sharedFiles[fileId];
    for(uint i = 0; i < sharedTo.length; i++) {
        if(sharedTo[i] == user) {
            return true;
        }
    }
    return false;
}


}
