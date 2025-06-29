import { PrioritizationWeights } from '../app/components/Prioritization/PrioritizationPanel';
import { Rule } from '../store/useRulesStore';

export interface ExportConfig {
  clients: Record<string, unknown>[];
  workers: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  rules: Rule[];
  prioritization: PrioritizationWeights;
  metadata: {
    exportDate: string;
    totalRules: number;
    totalClients: number;
    totalWorkers: number;
    totalTasks: number;
  };
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that need quotes (contain commas, quotes, or newlines)
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRulesJSON(rules: Rule[], prioritization: PrioritizationWeights): void {
  const exportData = {
    rules,
    prioritization,
    metadata: {
      exportDate: new Date().toISOString(),
      totalRules: rules.length,
      version: '1.0'
    }
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'rules.json');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCompletePackage(
  clients: Record<string, unknown>[],
  workers: Record<string, unknown>[],
  tasks: Record<string, unknown>[],
  rules: Rule[],
  prioritization: PrioritizationWeights
): void {
  // Export individual CSV files
  exportToCSV(clients, 'clients_cleaned');
  exportToCSV(workers, 'workers_cleaned');
  exportToCSV(tasks, 'tasks_cleaned');
  
  // Export rules with prioritization
  exportRulesJSON(rules, prioritization);
  
  // Create a comprehensive export config
  const exportConfig: ExportConfig = {
    clients,
    workers,
    tasks,
    rules,
    prioritization,
    metadata: {
      exportDate: new Date().toISOString(),
      totalRules: rules.length,
      totalClients: clients.length,
      totalWorkers: workers.length,
      totalTasks: tasks.length
    }
  };

  // Export the complete configuration
  const jsonContent = JSON.stringify(exportConfig, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'complete_config.json');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  alert(`Successfully exported:
  - ${clients.length} clients to clients_cleaned.csv
  - ${workers.length} workers to workers_cleaned.csv
  - ${tasks.length} tasks to tasks_cleaned.csv
  - ${rules.length} rules to rules.json
  - Complete configuration to complete_config.json`);
}

export function validateExportData(
  clients: Record<string, unknown>[],
  workers: Record<string, unknown>[],
  tasks: Record<string, unknown>[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!clients || clients.length === 0) {
    errors.push('No clients data available for export');
  }

  if (!workers || workers.length === 0) {
    errors.push('No workers data available for export');
  }

  if (!tasks || tasks.length === 0) {
    errors.push('No tasks data available for export');
  }

  // Check for required fields
  if (clients && clients.length > 0) {
    const requiredClientFields = ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag'];
    const missingFields = requiredClientFields.filter(field => !(field in clients[0]));
    if (missingFields.length > 0) {
      errors.push(`Missing required client fields: ${missingFields.join(', ')}`);
    }
  }

  if (workers && workers.length > 0) {
    const requiredWorkerFields = ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup'];
    const missingFields = requiredWorkerFields.filter(field => !(field in workers[0]));
    if (missingFields.length > 0) {
      errors.push(`Missing required worker fields: ${missingFields.join(', ')}`);
    }
  }

  if (tasks && tasks.length > 0) {
    const requiredTaskFields = ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases'];
    const missingFields = requiredTaskFields.filter(field => !(field in tasks[0]));
    if (missingFields.length > 0) {
      errors.push(`Missing required task fields: ${missingFields.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 