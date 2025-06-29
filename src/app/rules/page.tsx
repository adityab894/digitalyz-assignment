"use client";
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import RuleBuilder from "../components/RuleBuilder/RuleBuilder";
import Link from "next/link";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RuleIcon from '@mui/icons-material/Rule';

export default function RulesPage() {
  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RuleIcon sx={{ fontSize: 32, color: 'primary.main' }} /> Business Rules Builder
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Button variant="outlined" startIcon={<ArrowBackIcon />}>Back to Main Page</Button>
        </Link>
      </Box>
      <RuleBuilder />
    </Box>
  );
} 