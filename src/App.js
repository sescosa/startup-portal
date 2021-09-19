import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/StartupPortal.json"

export default function App() {

  const [startup, setStartup] = React.useState("");
  const [mining, setMining] = React.useState(false);
  const [miningStatus, setMiningStatus] = React.useState("⛏Mining in progress.....");
  const [statusColor, setStatusColor] = React.useState("orange");
  const [allIdeas, setAllIdeas] = React.useState([]);
  const [totalIdeas, setTotalIdeas] = React.useState(0);

  // Just a state variable we use to store our user's public wallet address
  const [currAccount, setCurrentAccount] = React.useState("")
  const contractAddress = "0xe8Bc8A5Db18237442e28cec941C9037ac81863b8"
  const contractABI = abi.abi

  const checkIfWalletIsConnected = () => {
    // First make sure we have access to window.ethereum
    const {ethereum} = window;
    if (!ethereum){
      console.log("Make sure you have metamask!")
      return
    } else {
      console.log("We have the ethereum object", ethereum)
      //Check if we're authorized to access the user's wallet
      ethereum.request({method: 'eth_accounts'})
      .then(async accounts => {
        //We could have multiple accounts. Check for one
        if(accounts.length !== 0){
          //Grab the first account
          const account = accounts[0];
          console.log("Found authorized account: ", account)

          //Store the users public wallet address
          setCurrentAccount(account);
          // Once we have the authorized account, we can call contract
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner()
          const startupPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

          let count = await startupPortalContract.getTotalIdeas();
          setTotalIdeas(count.toNumber());
          getAllIdeas();

        } else{
          console.log("No authorized account found")
        }
      })
    }
  }

  const connectWallet = () => {
    const { ethereum } = window;
    if(!ethereum) {
      alert("You should get a metamask wallet!")
    } else {
      ethereum.request({ method: 'eth_requestAccounts' })
      .then(async accounts => {
        console.log("Connected", accounts[0]);
        setCurrentAccount(accounts[0]);

        // Once we have the authorized account, we can call contract
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner()
        const startupPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await startupPortalContract.getTotalIdeas();
        setTotalIdeas(count.toNumber());
        getAllIdeas();
      })
      .catch(err => console.log(err));
    }
  }

  const idea = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Please Connect Your Wallet")
      }
      else {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const startupPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const ideaTxn = await startupPortalContract.idea(startup, {gasLimit: 300000});
        setMining(true);
        console.log("Mining...", ideaTxn.hash)
        await ideaTxn.wait()
        console.log("Mined -- ", ideaTxn.hash)
        setStatusColor("green");
        setMiningStatus("Confirmed✅");
        setTimeout(() => {
          setMining(false);
          setStatusColor("orange");
          setMiningStatus("⛏Mining in progress.....");
        }, 5000);

        let count = await startupPortalContract.getTotalIdeas();
        setTotalIdeas(count.toNumber());
        console.log("Retrieved total idea count...", count.toNumber());
      }
    } catch (e) {
      console.error(e);
      setStatusColor("red");
      setMiningStatus("You have too many ideas, please wait for 10 mins");
      setTimeout(() => {
        setMining(false);
        setStatusColor("orange");
        setMiningStatus("⛏Mining in progress.....");
      }, 5000);
    } 
  };

  async function getAllIdeas () {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner()
    const startupPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let ideas = await startupPortalContract.getAllIdeas();

    let ideasCleaned = []
    ideas.forEach(idea => {
      ideasCleaned.push({
        address: idea.entrepeneur,
        timestamp: new Date(idea.timestamp * 1000),
        message: idea.message,
        winner: idea.winner
      })
    })
    setAllIdeas(ideasCleaned)

    startupPortalContract.on("NewIdea", (from, timestamp, message, winner) => {
      console.log("NewIdea", from, timestamp, message, winner)
      setAllIdeas(oldArray => [...oldArray, {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
        winner: winner
      }])
    })
  }


  // This runs our function when the page loads
  React.useEffect(() => {
    checkIfWalletIsConnected()
  }, [])
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>

        <div className="bio">
        I am Sergio and I am building a startup (<a href="https://www.pamlearning.com" target="_blank">Pam Learning</a>) in Barcelona, so would love to know what are you building out there! Connect your Ethereum wallet and tell me your Startup idea!
        </div>

        <div className="bio">
        You have a 50% chance of winning some fake Ethereum!🤑
        </div>

        <div className="bio">
        You will need <a href="https://metamask.io/" target="_blank">Metamask</a> and some fake ETH from <a href="https://app.mycrypto.com/faucet">Rinkeby</a> testnet to try this out. To learn more about the project check out <a href="https://buildspace.so/" target="_blank">Buildspace</a>, you can also take a look at the <a href="https://github.com/sescosa/smart-contract" target="_blank">Smart Contract</a> code and the <a href="https://github.com/sescosa/startup-portal" target="_blank">front end UI</a> 🤓
        </div>

      <div style = {{margin: "8px", display: 'flex',justifyContent:'center'}}>
        <textarea id="idea" value={startup} type="text" placeholder="Send me your best ideas for a startup :)" style = {{width: "300px", height: "100px"}} onChange={(event) => {
          setStartup(event.target.value);
        }}></textarea>
      </div>

        <button className="waveButton" onClick={idea}>
          Share your idea ⚡️
        </button>

        {currAccount ? null : (
          <button className="waveButton" onClick={connectWallet}> Connect Wallet 🌐
          </button>
        )}

        <p style = {{marginTop: "10px", display: 'flex',justifyContent:'center'}}> Total ideas shared: {totalIdeas.toString()}</p>
      
      {mining ? (<div className="statusDiv" style={{ color: statusColor }}>{miningStatus}</div>) : null}

        {allIdeas.map((idea, index) => {
          return (
            <div key={idea.timestamp.toString()} style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
              <div><strong>🏠 Address:</strong> {idea.address}</div>
              <br/>
              <div><strong>⏱ Time:</strong> {idea.timestamp.toString()}</div>
              <br/>
              <div><strong>💡 Idea:</strong> {idea.message}</div>
              <br/>
              {idea.winner ? (<div><strong>🏆 Prize won? </strong>0.0001 ETH 🥳</div>) : (<div><strong>🏆 Prize won? </strong>0 ETH 😩</div>)}
            </div>
          )
        })}
      </div>
    </div>
  );
}
