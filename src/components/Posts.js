import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Posts({state, allUserTokens}) {  // Add allUserTokens as a prop

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
      return posts.filter(post => {
        return allUserTokens.some(token => token.tokenId === post.user);
      });
    };

    const filteredPosts = filterPostsByTokenHolders();

    return(
        <div className="posts-container">
      {filteredPosts.map((post) => {  // Use filteredPosts instead of posts
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
            <p>{post.description}</p>
            {post.image && <img className="postImage" src={post.image} alt="user post" />}
            </div>
          </div>
        );
      })}
        </div>
    );
}

export default Posts;
