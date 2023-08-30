

const CreateAccount = ({handleMint, state, setState, handleImageChange}) => {
    return (

        <div className='create-account'>
        <input type="text" placeholder="choose user name..." value={state.userDetails.name} onChange={(e) => setState({ ...state, userDetails: { ...state.userDetails, name: e.target.value } })} />
        <label className="file-upload">
          <input className='upload' type="file" onChange={handleImageChange} />
          <span>Upload Profile Picture</span>
        </label>
        <button onClick={handleMint}>Create Account</button>
      </div>

    );
}

export default CreateAccount;