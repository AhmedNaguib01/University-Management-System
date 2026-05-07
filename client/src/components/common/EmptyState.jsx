import React from "react";
import { Card, CardContent } from "../ui/display";
import "../../styles/empty-state.css";

const EmptyState = ({
  message = "No data available",
  icon: Icon,
  action,
  actionLabel,
}) => {
  return (
    <Card className="empty-state-card">
      <CardContent className="empty-state-content">
        {Icon && (
          <div className="empty-state-icon">
            <Icon size={48} />
          </div>
        )}
        <p className="empty-state-message">{message}</p>
        {action && actionLabel && (
          <button onClick={action} className="empty-state-action">
            {actionLabel}
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
