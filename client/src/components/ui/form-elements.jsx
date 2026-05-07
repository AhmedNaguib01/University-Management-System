import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";
import "../../styles/form-elements.css";

// Label Component
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("label", className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// Input Component
const Input = React.forwardRef(
  ({ className, type = "text", ...props }, ref) => (
    <input
      type={type}
      className={cn("input", className)}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

// Textarea Component
const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea className={cn("textarea", className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";

export { Label, Input, Textarea };
