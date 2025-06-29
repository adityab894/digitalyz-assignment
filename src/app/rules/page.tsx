"use client";
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import RuleBuilder from "../components/RuleBuilder/RuleBuilder";
import Link from "next/link";

export default function RulesPage() {
  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>Business Rules Builder</Typography>
      <Box sx={{ mb: 2 }}>
        <Link href="/">
          <Button variant="outlined">← Back to Main Page</Button>
        </Link>
      </Box>
      <RuleBuilder />
    </Box>
  );
} 