//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoShopping {
    address public admin;

    event NewPayment(address from, uint256 amount);

    constructor(address _admin) {
        admin = _admin;
    }

    function withdrawFunds() external {
        require(msg.sender == admin, "withdrawFunds: Only admin");
        (bool success, ) = payable(admin).call{value: address(this).balance}(
            ""
        );
        require(success, "withdrawFunds: tx failed");
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {
        emit NewPayment(msg.sender, msg.value);
    }
}
