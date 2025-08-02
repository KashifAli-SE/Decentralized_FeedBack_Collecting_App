// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.20;

contract FeedBack{

    address internal owner;
    
    mapping(address => bool) public isTeacherAddress;
    mapping(address => bool) public isStudentAddress;
    mapping (address => string[]) private FeedbackToTeachers; 

    enum FeedBackState{
        OPEN,
        CLOSE
    }
    
    FeedBackState feedbackstate;
    
    constructor(address own) {
        owner=own;
    }
    modifier  onlyOwner(address _owner) {
        require(_owner == owner, "Only owner can set feedback state");
        _;
    }

    modifier onlyStudent(address std){
        require(isStudentAddress[std],"Not Authorised to give feedback");
        _;
    }
    modifier onlyTeacher(address teacher){
        require(isTeacherAddress[teacher],"Not a Teacher");
        _;
    }
    
    function enterStudent(address stdAddress) public {
    require(feedbackstate==FeedBackState.OPEN,"Can not Enter. FeedBack is being collected");
    require(!isStudentAddress[stdAddress], "Already added");
    isStudentAddress[stdAddress] = true;
    }

    function addTeacher(address teacherAddress) public {
        require(msg.sender == owner, "Only owner can add");
        require(!isTeacherAddress[teacherAddress], "Already added");
        isTeacherAddress[teacherAddress] = true;
    }

    function giveFeedback(address teacher,string memory FeedBack) public onlyStudent(msg.sender){
        require(isTeacherAddress[teacher],"Not a teacher");
        require(feedbackstate==FeedBackState.OPEN,"can not give feedback");
        FeedbackToTeachers[teacher].push(FeedBack);
    }    

    function receiveFeedbacks(address teacher) public view returns (string[] memory)  {
        require(msg.sender==teacher || msg.sender==owner , "not authorized to receive");
        return FeedbackToTeachers[teacher];
    }

    function setFeedbackState(FeedBackState state) public onlyOwner(msg.sender){
    feedbackstate = state;
    }

    function removeTeacher(address _teacher) public onlyOwner(msg.sender){
        require(isTeacherAddress[_teacher],"Not a Teacher");
        isTeacherAddress[_teacher]=false;
    }

}