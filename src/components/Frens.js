import { useEffect } from 'react';

function Frens({state, allUserTokens, ethers, mintToken, sellToken, reRenderFrens}) {

    useEffect(() => {
        if (!state.createAccount && state.connected) {
            console.log("allUserTokens inside useEffect:", allUserTokens);
        }
    }, [reRenderFrens, state.nfts, allUserTokens]); 

    return(
        <div className="posts-container">
        {state.connected && (
          <section>
          {state.nfts.map((nft, index) => {
          console.log("allUserTokens:", allUserTokens);
          const userToken = Array.isArray(allUserTokens) ? allUserTokens.find(token => token.tokenId === ethers.utils.getAddress(nft.tokenId.toHexString())) : {};
          return (
              <div className='posts' key={index}>
                <div className='feed-1'>
                  <img style={{width: "50px", height: "50px"}} className='avatar' src={nft.tokenURI} alt={nft.tokenName} />
                  <h3 style={{fontSize: "18px"}}>{nft.tokenName}</h3>
              </div>

                {userToken && (
                  <div className='token-details'>
                    {/* <p>Token Address: <span className='address' onClick={() => truncateAndCopyAddress(userToken.address)} style={{ cursor: 'pointer' }}>{userToken.address.slice(0, 6) + "..."}</span></p> */}
                    <p>Owned: {parseInt(userToken.balance).toLocaleString() || '0'}</p>
                    {/* <p>Supply: {parseInt(userToken.totalSupply).toLocaleString() || '0'}</p> */}
                    {/* <p>Max Supply: {parseInt(userToken.maxSupply).toLocaleString() || '0'}</p> */}
                    <p>Price: {userToken.pricePerToken.includes('.') ? userToken.pricePerToken.slice(0, userToken.pricePerToken.indexOf('.') + 5) : userToken.pricePerToken || '0'} ETH</p>
                    
                  </div>
                )}
                <div className='mint-button'>
                  <button className='button' onClick={() => mintToken(userToken.address, 1)}>Buy</button>
                  <button className='button' onClick={() => sellToken(userToken.address, 1)}>Sell</button>
                </div>
              </div>
            );
          })}
        </section>
            )}
        </div>
    );
}

export default Frens;