import React, { useState } from 'react';
import { Rule } from '@/store/useRulesStore';
import { ruleAI } from '@/utils/ruleAI';

interface RuleRecommendationsProps {
  onRuleAccepted: (rule: Rule) => void;
  onError: (error: string) => void;
  // Mock data for demonstration - in real app this would come from uploaded data
  mockData?: {
    tasks: unknown[];
    workers: unknown[];
    clients: unknown[];
  };
}

interface RuleRecommendation {
  id: string;
  type: Rule['type'];
  description: string;
  rule: Rule;
  confidence: number;
  reasoning: string;
}

const RuleRecommendations: React.FC<RuleRecommendationsProps> = ({
  onRuleAccepted,
  onError,
  mockData
}) => {
  const [recommendations, setRecommendations] = useState<RuleRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Mock data for demonstration
  const sampleData = mockData || {
    tasks: [
      { TaskID: 'T1', TaskName: 'Data Analysis', Category: 'Analytics' },
      { TaskID: 'T2', TaskName: 'Report Generation', Category: 'Analytics' },
      { TaskID: 'T3', TaskName: 'Customer Support', Category: 'Support' },
      { TaskID: 'T4', TaskName: 'Urgent Bug Fix', Category: 'Development' },
      { TaskID: 'T5', TaskName: 'Code Review', Category: 'Development' }
    ],
    workers: [
      { WorkerID: 'W1', WorkerName: 'Alice', WorkerGroup: 'Analytics', MaxLoadPerPhase: 2 },
      { WorkerID: 'W2', WorkerName: 'Bob', WorkerGroup: 'Analytics', MaxLoadPerPhase: 2 },
      { WorkerID: 'W3', WorkerName: 'Charlie', WorkerGroup: 'Support', MaxLoadPerPhase: 4 },
      { WorkerID: 'W4', WorkerName: 'Diana', WorkerGroup: 'Development', MaxLoadPerPhase: 3 }
    ],
    clients: [
      { ClientID: 'C1', ClientName: 'Premium Corp', GroupTag: 'Premium', PriorityLevel: 'High' },
      { ClientID: 'C2', ClientName: 'Standard Inc', GroupTag: 'Standard', PriorityLevel: 'Medium' }
    ]
  };

  const analyzeData = async () => {
    setIsAnalyzing(true);
    
    try {
      // Use the ruleAI service for recommendations
      const newRecommendations = await ruleAI.generateRecommendations(sampleData);
      setRecommendations(newRecommendations);
      setShowRecommendations(true);
    } catch {
      onError('Failed to analyze data for recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptRecommendation = (recommendation: RuleRecommendation) => {
    onRuleAccepted(recommendation.rule);
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  };

  const handleDismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  const handleRequestMore = async () => {
    setIsAnalyzing(true);
    
    try {
      // Generate additional recommendations using the AI service
      const additionalRecs = await ruleAI.generateRecommendations(sampleData);
      setRecommendations(prev => [...prev, ...additionalRecs]);
    } catch {
      onError('Failed to generate additional recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ 
      border: '2px solid #28a745', 
      borderRadius: 8, 
      padding: '1rem', 
      marginBottom: '1.5rem',
      backgroundColor: '#f8fff9'
    }}>
      <h3 style={{ marginTop: 0, color: '#28a745' }}>🧠 AI Rule Recommendations</h3>
      
      {!showRecommendations ? (
        <div>
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            Let AI analyze your data and suggest relevant rules based on patterns and best practices.
          </p>
          <button
            onClick={analyzeData}
            disabled={isAnalyzing}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: isAnalyzing ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: isAnalyzing ? 'not-allowed' : 'pointer'
            }}
          >
            {isAnalyzing ? '🔍 Analyzing Data...' : '🔍 Analyze Data for Recommendations'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: '#28a745' }}>
              💡 Found {recommendations.length} Recommendations
            </h4>
            <button
              onClick={() => setShowRecommendations(false)}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.875rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Hide
            </button>
          </div>

          {recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
              <p>No more recommendations available.</p>
              <button
                onClick={handleRequestMore}
                disabled={isAnalyzing}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: isAnalyzing ? '#6c757d' : '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: isAnalyzing ? 'not-allowed' : 'pointer'
                }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Request More Suggestions'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: 6,
                    padding: '1rem',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>
                        {rec.description}
                      </h5>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6c757d' }}>
                        <strong>Reasoning:</strong> {rec.reasoning}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6c757d' }}>
                        <strong>Confidence:</strong> {(rec.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleAcceptRecommendation(rec)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDismissRecommendation(rec.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RuleRecommendations; 