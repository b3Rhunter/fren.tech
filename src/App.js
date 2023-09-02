import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import ABI from './ABIs/ABI.json';
import TokenFactoryABI from './ABIs/TokenFactoryABI.json';
import TokenABI from './ABIs/TokenABI.json';
import { storage, db } from './firebase';
import Posts from './components/Posts';
import Account from './components/Account';
import Frens from './components/Frens';
import NewPost from './components/NewPost';
import CreateAccount from './components/CreateAccount';
import Notification from './components/Notification';
import Loading from './components/Loading';
import { AiFillHome } from 'react-icons/ai';
import { ImFeed } from 'react-icons/im';
import { BsFillPersonFill } from 'react-icons/bs';

const authAddress = "0x49D3AE953A4C8D4Ab22016ccE50CbbFbde85810D";
const sharePrinterAddress = "0x02E1EA569CCfCE9C20BE85BB8697939ff1873A10";

function App() {

  const initialState = {
    connected: false,
    provider: null,
    account: null,
    signer: null,
    authContract: null,
    userDetails: {
      name: '',
      tokenURI: '',
      tokenId: ''
    },
    createAccount: false,
    nfts: [],
    view: 'allUsers'
  };

  const [state, setState] = useState(initialState);
  const [image, setImage] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState("")
  const [tokenAddress, setTokenAddress] = useState(null);
  const [allUserTokens, setAllUserTokens] = useState([]);
  const [tokenName, setTokenName] = useState(null);
  const [reRenderFrens, setReRenderFrens] = useState(false);
  const [ethBalance, setEthBalance] = useState("0");
  const [createPost, setCreatePost] = useState(false);
  const [notification, setNotification] = useState({ message: '', show: false });
  const [isLoading, setIsLoading] = useState(false);

  const connect = async () => {
    setIsLoading(true)
    try {
      let _provider;
      _provider = new ethers.providers.Web3Provider(window.ethereum);
      await _provider.send("eth_requestAccounts", []);
      const network = await _provider.getNetwork();
      const desiredChainId = '0x2105';  //base mainnet 0x2105
      if (network.chainId !== parseInt(desiredChainId)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: desiredChainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: desiredChainId,
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.base.org'], //https://mainnet.base.org
                  blockExplorerUrls: ['https://basescan.org'], //https://basescan.org
                }],
              });
            } catch (addError) {
              throw addError;
            }
          } else {
            throw switchError;
          }
        }
      }
      _provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log('provider: ', _provider.toString())
      const _account = await _provider.send("eth_requestAccounts", []);
      const _signer = _provider.getSigner();
      const _authContract = new ethers.Contract(authAddress, ABI, _signer);
      const _tokenContract = new ethers.Contract(sharePrinterAddress, TokenFactoryABI, _signer);
      setTokenContract(_tokenContract)
      const address = await _signer.getAddress();
      const auth = await _authContract.balanceOf(address);
      const getEthBalance = await _signer.getBalance();
      const parseEthBalance = ethers.utils.formatEther(getEthBalance);
      setEthBalance(parseEthBalance)
      //const getUserName = await _authContract.tokenName(address)
      //setUserName(getUserName)
      await _signer.signMessage("Welcome to BestFren.Tech!");

      let userDetails = {
        name: '',
        tokenURI: '',
        tokenId: address
      };

      if (!auth.eq(ethers.constants.Zero)) {
        userDetails.name = await _authContract.tokenName(address);
        userDetails.tokenURI = await _authContract.tokenURI(address);

        const TokenContractAddressArray = await _tokenContract.getTokensByUser(address);
        const parseAddress = TokenContractAddressArray[TokenContractAddressArray.length - 1].toString();
        
        setTokenAddress(parseAddress)
        const userTokenContract = new ethers.Contract(parseAddress, TokenABI, _signer);
        const balance = await userTokenContract.balanceOf(address);
        const _tokenName = await _authContract.tokenName(address)
        setTokenName(_tokenName)
        const parseBalance = await ethers.utils.formatEther(balance.toString());
        setTokenBalance(parseBalance.toString())
    }    

      setState({
        ...state,
        connected: true,
        provider: _provider,
        account: _account,
        signer: _signer,
        authContract: _authContract,
        userDetails,
        createAccount: auth.eq(ethers.constants.Zero)
      });
      showNotification("Welcome to BestFren.Tech");
      setIsLoading(false)
    } catch(error) {
      setIsLoading(false)
      console.log(error)
    }
  }

  const handleMint = async () => {
    if (!image) {
      alert('Please select an image.');
      return;
    }
    if (image) {
      setIsLoading(true)
      const uploadTask = storage.ref(`images/${image.name}`).put(image);
      uploadTask.on(
        'state_changed',
        snapshot => { },
        error => {
          console.error(error);
          alert('An error occurred while uploading the image.');
        },
        async () => {
          const downloadURL = await storage.ref('images').child(image.name).getDownloadURL();
          try {
            const tx = await state.authContract.mint(state.userDetails.name, downloadURL, { value: ethers.utils.parseEther("0.001") });
            await tx.wait();

            const address = await state.signer.getAddress();
            const userDetails = {
              name: await state.authContract.tokenName(address),
              tokenURI: await state.authContract.tokenURI(address),
              tokenId: address
            };
            const authContract = new ethers.Contract(authAddress, ABI, state.signer);
            const fetchedNFTs = await fetchNFTs();
            userDetails.name = await authContract.tokenName(address);
            userDetails.tokenURI = await authContract.tokenURI(address);
    
            const TokenContractAddressArray = await tokenContract.getTokensByUser(address);
            const parseAddress = TokenContractAddressArray[TokenContractAddressArray.length - 1].toString();
            
            setTokenAddress(parseAddress)
            const userTokenContract = new ethers.Contract(parseAddress, TokenABI, state.signer);
            const balance = await userTokenContract.balanceOf(address);
            const _tokenName = await authContract.tokenName(address)
            setTokenName(_tokenName)
            const parseBalance = await ethers.utils.formatEther(balance.toString());
            setTokenBalance(parseBalance.toString())
            setState({
              ...state,
              createAccount: false,
              userDetails,
              nfts: fetchedNFTs,
              view: 'allUsers'
            });

            const totalSupply = await userTokenContract.totalSupply();
            const parseTotalSupply = await ethers.utils.formatEther(totalSupply.toString());
            const maxSupply = await userTokenContract.maxSupply();
            const parseMaxSupply = await ethers.utils.formatEther(maxSupply.toString());
            const priceForOneToken = await userTokenContract.getPrice("1");
            const parsePriceForOneToken = await ethers.utils.formatEther(priceForOneToken.toString());
            const getEthBalance = await state.signer.getBalance();
            const parseEthBalance = ethers.utils.formatEther(getEthBalance);
            setEthBalance(parseEthBalance)
            setAllUserTokens(prevTokens => [...prevTokens, {
              tokenId: address,
              address: parseAddress,
              balance: parseBalance,
              totalSupply: parseTotalSupply,
              maxSupply: parseMaxSupply,
              pricePerToken: parsePriceForOneToken
            }]);            
            setTokenBalance(parseBalance);
            setTokenName(_tokenName);
            setReRenderFrens(!reRenderFrens);
            showNotification("Account Created!");
            setIsLoading(false)
          } catch (error) {
            showNotification("Minting failed: ", error);
            setIsLoading(false)
            console.error("Minting failed:", error);
          }
        }
      );
    } else {
      alert('Please select an image.');
    }
  };

  const handleBurn = async () => {
    setIsLoading(true)
    try {
      const url = new URL(state.userDetails.tokenURI);
      const decodedPathname = decodeURIComponent(url.pathname);
      const imageName = decodedPathname.split('/').pop();
      const imagePath = `images/${imageName}`;
      const tx = await state.authContract.burn(state.userDetails.tokenId);
      await tx.wait();
      const getEthBalance = await state.signer.getBalance();
      const parseEthBalance = ethers.utils.formatEther(getEthBalance);
      setEthBalance(parseEthBalance)
      const imageRef = storage.ref(imagePath);
      imageRef.delete().then(() => {
        console.log('Image deleted successfully from Firebase storage.');
      }).catch((error) => {
        console.error('Error deleting image from Firebase storage:', error);
      });

      setState({ ...state, createAccount: true, userDetails: { ...state.userDetails, tokenURI: '' } });
      showNotification("Account deleted...");
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      showNotification("Burning failed:", error);
      console.error("Burning failed:", error);
    }
  };

  const fetchNFTs = async () => {
    let fetchedNFTs = [];
    try {
      if (state.authContract) {
        const totalSupply = await state.authContract.totalSupply();
        for (let i = 0; i < totalSupply.toNumber(); i++) {
          const tokenId = await state.authContract.tokenByIndex(i);
          const tokenName = await state.authContract.tokenName(tokenId);
          const tokenURI = await state.authContract.tokenURI(tokenId);
          fetchedNFTs.push({ tokenId, tokenName, tokenURI });
        }
      }
    } catch (error) {
      console.log(error)
    }
    return fetchedNFTs;
  };

  const fetchAllUserTokens = async (nfts) => {
    console.log("fetchAllUserTokens called");
    if (!Array.isArray(nfts)) {
      console.warn("nfts is not an array:", nfts);
      return;
    }
    try {
      const allUserTokenDetails = [];
      for (const nft of nfts) {
        const address = state.signer.getAddress()
        const userAddressBigNumber = ethers.BigNumber.from(nft.tokenId);
        const userAddress = ethers.utils.getAddress(userAddressBigNumber.toHexString());
        const TokenContractAddressArray = await tokenContract.getTokensByUser(userAddress);
        const parseAddress = TokenContractAddressArray[TokenContractAddressArray.length - 1].toString();
        const userTokenContract = new ethers.Contract(parseAddress, TokenABI, state.signer);
        const balance = await userTokenContract.balanceOf(address);
        const parseBalance = await ethers.utils.formatEther(balance.toString());
        const totalSupply = await userTokenContract.totalSupply();
        const parseTotalSupply = await ethers.utils.formatEther(totalSupply.toString());
        const maxSupply = await userTokenContract.maxSupply();
        const parseMaxSupply = await ethers.utils.formatEther(maxSupply.toString());
        const priceForOneToken = await userTokenContract.getPrice("1");
        const parsePriceForOneToken = await ethers.utils.formatEther(priceForOneToken.toString());
        allUserTokenDetails.push({
          tokenId: userAddress,
          address: parseAddress,
          balance: parseBalance,
          totalSupply: parseTotalSupply,
          maxSupply: parseMaxSupply,
          pricePerToken: parsePriceForOneToken
        });
      }
      setAllUserTokens(allUserTokenDetails);
      console.log("allUserTokens updated:", allUserTokenDetails);
      console.log("fetchAllUserTokens finished");
    } catch (error) {
      console.error("Error fetching all user tokens:", error);
    }
  };

  const mintToken = async (tokenAddress, amount) => {
    setIsLoading(true)
    try {
      const userTokenContract = new ethers.Contract(tokenAddress, TokenABI, state.signer);
      const getPrice = await userTokenContract.getPrice(amount)
      const parseGetPrice = Number(ethers.utils.formatEther(getPrice))
      const fees = Number("0.001")
      const pricePerToken = parseGetPrice + fees;
      const roundedPricePerToken = parseFloat(pricePerToken.toFixed(18));
      const parsePrice = ethers.utils.parseEther(roundedPricePerToken.toString());
      const tx = await userTokenContract.buy(amount, { value: parsePrice.toString() });
      await tx.wait();
      const getEthBalance = await state.signer.getBalance();
      const parseEthBalance = ethers.utils.formatEther(getEthBalance);
      setEthBalance(parseEthBalance)
      updateAllUserTokens();
      setReRenderFrens(prev => !prev);
      showNotification("Purchased!");
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      showNotification("Error minting tokens:", error);
      console.error("Error minting tokens:", error);
    }
  };

  const updateAllUserTokens = async () => {
    try {
      const newAllUserTokens = await Promise.all(allUserTokens.map(async (token) => {
        const address = state.signer.getAddress()
        const userTokenContract = new ethers.Contract(token.address, TokenABI, state.signer);
        const balance = await userTokenContract.balanceOf(address);
        console.log('balance: ',balance)
        const parseBalance = ethers.utils.formatEther(balance.toString());
        console.log('parsed balance', parseBalance)
        const totalSupply = await userTokenContract.totalSupply();
        console.log('total supply: ', totalSupply)
        const parseTotalSupply = ethers.utils.formatEther(totalSupply.toString());
        console.log('parsed supply: ', parseTotalSupply)
        const priceForOneToken = await userTokenContract.getPrice("1");
        console.log('price: ', priceForOneToken)
        const parsePriceForOneToken = ethers.utils.formatEther(priceForOneToken.toString());
        console.log('parsed price: ', parsePriceForOneToken)
        return {
          ...token,
          balance: parseBalance,
          totalSupply: parseTotalSupply,
          pricePerToken: parsePriceForOneToken
        };
      }));
      setAllUserTokens(newAllUserTokens);
    } catch (error) {
      console.error("Error updating all user tokens:", error);
    }
  };

  const sellToken = async (tokenAddress, amount) => {
    setIsLoading(true)
    try {
      const userTokenContract = new ethers.Contract(tokenAddress, TokenABI, state.signer);
      const fees = ethers.utils.parseEther("0.001")
      const tx = await userTokenContract.sell(amount, { value: fees.toString() });
      await tx.wait();
      const getEthBalance = await state.signer.getBalance();
      const parseEthBalance = ethers.utils.formatEther(getEthBalance);
      setEthBalance(parseEthBalance)
      updateAllUserTokens();
      setReRenderFrens(prev => !prev);
      showNotification("Sold!");
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      showNotification("Error selling tokens:", error);
      console.error("Error selling tokens:", error);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
    showNotification("image uploaded...");
  };

  const disconnect = async () => {
    setState(initialState);
    showNotification("disconnected...");
  }

  const showNotification = (message) => {
    setNotification({ message, show: true });
  };

  useEffect(() => {
    if (state.connected && !state.createAccount) {
      setIsLoading(true)
      console.log("useEffect in App.js triggered");
      const updateNFTsAndTokens = async () => {
        const fetchedNFTs = await fetchNFTs();
        setState(prevState => ({ ...prevState, nfts: fetchedNFTs }));
        fetchAllUserTokens(fetchedNFTs);
        setIsLoading(false);
      };
      updateNFTsAndTokens();
    }
  }, [state.authContract, state.connected]);

  return (
    <div className="app">
        {isLoading && <Loading/>}
        {!state.connected && <div className='connect-container'><button onClick={connect} className='connect-btn'>connect</button></div>}
      <Router>
      {state.connected && (
      <>
          <nav>
          {!state.createAccount && (
            <>
            <Link to="/frens"><AiFillHome /></Link>
            <Link to="/posts"><ImFeed /></Link>
            <Link to="/account"><BsFillPersonFill /></Link>
            </>
          )}
          </nav>
          
          <div className='content'>
              <header>
                <div className='user'>
                {!state.createAccount && (
                <>
                <img className='user-avatar' src={state.userDetails.tokenURI} alt='avatar' />
                <p className='user-balance'>{parseFloat(ethBalance).toFixed(4)} ETH</p>
                </>
                )}
                </div>
                <h1>BestFren.Tech</h1>
                {state.connected && <button onClick={disconnect} className='disconnect-btn'>disconnect</button>}
              </header>
              {!state.createAccount && (
              <div className='create-post-container'>
              <NewPost state={state}/>
              </div>
              )}


              <main>
              {state.createAccount && (
                <CreateAccount state={state} setState={setState} handleImageChange={handleImageChange} handleMint={handleMint} />
              )}
                <Routes>
                  <Route path="/" element={<Posts />} />
                  <Route path="/account" element={<Account state={state} handleBurn={handleBurn} handleImageChange={handleImageChange} setState={setState} />} />
                  <Route path="/posts" element={allUserTokens.length > 0 ? <Posts state={state} allUserTokens={allUserTokens} ethers={ethers}/> : <div>{!state.createAccount && <p>Loading...</p>}</div>} fetchAllUserTokens={fetchAllUserTokens}/>
                  <Route path="/frens" element={<Frens state={state} allUserTokens={allUserTokens} ethers={ethers} mintToken={mintToken} sellToken={sellToken} reRenderFrens={reRenderFrens} />} />
                </Routes>
              </main>
            </div>
          </>
      )}
      </Router>
      <Notification
        message={notification.message}
        show={notification.show}
        setShow={(show) => setNotification({ ...notification, show })}
      />
    </div>
  );
}

export default App;
