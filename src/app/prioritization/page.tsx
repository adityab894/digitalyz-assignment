"use client";
import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import PrioritizationPanel, { PrioritizationWeights } from "../components/Prioritization/PrioritizationPanel";
import Link from "next/link";

export default function PrioritizationPage() {
  const [prioritizationWeights, setPrioritizationWeights] = useState<PrioritizationWeights>({
    priorityLevel: 0.7,
    taskFulfillment: 0.8,
    fairness: 0.5,
    workloadBalance: 0.6,
    costEfficiency: 0.4,
    timeEfficiency: 0.7,
    skillMatch: 0.8,
    phaseOptimization: 0.5
  });

  const handleExport = () => {
    alert("Export is available from the main page where data is loaded.");
  };

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" color="black" gutterBottom>Prioritization & Weights</Typography>
      <Box sx={{ mb: 2 }}>
        <Link href="/">
          <Button variant="outlined">← Back to Main Page</Button>
        </Link>
      </Box>
      <PrioritizationPanel
        weights={prioritizationWeights}
        onWeightsChange={setPrioritizationWeights}
        onExport={handleExport}
      />
    </Box>
  );
} 