export type ValidationError = {
  row: number;
  column: string;
  message: string;
  type: 'error' | 'warning';
};

export type ValidationResult = {
  errors: ValidationError[];
  summary: Record<string, number>;
};

type Row = Record<string, any>;

export function validateRequiredColumns(rows: Row[], required: string[]): ValidationError[] {
  if (!rows.length) return [];
  const missing: string[] = required.filter(col => !(col in rows[0]));
  if (missing.length === 0) return [];
  return missing.map(col => ({ row: 0, column: col, message: `Missing required column: ${col}`, type: 'error' }));
}

export function validateDuplicateIDs(rows: Row[], idCol: string): ValidationError[] {
  const seen = new Set();
  const errors: ValidationError[] = [];
  rows.forEach((row, i) => {
    const id = row[idCol];
    if (seen.has(id)) {
      errors.push({ row: i + 1, column: idCol, message: `Duplicate ID: ${id}`, type: 'error' });
    } else {
      seen.add(id);
    }
  });
  return errors;
}

export function validateNumericList(rows: Row[], col: string): ValidationError[] {
  const errors: ValidationError[] = [];
  rows.forEach((row, i) => {
    if (row[col]) {
      const vals = String(row[col]).split(/[,;]/).map(v => v.trim());
      if (vals.some(v => v && isNaN(Number(v)))) {
        errors.push({ row: i + 1, column: col, message: `Malformed numeric list in ${col}`, type: 'error' });
      }
    }
  });
  return errors;
}

export function validateRange(rows: Row[], col: string, min: number, max: number): ValidationError[] {
  const errors: ValidationError[] = [];
  rows.forEach((row, i) => {
    const val = Number(row[col]);
    if (isNaN(val) || val < min || val > max) {
      errors.push({ row: i + 1, column: col, message: `Value out of range (${min}-${max}) in ${col}`, type: 'error' });
    }
  });
  return errors;
}

export function validateJSON(rows: Row[], col: string): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!rows.length || !(col in rows[0])) {
    return errors;
  }
  rows.forEach((row, i) => {
    if (row[col]) {
      try {
        let jsonStr = String(row[col]);
        if (jsonStr.includes('{') && jsonStr.includes('}')) {
          const start = jsonStr.indexOf('{');
          const end = jsonStr.lastIndexOf('}') + 1;
          jsonStr = jsonStr.substring(start, end);
        }
        JSON.parse(jsonStr);
      } catch (error) {
        errors.push({ row: i + 1, column: col, message: `Malformed JSON in ${col}`, type: 'error' });
      }
    }
  });
  return errors;
}

export function validateReferences(rows: Row[], col: string, validIDs: Set<string>, delimiter = /[,;]/): ValidationError[] {
  const errors: ValidationError[] = [];
  rows.forEach((row, i) => {
    if (row[col]) {
      const ids = String(row[col]).split(delimiter).map((v: string) => v.trim());
      ids.forEach(id => {
        if (id && !validIDs.has(id)) {
          errors.push({ row: i + 1, column: col, message: `Unknown reference: ${id}`, type: 'error' });
        }
      });
    }
  });
  return errors;
}

export function validateGroupTags(rows: Row[], groupCol: string): ValidationError[] {
  const errors: ValidationError[] = [];
  rows.forEach((row, i) => {
    const group = row[groupCol];
    if (!group || String(group).trim() === '') {
      errors.push({ row: i + 1, column: groupCol, message: `Empty or invalid group tag`, type: 'error' });
    }
  });
  return errors;
}

export function validateCircularGroups(rows: Row[], idCol: string, groupCol: string): ValidationError[] {
  return [];
}

export function validateWorkerLoad(rows: Row[]): ValidationError[] {
  const errors: ValidationError[] = [];
  rows.forEach((row, i) => {
    const slots = String(row['AvailableSlots'] || '').split(/[,;]/).filter(Boolean);
    const maxLoad = Number(row['MaxLoadPerPhase']);
    if (slots.length < maxLoad) {
      errors.push({ row: i + 1, column: 'AvailableSlots', message: `Worker overloaded: AvailableSlots < MaxLoadPerPhase`, type: 'error' });
    }
  });
  return errors;
}

export function validateSkillCoverage(tasks: Row[], workers: Row[]): ValidationError[] {
  const allSkills = new Set<string>();
  workers.forEach(w => String(w['Skills'] || '').split(/[,;]/).forEach((s: string) => allSkills.add(s.trim())));
  const errors: ValidationError[] = [];
  tasks.forEach((task, i) => {
    const reqSkills = String(task['RequiredSkills'] || '').split(/[,;]/).map((s: string) => s.trim());
    reqSkills.forEach(skill => {
      if (skill && !allSkills.has(skill)) {
        errors.push({ row: i + 1, column: 'RequiredSkills', message: `Skill not covered by any worker: ${skill}`, type: 'error' });
      }
    });
  });
  return errors;
}

export function validateAll({ clients, workers, tasks }:{ clients: Row[], workers: Row[], tasks: Row[] }): Record<string, ValidationResult> {
  if (!clients?.length || !workers?.length || !tasks?.length) {
    return {
      clients: { errors: [], summary: {} },
      workers: { errors: [], summary: {} },
      tasks: { errors: [], summary: {} }
    };
  }
  const clientErrors = [
    ...validateRequiredColumns(clients, ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON']),
    ...validateDuplicateIDs(clients, 'ClientID'),
    ...validateRange(clients, 'PriorityLevel', 1, 5),
    ...validateJSON(clients, 'AttributesJSON'),
    ...validateGroupTags(clients, 'GroupTag'),
    ...validateReferences(clients, 'RequestedTaskIDs', new Set(tasks.map(t => t['TaskID'])))
  ];
  const workerErrors = [
    ...validateRequiredColumns(workers, ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel']),
    ...validateDuplicateIDs(workers, 'WorkerID'),
    ...validateNumericList(workers, 'AvailableSlots'),
    ...validateWorkerLoad(workers),
    ...validateGroupTags(workers, 'WorkerGroup')
  ];
  const taskErrors = [
    ...validateRequiredColumns(tasks, ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']),
    ...validateDuplicateIDs(tasks, 'TaskID'),
    ...validateRange(tasks, 'Duration', 1, Infinity),
    ...validateSkillCoverage(tasks, workers)
  ];
  const summarize = (errs: ValidationError[]) => errs.reduce((acc, e) => { acc[e.type] = (acc[e.type]||0)+1; return acc; }, {} as Record<string, number>);
  return {
    clients: { errors: clientErrors, summary: summarize(clientErrors) },
    workers: { errors: workerErrors, summary: summarize(workerErrors) },
    tasks: { errors: taskErrors, summary: summarize(taskErrors) }
  };
} 