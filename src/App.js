import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI from './ABI.json';
import TokenFactoryABI from './TokenFactoryABI.json';
import TokenABI from './TokenABI.json';
import { storage, db } from './firebase';

const authAddress = "0xf11901D4ADEe17A147Cf881F4553c9Acb914Ed6A";
const tokenFactoryAddress = "0xC9d27A7C0c6e4bcc068FFb03e8bE03387F64CBa2";

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
    view: 'home'
  };

  const [state, setState] = useState(initialState);
  const [image, setImage] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState("")
  const [tokenAddress, setTokenAddress] = useState(null);
  const [allUserTokens, setAllUserTokens] = useState([]);
  const [tokenName, setTokenName] = useState(null);

  const connectWallet = async () => {
    try {
      const _provider = new ethers.providers.Web3Provider(window.ethereum);
      const _account = await _provider.send("eth_requestAccounts", []);
      const _signer = _provider.getSigner();
      const _authContract = new ethers.Contract(authAddress, ABI, _signer);
      const _tokenContract = new ethers.Contract(tokenFactoryAddress, TokenFactoryABI, _signer);
      setTokenContract(_tokenContract)
      const address = await _signer.getAddress();
      const auth = await _authContract.balanceOf(address);

      await _signer.signMessage("Welcome to EthAuth!");

      let userDetails = {
        name: '',
        tokenURI: '',
        tokenId: address
      };

      if (!auth.eq(ethers.constants.Zero)) {
        userDetails.name = await _authContract.tokenName(address);
        userDetails.tokenURI = await _authContract.tokenURI(address);
        const TokenContractAddress = await _tokenContract.getTokensByUser(address);
        const parseAddress = TokenContractAddress.toString();
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
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const handleMint = async () => {
    if (!image) {
      alert('Please select an image.');
      return;
    }
    if (image) {
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

            const fetchedNFTs = await fetchNFTs();

            setState({
              ...state,
              createAccount: false,
              userDetails,
              nfts: fetchedNFTs,
              view: 'home'
            });
          } catch (error) {
            console.error("Minting failed:", error);
          }

        }
      );
    } else {
      alert('Please select an image.');
    }
  };

  const handleBurn = async () => {
    try {
      const url = new URL(state.userDetails.tokenURI);
      const decodedPathname = decodeURIComponent(url.pathname);
      const imageName = decodedPathname.split('/').pop();
      const imagePath = `images/${imageName}`;
      const tx = await state.authContract.burn(state.userDetails.tokenId);
      await tx.wait();

      const imageRef = storage.ref(imagePath);
      imageRef.delete().then(() => {
        console.log('Image deleted successfully from Firebase storage.');
      }).catch((error) => {
        console.error('Error deleting image from Firebase storage:', error);
      });

      setState({ ...state, createAccount: true, userDetails: { ...state.userDetails, tokenURI: '' } });
    } catch (error) {
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
    if (!Array.isArray(nfts)) {
      console.warn("nfts is not an array:", nfts);
      return;
  }
    try {
      const allUserTokenDetails = [];
      for (const nft of nfts) {
        const userAddressBigNumber = ethers.BigNumber.from(nft.tokenId);
        const userAddress = ethers.utils.getAddress(userAddressBigNumber.toHexString());
        const TokenContractAddress = await tokenContract.getTokensByUser(userAddress);
        const parseAddress = TokenContractAddress.toString();
        const userTokenContract = new ethers.Contract(parseAddress, TokenABI, state.signer);
        const balance = await userTokenContract.balanceOf(userAddress);
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
    } catch (error) {
      console.error("Error fetching all user tokens:", error);
    }
  };

  const mintToken = async (tokenAddress) => {
    try {
      const amount = "1";
      const userTokenContract = new ethers.Contract(tokenAddress, TokenABI, state.signer);
      const pricePerToken = await userTokenContract.getPrice(amount);
      const tx = await userTokenContract.mintShares(amount, { value: pricePerToken.toString() });
      await tx.wait();
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const disconnect = () => {
    setState(initialState);
  };

  const truncateAndCopyAddress = (tokenAddress) => {
    const truncatedAddress = tokenAddress.slice(0, 6) + "...";
    navigator.clipboard.writeText(tokenAddress);
    return truncatedAddress;
  };

  useEffect(() => {
    const updateNFTsAndTokens = async () => {
      const fetchedNFTs = await fetchNFTs();
      setState(prevState => ({ ...prevState, nfts: fetchedNFTs }));
      if (state.connected) {
        fetchAllUserTokens(fetchedNFTs);
      }
    };
    updateNFTsAndTokens();
}, [state.authContract, state.connected]);

  const renderContent = () => {
    if (!state.connected) return <p>please connect wallet...</p>;
    if (state.createAccount) {
      return (
        <div className='create-account'>
          <input type="text" placeholder="choose user name..." value={state.userDetails.name} onChange={(e) => setState({ ...state, userDetails: { ...state.userDetails, name: e.target.value } })} />
          <input type="file" onChange={handleImageChange} />
          <button onClick={handleMint}>Create Account</button>
        </div>
      );
    }

    if (state.view === 'home') {
      return (
        <>
          <h2>Welcome {state.userDetails.name}</h2>
          <p>you have access!</p>
        </>
      );
    }

    if (state.view === 'allUsers') {
      return (
        <section className='user-container'>
          {state.nfts.map((nft, index) => {
            const userToken = allUserTokens.find(token => token.tokenId === ethers.utils.getAddress(nft.tokenId.toHexString())) || {};
            return (
              <div className='feed' key={index}>
                <div className='feed-1'>
                <img className='avatar' src={nft.tokenURI} alt={nft.tokenName} />
                <h3>{nft.tokenName}</h3>
                </div>

                {userToken && (
                  <div className='token-details'>
                    {/* <p>Token Address: <span className='address' onClick={() => truncateAndCopyAddress(userToken.address)} style={{ cursor: 'pointer' }}>{userToken.address.slice(0, 6) + "..."}</span></p> */}
                    {/* <p>Token Balance: {parseInt(userToken.balance).toLocaleString() || '0'}</p> */}
                    <p>Supply: {parseInt(userToken.totalSupply).toLocaleString() || '0'}</p>
                    {/* <p>Max Supply: {parseInt(userToken.maxSupply).toLocaleString() || '0'}</p> */}
                    <p>Price: {userToken.pricePerToken || '0'} ETH</p>
                  </div>
                )}
                <div className='mint-button'>
                <button className='button' onClick={() => mintToken(userToken.address, 1)}>Buy Shares</button>
                </div>
              </div>
            );
          })}
        </section>
      );
    }

  };

  return (
    <div className="app">
      <header>
        <h1>Fren.Tech</h1>
        {!state.connected && <button className='disconnect' onClick={connectWallet}>connect</button>}
        {state.connected && (
          <div>
            {!state.createAccount && <img className='user-avatar' src={state.userDetails.tokenURI} alt='avatar' />}
            {!state.createAccount && <p className='balance'>{parseInt(tokenBalance).toLocaleString()} <span>{tokenName}</span> shares</p>}
          </div>
        )}
        {state.connected && <button className='disconnect' onClick={disconnect}>disconnect</button>}
        {state.connected && (
          <div className='nav'>
            <button onClick={() => setState({ ...state, view: 'home' })}>Home</button>
            <button onClick={() => setState({ ...state, view: 'allUsers' })}>Friends</button>
            <button onClick={handleBurn}>Delete Account</button>
          </div>
        )}
      </header>
      <section className='card'>
        {renderContent()}
      </section>
    </div>
  );
}

export default App;
