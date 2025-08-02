import { ethers } from "./ethers-6.7.esm.min.js";
import { contractAddress, abi } from "./abi.js";

// Global variables
let provider, signer, contract, currentAccount;
let isOwner = false;
let isStudent = false;
let isTeacher = false;

// Contract configuration
const CONTRACT_ADDRESS = contractAddress;
const CONTRACT_ABI = abi;

// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletAddressDiv = document.getElementById('walletAddress');
const roleBtns = document.querySelectorAll('.role-btn');
const sections = document.querySelectorAll('.section');
const statusMessage = document.getElementById('statusMessage');

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    checkWalletConnection();
});

// Setup all event listeners
function setupEventListeners() {
    // Connect wallet button
    connectWalletBtn.addEventListener('click', connectWallet);

    // Role selector buttons
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => switchRole(btn.dataset.role));
    });

    // Student functions
    document.getElementById('registerStudentBtn').addEventListener('click', registerStudent);
    document.getElementById('giveFeedbackBtn').addEventListener('click', giveFeedback);

    // Teacher functions
    document.getElementById('viewMyFeedbacksBtn').addEventListener('click', viewMyFeedbacks);

    // Admin functions
    document.getElementById('addTeacherBtn').addEventListener('click', addTeacher);
    document.getElementById('removeTeacherBtn').addEventListener('click', removeTeacher);
    document.getElementById('setFeedbackStateBtn').addEventListener('click', setFeedbackState);
    document.getElementById('adminViewFeedbacksBtn').addEventListener('click', adminViewFeedbacks);
}

// Check if wallet is already connected
async function checkWalletConnection() {
    if (window.ethereum && window.ethereum.selectedAddress) {
        await connectWallet();
    }
}

// Connect wallet function
async function connectWallet() {
    if (!window.ethereum) {
        showStatus('MetaMask is not installed! Please install MetaMask.', 'error');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        currentAccount = accounts[0];

        // Setup ethers
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Update UI
        walletAddressDiv.textContent = `Connected: ${currentAccount}`;
        connectWalletBtn.textContent = '🔗 Wallet Connected';
        connectWalletBtn.disabled = true;

        showStatus('Wallet connected successfully!', 'success');

        // Check user roles
        await checkUserRoles();

    } catch (error) {
        console.error('Error connecting wallet:', error);
        showStatus('Failed to connect wallet: ' + error.message, 'error');
    }
}

// Check user roles (student, teacher, owner)
async function checkUserRoles() {
    if (!contract || !currentAccount) return;

    try {
        // Check if user is a student
        isStudent = await contract.isStudentAddress(currentAccount);

        // Check if user is a teacher
        isTeacher = await contract.isTeacherAddress(currentAccount);

        // Check if user is owner (this would need to be implemented in your contract)
        // For now, we'll assume the deployer is the owner
        // You might want to add an owner() function to your contract

        console.log('User roles:', { isStudent, isTeacher });

    } catch (error) {
        console.error('Error checking user roles:', error);
    }
}

