import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore"; // Import query and where
import { db } from "../firebase";
import NewComment from './NewComment';
import { FaRegCommentDots } from 'react-icons/fa';
import { AiFillHeart } from 'react-icons/ai';


function Posts({ state, allUserTokens = [] }) {

  const [posts, setPosts] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState({});

  const fetchComments = (postId) => {
    const commentsQuery = query(collection(db, 'comments'), where('postId', '==', postId)); // Use query
    onSnapshot(commentsQuery, (snapshot) => {
      const postComments = [];
      snapshot.forEach((doc) => postComments.push(doc.data()));
      setComments((prevComments) => ({
        ...prevComments,
        [postId]: postComments,
      }));
    });
  };

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

  const toggleComments = (postId) => {
    if (!comments[postId]) {
      fetchComments(postId);
    }
    setShowComments((prevState) => ({
      ...prevState,
      [postId]: !prevState[postId],
    }));
  };


  return (
    <div className="posts-container">
      {filteredPosts.map((post) => {
        const nft = findNFTByUsername(post.username);
        return (
          <div className="frens-posts" key={post.id}>
            {nft && (
              <>
                <div className="user-post">
                  <img style={{ width: "50px", height: "50px" }} className='avatar' src={nft.tokenURI} alt={nft.tokenName} />
                  <h3 style={{ fontSize: "18px" }}>{nft.tokenName}</h3>
                </div>
              </>
            )}
            <div className="post-content">
              <p dangerouslySetInnerHTML={{ __html: renderDescriptionWithImages(post.description) }}></p>
              {post.image && <img className="postImage" src={post.image} alt="user post" />}
            </div>
            <div className="react-btns"> 
            <button className="open-comments" onClick={() => toggleComments(post.id)}><FaRegCommentDots/></button>
            {/* <button className="open-comments"><AiFillHeart/></button> */}
            </div>
            {showComments[post.id] && (
              <div className="comment-section">
                <NewComment
                  postId={post.id}
                  userId={state.userDetails?.id || 'defaultUserId'} // Replace with actual user ID
                  username={state.userDetails?.name || 'defaultUsername'} // Replace with actual username
                />

                <div className="existing-comments">
                  {comments[post.id]?.slice(0).reverse().map((comment, index) => (
                    <div key={index}>
                      <p><strong>{comment.username}</strong>: {comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      );
    })}
    </div>
  );
}

export default Posts;