import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Rule =
  | { type: 'coRun'; tasks: string[] }
  | { type: 'slotRestriction'; group: string; minCommonSlots: number }
  | { type: 'loadLimit'; group: string; maxSlotsPerPhase: number }
  | { type: 'phaseWindow'; task: string; allowedPhases: number[] }
  | { type: 'patternMatch'; regex: string; template: string; params: Record<string, unknown> }
  | { type: 'precedenceOverride'; global: string[]; specific: string[]; priority: number };

interface RulesState {
  rules: Rule[];
  addRule: (rule: Rule) => void;
  updateRule: (index: number, rule: Rule) => void;
  deleteRule: (index: number) => void;
  clearRules: () => void;
  importRules: (rules: Rule[]) => void;
  exportRules: () => { rules: Rule[]; metadata: Record<string, unknown> };
  validateRule: (rule: Rule) => { isValid: boolean; errors: string[] };
}

export const useRulesStore = create<RulesState>()(
  persist(
    (set, get) => ({
      rules: [],
      
      addRule: (rule: Rule) => {
        const validation = get().validateRule(rule);
        if (!validation.isValid) {
          throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
        }
        set((state) => ({ rules: [...state.rules, rule] }));
      },
      
      updateRule: (index: number, rule: Rule) => {
        const validation = get().validateRule(rule);
        if (!validation.isValid) {
          throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
        }
        set((state) => ({
          rules: state.rules.map((r, i) => i === index ? rule : r)
        }));
      },
      
      deleteRule: (index: number) => {
        set((state) => ({
          rules: state.rules.filter((_, i) => i !== index)
        }));
      },
      
      clearRules: () => {
        set({ rules: [] });
      },
      
      importRules: (rules: Rule[]) => {
        // Validate all rules before importing
        const invalidRules = rules.filter(rule => !get().validateRule(rule).isValid);
        if (invalidRules.length > 0) {
          throw new Error(`Invalid rules found: ${invalidRules.length} rules failed validation`);
        }
        set({ rules });
      },
      
      exportRules: () => {
        const { rules } = get();
        return {
          rules,
          metadata: {
            generatedAt: new Date().toISOString(),
            totalRules: rules.length,
            ruleTypes: [...new Set(rules.map(rule => rule.type))]
          }
        };
      },
      
      validateRule: (rule: Rule) => {
        const errors: string[] = [];
        
        switch (rule.type) {
          case 'coRun':
            if (!rule.tasks || rule.tasks.length < 2) {
              errors.push('Co-run rule must have at least 2 tasks');
            }
            if (rule.tasks.some(task => !task.trim())) {
              errors.push('All tasks must have valid names');
            }
            break;
            
          case 'slotRestriction':
            if (!rule.group || !rule.group.trim()) {
              errors.push('Slot restriction rule must have a group');
            }
            if (!rule.minCommonSlots || rule.minCommonSlots < 1) {
              errors.push('Minimum common slots must be at least 1');
            }
            break;
            
          case 'loadLimit':
            if (!rule.group || !rule.group.trim()) {
              errors.push('Load limit rule must have a group');
            }
            if (!rule.maxSlotsPerPhase || rule.maxSlotsPerPhase < 1) {
              errors.push('Maximum slots per phase must be at least 1');
            }
            break;
            
          case 'phaseWindow':
            if (!rule.task || !rule.task.trim()) {
              errors.push('Phase window rule must have a task');
            }
            if (!rule.allowedPhases || rule.allowedPhases.length === 0) {
              errors.push('Phase window rule must have at least one allowed phase');
            }
            if (rule.allowedPhases.some(phase => phase < 1)) {
              errors.push('All phases must be positive numbers');
            }
            break;
            
          case 'patternMatch':
            if (!rule.regex || !rule.regex.trim()) {
              errors.push('Pattern match rule must have a regex pattern');
            }
            if (!rule.template || !rule.template.trim()) {
              errors.push('Pattern match rule must have a template');
            }
            // Validate regex syntax
            try {
              new RegExp(rule.regex);
            } catch {
              errors.push('Invalid regex pattern');
            }
            break;
            
          case 'precedenceOverride':
            if (!rule.global || rule.global.length === 0) {
              errors.push('Precedence override rule must have global rules');
            }
            if (!rule.specific || rule.specific.length === 0) {
              errors.push('Precedence override rule must have specific rules');
            }
            if (!rule.priority || rule.priority < 1) {
              errors.push('Priority must be at least 1');
            }
            break;
            
          default:
            errors.push('Unknown rule type');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      }
    }),
    {
      name: 'rules-storage',
      partialize: (state) => ({ rules: state.rules })
    }
  )
); 