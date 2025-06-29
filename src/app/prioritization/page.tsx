"use client";
import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import PrioritizationPanel, { PrioritizationWeights } from "../components/Prioritization/PrioritizationPanel";
import Link from "next/link";

export default function PrioritizationPage() {
  // Prioritization state
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

  // For export, we need to get the latest data from localStorage or session (or you can pass via Zustand/global store)
  // For now, we will assume the user will revisit the main page to export data, or you can add a TODO to sync data here.

  const handleExport = () => {
    // TODO: You may want to sync data from main page or use Zustand/global store for data
    alert("Export is available from the main page where data is loaded.");
  };

  return (
    <Box sx={{ p: 2, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>Prioritization & Weights</Typography>
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