// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OffsetNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor(address initialOwner) ERC721("OffsetNFT", "ONFT") Ownable(initialOwner) {}

    function safeMint(address to, string memory uri) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, uri);
        return newTokenId;
    }

    // Function to receive ETH when sent to this contract
    receive() external payable {
        // Contract can now receive and hold ETH
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}