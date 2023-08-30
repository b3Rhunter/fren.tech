import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const NewComment = ({ postId, userId, username }) => {
  const [text, setText] = useState('');

  const handleAddComment = async () => {
    await addDoc(collection(db, 'comments'), {
      postId,
      userId,
      username,
      text,
      timestamp: new Date(),
    });
    setText('');
  };

  return (
    <div className='comment-container'>
      <input
        className='comment-input'
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
      />
      <button className='comment-btn' onClick={handleAddComment}>Comment</button>
    </div>
  );
};

export default NewComment;
