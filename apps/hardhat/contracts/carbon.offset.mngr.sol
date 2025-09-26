// SPDX-License-Identifier: MIT

pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./carbon.credit.sol";
import "./offset.nft.sol";

contract CarbonOffsetManager is Ownable {
    CarbonCredit public carbonCredit;
    OffsetNFT public offsetNFT;
    address public centralWallet;

    event ProjectCompleted(uint256 amount, string projectName);
    event OffsetAgainstProject(uint256 amount, address sourceCompany, address sinkCompany, string fromProject,  uint256 nftId);
    event TokensClaimed(address user, uint256 amount);
    event OffsetToProject(uint256 amount, address sourceCompany, uint256 nftId);

    constructor(address _carbonCredit, address _offsetNFT, address _centralWallet, address initialOwner) Ownable(initialOwner) {
        carbonCredit = CarbonCredit(_carbonCredit);
        offsetNFT = OffsetNFT(_offsetNFT);
        centralWallet = _centralWallet;
    }

    function projectComplete(uint256 amount, string memory projectName) public onlyOwner {
        carbonCredit.mint(centralWallet, amount);
        emit ProjectCompleted(amount, projectName);
    }

    // fromcompany. , fromproject , tocompany  
    // addd more fields for name of comapny

    function offsetAgainstProject(uint256 amount, address sourceCompany, address sinkCompany, string memory fromProject) public onlyOwner {
        require(carbonCredit.balanceOf(centralWallet) >= amount, "Insufficient tokens in central wallet");

        carbonCredit.burn(centralWallet, amount);

        string memory nftURI = generateNFTURI(amount, sourceCompany, sinkCompany, fromProject);
        uint256 nftId = offsetNFT.safeMint(sinkCompany, nftURI);

        emit OffsetAgainstProject(amount, sourceCompany, sinkCompany, fromProject, nftId);
    }

    // transfer from db user to on chain user wallet 

    function claim(address user, uint256 amount) public onlyOwner {
        require(carbonCredit.balanceOf(centralWallet) >= amount, "Insufficient tokens in central wallet");
        carbonCredit.transferFrom(centralWallet, user, amount);
        emit TokensClaimed(user, amount);
    }


    /// 

    function offsetToProject(uint256 amount, address sinkCompany) public {
        require(carbonCredit.balanceOf(sinkCompany) >= amount, "Insufficient tokens in source company wallet");

        // Transfer tokens from the source company to this contract
        carbonCredit.transferFrom(sinkCompany, address(this), amount);

        // Burn the tokens
        carbonCredit.burn(address(this), amount);

        string memory nftURI = generateNFTURI(amount, sinkCompany, address(0), "");
        uint256 nftId = offsetNFT.safeMint(sinkCompany, nftURI);

        emit OffsetToProject(amount, sinkCompany, nftId);
    }

    function generateNFTURI(uint256 amount, address sourceCompany, address sinkCompany, string memory fromProject) internal pure returns (string memory) {
        // In a real-world scenario, you would generate a proper JSON metadata here
        // For simplicity, we're just concatenating the data
        return string(abi.encodePacked(
            "Amount:", Strings.toString(amount),
            ",Source:", Strings.toHexString(uint160(sourceCompany), 20),
            ",Sink:", Strings.toHexString(uint160(sinkCompany), 20),
            ",From:", fromProject
        ));
    }

    function setCentralWallet(address newCentralWallet) public onlyOwner {
        centralWallet = newCentralWallet;
    }

    // Debug function
    function debugProjectComplete() public onlyOwner view returns (bool, address)  {
        return (msg.sender == owner(), owner());
    }
}