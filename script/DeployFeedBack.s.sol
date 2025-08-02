// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {FeedBack} from "../src/FeedBack.sol";


contract deployFeedback is Script{
    function run() external returns(FeedBack){
        vm.startBroadcast();
        FeedBack feedback=new FeedBack(msg.sender);
        vm.stopBroadcast();
        return feedback;
    }
}