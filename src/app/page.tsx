"use client";
import React, { useState, useCallback } from "react";
import { DataGrid, GridColDef, GridCellParams } from "@mui/x-data-grid";
import { Box, Typography, Collapse, Alert, TextField, Button, Tabs, Tab, Paper, IconButton } from "@mui/material";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { validateAll, ValidationResult } from "../utils/validation";
import CloseIcon from '@mui/icons-material/Close';
import { geminiNlpFilter } from "../utils/gemini";
import { geminiHeaderMap } from "../utils/geminiHeaderMap";
import { geminiSuggestFix } from "../utils/geminiSuggestFix";
import { geminiDataModifier } from "../utils/geminiDataModifier";
import RuleBuilder from "./components/RuleBuilder/RuleBuilder";

const DATASETS = ["clients", "workers", "tasks"] as const;
type Dataset = typeof DATASETS[number];

const REQUIRED_COLS: Record<Dataset, string[]> = {
  clients: ["ClientID", "ClientName", "PriorityLevel", "RequestedTaskIDs", "GroupTag", "AttributesJSON"],
  workers: ["WorkerID", "WorkerName", "Skills", "AvailableSlots", "MaxLoadPerPhase", "WorkerGroup", "QualificationLevel"],
  tasks: ["TaskID", "TaskName", "Category", "Duration", "RequiredSkills", "PreferredPhases", "MaxConcurrent"],
};

const FRIENDLY_NAMES: Record<Dataset, string> = {
  clients: "Clients",
  workers: "Workers",
  tasks: "Tasks",
};

function mapHeaders(row: Record<string, unknown>, dataset: Dataset) {
  const mapping: Record<string, string> = {};
  Object.keys(row).forEach((col) => {
    const match = REQUIRED_COLS[dataset].find(
      (req) => req.toLowerCase() === col.toLowerCase() || req.replace(/[^a-zA-Z]/g, '').toLowerCase() === col.replace(/[^a-zA-Z]/g, '').toLowerCase()
    );
    mapping[col] = match || col;
  });
  const mapped: Record<string, unknown> = {};
  Object.entries(row).forEach(([k, v]) => {
    mapped[mapping[k]] = v;
  });
  return mapped;
}

function parseFile(file: File, dataset: Dataset): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        quoteChar: '"',
        escapeChar: '"',
        complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
          console.log('Papa Parse results:', results);
          const data = results.data
            .filter((row: Record<string, unknown>) => Object.keys(row).some(key => row[key] !== ''))
            .map((row: Record<string, unknown>) => {
              const cleanRow: Record<string, unknown> = {};
              Object.keys(row).forEach(key => {
                if (!key.startsWith('__parsed_extra')) {
                  cleanRow[key] = row[key];
                }
              });
              return mapHeaders(cleanRow, dataset);
            });
          console.log('Parsed data:', data);
          resolve(data);
        },
        error: (error: unknown) => {
          console.error('Papa Parse error:', error);
          reject(error);
        },
      });
    } else if (file.name.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const mapped = (json as unknown[]).map((row: unknown) => mapHeaders(row as Record<string, unknown>, dataset));
        resolve(mapped);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
}

function getColumns(dataset: Dataset, rows: Record<string, unknown>[]): GridColDef[] {
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return allKeys.map((key) => ({
    field: key,
    headerName: key,
    width: 180,
    editable: true,
    flex: 1,
  }));
}

