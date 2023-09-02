function Alerts({ notifications }) {
    return (
      <div className="alert-container">
          {notifications.slice(0).reverse().map((notification, index) => (
            <p className="alert" key={index}>{notification}</p>
          ))}
      </div>
    );
  }
  
  export default Alerts;
  