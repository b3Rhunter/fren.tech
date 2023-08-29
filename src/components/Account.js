import React, { useState } from 'react';
import { storage } from '../firebase';

function Account({ handleBurn, state, setState }) {
  const [newUsername, setNewUsername] = useState('');
  const [newImage, setNewImage] = useState(null);

  const updateUsername = async () => {
    try {
      const address = await state.signer.getAddress();
      const tx = await state.authContract.changeTokenName(address, newUsername);
      await tx.wait();
    } catch (error) {
      console.log(error);
    }
  };

  const handleNewImageChange = (e) => {
    if (e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const updateProfilePicture = async () => {
    if (!newImage) {
      alert('Please select an image.');
      return;
    }

    const uploadTask = storage.ref(`images/${newImage.name}`).put(newImage);
    uploadTask.on(
      'state_changed',
      snapshot => {},
      error => {
        console.error(error);
        alert('An error occurred while uploading the image.');
      },
      async () => {
        const downloadURL = await storage.ref('images').child(newImage.name).getDownloadURL();
        try {
          const address = await state.signer.getAddress();
          const tx = await state.authContract.changeTokenURI(address, downloadURL);
          await tx.wait();
        } catch (error) {
          console.log(error);
        }
      }
    );
  };

  return (
    <div className="account-container">
      {state.connected && (
        <>
          <input
            type="text"
            placeholder="choose user name..."
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button className='off-btn' onClick={updateUsername}>Update Username</button>
          <label className="file-upload">
            <input
              className='upload'
              type="file"
              onChange={handleNewImageChange}
            />
            <span>Upload image...</span>
          </label>
          <button className='off-btn' onClick={updateProfilePicture}>Update Profile Picture</button>
          <button onClick={handleBurn}>Delete Account</button>
        </>
      )}
    </div>
  );
}

export default Account;
