// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CarbonCredit
/// @notice ERC20 token representing carbon credits
contract CarbonCredit is ERC20, Ownable {
    constructor(address initialOwner) ERC20("CarbonCredit", "CC") Ownable(initialOwner) {}

    /// @notice Mint new credits (only owner can do this, e.g. government/regulator)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn credits from caller’s balance
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Burn credits from another account (requires allowance)
    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}