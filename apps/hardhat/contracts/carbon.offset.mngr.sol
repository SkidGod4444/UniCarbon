// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./carbon.credit.sol";
import "./offset.nft.sol";

/// @title CarbonOffsetManager
/// @notice Main contract to sell credits and issue offset NFTs
contract CarbonOffsetManager is Ownable {
    CarbonCredit public carbonCredit;
    OffsetNFT public offsetNFT;
    address public centralWallet;
    uint256 public pricePerCredit; // in wei per credit

    event CreditsPurchased(address indexed buyer, uint256 amount, uint256 paid);
    event CreditsOffset(address indexed company, uint256 amount, uint256 nftId);

    constructor(
        address _carbonCredit,
        address _offsetNFT,
        address _centralWallet,
        address initialOwner,
        uint256 _pricePerCredit
    ) Ownable(initialOwner) {
        carbonCredit = CarbonCredit(_carbonCredit);
        offsetNFT = OffsetNFT(_offsetNFT);
        centralWallet = _centralWallet;
        pricePerCredit = _pricePerCredit;
    }

    /// @notice Buy credits by paying ETH
    function buyCredits(uint256 amount) external payable {
        require(msg.value >= amount * pricePerCredit, "Not enough KAD sent");
        require(carbonCredit.balanceOf(centralWallet) >= amount, "Central wallet has no credits");

        // Transfer credits from central wallet to buyer
        carbonCredit.transferFrom(centralWallet, msg.sender, amount);

        emit CreditsPurchased(msg.sender, amount, msg.value);
    }

    /// @notice Company offsets credits, gets NFT certificate
    function offset(uint256 amount, string memory projectName) external {
        require(carbonCredit.balanceOf(msg.sender) >= amount, "Not enough credits to offset");

        // Burn directly from company wallet
        carbonCredit.burnFrom(msg.sender, amount);

        // Generate metadata
        string memory uri = generateMetadata(msg.sender, amount, projectName);

        // Mint NFT certificate to company
        uint256 nftId = offsetNFT.mintCertificate(msg.sender, uri);

        emit CreditsOffset(msg.sender, amount, nftId);
    }

    /// @notice Generate simple JSON metadata for NFT
    function generateMetadata(address company, uint256 amount, string memory projectName)
        internal
        view
        returns (string memory)
    {
        return string(
            abi.encodePacked(
                '{"company":"', Strings.toHexString(uint160(company), 20),
                '","amount":"', Strings.toString(amount),
                '","project":"', projectName,
                '","timestamp":"', Strings.toString(block.timestamp),
                '"}'
            )
        );
    }

    /// @notice Admin can fund central wallet with credits
    function projectComplete(uint256 amount) external onlyOwner {
        carbonCredit.mint(centralWallet, amount);
    }

    /// @notice Recieve ETH payments
    receive() external payable {}

    /// @notice Withdraw ETH payments
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}