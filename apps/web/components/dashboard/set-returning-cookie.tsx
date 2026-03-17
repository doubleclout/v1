"use client";

import { useEffect } from "react";
import { setReturningCookie } from "@/lib/dc-cookie";

export function SetReturningCookie() {
  useEffect(() => {
    setReturningCookie();
  }, []);
  return null;
}
