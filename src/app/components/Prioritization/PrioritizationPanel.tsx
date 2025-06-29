import React, { useState } from 'react';
import { Box, Typography, Slider, Button, Card, CardContent, Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export interface PrioritizationWeights {
  priorityLevel: number;
  taskFulfillment: number;
  fairness: number;
  workloadBalance: number;
  costEfficiency: number;
  timeEfficiency: number;
  skillMatch: number;
  phaseOptimization: number;
}

export interface PrioritizationProfile {
  name: string;
  description: string;
  weights: PrioritizationWeights;
}

const PRESET_PROFILES: PrioritizationProfile[] = [
  {
    name: 'Maximize Fulfillment',
    description: 'Prioritize completing as many requested tasks as possible',
    weights: {
      priorityLevel: 0.9,
      taskFulfillment: 1.0,
      fairness: 0.3,
      workloadBalance: 0.4,
      costEfficiency: 0.2,
      timeEfficiency: 0.7,
      skillMatch: 0.8,
      phaseOptimization: 0.6
    }
  },
  {
    name: 'Fair Distribution',
    description: 'Ensure equal workload distribution across workers',
    weights: {
      priorityLevel: 0.5,
      taskFulfillment: 0.7,
      fairness: 1.0,
      workloadBalance: 1.0,
      costEfficiency: 0.4,
      timeEfficiency: 0.5,
      skillMatch: 0.6,
      phaseOptimization: 0.4
    }
  },
  {
    name: 'Minimize Workload',
    description: 'Reduce overall worker stress and burnout',
    weights: {
      priorityLevel: 0.3,
      taskFulfillment: 0.5,
      fairness: 0.8,
      workloadBalance: 1.0,
      costEfficiency: 0.6,
      timeEfficiency: 0.4,
      skillMatch: 0.7,
      phaseOptimization: 0.5
    }
  },
  {
    name: 'Cost Optimized',
    description: 'Minimize resource costs while maintaining quality',
    weights: {
      priorityLevel: 0.4,
      taskFulfillment: 0.6,
      fairness: 0.3,
      workloadBalance: 0.5,
      costEfficiency: 1.0,
      timeEfficiency: 0.8,
      skillMatch: 0.5,
      phaseOptimization: 0.7
    }
  },
  {
    name: 'Time Critical',
    description: 'Optimize for fastest completion times',
    weights: {
      priorityLevel: 0.8,
      taskFulfillment: 0.9,
      fairness: 0.2,
      workloadBalance: 0.3,
      costEfficiency: 0.4,
      timeEfficiency: 1.0,
      skillMatch: 0.9,
      phaseOptimization: 1.0
    }
  }
];

const CRITERIA_LABELS = {
  priorityLevel: 'Priority Level',
  taskFulfillment: 'Task Fulfillment',
  fairness: 'Fairness',
  workloadBalance: 'Workload Balance',
  costEfficiency: 'Cost Efficiency',
  timeEfficiency: 'Time Efficiency',
  skillMatch: 'Skill Match',
  phaseOptimization: 'Phase Optimization'
};

interface PrioritizationPanelProps {
  weights: PrioritizationWeights;
  onWeightsChange: (weights: PrioritizationWeights) => void;
  onExport: () => void;
}

const PrioritizationPanel: React.FC<PrioritizationPanelProps> = ({
  weights,
  onWeightsChange,
  onExport
}) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [rankingMode, setRankingMode] = useState<'sliders' | 'ranking' | 'pairwise'>('sliders');
  const [criteriaRanking, setCriteriaRanking] = useState<string[]>([
    'taskFulfillment',
    'priorityLevel',
    'skillMatch',
    'timeEfficiency',
    'workloadBalance',
    'phaseOptimization',
    'fairness',
    'costEfficiency'
  ]);

  const handleSliderChange = (criterion: keyof PrioritizationWeights) => (event: Event, newValue: number | number[]) => {
    onWeightsChange({
      ...weights,
      [criterion]: newValue as number
    });
  };

  const handleProfileSelect = (profileName: string) => {
    setSelectedProfile(profileName);
    const profile = PRESET_PROFILES.find(p => p.name === profileName);
    if (profile) {
      onWeightsChange(profile.weights);
    }
  };

  const handlePairwiseComparison = (criterion1: string, criterion2: string, winner: string) => {
    const currentWeight1 = weights[criterion1 as keyof PrioritizationWeights];
    const currentWeight2 = weights[criterion2 as keyof PrioritizationWeights];
    
    if (winner === criterion1) {
      onWeightsChange({
        ...weights,
        [criterion1]: Math.min(1.0, currentWeight1 + 0.1),
        [criterion2]: Math.max(0.1, currentWeight2 - 0.05)
      });
    } else {
      onWeightsChange({
        ...weights,
        [criterion1]: Math.max(0.1, currentWeight1 - 0.05),
        [criterion2]: Math.min(1.0, currentWeight2 + 0.1)
      });
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#495057', mb: 3 }}>
        🎯 Prioritization & Weights
      </Typography>

      {/* Mode Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>Input Method:</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Sliders"
            color={rankingMode === 'sliders' ? 'primary' : 'default'}
            onClick={() => setRankingMode('sliders')}
            clickable
          />
          <Chip
            label="Ranking"
            color={rankingMode === 'ranking' ? 'primary' : 'default'}
            onClick={() => setRankingMode('ranking')}
            clickable
          />
          <Chip
            label="Pairwise Comparison"
            color={rankingMode === 'pairwise' ? 'primary' : 'default'}
            onClick={() => setRankingMode('pairwise')}
            clickable
          />
        </Box>
      </Box>

      {/* Preset Profiles */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>Preset Profiles:</Typography>
        <FormControl fullWidth>
          <InputLabel>Select a profile</InputLabel>
          <Select
            value={selectedProfile}
            label="Select a profile"
            onChange={(e) => handleProfileSelect(e.target.value)}
          >
            <MenuItem value="">Custom</MenuItem>
            {PRESET_PROFILES.map((profile) => (
              <MenuItem key={profile.name} value={profile.name}>
                {profile.name} - {profile.description}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Sliders Mode */}
      {rankingMode === 'sliders' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>Adjust Weights:</Typography>
          {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
            <Box key={key} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'black' }}>{label}</Typography>
                <Typography variant="body2" color="primary">
                  {weights[key as keyof PrioritizationWeights].toFixed(2)}
                </Typography>
              </Box>
              <Slider
                value={weights[key as keyof PrioritizationWeights]}
                onChange={handleSliderChange(key as keyof PrioritizationWeights)}
                min={0}
                max={1}
                step={0.01}
                marks={[
                  { value: 0, label: 'Low' },
                  { value: 0.5, label: 'Medium' },
                  { value: 1, label: 'High' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Drag & Drop Ranking Mode */}
      {rankingMode === 'ranking' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>Rank Criteria by Importance:</Typography>
          <Box sx={{ minHeight: 200 }}>
            {criteriaRanking.map((criterion, index) => (
              <Card key={criterion} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'black' }}>
                      {index + 1}. {CRITERIA_LABELS[criterion as keyof typeof CRITERIA_LABELS]}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" color="primary" sx={{ mr: 1 }}>
                        Weight: {weights[criterion as keyof PrioritizationWeights].toFixed(2)}
                      </Typography>
                      <Button
                        size="small"
                        disabled={index === 0}
                        onClick={() => {
                          const newRanking = [...criteriaRanking];
                          [newRanking[index], newRanking[index - 1]] = [newRanking[index - 1], newRanking[index]];
                          setCriteriaRanking(newRanking);
                          
                          // Update weights based on new ranking
                          const newWeights = { ...weights };
                          newRanking.forEach((criterion, idx) => {
                            const weight = 1 - (idx / (newRanking.length - 1)) * 0.8;
                            newWeights[criterion as keyof PrioritizationWeights] = weight;
                          });
                          onWeightsChange(newWeights);
                        }}
                      >
                        ↑
                      </Button>
                      <Button
                        size="small"
                        disabled={index === criteriaRanking.length - 1}
                        onClick={() => {
                          const newRanking = [...criteriaRanking];
                          [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
                          setCriteriaRanking(newRanking);
                          
                          // Update weights based on new ranking
                          const newWeights = { ...weights };
                          newRanking.forEach((criterion, idx) => {
                            const weight = 1 - (idx / (newRanking.length - 1)) * 0.8;
                            newWeights[criterion as keyof PrioritizationWeights] = weight;
                          });
                          onWeightsChange(newWeights);
                        }}
                      >
                        ↓
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Pairwise Comparison Mode */}
      {rankingMode === 'pairwise' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>Pairwise Comparison:</Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'black' }}>
            Click on the criterion that is more important for your resource allocation:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {(() => {
              const criteria = Object.keys(CRITERIA_LABELS);
              const pairs = [];
              for (let i = 0; i < criteria.length; i++) {
                for (let j = i + 1; j < criteria.length; j++) {
                  pairs.push([criteria[i], criteria[j]]);
                }
              }
              return pairs.map(([criterion1, criterion2]) => {
                const label1 = CRITERIA_LABELS[criterion1 as keyof typeof CRITERIA_LABELS];
                const label2 = CRITERIA_LABELS[criterion2 as keyof typeof CRITERIA_LABELS];
                
                return (
                  <Card key={`${criterion1}-${criterion2}`} sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
                      Which is more important?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          handlePairwiseComparison(criterion1, criterion2, criterion1);
                          // Add visual feedback
                          console.log(`Selected: ${label1} over ${label2}`);
                        }}
                        sx={{ flex: 1 }}
                      >
                        {label1}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          handlePairwiseComparison(criterion1, criterion2, criterion2);
                          // Add visual feedback
                          console.log(`Selected: ${label2} over ${label1}`);
                        }}
                        sx={{ flex: 1 }}
                      >
                        {label2}
                      </Button>
                    </Box>
                  </Card>
                );
              });
            })()}
          </Box>
        </Box>
      )}

      {/* Current Weights Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'black' }}>Current Weights Summary:</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
          {Object.entries(weights).map(([key, value]) => (
            <Chip
              key={key}
              label={`${CRITERIA_LABELS[key as keyof typeof CRITERIA_LABELS]}: ${value.toFixed(2)}`}
              variant="outlined"
              color={value > 0.7 ? 'success' : value > 0.4 ? 'warning' : 'default'}
            />
          ))}
        </Box>
      </Box>

      {/* Export Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={onExport}
          sx={{ 
            backgroundColor: '#28a745',
            '&:hover': { backgroundColor: '#218838' }
          }}
        >
          📤 Export Data & Rules
        </Button>
      </Box>
    </Box>
  );
};

export default PrioritizationPanel; 