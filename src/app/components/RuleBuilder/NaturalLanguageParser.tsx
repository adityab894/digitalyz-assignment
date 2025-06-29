import React, { useState } from 'react';
import { Rule } from '@/store/useRulesStore';
import { ruleAI } from '@/utils/ruleAI';

interface NaturalLanguageParserProps {
  onRuleGenerated: (rule: Rule) => void;
  onError: (error: string) => void;
  context?: {
    tasks: any[];
    workers: any[];
    clients: any[];
  };
}

const NaturalLanguageParser: React.FC<NaturalLanguageParserProps> = ({
  onRuleGenerated,
  onError,
  context
}) => {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedRules, setSuggestedRules] = useState<string[]>([
    "Tasks T1 and T2 must run together",
    "WorkerGroup Sales can only handle 3 slots per phase",
    "Task T5 can only run in phases 1, 2, or 3",
    "ClientGroup Premium needs at least 2 common slots",
    "Any task with 'urgent' in the name should use template A"
  ]);

  const parseNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) {
      onError('Please enter a rule description');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Use the ruleAI service for parsing
      const rule = await ruleAI.parseNaturalLanguage(naturalLanguageInput, context);
      onRuleGenerated(rule);
      setNaturalLanguageInput('');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to parse rule');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNaturalLanguageInput(suggestion);
  };

  return (
    <div style={{ 
      border: '2px solid #007bff', 
      borderRadius: 8, 
      padding: '1rem', 
      marginBottom: '1.5rem',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ marginTop: 0, color: '#007bff' }}>🤖 AI Natural Language Rule Parser</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="nlp-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: 'black' }}>
          Describe your rule in plain English:
        </label>
        <textarea
          id="nlp-input"
          value={naturalLanguageInput}
          onChange={(e) => setNaturalLanguageInput(e.target.value)}
          placeholder="e.g., Tasks T1 and T2 must run together"
          style={{
            width: '100%',
            minHeight: 80,
            padding: '0.75rem',
            borderRadius: 4,
            border: '1px solid #ccc',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
          disabled={isProcessing}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={parseNaturalLanguage}
          disabled={isProcessing || !naturalLanguageInput.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: isProcessing ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            marginRight: '1rem'
          }}
        >
          {isProcessing ? '🤖 Processing...' : '✨ Generate Rule'}
        </button>
        
        {isProcessing && (
          <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>
            AI is analyzing your description...
          </span>
        )}
      </div>

      <div>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>💡 Try these examples:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {suggestedRules.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                backgroundColor: '#e9ecef',
                color: '#495057',
                border: '1px solid #dee2e6',
                borderRadius: 4,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NaturalLanguageParser; 