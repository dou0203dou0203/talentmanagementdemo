import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { userMutations } from '../lib/saveHelper';
import * as XLSX from 'xlsx';
import type { User, Qualification } from '../types';

// ===== Column definitions =====
type ColKey = 'name'|'gender'|'birth_date'|'facility'|'occupation'|'position'|'employment_type'|'address'|'phone'|'hire_date'|'qualifications'|'notes'|'health_check_date'|'status'|'role'|'work_pattern'|'corporation'|'resignation_date'|'resignation_reason'|'mental'|'motivation'|'eval_score';

const ALL_COLUMNS: {key:ColKey;label:string;default:boolean;exportOnly?:boolean}[] = [
  {key:'name',label:'氏名',default:true},
  {key:'gender',label:'性別',default:true},
  {key:'birth_date',label:'生年月日',default:true},
  {key:'facility',label:'所属',default:true},
  {key:'occupation',label:'職種',default:true},
  {key:'position',label:'役職',default:true},
  {key:'employment_type',label:'雇用形態',default:true},
  {key:'address',label:'住所',default:false},
  {key:'phone',label:'連絡先',default:false},
  {key:'hire_date',label:'雇用年月日',default:true},
  {key:'qualifications',label:'保有資格',default:true},
  {key:'notes',label:'備考',default:false},
  {key:'health_check_date',label:'健康診断時期',default:true},
  {key:'status',label:'ステータス',default:false},
  {key:'role',label:'権限',default:false},
  {key:'work_pattern',label:'勤務形態',default:false},
  {key:'corporation',label:'法人',default:false},
  {key:'resignation_date',label:'離職日',default:false},
  {key:'resignation_reason',label:'離職理由',default:false},
  {key:'mental',label:'メンタルスコア',default:false,exportOnly:true},
  {key:'motivation',label:'モチベーション',default:false,exportOnly:true},
  {key:'eval_score',label:'評価スコア',default:false,exportOnly:true},
];

// インポート対象の列（必須項目順）
const IMPORT_COLUMNS: {key:string;label:string;required:boolean}[] = [
  {key:'name',label:'氏名',required:true},
  {key:'gender',label:'性別',required:false},
  {key:'birth_date',label:'生年月日',required:false},
  {key:'facility',label:'所属',required:false},
  {key:'occupation',label:'職種',required:false},
  {key:'position',label:'役職',required:false},
  {key:'employment_type',label:'雇用形態',required:false},
  {key:'address',label:'住所',required:false},
  {key:'phone',label:'連絡先',required:false},
  {key:'hire_date',label:'雇用年月日',required:false},
  {key:'qualifications',label:'保有資格',required:false},
  {key:'notes',label:'備考',required:false},
  {key:'health_check_date',label:'健康診断時期',required:false},
  {key:'status',label:'ステータス',required:false},
  {key:'role',label:'権限',required:false},
  {key:'corporation',label:'法人',required:false},
  {key:'resignation_date',label:'離職日',required:false},
  {key:'resignation_reason',label:'離職理由',required:false},
];

const STATUS_LABELS: Record<string,string> = { active: '在籍', leave: '休職中', inactive: '退職' };
const STATUS_REVERSE: Record<string,string> = { '在籍': 'active', '休職中': 'leave', '退職': 'inactive', 'active': 'active', 'leave': 'leave', 'inactive': 'inactive' };
const ROLE_LABELS: Record<string,string> = { staff: 'スタッフ', facility_manager: '事業所管理者', hr_admin: '人事部', corp_head: '法人代表' };
const ROLE_REVERSE: Record<string,string> = { 'スタッフ': 'staff', '事業所管理者': 'facility_manager', '人事部': 'hr_admin', '法人代表': 'corp_head', 'staff': 'staff', 'facility_manager': 'facility_manager', 'hr_admin': 'hr_admin', 'corp_head': 'corp_head' };

// Header mapping for import
const HEADER_MAP: Record<string,string> = {
  '氏名': 'name', '名前': 'name', 'name': 'name',
  '性別': 'gender', 'gender': 'gender',
  '生年月日': 'birth_date', '誕生日': 'birth_date', 'birth_date': 'birth_date',
  '所属': 'facility', '施設': 'facility', '施設名': 'facility', 'facility': 'facility',
  '職種': 'occupation', '職種名': 'occupation', 'occupation': 'occupation',
  '役職': 'position', 'position': 'position',
  '雇用形態': 'employment_type', 'employment_type': 'employment_type',
  '住所': 'address', 'address': 'address',
  '連絡先': 'phone', '電話番号': 'phone', '電話': 'phone', 'phone': 'phone',
  '雇用年月日': 'hire_date', '入職日': 'hire_date', '入社日': 'hire_date', 'hire_date': 'hire_date',
  '保有資格': 'qualifications', '資格': 'qualifications', 'qualifications': 'qualifications',
  '備考': 'notes', 'notes': 'notes',
  '健康診断時期': 'health_check_date', '健康診断': 'health_check_date', 'health_check_date': 'health_check_date',
  '権限': 'role', 'ロール': 'role', 'role': 'role',
  'ステータス': 'status', 'status': 'status',
  '法人': 'corporation', '法人名': 'corporation', 'corporation': 'corporation',
  '離職日': 'resignation_date', 'resignation_date': 'resignation_date',
  '離職理由': 'resignation_reason', 'resignation_reason': 'resignation_reason',
};

