import React from "react";

export function Skeleton({ className = "", style }) {
  return <div className={`skel rounded-xl ${className}`} style={style} />;
}

export default Skeleton;
