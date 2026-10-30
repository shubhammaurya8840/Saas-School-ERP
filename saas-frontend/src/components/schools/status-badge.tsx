import React from "react";
import { SchoolStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: SchoolStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  switch (status) {
    case "active":
      return (
        <Badge variant="success" dot size={size}>
          Active Workspace
        </Badge>
      );
    case "trial":
      return (
        <Badge variant="warning" dot size={size}>
          Free Trial
        </Badge>
      );
    case "suspended":
      return (
        <Badge variant="danger" dot size={size}>
          Suspended
        </Badge>
      );
    default:
      return <Badge size={size}>{status}</Badge>;
  }
}