// Switch between role sections
function switchRole(role) {
    // Update active button
    roleBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-role="${role}"]`).classList.add('active');

    // Update active section
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(`${role}-section`).classList.add('active');
}

// Student Functions

// Register as student
async function registerStudent() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const btn = document.getElementById('registerStudentBtn');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Registering...';

        const tx = await contract.enterStudent(currentAccount);
        await tx.wait();

        isStudent = true;
        showStatus('Successfully registered as student!', 'success');

    } catch (error) {
        console.error('Error registering student:', error);
        showStatus('Failed to register: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Give feedback to teacher
async function giveFeedback() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const teacherAddress = document.getElementById('feedbackTeacherAddress').value.trim();
    const feedbackText = document.getElementById('feedbackText').value.trim();

    if (!isValidAddress(teacherAddress)) {
        showStatus('Please enter a valid teacher address!', 'error');
        return;
    }

    if (!feedbackText) {
        showStatus('Please enter feedback text!', 'error');
        return;
    }

    const btn = document.getElementById('giveFeedbackBtn');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Submitting...';

        const tx = await contract.giveFeedback(teacherAddress, feedbackText);
        await tx.wait();

        // Clear form
        document.getElementById('feedbackTeacherAddress').value = '';
        document.getElementById('feedbackText').value = '';

        showStatus('Feedback submitted successfully!', 'success');

    } catch (error) {
        console.error('Error giving feedback:', error);
        showStatus('Failed to submit feedback: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Teacher Functions

// View my feedbacks
async function viewMyFeedbacks() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const btn = document.getElementById('viewMyFeedbacksBtn');
    const originalText = btn.textContent;
    const feedbackList = document.getElementById('teacherFeedbackList');

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Loading...';

        const feedbacks = await contract.receiveFeedbacks(currentAccount);

        feedbackList.innerHTML = '';

        if (feedbacks.length === 0) {
            feedbackList.innerHTML = '<div class="feedback-item">No feedbacks received yet.</div>';
        } else {
            feedbacks.forEach((feedback, index) => {
                const feedbackItem = document.createElement('div');
                feedbackItem.className = 'feedback-item';
                feedbackItem.innerHTML = `<strong>Feedback ${index + 1}:</strong> ${feedback}`;
                feedbackList.appendChild(feedbackItem);
            });
        }

        showStatus('Feedbacks loaded successfully!', 'success');

    } catch (error) {
        console.error('Error viewing feedbacks:', error);
        showStatus('Failed to load feedbacks: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Admin Functions

// Add teacher
async function addTeacher() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const teacherAddress = document.getElementById('addTeacherAddress').value.trim();

    if (!isValidAddress(teacherAddress)) {
        showStatus('Please enter a valid teacher address!', 'error');
        return;
    }

    const btn = document.getElementById('addTeacherBtn');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Adding...';

        const tx = await contract.addTeacher(teacherAddress);
        await tx.wait();

        document.getElementById('addTeacherAddress').value = '';
        showStatus('Teacher added successfully!', 'success');

    } catch (error) {
        console.error('Error adding teacher:', error);
        showStatus('Failed to add teacher: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Remove teacher
async function removeTeacher() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const teacherAddress = document.getElementById('removeTeacherAddress').value.trim();

    if (!isValidAddress(teacherAddress)) {
        showStatus('Please enter a valid teacher address!', 'error');
        return;
    }

    const btn = document.getElementById('removeTeacherBtn');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Removing...';

        const tx = await contract.removeTeacher(teacherAddress);
        await tx.wait();

        document.getElementById('removeTeacherAddress').value = '';
        showStatus('Teacher removed successfully!', 'success');

    } catch (error) {
        console.error('Error removing teacher:', error);
        showStatus('Failed to remove teacher: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Set feedback state
async function setFeedbackState() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const state = parseInt(document.getElementById('feedbackState').value);
    const btn = document.getElementById('setFeedbackStateBtn');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Updating...';

        const tx = await contract.setFeedbackState(state);
        await tx.wait();

        showStatus(`Feedback state updated to ${state === 0 ? 'OPEN' : 'CLOSE'}!`, 'success');

    } catch (error) {
        console.error('Error setting feedback state:', error);
        showStatus('Failed to update feedback state: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Admin view any teacher's feedbacks
async function adminViewFeedbacks() {
    if (!contract || !currentAccount) {
        showStatus('Please connect your wallet first!', 'error');
        return;
    }

    const teacherAddress = document.getElementById('adminViewTeacherAddress').value.trim();

    if (!isValidAddress(teacherAddress)) {
        showStatus('Please enter a valid teacher address!', 'error');
        return;
    }

    const btn = document.getElementById('adminViewFeedbacksBtn');
    const originalText = btn.textContent;
    const feedbackList = document.getElementById('adminFeedbackList');

    try {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Loading...';

        const feedbacks = await contract.receiveFeedbacks(teacherAddress);

        feedbackList.innerHTML = '';

        if (feedbacks.length === 0) {
            feedbackList.innerHTML = '<div class="feedback-item">No feedbacks found for this teacher.</div>';
        } else {
            feedbacks.forEach((feedback, index) => {
                const feedbackItem = document.createElement('div');
                feedbackItem.className = 'feedback-item';
                feedbackItem.innerHTML = `<strong>Feedback ${index + 1}:</strong> ${feedback}`;
                feedbackList.appendChild(feedbackItem);
            });
        }

        showStatus('Feedbacks loaded successfully!', 'success');

    } catch (error) {
        console.error('Error viewing feedbacks:', error);
        showStatus('Failed to load feedbacks: ' + getErrorMessage(error), 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Utility Functions

// Custom address validation function (avoids ENS issues on testnets)
function isValidAddress(address) {
    if (!address || typeof address !== 'string') return false;

    // Check if it's a valid Ethereum address format
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} show`;

    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, 5000);
}

// Get error message from contract error
function getErrorMessage(error) {
    if (error.reason) return error.reason;
    if (error.message) return error.message;
    return 'Unknown error occurred';
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
            // User disconnected wallet
            currentAccount = null;
            provider = null;
            signer = null;
            contract = null;
            walletAddressDiv.textContent = '';
            connectWalletBtn.textContent = '🔗 Connect Wallet';
            connectWalletBtn.disabled = false;
            showStatus('Wallet disconnected', 'info');
        } else {
            // User switched accounts
            connectWallet();
        }
    });
} 