export default function Home() {
  const [tab, setTab] = useState<number>(0);
  const [files, setFiles] = useState<Partial<Record<Dataset, File>>>({});
  const [rawData, setRawData] = useState<Partial<Record<Dataset, Record<string, unknown>[]>>>({});
  const [data, setData] = useState<Partial<Record<Dataset, Record<string, unknown>[]>>>({});
  const [validation, setValidation] = useState<Partial<Record<Dataset, ValidationResult>>>({});
  const [showSummary, setShowSummary] = useState<Partial<Record<Dataset, boolean>>>({ clients: true, workers: true, tasks: true });
  const [search, setSearch] = useState<string>("");
  const [filtered, setFiltered] = useState<Partial<Record<Dataset, Record<string, unknown>[]>>>({});
  const [modifyCommand, setModifyCommand] = useState("");

  const onDrop = useCallback((dataset: Dataset) => async (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;
    setFiles((prev) => ({ ...prev, [dataset]: acceptedFiles[0] }));
    const file = acceptedFiles[0];
    if (file.name.endsWith(".csv")) {
      const headers = await extractHeadersFromFile(file);
      const required = REQUIRED_COLS[dataset];
      let mapping: Record<string, string | null> = {};
      try {
        mapping = await geminiHeaderMap(headers, required);
      } catch (e) {
        alert("Gemini header mapping failed: " + e);
        return;
      }
      const rows = await parseFileWithMapping(file, mapping);
      setRawData((prev) => ({ ...prev, [dataset]: rows }));
      setData((prev) => ({ ...prev, [dataset]: rows }));
    } else if (file.name.endsWith(".xlsx")) {
      parseFile(file, dataset).then((rows) => {
        setRawData((prev) => ({ ...prev, [dataset]: rows }));
        setData((prev) => ({ ...prev, [dataset]: rows }));
      });
    }
  }, []);

  React.useEffect(() => {
    if (data.clients && data.workers && data.tasks &&
      data.clients.length > 0 && data.workers.length > 0 && data.tasks.length > 0) {
      try {
        const result = validateAll({ clients: data.clients, workers: data.workers, tasks: data.tasks });
        setValidation(result);
      } catch (error) {
        console.error('Validation error:', error);
        setValidation({});
      }
    } else {
      setValidation({});
    }
  }, [data.clients, data.workers, data.tasks]);

  const handleProcessRowUpdate = (dataset: Dataset) => (newRow: Record<string, unknown>) => {
    setData((prev) => {
      const rows = prev[dataset]?.map((row, i) =>
        i === (newRow as { id: number }).id ? { ...row, ...newRow } : row
      ) || [];
      return { ...prev, [dataset]: rows };
    });
    return newRow;
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      setFiltered({});
      return;
    }
    const ds = DATASETS[tab];
    if (data[ds]) {
      try {
        const sample = data[ds]?.slice(0, 3) ?? [];
        console.log("Gemini data sample:", sample);
        const filterFn = await geminiNlpFilter(search, sample, ds);
        if (typeof filterFn !== "function") {
          throw new Error("geminiNlpFilter did not return a function");
        }
        setFiltered({ [ds]: data[ds]!.filter((row: Record<string, unknown>, idx: number, arr: Record<string, unknown>[]) => filterFn(row, idx, arr)) });
      } catch (e) {
        alert("Gemini NLP search failed: " + e);
        setFiltered({});
      }
    }
  };

  const handleSuggestFix = async (row: Record<string, unknown>, error: string) => {
    try {
      const fix = await geminiSuggestFix(row, error);
      alert("Gemini Suggestion:\n" + JSON.stringify(fix, null, 2));
    } catch (e) {
      alert("Gemini suggestion failed: " + e);
    }
  };

  const handleNlpModify = async () => {
    const ds = DATASETS[tab];
    if (data[ds]) {
      try {
        const mapFn = await geminiDataModifier(modifyCommand, data[ds]!, ds) as (row: Record<string, unknown>) => Record<string, unknown>;
        const newRows = data[ds]!.map(mapFn);
        setData((prev) => ({ ...prev, [ds]: newRows }));
        alert("Modification applied!");
      } catch (e) {
        alert("Gemini NLP modify failed: " + e);
      }
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1400, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>AI Resource Allocation Configurator</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">1. Upload Files (CSV/XLSX)</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {DATASETS.map((ds) => (
            <Box key={ds} sx={{ minWidth: 250 }}>
              <Typography variant="subtitle1">{FRIENDLY_NAMES[ds]}</Typography>
              <DropzoneArea file={files[ds]} onDrop={onDrop(ds)} />
              {rawData[ds] && (
                <Typography variant="caption" color="text.secondary">
                  {rawData[ds]?.length} rows loaded
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">2. Natural Language Search</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Type a query (e.g. Tasks with Duration > 1)"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSearch(); }}
            sx={{ minWidth: 400 }}
          />
          <Button variant="contained" onClick={handleSearch}>Search</Button>
        </Box>
      </Paper>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">NLP Data Modification</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            label="Type a modification command (e.g. Set all PriorityLevel to 5 for clients in group Alpha)"
            value={modifyCommand}
            onChange={e => setModifyCommand(e.target.value)}
            sx={{ minWidth: 400 }}
          />
          <Button variant="contained" onClick={handleNlpModify}>Apply</Button>
        </Box>
      </Paper>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {DATASETS.map((ds) => (
          <Tab key={ds} label={FRIENDLY_NAMES[ds]} />
        ))}
      </Tabs>
      {DATASETS.map((ds) => (
        <Collapse key={ds} in={tab === DATASETS.indexOf(ds)} mountOnEnter unmountOnExit>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="h6" sx={{ flex: 1 }}>{FRIENDLY_NAMES[ds]} Data</Typography>
              <Button size="small" onClick={() => setShowSummary(s => ({ ...s, [ds]: !s[ds] }))}>
                {showSummary[ds] ? "Hide" : "Show"} Validation Summary
              </Button>
            </Box>
            <Collapse in={!!showSummary[ds]}>
              <ValidationSummary result={validation[ds]} data={data[ds]} onSuggestFix={handleSuggestFix} />
            </Collapse>
            <Box sx={{ height: 400, width: "100%", mt: 2 }}>
              <DataGrid
                rows={((filtered[ds] ?? data[ds] ?? []) as Record<string, unknown>[]).map((row, i) => ({ id: i, ...row }))}
                columns={getColumns(ds, data[ds] ?? [])}
                processRowUpdate={handleProcessRowUpdate(ds) as (newRow: Record<string, unknown>) => Record<string, unknown>}
                getCellClassName={(params: GridCellParams<Record<string, unknown>>) =>
                  (validation[ds]?.errors.find(e => e.row === (typeof params.id === 'number' ? Number(params.id) + 1 : 0) && e.column === params.field)) ? "cell-error" : ""
                }
                sx={{
                  "& .cell-error": { backgroundColor: "#ffebee" },
                }}
                disableRowSelectionOnClick
              />
            </Box>
          </Paper>
        </Collapse>
      ))}
      <RuleBuilder />
    </Box>
  );
}

