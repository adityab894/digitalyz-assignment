import React, { useState, useRef } from 'react';
import { useRulesStore, Rule } from '@/store/useRulesStore';
import NaturalLanguageParser from './NaturalLanguageParser';
import RuleRecommendations from './RuleRecommendations';

const RULE_TYPE_LABELS: Record<string, string> = {
  coRun: 'Co-run',
  slotRestriction: 'Slot-restriction',
  loadLimit: 'Load-limit',
  phaseWindow: 'Phase-window',
  patternMatch: 'Pattern-match',
  precedenceOverride: 'Precedence override',
};

const RuleBuilder = () => {
  const { 
    rules, 
    addRule, 
    updateRule, 
    deleteRule, 
    clearRules, 
    importRules, 
    exportRules
  } = useRulesStore();
  
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [coRunTasks, setCoRunTasks] = useState<string>('');
  const [slotRestrictionGroup, setSlotRestrictionGroup] = useState<string>('');
  const [minCommonSlots, setMinCommonSlots] = useState<string>('');
  const [loadLimitGroup, setLoadLimitGroup] = useState<string>('');
  const [maxSlotsPerPhase, setMaxSlotsPerPhase] = useState<string>('');
  const [phaseWindowTask, setPhaseWindowTask] = useState<string>('');
  const [allowedPhases, setAllowedPhases] = useState<string>('');
  const [patternRegex, setPatternRegex] = useState<string>('');
  const [patternTemplate, setPatternTemplate] = useState<string>('');
  const [patternParams, setPatternParams] = useState<string>('');
  const [globalRules, setGlobalRules] = useState<string>('');
  const [specificRules, setSpecificRules] = useState<string>('');
  const [priorityOrder, setPriorityOrder] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearForm = () => {
    setCoRunTasks('');
    setSlotRestrictionGroup('');
    setMinCommonSlots('');
    setLoadLimitGroup('');
    setMaxSlotsPerPhase('');
    setPhaseWindowTask('');
    setAllowedPhases('');
    setPatternRegex('');
    setPatternTemplate('');
    setPatternParams('');
    setGlobalRules('');
    setSpecificRules('');
    setPriorityOrder('');
    setEditingIndex(null);
    setValidationErrors([]);
  };

  const handleEditRule = (rule: Rule, index: number) => {
    setEditingIndex(index);
    setSelectedRuleType(rule.type);
    
    switch (rule.type) {
      case 'coRun':
        setCoRunTasks(rule.tasks.join(', '));
        break;
      case 'slotRestriction':
        setSlotRestrictionGroup(rule.group);
        setMinCommonSlots(rule.minCommonSlots.toString());
        break;
      case 'loadLimit':
        setLoadLimitGroup(rule.group);
        setMaxSlotsPerPhase(rule.maxSlotsPerPhase.toString());
        break;
      case 'phaseWindow':
        setPhaseWindowTask(rule.task);
        setAllowedPhases(rule.allowedPhases.join(', '));
        break;
      case 'patternMatch':
        setPatternRegex(rule.regex);
        setPatternTemplate(rule.template);
        setPatternParams(JSON.stringify(rule.params, null, 2));
        break;
      case 'precedenceOverride':
        setGlobalRules(rule.global.join(', '));
        setSpecificRules(rule.specific.join(', '));
        setPriorityOrder(rule.priority.toString());
        break;
    }
  };

  const handleDeleteRule = (index: number) => {
    deleteRule(index);
    if (editingIndex === index) {
      clearForm();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleSaveRule = (newRule: Rule) => {
    try {
      if (editingIndex !== null) {
        updateRule(editingIndex, newRule);
        clearForm();
      } else {
        addRule(newRule);
        clearForm();
      }
    } catch (error) {
      if (error instanceof Error) {
        setValidationErrors([error.message]);
      }
    }
  };

  const handleAIGeneratedRule = (rule: Rule) => {
    try {
      addRule(rule);
      setValidationErrors([]);
    } catch (error) {
      if (error instanceof Error) {
        setValidationErrors([error.message]);
      }
    }
  };

  const handleAIError = (error: string) => {
    setValidationErrors([error]);
  };

  const handleAddCoRunRule = () => {
    const tasks = coRunTasks
      .split(/[,\s]+/)
      .map(t => t.trim())
      .filter(Boolean);
    if (tasks.length < 2) {
      setValidationErrors(['Please enter at least two TaskIDs.']);
      return;
    }
    handleSaveRule({ type: 'coRun', tasks });
  };

  const handleAddSlotRestrictionRule = () => {
    if (!slotRestrictionGroup.trim()) {
      setValidationErrors(['Please enter a group name.']);
      return;
    }
    const slots = parseInt(minCommonSlots);
    if (isNaN(slots) || slots < 1) {
      setValidationErrors(['Please enter a valid minimum number of common slots (at least 1).']);
      return;
    }
    handleSaveRule({ type: 'slotRestriction', group: slotRestrictionGroup.trim(), minCommonSlots: slots });
  };

  const handleAddLoadLimitRule = () => {
    if (!loadLimitGroup.trim()) {
      setValidationErrors(['Please enter a WorkerGroup name.']);
      return;
    }
    const slots = parseInt(maxSlotsPerPhase);
    if (isNaN(slots) || slots < 1) {
      setValidationErrors(['Please enter a valid maximum number of slots per phase (at least 1).']);
      return;
    }
    handleSaveRule({ type: 'loadLimit', group: loadLimitGroup.trim(), maxSlotsPerPhase: slots });
  };

  const handleAddPhaseWindowRule = () => {
    if (!phaseWindowTask.trim()) {
      setValidationErrors(['Please enter a TaskID.']);
      return;
    }
    const phases = allowedPhases
      .split(/[,\s]+/)
      .map(p => parseInt(p.trim()))
      .filter(p => !isNaN(p) && p > 0);
    if (phases.length === 0) {
      setValidationErrors(['Please enter at least one valid phase number.']);
      return;
    }
    handleSaveRule({ type: 'phaseWindow', task: phaseWindowTask.trim(), allowedPhases: phases });
  };

  const handleAddPatternMatchRule = () => {
    if (!patternRegex.trim()) {
      setValidationErrors(['Please enter a regex pattern.']);
      return;
    }
    if (!patternTemplate.trim()) {
      setValidationErrors(['Please select a rule template.']);
      return;
    }
    let params: Record<string, unknown> = {};
    try {
      params = JSON.parse(patternParams);
    } catch {
      setValidationErrors(['Please enter valid JSON for parameters.']);
      return;
    }
    handleSaveRule({ type: 'patternMatch', regex: patternRegex.trim(), template: patternTemplate.trim(), params });
  };

  const handleAddPrecedenceOverrideRule = () => {
    const global = globalRules
      .split(/[,\s]+/)
      .map(r => r.trim())
      .filter(Boolean);
    const specific = specificRules
      .split(/[,\s]+/)
      .map(r => r.trim())
      .filter(Boolean);
    const priority = parseInt(priorityOrder);
    if (isNaN(priority) || priority < 1) {
      setValidationErrors(['Please enter a valid priority order (at least 1).']);
      return;
    }
    handleSaveRule({ type: 'precedenceOverride', global, specific, priority });
  };

  const getButtonText = (ruleType: string) => {
    return editingIndex !== null ? `Update ${RULE_TYPE_LABELS[ruleType]} Rule` : `Add ${RULE_TYPE_LABELS[ruleType]} Rule`;
  };

  const handleGenerateRulesConfig = () => {
    if (rules.length === 0) {
      alert('No rules to export. Please add at least one rule first.');
      return;
    }

    const rulesConfig = exportRules();
    const jsonContent = JSON.stringify(rulesConfig, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rules.json';
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`Successfully exported ${rules.length} rules to rules.json`);
  };

  const handleImportRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        const rulesToImport = data.rules || data;
        
        if (Array.isArray(rulesToImport)) {
          importRules(rulesToImport);
          alert(`Successfully imported ${rulesToImport.length} rules`);
        } else {
          alert('Invalid file format. Expected an array of rules or a rules configuration object.');
        }
      } catch {
        alert('Error importing rules: Invalid JSON file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllRules = () => {
    if (rules.length === 0) {
      alert('No rules to clear.');
      return;
    }
    
    if (confirm(`Are you sure you want to delete all ${rules.length} rules?`)) {
      clearRules();
      clearForm();
      alert('All rules have been cleared.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, fontFamily: 'Arial, Helvetica, sans-serif', margin: '0 auto' }}>
      <h1>Rule Builder</h1>
      
      {/* AI Features Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#007bff', marginBottom: '1rem' }}>🤖 AI-Powered Features</h2>
        
        {/* Natural Language Parser */}
        <NaturalLanguageParser 
          onRuleGenerated={handleAIGeneratedRule}
          onError={handleAIError}
        />
        
        {/* Rule Recommendations */}
        <RuleRecommendations 
          onRuleAccepted={handleAIGeneratedRule}
          onError={handleAIError}
        />
      </section>
      
      {/* Import/Export Controls */}
      <section style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportRules}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Import Rules
        </button>
        <button
          onClick={handleClearAllRules}
          disabled={rules.length === 0}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            backgroundColor: rules.length === 0 ? '#6c757d' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: rules.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Clear All Rules
        </button>
      </section>
      
      {editingIndex !== null && (
        <div style={{ 
          backgroundColor: 'black', 
          border: '1px solidrgb(244, 241, 233)', 
          padding: '0.75rem', 
          borderRadius: 8, 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span><strong>Editing Rule #{editingIndex + 1}</strong></span>
          <button 
            onClick={clearForm}
            style={{ 
              padding: '0.25rem 0.75rem', 
              fontSize: '0.875rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          color: '#721c24',
          padding: '0.75rem',
          borderRadius: 8,
          marginBottom: '1rem'
        }}>
          <strong>Validation Errors:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Manual Rule Builder Section */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#6c757d', marginBottom: '1rem' }}>📝 Manual Rule Builder</h2>
        
        {/* Rule Type Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="rule-type">Rule Type:</label>
          <select
            id="rule-type"
            style={{ marginLeft: '1rem', backgroundColor: 'black', color: 'white' }}
            value={selectedRuleType}
            onChange={e => {
              setSelectedRuleType(e.target.value);
              if (editingIndex !== null) {
                clearForm();
              }
            }}
          >
            <option value="">Select a rule type</option>
            <option value="coRun">Co-run</option>
            <option value="slotRestriction">Slot-restriction</option>
            <option value="loadLimit">Load-limit</option>
            <option value="phaseWindow">Phase-window</option>
            <option value="patternMatch">Pattern-match</option>
            <option value="precedenceOverride">Precedence override</option>
          </select>
        </div>

        {/* Dynamic Rule Form */}
        <div style={{ border: '1px dashed #ccc', padding: '1rem', borderRadius: 8 }}>
          {selectedRuleType === 'coRun' ? (
            <div>
              <label htmlFor="coRunTasks"><strong>TaskIDs (comma or space separated):</strong></label>
              <input
                id="coRunTasks"
                type="text"
                value={coRunTasks}
                onChange={e => setCoRunTasks(e.target.value)}
                placeholder="e.g. T1, T2, T3"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button
                onClick={handleAddCoRunRule}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}
              >
                {getButtonText('coRun')}
              </button>
            </div>
          ) : selectedRuleType === 'slotRestriction' ? (
            <div>
              <label htmlFor="slotRestrictionGroup"><strong>ClientGroup or WorkerGroup:</strong></label>
              <input
                id="slotRestrictionGroup"
                type="text"
                value={slotRestrictionGroup}
                onChange={e => setSlotRestrictionGroup(e.target.value)}
                placeholder="e.g. ClientGroupA or WorkerGroupB"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <label htmlFor="minCommonSlots"><strong>Minimum Common Slots:</strong></label>
              <input
                id="minCommonSlots"
                type="number"
                value={minCommonSlots}
                onChange={e => setMinCommonSlots(e.target.value)}
                placeholder="e.g. 2"
                min="1"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button
                onClick={handleAddSlotRestrictionRule}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}
              >
                {getButtonText('slotRestriction')}
              </button>
            </div>
          ) : selectedRuleType === 'loadLimit' ? (
            <div>
              <label htmlFor="loadLimitGroup"><strong>WorkerGroup:</strong></label>
              <input
                id="loadLimitGroup"
                type="text"
                value={loadLimitGroup}
                onChange={e => setLoadLimitGroup(e.target.value)}
                placeholder="e.g. WorkerGroupA"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <label htmlFor="maxSlotsPerPhase"><strong>Maximum Slots Per Phase:</strong></label>
              <input
                id="maxSlotsPerPhase"
                type="number"
                value={maxSlotsPerPhase}
                onChange={e => setMaxSlotsPerPhase(e.target.value)}
                placeholder="e.g. 3"
                min="1"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button
                onClick={handleAddLoadLimitRule}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}
              >
                {getButtonText('loadLimit')}
              </button>
            </div>
          ) : selectedRuleType === 'phaseWindow' ? (
            <div>
              <label htmlFor="phaseWindowTask"><strong>TaskID:</strong></label>
              <input
                id="phaseWindowTask"
                type="text"
                value={phaseWindowTask}
                onChange={e => setPhaseWindowTask(e.target.value)}
                placeholder="e.g. T1"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <label htmlFor="allowedPhases"><strong>Allowed Phases (comma or space separated):</strong></label>
              <input
                id="allowedPhases"
                type="text"
                value={allowedPhases}
                onChange={e => setAllowedPhases(e.target.value)}
                placeholder="e.g. 1, 2, 3"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button
                onClick={handleAddPhaseWindowRule}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}
              >
                {getButtonText('phaseWindow')}
              </button>
            </div>
          ) : selectedRuleType === 'patternMatch' ? (
            <div>
              <label htmlFor="patternRegex"><strong>Regex Pattern:</strong></label>
              <input
                id="patternRegex"
                type="text"
                value={patternRegex}
                onChange={e => setPatternRegex(e.target.value)}
                placeholder="e.g. .*urgent.*"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <label htmlFor="patternTemplate"><strong>Rule Template:</strong></label>
              <select
                id="patternTemplate"
                value={patternTemplate}
                onChange={e => setPatternTemplate(e.target.value)}
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select a template</option>
                <option value="templateA">Template A</option>
                <option value="templateB">Template B</option>
                <option value="templateC">Template C</option>
              </select>
              <label htmlFor="patternParams"><strong>Parameters (JSON):</strong></label>
              <textarea
                id="patternParams"
                value={patternParams}
                onChange={e => setPatternParams(e.target.value)}
                placeholder='{"key": "value"}'
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }}
              />
              <button
                onClick={handleAddPatternMatchRule}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}
              >
                {getButtonText('patternMatch')}
              </button>
            </div>
          ) : selectedRuleType === 'precedenceOverride' ? (
            <div>
              <label htmlFor="globalRules"><strong>Global Rules (comma or space separated):</strong></label>
              <input
                id="globalRules"
                type="text"
                value={globalRules}
                onChange={e => setGlobalRules(e.target.value)}
                placeholder="e.g. rule1, rule2"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <label htmlFor="specificRules"><strong>Specific Rules (comma or space separated):</strong></label>
              <input
                id="specificRules"
                type="text"
                value={specificRules}
                onChange={e => setSpecificRules(e.target.value)}
                placeholder="e.g. rule3, rule4"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <label htmlFor="priorityOrder"><strong>Priority Order:</strong></label>
              <input
                id="priorityOrder"
                type="number"
                value={priorityOrder}
                onChange={e => setPriorityOrder(e.target.value)}
                placeholder="e.g. 1"
                min="1"
                style={{ width: '100%', marginTop: 8, marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              />
              <button
                onClick={handleAddPrecedenceOverrideRule}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem' }}
              >
                {getButtonText('precedenceOverride')}
              </button>
            </div>
          ) : selectedRuleType ? (
            <strong>Selected: {RULE_TYPE_LABELS[selectedRuleType]}</strong>
          ) : (
            <em>Rule form will appear here based on selected type.</em>
          )}
        </div>
      </section>

      {/* Current Rules List */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Current Rules ({rules.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rules.length === 0 ? (
            <li><em>No rules added yet.</em></li>
          ) : (
            rules.map((rule: unknown, idx: number) => {
              const typedRule = rule as Rule;
              return (
                <li key={idx} style={{ 
                  marginBottom: 12, 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: 8,
                  backgroundColor: editingIndex === idx ? '#f8f9fa' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 , color: 'black'}}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>{RULE_TYPE_LABELS[typedRule.type]} Rule #{idx + 1}</strong>
                    </div>
                    <code style={{ fontSize: '0.875rem' }}>{JSON.stringify(typedRule, null, 2)}</code>
                  </div>
                  <div style={{ marginLeft: 12 }}>
                    <button
                      onClick={() => handleEditRule(typedRule, idx)}
                      style={{ 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.875rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRule(idx)}
                      style={{ 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.875rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Generate Rules Config Button */}
      <button 
        onClick={handleGenerateRulesConfig}
        disabled={rules.length === 0}
        style={{ 
          padding: '0.75rem 2rem', 
          fontSize: '1rem',
          backgroundColor: rules.length === 0 ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: rules.length === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        Generate Rules Config ({rules.length} rules)
      </button>
    </div>
  );
};

export default RuleBuilder; 