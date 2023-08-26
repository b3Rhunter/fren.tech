function Account({handleBurn, state, setState, handleImageChange}) {

    return(
        <div className="account-container">
            {state.connected && (
            <>
            <input type="text" placeholder="choose user name..." value={state.userDetails.name} onChange={(e) => setState({ ...state, userDetails: { ...state.userDetails, name: e.target.value } })} />
            <button>Update Username</button>
            <label className="file-upload">
                <input className='upload' type="file" onChange={handleImageChange} />
            <span>Upload Profile Picture</span>
            </label>
            <button>Update Profile Picture</button>
            <button onClick={handleBurn}>Delete Account</button>
            </>
            )}
        </div>
    );
}

export default Account;