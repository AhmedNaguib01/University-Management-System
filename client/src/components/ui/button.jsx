import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import "../../styles/button.css";

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn("btn", `btn-${variant}`, `btn-${size}`, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
