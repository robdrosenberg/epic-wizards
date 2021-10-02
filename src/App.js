import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import myEpicNft from './utils/MyEpicNFT.json';
import LoadSpinner from './components/LoadSpinner';

const TWITTER_HANDLE = 'robdrosenberg';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0x14304944D6B151Ba54e5E1197d09B9c36d2beF57";
const COLLECTION_LINK = `https://testnets.opensea.io/collection/epic-magi-titles-v2`;

const App = () => {

    const [currentAccount, setCurrentAccount] = useState("");
    const [mintCount, setMintCount] = useState(0);
    const [showNetworkWarning, setShowNetworkWarning] = useState(false);
    const [isMining, setIsMining] = useState(false);
    
    const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;

      if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
        } else {
          console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)
          setupEventListener();
      } else {
          console.log("No authorized account found")
      }

      if(ethereum.networkVersion !== "4"){
        setShowNetworkWarning(true);
      } else {
        setShowNetworkWarning(false);
      }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }

  const getMintCount = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        const mintCount = await connectedContract.getTotalNFTsMintedSoFar();
        console.log("Get Mints!", mintCount);
        setMintCount(mintCount.toNumber());

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    // Most of this looks the same as our function askContractToMintNft
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Same stuff again
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        // THIS IS THE MAGIC SAUCE.
        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
          setMintCount(mintCount + 1);
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const askContractToMintNft = async () => {
    setIsMining(true);
      try {
        const { ethereum } = window;

        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

          console.log("Going to pop wallet now to pay gas...")
          let nftTxn = await connectedContract.makeAnEpicNFT();

          console.log("Mining...please wait.")
          await nftTxn.wait();
          setIsMining(false);
          console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error)
      }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    getMintCount();
  }, [])

  /*
  * We added a simple onClick event here.
  */
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  /*
  * We want the "Connect to Wallet" button to dissapear if they've already connected their wallet!
  */
  const renderMintButton = ({isMining, ...props}) => (
      <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
        {isMining ? <LoadSpinner /> : "Mint Magi Title"}
      </button>
  )

  /*
  * Added a conditional render! We don't want to show Connect to Wallet if we're already conencted :).
  */
  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">The Magi Collection</p>
          <p className="sub-text">
            Unique Spell Casters create the coalition of Magi. Discover your Magi Title today!
          </p>
          {showNetworkWarning && <p className="network-warning">You are not on the Rinkeby testnet network. Please switch to the Rinkeby testnet to continue.</p>}
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintButton(isMining)}
          <p>{mintCount}/50 Magi Titles remain! 🧙‍♂️</p>
          <a href={COLLECTION_LINK}>View the Magi Collection!</a>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;