// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title OffsetNFT
/// @notice Proof of carbon credit offset (certificate)
contract OffsetNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor(address initialOwner) ERC721("OffsetNFT", "ONFT") Ownable(initialOwner) {}

    /// @notice Mint NFT to recipient with metadata
    function mintCertificate(address to, string memory uri) external onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newId = _tokenIds;
        _mint(to, newId);
        _setTokenURI(newId, uri);
        return newId;
    }
}