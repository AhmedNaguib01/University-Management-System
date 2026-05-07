import React from "react";
import "../../styles/loading-spinner.css";

const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className={`loading-spinner-container loading-spinner-${size}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