type ImportStep = 'upload' | 'mapping' | 'validate' | 'executing' | 'done';

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportRowResult {
  row: number;
  originalData: Record<string, string>;
  parsedUser: Partial<User> | null;
  errors: ValidationError[];
  status: 'valid' | 'warning' | 'error';
}

export default function StaffDataExport() {
  const { users, occupations, facilities, surveys, surveyPeriods, evaluations, addUsers, removeUsers } = useData();
  const navigate = useNavigate();

  // --- Mode & Export state ---
  const [mode, setMode] = useState<'export'|'import'>('export');
  const [filterFac, setFilterFac] = useState('all');
  const [filterOcc, setFilterOcc] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [sortKey, setSortKey] = useState<ColKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(ALL_COLUMNS.filter(c=>c.default).map(c=>c.key)));
  const [showColPicker, setShowColPicker] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- Import state ---
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [importFile, setImportFile] = useState<File|null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headerMapping, setHeaderMapping] = useState<Record<number,string>>({});
  const [validationResults, setValidationResults] = useState<ImportRowResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{total:number;success:number;failed:number;warnings:number}>({total:0,success:0,failed:0,warnings:0});
  const [isDragOver, setIsDragOver] = useState(false);

  const toggleCol = (key: ColKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  // ===== EXPORT LOGIC =====
  const latestPeriod = surveyPeriods.filter(p=>p.status==='closed').slice(-1)[0] || surveyPeriods[surveyPeriods.length-1];
  const surveyMap = useMemo(() => {
    const m: Record<string,{mental:number;motivation:number}> = {};
    surveys.filter(s=>s.period_id===latestPeriod?.id).forEach(s => { m[s.user_id] = {mental:s.mental_score,motivation:s.motivation_score}; });
    return m;
  }, [surveys, surveyPeriods]);

  const evalMap = useMemo(() => {
    const m: Record<string,number> = {};
    evaluations.forEach(ev => {
      if (!ev.scores || ev.scores.length===0) return;
      const avg = ev.scores.reduce((s,sc)=>s+sc.score,0)/ev.scores.length;
      if (avg > 0) m[ev.user_id] = Math.round(avg*10)/10;
    });
    return m;
  }, [evaluations]);

  const getCellValue = (u: User, col: ColKey): string => {
    const occ = occupations.find(o=>o.id===u.occupation_id);
    const fac = facilities.find(f=>f.id===u.facility_id);
    switch(col) {
      case 'name': return u.name;
      case 'gender': return u.gender||'';
      case 'birth_date': return u.birth_date||'';
      case 'facility': return fac?.name||'';
      case 'occupation': return occ?.name||'';
      case 'position': return u.position||'';
      case 'employment_type': return u.employment_type||'';
      case 'address': return u.address||'';
      case 'phone': return u.phone||'';
      case 'hire_date': return u.hire_date||'';
      case 'qualifications': return u.qualifications?.map(q=>q.name).join(', ')||'';
      case 'notes': return u.notes||'';
      case 'health_check_date': return u.health_check_date||'';
      case 'status': return STATUS_LABELS[u.status]||u.status;
      case 'role': return ROLE_LABELS[u.role]||u.role;
      case 'work_pattern': return u.work_pattern||'';
      case 'corporation': return u.corporation||'';
      case 'resignation_date': return u.resignation_date||'';
      case 'resignation_reason': return u.resignation_reason||'';
      case 'mental': return surveyMap[u.id]?.mental?.toString()||'';
      case 'motivation': return surveyMap[u.id]?.motivation?.toString()||'';
      case 'eval_score': return evalMap[u.id]?.toString()||'';
      default: return '';
    }
  };

  const filtered = useMemo(() => {
    return users
      .filter(u => filterFac==='all' || u.facility_id===filterFac)
      .filter(u => filterOcc==='all' || u.occupation_id===filterOcc)
      .filter(u => filterStatus==='all' || u.status===filterStatus)
      .filter(u => !searchName.trim() || u.name.includes(searchName.trim()))
      .sort((a,b) => {
        const va = getCellValue(a, sortKey);
        const vb = getCellValue(b, sortKey);
        const cmp = va.localeCompare(vb, 'ja');
        return sortAsc ? cmp : -cmp;
      });
  }, [users, filterFac, filterOcc, filterStatus, searchName, sortKey, sortAsc, occupations, facilities, surveyMap, evalMap]);

  const handleSort = (key: ColKey) => {
    if (sortKey === key) { setSortAsc(!sortAsc); } else { setSortKey(key); setSortAsc(true); }
  };

  const handleBulkDeleteClick = () => {
    if (selectedUserIds.size === 0) return;
    setShowDeleteModal(true);
  };

  const executeBulkDelete = async () => {
    const ids = Array.from(selectedUserIds);
    const res = await userMutations.deleteUsers(ids);
    
    if (res.success) {
      removeUsers(ids);
      setSelectedUserIds(new Set());
      setShowDeleteModal(false);
      /* Use a small div alert or just ignore since UI updates automatically */
    } else {
      alert('削除に失敗しました: ' + res.error);
    }
  };

  // CSV Export
  const exportCSV = () => {
    const cols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));
    const header = cols.map(c => c.label).join(',');
    const rows = filtered.map(u => cols.map(c => {
      const val = getCellValue(u, c.key);
      return '"' + val.replace(/"/g, '""') + '"';
    }).join(','));
    const bom = '\uFEFF';
    const csv = bom + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '職員データ_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Excel Export
  const exportExcel = () => {
    const cols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));
    const headerRow = cols.map(c => c.label);
    const dataRows = filtered.map(u => cols.map(c => getCellValue(u, c.key)));
    const wsData = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = cols.map(c => ({
      wch: c.key === 'name' ? 14 : c.key === 'address' ? 30 : c.key === 'qualifications' ? 28 : c.key === 'notes' ? 24 : c.key === 'facility' ? 20 : 14
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '職員データ');
    XLSX.writeFile(wb, '職員データ_' + new Date().toISOString().slice(0,10) + '.xlsx');
  };

  // ===== IMPORT LOGIC =====
  const parseFile = useCallback((file: File) => {
    setImportFile(file);
    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (jsonData.length < 2) return;
        const headers = jsonData[0].map(h => String(h).trim());
        const rows = jsonData.slice(1).filter(row => row.some(cell => String(cell).trim()));
        setRawHeaders(headers);
        setRawData(rows.map(r => r.map(c => String(c).trim())));
        autoMapHeaders(headers);
        setImportStep('mapping');
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
        if (lines.length < 2) return;
        const headers = parseCSVLine(lines[0]);
        const rows = lines.slice(1).map(l => parseCSVLine(l)).filter(row => row.some(cell => cell.trim()));
        setRawHeaders(headers);
        setRawData(rows);
        autoMapHeaders(headers);
        setImportStep('mapping');
      };
      reader.readAsText(file, 'UTF-8');
    }
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };

  const autoMapHeaders = (headers: string[]) => {
    const mapping: Record<number,string> = {};
    headers.forEach((h, i) => {
      const normalized = h.trim().toLowerCase();
      for (const [key, val] of Object.entries(HEADER_MAP)) {
        if (key.toLowerCase() === normalized) {
          mapping[i] = val;
          break;
        }
      }
    });
    setHeaderMapping(mapping);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      parseFile(file);
    }
  };

  // Validation
  const runValidation = () => {
    const facilityNameMap: Record<string,string> = {};
    facilities.forEach(f => { facilityNameMap[f.name] = f.id; });
    const occNameMap: Record<string,string> = {};
    occupations.forEach(o => { occNameMap[o.name] = o.id; });
    const existingNames = users.map(u => u.name);

    const results: ImportRowResult[] = rawData.map((row, ri) => {
      const errors: ValidationError[] = [];
      const rowData: Record<string,string> = {};

      // Map columns
      Object.entries(headerMapping).forEach(([colIdx, field]) => {
        rowData[field] = row[parseInt(colIdx)] || '';
      });

      // Required: 氏名
      if (!rowData.name?.trim()) {
        errors.push({ row: ri+1, column: '氏名', message: '氏名は必須です', severity: 'error' });
      }

      // Name duplicate warning
      if (rowData.name?.trim() && existingNames.includes(rowData.name.trim())) {
        errors.push({ row: ri+1, column: '氏名', message: '同名のスタッフが既に存在します', severity: 'warning' });
      }

      // Facility check
      const facilityId = rowData.facility ? facilityNameMap[rowData.facility.trim()] : undefined;
      if (rowData.facility?.trim() && !facilityId) {
        errors.push({ row: ri+1, column: '所属', message: `所属「${rowData.facility}」が見つかりません`, severity: 'warning' });
      }

      // Occupation check
      const occId = rowData.occupation ? occNameMap[rowData.occupation.trim()] : undefined;
      if (rowData.occupation?.trim() && !occId) {
        errors.push({ row: ri+1, column: '職種', message: `職種「${rowData.occupation}」が見つかりません`, severity: 'warning' });
      }

      // Date format check
      ['hire_date', 'birth_date', 'health_check_date', 'resignation_date'].forEach(field => {
        if (rowData[field]?.trim()) {
          const dateStr = rowData[field].trim();
          if (!/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(dateStr)) {
            const fieldLabels: Record<string,string> = {
              hire_date: '雇用年月日', birth_date: '生年月日',
              health_check_date: '健康診断時期', resignation_date: '離職日',
            };
            errors.push({ row: ri+1, column: fieldLabels[field] || field, message: '日付形式が不正です（YYYY-MM-DD）', severity: 'warning' });
          }
        }
      });

      // Gender validation
      if (rowData.gender?.trim()) {
        const g = rowData.gender.trim();
        if (!['男', '女', '男性', '女性', 'その他', '未回答'].includes(g)) {
          errors.push({ row: ri+1, column: '性別', message: '性別は「男性」「女性」「その他」のいずれかを指定してください', severity: 'warning' });
        }
      }

      // Build parsed user
      let parsedUser: Partial<User> | null = null;
      const hasErrors = errors.some(e => e.severity === 'error');
      if (!hasErrors) {
        const qualStr = rowData.qualifications?.trim();
        const quals: Qualification[] = qualStr
          ? qualStr.split(/[,、]/).map(q => ({ name: q.trim(), acquired_date: '' })).filter(q => q.name)
          : [];

        // Normalize gender
        let gender = rowData.gender?.trim() || '';
        if (gender === '男') gender = '男性';
        if (gender === '女') gender = '女性';

        parsedUser = {
          id: 'u-import-' + Date.now() + '-' + ri,
          name: rowData.name?.trim() || '',
          email: (rowData.name?.trim() || '').replace(/\s/g, '') + '@import.local',
          role: (ROLE_REVERSE[rowData.role?.trim() || ''] || 'staff') as User['role'],
          occupation_id: occId || occupations[0]?.id || undefined,
          facility_id: facilityId || facilities[0]?.id || undefined,
          status: (STATUS_REVERSE[rowData.status?.trim() || ''] || 'active') as User['status'],
          evaluator_id: null,
          gender: gender || undefined,
          birth_date: normalizeDate(rowData.birth_date),
          hire_date: normalizeDate(rowData.hire_date),
          position: rowData.position?.trim() || '',
          employment_type: (rowData.employment_type?.trim() || undefined) as User['employment_type'],
          work_pattern: (rowData.work_pattern?.trim() || undefined) as User['work_pattern'],
          corporation: rowData.corporation?.trim() || '',
          qualifications: quals.length > 0 ? quals : undefined,
          address: rowData.address?.trim() || undefined,
          phone: rowData.phone?.trim() || undefined,
          notes: rowData.notes?.trim() || undefined,
          health_check_date: normalizeDate(rowData.health_check_date),
          resignation_date: normalizeDate(rowData.resignation_date),
          resignation_reason: rowData.resignation_reason?.trim() || undefined,
        };
      }

      return {
        row: ri + 1,
        originalData: rowData,
        parsedUser,
        errors,
        status: hasErrors ? 'error' as const : errors.length > 0 ? 'warning' as const : 'valid' as const,
      };
    });

    setValidationResults(results);
    setImportStep('validate');
  };

  const normalizeDate = (dateStr?: string): string | undefined => {
    if (!dateStr?.trim()) return undefined;
    let s = dateStr.trim();
    // Excelシリアル値 (例: 44197 -> 2021-01-01) ※5桁の数字（1927年以降〜2173年まで対応）
    if (/^\d{5}$/.test(s)) {
      const serial = parseInt(s, 10);
      const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return d.toISOString().split('T')[0];
    }
    // ハイフンなしの YYYYMMDD (例: 19901015 -> 1990-10-15)
    if (/^\d{8}$/.test(s)) {
      return `${s.substring(0,4)}-${s.substring(4,6)}-${s.substring(6,8)}`;
    }
    return s.replace(/\//g, '-');
  };

  // Execute Import
  const executeImport = async () => {
    setImportStep('executing');
    const validRows = validationResults.filter(r => r.status !== 'error' && r.parsedUser);
    const total = validRows.length;
    let success = 0;
    let failed = 0;
    const warnings = validationResults.filter(r => r.status === 'warning').length;
    const newUsers: User[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const user = row.parsedUser as User;
        const result = await userMutations.importUsers([{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          occupation_id: user.occupation_id,
          facility_id: user.facility_id,
          status: user.status,
          evaluator_id: user.evaluator_id,
          gender: user.gender || null,
          birth_date: user.birth_date || null,
          hire_date: user.hire_date || null,
          position: user.position || null,
          employment_type: user.employment_type || null,
          work_pattern: user.work_pattern || null,
          corporation: user.corporation || null,
          qualifications: user.qualifications || null,
          address: user.address || null,
          phone: user.phone || null,
          notes: user.notes || null,
          health_check_date: user.health_check_date || null,
          resignation_date: user.resignation_date || null,
          resignation_reason: user.resignation_reason || null,
        }]);
        if (result.success) {
          newUsers.push(user);
          success++;
        } else {
          console.error('[Import Error]', user.name, result.error);
          failed++;
        }
      } catch (err: any) {
        console.error('[Import Exception]', row.parsedUser?.name, err.message);
        failed++;
      }
      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    if (newUsers.length > 0) {
      addUsers(newUsers);
    }

    setImportSummary({ total, success, failed, warnings });
    setImportStep('done');
  };

  const resetImport = () => {
    setImportFile(null);
    setRawHeaders([]);
    setRawData([]);
    setHeaderMapping({});
    setValidationResults([]);
    setImportProgress(0);
    setImportSummary({total:0,success:0,failed:0,warnings:0});
    setImportStep('upload');
  };

  // Template headers (required items)
  const templateHeaders = ['氏名','性別','生年月日','所属','職種','役職','雇用形態','住所','連絡先','雇用年月日','保有資格','備考','健康診断時期'];
  const templateSample = ['山田花子','女性','1990-01-15','さくらの樹クリニック','看護師','一般','常勤','大阪府大阪市平野区...','090-1234-5678','2025-04-01','看護師免許','','2025-10'];

  const downloadTemplate = () => {
    const header = templateHeaders.join(',');
    const sample = templateSample.map(v => '"' + v + '"').join(',');
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + '\n' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = '職員インポートテンプレート.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateHeaders, templateSample]);
    ws['!cols'] = templateHeaders.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'テンプレート');
    XLSX.writeFile(wb, '職員インポートテンプレート.xlsx');
  };

  const cols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));
  const importMappableFields = [
    { value: '', label: '— スキップ —' },
    ...IMPORT_COLUMNS.map(c => ({ value: c.key, label: c.label + (c.required ? ' *' : '') })),
  ];

  const validCount = validationResults.filter(r => r.status !== 'error').length;
  const errorCount = validationResults.filter(r => r.status === 'error').length;
  const warningCount = validationResults.filter(r => r.status === 'warning').length;

  return (
    <div className='fade-in'>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:'var(--space-5)'}}>
        <div>
          <h2 className='page-title'>📊 スタッフデータ管理</h2>
          <p className='page-subtitle'>職員情報のフィルタリング・エクスポート（CSV/Excel）、一括インポートが行えます。</p>
        </div>
        {mode==='export' && (
          <div style={{display:'flex',gap:8}}>
            {selectedUserIds.size > 0 && (
              <button className='btn btn-danger' onClick={handleBulkDeleteClick} style={{whiteSpace:'nowrap',background:'var(--color-danger)',color:'#fff'}}>
                🗑️ {selectedUserIds.size}件を削除
              </button>
            )}
            <button className='btn btn-primary' onClick={exportCSV} style={{whiteSpace:'nowrap'}}>
              📥 CSV出力（{filtered.length}件）
            </button>
            <button className='btn btn-primary' onClick={exportExcel} style={{whiteSpace:'nowrap',background:'var(--color-success)'}}>
              📗 Excel出力（{filtered.length}件）
            </button>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className='sp-tabs' style={{marginBottom:'var(--space-5)'}}>
        <button className={'sp-tab '+(mode==='export'?'active':'')} onClick={()=>setMode('export')}><span>📥</span> データ出力</button>
        <button className={'sp-tab '+(mode==='import'?'active':'')} onClick={()=>{setMode('import'); resetImport();}}><span>📤</span> データインポート</button>
      </div>

      {/* ===== EXPORT MODE ===== */}
      {mode==='export' && (<>
      <div className='an-kpi-grid'>
        <div className='an-kpi card'><div className='an-kpi-icon'>👥</div><div><div className='an-kpi-value'>{filtered.length}</div><div className='an-kpi-label'>表示中</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📋</div><div><div className='an-kpi-value'>{users.length}</div><div className='an-kpi-label'>全スタッフ</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📂</div><div><div className='an-kpi-value'>{cols.length}</div><div className='an-kpi-label'>表示列</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>🏥</div><div><div className='an-kpi-value'>{facilities.length}</div><div className='an-kpi-label'>施設数</div></div></div>
      </div>

      <div className='iv-filters card'>
        <div className='iv-filter-group'><label>所属:</label><select value={filterFac} onChange={e=>setFilterFac(e.target.value)}><option value='all'>すべて</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div className='iv-filter-group'><label>職種:</label><select value={filterOcc} onChange={e=>setFilterOcc(e.target.value)}><option value='all'>すべて</option>{occupations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <div className='iv-filter-group'><label>ステータス:</label><select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value='all'>すべて</option><option value='active'>在籍</option><option value='leave'>休職中</option><option value='inactive'>退職</option></select></div>
        <div className='iv-filter-group'><label>検索:</label><input type='text' className='form-input' placeholder='氏名で検索...' value={searchName} onChange={e=>setSearchName(e.target.value)} style={{width:150}} /></div>
        <button className='btn btn-sm btn-secondary' onClick={()=>setShowColPicker(!showColPicker)} style={{marginLeft:'auto'}}>⚙️ 列設定</button>
      </div>

      {showColPicker && (
        <div className='card' style={{padding:'var(--space-3) var(--space-4)',marginBottom:'var(--space-4)'}}>
          <div style={{fontSize:'var(--font-size-sm)',fontWeight:600,marginBottom:8}}>表示する列を選択:</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {ALL_COLUMNS.map(c => (
              <label key={c.key} style={{display:'flex',alignItems:'center',gap:4,fontSize:'var(--font-size-sm)',cursor:'pointer',padding:'4px 10px',borderRadius:'var(--radius-md)',background:visibleCols.has(c.key)?'var(--color-primary-50)':'var(--color-neutral-50)',border:'1px solid '+(visibleCols.has(c.key)?'var(--color-primary-200)':'var(--color-neutral-200)'),transition:'all 0.15s'}}>
                <input type='checkbox' checked={visibleCols.has(c.key)} onChange={()=>toggleCol(c.key)} style={{accentColor:'var(--color-primary-500)'}} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className='card' style={{overflow:'auto'}}>
        <table className='data-table' style={{minWidth:cols.length*110}}>
          <thead>
            <tr>
              <th style={{width:40,textAlign:'center'}}>
                <input 
                  type="checkbox" 
                  checked={filtered.length > 0 && selectedUserIds.size === filtered.length}
                  onChange={(e) => setSelectedUserIds(e.target.checked ? new Set(filtered.map(u => u.id)) : new Set())}
                  style={{cursor:'pointer',accentColor:'var(--color-primary-500)'}}
                />
              </th>
              <th style={{width:40,textAlign:'center'}}>#</th>
              {cols.map(c => (
                <th key={c.key} onClick={()=>handleSort(c.key)} style={{cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
                  {c.label} {sortKey===c.key ? (sortAsc?'▲':'▼') : ''}
                </th>
              ))}
              <th style={{width:80,textAlign:'center'}}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u,i) => (
              <tr key={u.id} style={{background: selectedUserIds.has(u.id) ? 'var(--color-primary-50)' : 'transparent'}}>
                <td style={{textAlign:'center'}}>
                  <input 
                    type="checkbox" 
                    checked={selectedUserIds.has(u.id)}
                    onChange={(e) => {
                      const next = new Set(selectedUserIds);
                      if (e.target.checked) next.add(u.id);
                      else next.delete(u.id);
                      setSelectedUserIds(next);
                    }}
                    style={{cursor:'pointer',accentColor:'var(--color-primary-500)'}}
                  />
                </td>
                <td style={{textAlign:'center',color:'var(--color-neutral-400)',fontSize:'var(--font-size-xs)'}}>{i+1}</td>
                {cols.map(c => {
                  const val = getCellValue(u, c.key);
                  let style: React.CSSProperties = {};
                  if (c.key==='status') {
                    style.color = u.status==='active'?'var(--color-success)':u.status==='leave'?'var(--color-warning)':'var(--color-neutral-400)';
                    style.fontWeight = 600;
                  }
                  if ((c.key==='mental'||c.key==='motivation') && val) {
                    const n = parseInt(val);
                    style.fontWeight = 600;
                    style.color = n>=70?'var(--color-success)':n>=50?'var(--color-warning)':'var(--color-danger)';
                  }
                  return <td key={c.key} style={style}>{val||'—'}</td>;
                })}
                <td style={{textAlign:'center'}}>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    style={{padding: '4px 8px', fontSize: 'var(--font-size-xs)'}}
                    onClick={() => navigate('/staff/' + u.id)}
                  >
                    ✏️ 編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div style={{textAlign:'center',padding:'var(--space-8)',color:'var(--color-neutral-400)'}}>該当するスタッフがいません</div>
        )}
      </div>

      {showDeleteModal && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <div className='card' style={{width: 400, maxWidth:'90%', padding:'var(--space-6)'}}>
            <h3 style={{marginBottom:'var(--space-3)', color:'var(--color-danger)'}}>🗑️ スタッフデータの一括削除</h3>
            <p style={{marginBottom:'var(--space-5)', fontSize:'var(--font-size-sm)', color:'var(--color-neutral-700)'}}>
              選択された <strong>{selectedUserIds.size} 件</strong> のスタッフデータを完全に削除しますか？<br/><br/>
              （この操作は元に戻せません。関連する評価やアンケートデータにも影響する可能性があります）
            </p>
            <div style={{display:'flex', gap:12, justifyContent:'flex-end'}}>
              <button className='btn btn-secondary' onClick={() => setShowDeleteModal(false)}>キャンセル</button>
              <button className='btn btn-danger' onClick={executeBulkDelete} style={{background:'var(--color-danger)', color:'#fff'}}>削除を実行する</button>
            </div>
          </div>
        </div>
      )}
      </>)}

      {/* ===== IMPORT MODE ===== */}
      {mode==='import' && (
        <div>
          {/* Step Indicator */}
          <div className='card' style={{marginBottom:'var(--space-5)',padding:'var(--space-4)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0}}>
              {[
                { step: 'upload', label: 'ファイル選択', icon: '📁' },
                { step: 'mapping', label: 'マッピング', icon: '🔗' },
                { step: 'validate', label: 'バリデーション', icon: '✅' },
                { step: 'executing', label: '実行中', icon: '⏳' },
                { step: 'done', label: '完了', icon: '🎉' },
              ].map((s, i, arr) => {
                const steps: ImportStep[] = ['upload','mapping','validate','executing','done'];
                const currentIdx = steps.indexOf(importStep);
                const stepIdx = steps.indexOf(s.step as ImportStep);
                const isActive = stepIdx === currentIdx;
                const isDone = stepIdx < currentIdx;
                return (
                  <div key={s.step} style={{display:'flex',alignItems:'center'}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,minWidth:80}}>
                      <div style={{
                        width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'1rem',
                        background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-primary-500)' : 'var(--color-neutral-100)',
                        color: isDone || isActive ? '#fff' : 'var(--color-neutral-400)',
                        fontWeight:700,transition:'all 0.3s ease',
                        boxShadow: isActive ? '0 0 0 3px var(--color-primary-100)' : 'none',
                      }}>
                        {isDone ? '✓' : s.icon}
                      </div>
                      <span style={{
                        fontSize:'var(--font-size-xs)',
                        fontWeight: isActive ? 700 : 400,
                        color: isDone || isActive ? 'var(--color-neutral-900)' : 'var(--color-neutral-400)',
                      }}>
                        {s.label}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{
                        width:40,height:2,
                        background: stepIdx < currentIdx ? 'var(--color-success)' : 'var(--color-neutral-200)',
                        marginBottom:20,transition:'background 0.3s ease',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step: Upload */}
          {importStep==='upload' && (
            <div className='card' style={{marginBottom:'var(--space-5)'}}>
              <div className='card-header'>
                <h3 className='card-title'>📤 ファイルアップロード</h3>
                <div style={{display:'flex',gap:8}}>
                  <button className='btn btn-sm btn-secondary' onClick={downloadTemplate}>📋 CSVテンプレート</button>
                  <button className='btn btn-sm btn-secondary' onClick={downloadTemplateExcel}>📗 Excelテンプレート</button>
                </div>
              </div>
              <div className='card-body'>
                <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)',marginBottom:'var(--space-3)'}}>
                  職員データのCSVまたはExcelファイルをアップロードしてください。テンプレートをダウンロードしてフォーマットを確認できます。
                </p>
                <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)',marginBottom:'var(--space-4)',background:'var(--color-neutral-50)',padding:'8px 12px',borderRadius:'var(--radius-md)',border:'1px solid var(--color-neutral-200)'}}>
                  <strong>必須項目:</strong> 氏名 ／
                  <strong style={{marginLeft:8}}>推奨項目:</strong> 性別、生年月日、所属、職種、役職、雇用形態、住所、連絡先、雇用年月日、保有資格、備考、健康診断時期
                </div>
                <div
                  onDragOver={(e) => {e.preventDefault(); setIsDragOver(true);}}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={()=>document.getElementById('csv-upload')?.click()}
                  style={{
                    border: isDragOver ? '2px solid var(--color-primary-500)' : '2px dashed var(--color-primary-200)',
                    borderRadius:'var(--radius-lg)',padding:'var(--space-8)',textAlign:'center',
                    background: isDragOver ? 'var(--color-primary-100)' : 'var(--color-primary-50)',
                    cursor:'pointer',transition:'all 0.2s ease',
                  }}
                >
                  <div style={{fontSize:'3rem',marginBottom:8}}>{isDragOver ? '📥' : '📁'}</div>
                  <div style={{fontWeight:600,marginBottom:4}}>クリックまたはドラッグ＆ドロップでファイルを選択</div>
                  <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)'}}>対応形式: CSV (.csv) / Excel (.xlsx, .xls)</div>
                  <input id='csv-upload' type='file' accept='.csv,.xlsx,.xls' onChange={handleFileChange} style={{display:'none'}} />
                </div>
              </div>
            </div>
          )}

          {/* Step: Header Mapping */}
          {importStep==='mapping' && (
            <div className='card' style={{marginBottom:'var(--space-5)'}}>
              <div className='card-header'>
                <h3 className='card-title'>🔗 ヘッダーマッピング</h3>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span className='badge badge-primary'>{importFile?.name}</span>
                  <span className='badge badge-primary'>{rawData.length}件</span>
                </div>
              </div>
              <div className='card-body'>
                <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)',marginBottom:'var(--space-4)'}}>
                  ファイルの各列を対応するフィールドにマッピングしてください。自動マッピングされた列を確認・修正できます。
                </p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12,marginBottom:'var(--space-5)'}}>
                  {rawHeaders.map((h, i) => (
                    <div key={i} style={{
                      padding:'12px 16px',borderRadius:'var(--radius-md)',
                      border:'1px solid '+(headerMapping[i] ? 'var(--color-primary-200)' : 'var(--color-neutral-200)'),
                      background: headerMapping[i] ? 'var(--color-primary-50)' : 'var(--color-neutral-50)',
                    }}>
                      <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)',marginBottom:4}}>ファイル列: <strong>{h}</strong></div>
                      <select
                        value={headerMapping[i]||''}
                        onChange={e => setHeaderMapping(prev => ({...prev, [i]: e.target.value}))}
                        style={{width:'100%',padding:'6px 8px',borderRadius:'var(--radius-md)',border:'1px solid var(--color-neutral-300)',fontSize:'var(--font-size-sm)'}}
                      >
                        {importMappableFields.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                      {rawData[0] && (
                        <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)',marginTop:4}}>
                          例: {rawData[0][i] || '(空)'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button className='btn btn-secondary' onClick={resetImport}>← 戻る</button>
                  <button className='btn btn-primary' onClick={runValidation}
                    disabled={!Object.values(headerMapping).includes('name')}
                  >
                    次へ: バリデーション →
                  </button>
                </div>
                {!Object.values(headerMapping).includes('name') && (
                  <div style={{marginTop:8,fontSize:'var(--font-size-xs)',color:'var(--color-danger)'}}>
                    ※「氏名」のマッピングは必須です
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step: Validation */}
          {importStep==='validate' && (
            <div>
              <div className='an-kpi-grid' style={{marginBottom:'var(--space-4)'}}>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon'>📋</div>
                  <div><div className='an-kpi-value'>{validationResults.length}</div><div className='an-kpi-label'>全件数</div></div>
                </div>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon' style={{background:'var(--color-success-bg)',color:'var(--color-success)'}}>✅</div>
                  <div><div className='an-kpi-value' style={{color:'var(--color-success)'}}>{validCount}</div><div className='an-kpi-label'>インポート可能</div></div>
                </div>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon' style={{background:'#fff3cd',color:'#856404'}}>⚠️</div>
                  <div><div className='an-kpi-value' style={{color:'#856404'}}>{warningCount}</div><div className='an-kpi-label'>警告あり</div></div>
                </div>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon' style={{background:'var(--color-danger-bg,#fce4ec)',color:'var(--color-danger)'}}>❌</div>
                  <div><div className='an-kpi-value' style={{color:'var(--color-danger)'}}>{errorCount}</div><div className='an-kpi-label'>エラー</div></div>
                </div>
              </div>

              {validationResults.some(r => r.errors.length > 0) && (
                <div className='card' style={{marginBottom:'var(--space-4)'}}>
                  <div className='card-header'>
                    <h3 className='card-title'>🔍 バリデーション結果詳細</h3>
                  </div>
                  <div className='card-body' style={{maxHeight:300,overflow:'auto'}}>
                    {validationResults.filter(r => r.errors.length > 0).map(r => (
                      <div key={r.row} style={{
                        padding:'8px 12px',marginBottom:6,borderRadius:'var(--radius-md)',
                        border:'1px solid '+(r.status==='error' ? 'var(--color-danger)' : '#ffc107'),
                        background: r.status==='error' ? 'var(--color-danger-bg,#fce4ec)' : '#fff3cd',
                        fontSize:'var(--font-size-sm)',
                      }}>
                        <strong>行 {r.row}</strong>
                        {r.originalData.name && <span style={{marginLeft:8,color:'var(--color-neutral-600)'}}>({r.originalData.name})</span>}
                        <ul style={{margin:'4px 0 0 16px',padding:0,listStyle:'disc'}}>
                          {r.errors.map((err, ei) => (
                            <li key={ei}>
                              <span style={{fontWeight:600}}>{err.column}:</span> {err.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='card' style={{marginBottom:'var(--space-4)'}}>
                <div className='card-header'>
                  <h3 className='card-title'>📄 プレビュー（先頭20件）</h3>
                </div>
                <div className='card-body' style={{overflow:'auto',maxHeight:400}}>
                  <table className='data-table' style={{fontSize:'var(--font-size-xs)'}}>
                    <thead>
                      <tr>
                        <th style={{width:40}}>行</th>
                        <th style={{width:50}}>状態</th>
                        {Object.values(headerMapping).filter(Boolean).map((field, i) => {
                          const fieldLabel = importMappableFields.find(f => f.value === field)?.label?.replace(' *','') || field;
                          return <th key={i}>{fieldLabel}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.slice(0, 20).map(r => (
                        <tr key={r.row} style={{
                          background: r.status === 'error' ? 'var(--color-danger-bg,#fce4ec)' : r.status === 'warning' ? '#fff3cd' : undefined,
                        }}>
                          <td style={{textAlign:'center'}}>{r.row}</td>
                          <td style={{textAlign:'center'}}>
                            {r.status === 'valid' && '✅'}
                            {r.status === 'warning' && '⚠️'}
                            {r.status === 'error' && '❌'}
                          </td>
                          {Object.values(headerMapping).filter(Boolean).map((field, ci) => (
                            <td key={ci}>{r.originalData[field] || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {validationResults.length > 20 && (
                    <div style={{textAlign:'center',padding:8,fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)'}}>
                      ...残り{validationResults.length - 20}件
                    </div>
                  )}
                </div>
              </div>

              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button className='btn btn-secondary' onClick={() => setImportStep('mapping')}>← マッピングに戻る</button>
                <button className='btn btn-secondary' onClick={resetImport}>✕ キャンセル</button>
                <button
                  className='btn btn-primary'
                  onClick={executeImport}
                  disabled={validCount === 0}
                  style={{fontWeight:700}}
                >
                  ✅ {validCount}件をインポート実行
                </button>
              </div>
            </div>
          )}

          {/* Step: Executing */}
          {importStep==='executing' && (
            <div className='card' style={{padding:'var(--space-8)',textAlign:'center'}}>
              <div style={{fontSize:'3rem',marginBottom:16}}>⏳</div>
              <div style={{fontWeight:700,fontSize:'var(--font-size-lg)',marginBottom:16}}>インポート実行中...</div>
              <div style={{
                width:'100%',maxWidth:400,margin:'0 auto 16px',height:8,background:'var(--color-neutral-100)',
                borderRadius:'var(--radius-full)',overflow:'hidden',
              }}>
                <div style={{
                  height:'100%',width:importProgress+'%',
                  background:'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))',
                  borderRadius:'var(--radius-full)',transition:'width 0.3s ease',
                }} />
              </div>
              <div style={{color:'var(--color-neutral-500)',fontSize:'var(--font-size-sm)'}}>{importProgress}% 完了</div>
            </div>
          )}

          {/* Step: Done */}
          {importStep==='done' && (
            <div className='card' style={{padding:'var(--space-8)'}}>
              <div style={{textAlign:'center',marginBottom:'var(--space-6)'}}>
                <div style={{fontSize:'4rem',marginBottom:12}}>🎉</div>
                <div style={{fontWeight:700,fontSize:'var(--font-size-xl)',marginBottom:8}}>インポート完了</div>
              </div>
              <div className='an-kpi-grid'>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon'>📋</div>
                  <div><div className='an-kpi-value'>{importSummary.total}</div><div className='an-kpi-label'>処理件数</div></div>
                </div>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon' style={{background:'var(--color-success-bg)',color:'var(--color-success)'}}>✅</div>
                  <div><div className='an-kpi-value' style={{color:'var(--color-success)'}}>{importSummary.success}</div><div className='an-kpi-label'>成功</div></div>
                </div>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon' style={{background:'#fff3cd',color:'#856404'}}>⚠️</div>
                  <div><div className='an-kpi-value' style={{color:'#856404'}}>{importSummary.warnings}</div><div className='an-kpi-label'>警告</div></div>
                </div>
                <div className='an-kpi card'>
                  <div className='an-kpi-icon' style={{background:'var(--color-danger-bg,#fce4ec)',color:'var(--color-danger)'}}>❌</div>
                  <div><div className='an-kpi-value' style={{color:'var(--color-danger)'}}>{importSummary.failed}</div><div className='an-kpi-label'>失敗</div></div>
                </div>
              </div>
              <div style={{textAlign:'center',marginTop:'var(--space-5)'}}>
                <button className='btn btn-primary' onClick={resetImport} style={{marginRight:8}}>🔄 新規インポート</button>
                <button className='btn btn-secondary' onClick={()=>setMode('export')}>📊 データ出力へ</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}