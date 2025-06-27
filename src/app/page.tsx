"use client";
import React, { useState, useCallback } from "react";
import { DataGrid, GridColDef, GridCellParams, GridRowId } from "@mui/x-data-grid";
import { Box, Typography, Collapse, Alert, TextField, Button, Tabs, Tab, Paper, IconButton } from "@mui/material";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { validateAll, ValidationError, ValidationResult } from "../utils/validation";
import CloseIcon from '@mui/icons-material/Close';

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

function mapHeaders(row: Record<string, any>, dataset: Dataset) {
  const mapping: Record<string, string> = {};
  Object.keys(row).forEach((col) => {
    const match = REQUIRED_COLS[dataset].find(
      (req) => req.toLowerCase() === col.toLowerCase() || req.replace(/[^a-zA-Z]/g, '').toLowerCase() === col.replace(/[^a-zA-Z]/g, '').toLowerCase()
    );
    mapping[col] = match || col;
  });
  const mapped: Record<string, any> = {};
  Object.entries(row).forEach(([k, v]) => {
    mapped[mapping[k]] = v;
  });
  return mapped;
}

function parseFile(file: File, dataset: Dataset): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        quoteChar: '"',
        escapeChar: '"',
        complete: (results: Papa.ParseResult<any>) => {
          console.log('Papa Parse results:', results);
          const data = results.data
            .filter((row: any) => Object.keys(row).some(key => row[key] !== ''))
            .map((row: any) => {
              const cleanRow: any = {};
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
        error: (error: any) => {
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
        const mapped = json.map((row: any) => mapHeaders(row, dataset));
        resolve(mapped);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
}

function getColumns(dataset: Dataset, rows: any[]): GridColDef[] {
  const allKeys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return allKeys.map((key) => ({
    field: key,
    headerName: key,
    width: 180,
    editable: true,
    flex: 1,
  }));
}

function highlightCell(params: GridCellParams<any>, errors: ValidationError[]) {
  const err = errors.find((e) => e.row === (typeof params.id === 'number' ? Number(params.id) + 1 : 0) && e.column === params.field);
  return err ? { backgroundColor: "#ffebee" } : {};
}

export default function Home() {
  const [tab, setTab] = useState<number>(0);
  const [files, setFiles] = useState<Partial<Record<Dataset, File>>>({});
  const [rawData, setRawData] = useState<Partial<Record<Dataset, any[]>>>({});
  const [data, setData] = useState<Partial<Record<Dataset, any[]>>>({});
  const [validation, setValidation] = useState<Partial<Record<Dataset, ValidationResult>>>({});
  const [showSummary, setShowSummary] = useState<Partial<Record<Dataset, boolean>>>({ clients: true, workers: true, tasks: true });
  const [search, setSearch] = useState<string>("");
  const [filtered, setFiltered] = useState<Partial<Record<Dataset, any[]>>>({});


  const onDrop = useCallback((dataset: Dataset) => (acceptedFiles: File[]) => {
    if (!acceptedFiles[0]) return;
    console.log(`Uploading ${dataset} file:`, acceptedFiles[0].name);
    setFiles((prev) => ({ ...prev, [dataset]: acceptedFiles[0] }));
    parseFile(acceptedFiles[0], dataset).then((rows) => {
      console.log(`Parsed ${dataset} data:`, rows);
      setRawData((prev) => ({ ...prev, [dataset]: rows }));
      setData((prev) => ({ ...prev, [dataset]: rows }));
    }).catch((error) => {
      console.error(`Error parsing ${dataset} file:`, error);
    });
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

  const handleProcessRowUpdate = (dataset: Dataset) => (newRow: any, oldRow: any) => {
    setData((prev) => {
      const rows = prev[dataset]?.map((row, i) =>
        i === newRow.id ? { ...row, ...newRow } : row
      ) || [];
      return { ...prev, [dataset]: rows };
    });
    return newRow;
  };

  const handleSearch = () => {
    if (!search.trim()) {
      setFiltered({});
      return;
    }
    const newFiltered: Partial<Record<Dataset, any[]>> = {};
    DATASETS.forEach((ds) => {
      if (data[ds]) {
        newFiltered[ds] = data[ds]!.filter((row) =>
          Object.values(row).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))
        );
      }
    });
    setFiltered(newFiltered);
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
              <DropzoneArea dataset={ds} file={files[ds]} onDrop={onDrop(ds)} />
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
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {DATASETS.map((ds, i) => (
          <Tab key={ds} label={FRIENDLY_NAMES[ds]} />
        ))}
      </Tabs>
      {DATASETS.map((ds, i) => (
        <Collapse key={ds} in={tab === i} mountOnEnter unmountOnExit>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="h6" sx={{ flex: 1 }}>{FRIENDLY_NAMES[ds]} Data</Typography>
              <Button size="small" onClick={() => setShowSummary(s => ({ ...s, [ds]: !s[ds] }))}>
                {showSummary[ds] ? "Hide" : "Show"} Validation Summary
              </Button>
            </Box>
            <Collapse in={!!showSummary[ds]}>
              <ValidationSummary result={validation[ds]} />
            </Collapse>
            <Box sx={{ height: 400, width: "100%", mt: 2 }}>
              <DataGrid
                rows={(filtered[ds] ?? data[ds] ?? []).map((row, i) => ({ id: i, ...row }))}
                columns={getColumns(ds, data[ds] ?? [])}
                processRowUpdate={handleProcessRowUpdate(ds)}
                getCellClassName={(params: GridCellParams<any>) =>
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
    </Box>
  );
}

function DropzoneArea({ dataset, file, onDrop }: { dataset: Dataset, file?: File, onDrop: (files: File[]) => void }) {
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

function ValidationSummary({ result }: { result?: ValidationResult }) {
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
          <li key={i}><b>Row {e.row}</b> [{e.column}]: {e.message}</li>
        ))}
        {result.errors.length > 10 && open && <li>...and {result.errors.length - 10} more</li>}
      </ul>
    </Alert>
  );
}
