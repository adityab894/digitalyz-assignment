import { Rule } from '@/store/useRulesStore';

// Mock AI service - in production this would use the actual Gemini API
export class RuleAIService {
  private static instance: RuleAIService;
  
  static getInstance(): RuleAIService {
    if (!RuleAIService.instance) {
      RuleAIService.instance = new RuleAIService();
    }
    return RuleAIService.instance;
  }

  async parseNaturalLanguage(input: string, context?: Record<string, unknown>): Promise<Rule> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Enhanced parsing with context awareness
    if (context?.tasks) {
      // Use context data for better parsing
      return this.parseWithContext(input, context);
    }
    
    // Fallback to basic parsing
    return this.parseBasic(input);
  }

  private parseWithContext(input: string, context: Record<string, unknown>): Rule {
    const lowerInput = input.toLowerCase();
    
    // Co-run with context
    if (lowerInput.includes('run together') || lowerInput.includes('co-run')) {
      const taskMatches = input.match(/T\d+/g);
      if (taskMatches && taskMatches.length >= 2) {
        // Validate tasks exist in context
        const validTasks = taskMatches.filter(taskId => 
          (context.tasks as unknown[]).some((t) => (t as Record<string, unknown>).TaskID === taskId)
        );
        if (validTasks.length >= 2) {
          return {
            type: 'coRun',
            tasks: validTasks
          };
        }
      }
    }
    
    // Load-limit with context
    if (lowerInput.includes('slots per phase') || lowerInput.includes('max slots')) {
      const groupMatch = input.match(/(?:WorkerGroup|group)\s+(\w+)/i);
      const slotMatch = input.match(/(\d+)\s*(?:slots?|slot)/i);
      
      if (groupMatch && slotMatch) {
        const groupName = groupMatch[1];
        // Validate group exists in context
        const groupExists = (context.workers as unknown[]).some((w) => (w as Record<string, unknown>).WorkerGroup === groupName);
        if (groupExists) {
          return {
            type: 'loadLimit',
            group: groupName,
            maxSlotsPerPhase: parseInt(slotMatch[1])
          };
        }
      }
    }
    
    // Fallback to basic parsing
    return this.parseBasic(input);
  }

  private parseBasic(input: string): Rule {
    const lowerInput = input.toLowerCase();
    
    // Co-run rules
    if (lowerInput.includes('run together') || lowerInput.includes('co-run') || lowerInput.includes('must run together')) {
      const taskMatches = input.match(/T\d+/g);
      if (taskMatches && taskMatches.length >= 2) {
        return {
          type: 'coRun',
          tasks: taskMatches
        };
      }
      throw new Error('Could not identify tasks for co-run rule. Please specify TaskIDs like T1, T2, etc.');
    }
    
    // Load-limit rules
    if (lowerInput.includes('slots per phase') || lowerInput.includes('max slots') || lowerInput.includes('can only handle')) {
      const groupMatch = input.match(/(?:WorkerGroup|group)\s+(\w+)/i);
      const slotMatch = input.match(/(\d+)\s*(?:slots?|slot)/i);
      
      if (groupMatch && slotMatch) {
        return {
          type: 'loadLimit',
          group: groupMatch[1],
          maxSlotsPerPhase: parseInt(slotMatch[1])
        };
      }
      throw new Error('Could not identify worker group and slot limit. Please specify like "WorkerGroup Sales can only handle 3 slots per phase"');
    }
    
    // Phase-window rules
    if (lowerInput.includes('phase') && (lowerInput.includes('only') || lowerInput.includes('allowed'))) {
      const taskMatch = input.match(/T\d+/);
      const phaseMatches = input.match(/(\d+)/g);
      
      if (taskMatch && phaseMatches) {
        const phases = phaseMatches.map(p => parseInt(p)).filter(p => p > 0);
        if (phases.length > 0) {
          return {
            type: 'phaseWindow',
            task: taskMatch[0],
            allowedPhases: phases
          };
        }
      }
      throw new Error('Could not identify task and phases. Please specify like "Task T5 can only run in phases 1, 2, or 3"');
    }
    
    // Slot-restriction rules
    if (lowerInput.includes('common slots') || lowerInput.includes('minimum slots')) {
      const groupMatch = input.match(/(?:ClientGroup|WorkerGroup|group)\s+(\w+)/i);
      const slotMatch = input.match(/(\d+)\s*(?:common\s+)?slots?/i);
      
      if (groupMatch && slotMatch) {
        return {
          type: 'slotRestriction',
          group: groupMatch[1],
          minCommonSlots: parseInt(slotMatch[1])
        };
      }
      throw new Error('Could not identify group and slot requirement. Please specify like "ClientGroup Premium needs at least 2 common slots"');
    }
    
    // Pattern-match rules
    if (lowerInput.includes('regex') || lowerInput.includes('pattern') || lowerInput.includes('template')) {
      const regexMatch = input.match(/['"`]([^'"`]+)['"`]/);
      const templateMatch = input.match(/template\s+(\w+)/i);
      
      if (regexMatch && templateMatch) {
        return {
          type: 'patternMatch',
          regex: regexMatch[1],
          template: templateMatch[1],
          params: {}
        };
      }
      throw new Error('Could not identify regex pattern and template. Please specify like "Any task with \'urgent\' in the name should use template A"');
    }
    
    // Precedence override rules
    if (lowerInput.includes('precedence') || lowerInput.includes('priority')) {
      const globalMatch = input.match(/global\s+rules?:\s*([^.]+)/i);
      const specificMatch = input.match(/specific\s+rules?:\s*([^.]+)/i);
      const priorityMatch = input.match(/priority\s*(\d+)/i);
      
      if (globalMatch && specificMatch && priorityMatch) {
        const global = globalMatch[1].split(/[,\s]+/).filter(Boolean);
        const specific = specificMatch[1].split(/[,\s]+/).filter(Boolean);
        
        return {
          type: 'precedenceOverride',
          global,
          specific,
          priority: parseInt(priorityMatch[1])
        };
      }
      throw new Error('Could not identify precedence rules. Please specify global rules, specific rules, and priority.');
    }
    
    throw new Error('Could not understand the rule description. Please try a different format or use the structured form.');
  }

  async generateRecommendations(data: Record<string, unknown>): Promise<Array<{
    id: string;
    type: Rule['type'];
    description: string;
    rule: Rule;
    confidence: number;
    reasoning: string;
  }>> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recommendations = [];
    
    // Analyze task patterns
    if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
      const taskCategories = this.groupBy(data.tasks as Record<string, unknown>[], 'Category');
      
      // Co-run recommendations for same category tasks
      Object.entries(taskCategories).forEach(([category, tasks]: [string, Record<string, unknown>[]]) => {
        if (tasks.length >= 2) {
          recommendations.push({
            id: `rec-${Date.now()}-${category}`,
            type: 'coRun' as const,
            description: `${category} tasks often have dependencies. Consider co-running ${tasks.slice(0, 2).map((t: Record<string, unknown>) => t.TaskID).join(' and ')}`,
            rule: {
              type: 'coRun',
              tasks: tasks.slice(0, 2).map((t: Record<string, unknown>) => t.TaskID as string)
            },
            confidence: 0.85,
            reasoning: `Found ${tasks.length} ${category} tasks that typically have dependencies`
          });
        }
      });
      
      // Pattern matching for urgent tasks
      const urgentTasks = data.tasks.filter((t: Record<string, unknown>) => 
        (t.TaskName as string).toLowerCase().includes('urgent') || 
        (t.Category as string) === 'Development'
      );
      if (urgentTasks.length > 0) {
        recommendations.push({
          id: `rec-${Date.now()}-urgent`,
          type: 'patternMatch' as const,
          description: 'Urgent tasks detected. Add pattern matching rule for priority handling',
          rule: {
            type: 'patternMatch' as const,
            regex: '.*urgent.*',
            template: 'templateA',
            params: { priority: 'high' }
          },
          confidence: 0.72,
          reasoning: `Found ${urgentTasks.length} tasks that might need special handling`
        });
      }
    }
    
    // Analyze worker patterns
    if (data.workers && Array.isArray(data.workers) && data.workers.length > 0) {
      const workerGroups = this.groupBy(data.workers as Record<string, unknown>[], 'WorkerGroup');
      
      Object.entries(workerGroups).forEach(([group, workers]: [string, Record<string, unknown>[]]) => {
        const avgLoad = workers.reduce((sum: number, w: Record<string, unknown>) => sum + (w.MaxLoadPerPhase as number || 0), 0) / workers.length;
        if (avgLoad > 3) {
          recommendations.push({
            id: `rec-${Date.now()}-${group}`,
            type: 'loadLimit' as const,
            description: `${group} workers are overloaded. Consider setting a load limit`,
            rule: {
              type: 'loadLimit',
              group,
              maxSlotsPerPhase: Math.floor(avgLoad * 0.8)
            },
            confidence: 0.78,
            reasoning: `${group} workers average ${avgLoad.toFixed(1)} slots per phase, which is high`
          });
        }
      });
    }
    
    // Analyze client patterns
    if (data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
      const clientGroups = this.groupBy(data.clients as Record<string, unknown>[], 'GroupTag');
      
      Object.entries(clientGroups).forEach(([group, clients]: [string, Record<string, unknown>[]]) => {
        if (group.toLowerCase().includes('premium') || group.toLowerCase().includes('vip')) {
          recommendations.push({
            id: `rec-${Date.now()}-${group}`,
            type: 'slotRestriction' as const,
            description: `${group} clients detected. Consider slot restrictions for guaranteed service`,
            rule: {
              type: 'slotRestriction',
              group,
              minCommonSlots: 2
            },
            confidence: 0.68,
            reasoning: `${clients.length} ${group} clients may need guaranteed slots`
          });
        }
      });
    }
    
    return recommendations;
  }

  private groupBy(array: Record<string, unknown>[], key: string): Record<string, Record<string, unknown>[]> {
    return array.reduce((groups: Record<string, Record<string, unknown>[]>, item) => {
      const group = item[key] as string;
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}

// Export singleton instance
export const ruleAI = RuleAIService.getInstance(); 