function DropzoneArea({ file, onDrop }: { file?: File, onDrop: (files: File[]) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    multiple: false,
  });
  return (
    <Box {...getRootProps()} sx={{ border: "2px dashed #aaa", p: 2, borderRadius: 2, textAlign: "center", cursor: "pointer", bgcolor: isDragActive ? "#f0f0f0" : undefined }}>
      <input {...getInputProps()} />
      {file ? (
        <Typography variant="body2">{file.name}</Typography>
      ) : (
        <Typography variant="body2">Drag & drop or click to upload .csv/.xlsx</Typography>
      )}
    </Box>
  );
}

function ValidationSummary({ result, data, onSuggestFix }: { result?: ValidationResult, data?: Record<string, unknown>[], onSuggestFix?: (row: Record<string, unknown>, error: string) => void }) {
  const [open, setOpen] = useState(true);
  if (!result || !result.errors.length) return <Alert severity="success">No validation errors!</Alert>;
  return (
    <Alert severity="error" action={
      <IconButton color="inherit" size="small" onClick={() => setOpen(false)}>
        <CloseIcon fontSize="inherit" />
      </IconButton>
    }>
      <Typography variant="subtitle2">Validation Errors ({result.errors.length})</Typography>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {result.errors.slice(0, open ? 10 : 0).map((e, i) => (
          <li key={i}>
            <b>Row {e.row}</b> [{e.column}]: {e.message}
            {onSuggestFix && data && data[e.row - 1] && (
              <Button size="small" sx={{ ml: 1 }} onClick={() => onSuggestFix(data[e.row - 1], e.message)}>
                Suggest Fix
              </Button>
            )}
          </li>
        ))}
        {result.errors.length > 10 && open && <li>...and {result.errors.length - 10} more</li>}
      </ul>
    </Alert>
  );
}

function extractHeadersFromFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      preview: 1,
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        resolve(Object.keys(results.data[0]));
      },
      error: reject,
    });
  });
}

function parseFileWithMapping(file: File, mapping: Record<string, string | null>): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
        const data = results.data.map((row: Record<string, unknown>) => {
          const remapped: Record<string, unknown> = {};
          Object.entries(mapping).forEach(([uploaded, required]) => {
            if (required && uploaded in row) {
              remapped[required] = row[uploaded];
            }
          });
          return remapped;
        });
        resolve(data);
      },
      error: reject,
    });
  });
}
