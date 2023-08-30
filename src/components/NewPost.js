import React, { useState } from "react";
import { collection, doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from "../firebase";
import { BiImageAdd } from 'react-icons/bi';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';



const NewPost = ({state}) => {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [isUploading, setUploading] = useState(false);

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
      console.log('file uploaded: ',e.target.files[0])
    }
  };

  const handleNewPost = async (e) => {
    e.preventDefault();
    setUploading(true);
  
    const address = await state.signer.getAddress();
    const uid = address.toString();
    const name = state.userDetails.name;
  
    if (!uid || !name) {
      console.error("UID or username is undefined");
      return;
    }
  
    const postRef = doc(collection(db, "posts"));
    const post = {
      description,
      user: uid,
      username: name,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };
  
    if (image) {
      const storageRef = ref(storage, `images/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);
  
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Handle progress, error, and complete states here
          }, 
          (error) => {
            console.log(error);
            reject(error);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            post.image = downloadURL;
            resolve();
          }
        );
      });
    }
  
    await setDoc(postRef, post);
    setUploading(false);
  };
  
  return (
    <div className="create-post">
      <form className="post-form" onSubmit={handleNewPost}>
          <input placeholder="what's happening..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="post-btn" type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Post"}
          </button>
          <div className="upload-image">
          <label>
          <BiImageAdd/>
          <input placeholder="upload image..." type="file" onChange={handleImageUpload} />
          </label>
          </div>
      </form>
    </div>
  );
};

export default NewPost;
