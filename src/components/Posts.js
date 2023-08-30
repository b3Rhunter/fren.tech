import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Posts({state, allUserTokens = []}) {

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const postsData = [];
      snapshot.forEach((doc) => postsData.push({ ...doc.data(), id: doc.id }));
      setPosts(postsData);
    });

    return unsubscribe;
  }, []);

  const findNFTByUsername = (username) => {
    return state.nfts.find(nft => nft.tokenName === username);
  };

  const filterPostsByTokenHolders = () => {
    if (!Array.isArray(allUserTokens)) {
      console.warn("allUserTokens is not an array:", allUserTokens);
      return [];
    }
    const filtered = posts.filter(post => {
      const hasToken = allUserTokens.some(token => {
        return token.tokenId === post.user && parseFloat(token.balance) > 0;
      });
      return hasToken;
    });
    return filtered.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
  };
  
  
  const filteredPosts = filterPostsByTokenHolders();

  const renderDescriptionWithImages = (description) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return description.replace(urlRegex, (url) => {
      return `<img src="${url}" alt="embedded image" class="embeddedImage" />`;
    });
  };

  return(
      <div className="posts-container">
{filteredPosts.map((post) => {
  const nft = findNFTByUsername(post.username);
  return (
    <div className="frens-posts" key={post.id}>
      {nft && (
        <>
        <div className="user-post">
          <img style={{width: "50px", height: "50px"}} className='avatar' src={nft.tokenURI} alt={nft.tokenName} />
          <h3 style={{fontSize: "18px"}}>{nft.tokenName}</h3>
        </div>
        </>
      )}
      <div className="post-content">
        <p dangerouslySetInnerHTML={{ __html: renderDescriptionWithImages(post.description) }}></p>
        {post.image && <img className="postImage" src={post.image} alt="user post" />}
      </div>
    </div>
  );
})}

      </div>
  );
}


export default Posts;
