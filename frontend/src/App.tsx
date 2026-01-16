import React, { useState, useEffect } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Tutorial, TutorialStep } from './Tutorial';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type Language = 'en' | 'pt';

const TRANSLATIONS = {
  en: {
    startTour: 'Start Tour',
    quickStartTitle: 'Quick Start: Choose a Schema',
    quickStartDesc: 'Click "Register" to instantly load a preset.',
    registerLoad: 'Register / Load Schema',
    customSchemaTitle: 'Custom Schema Registration',
    customSchemaDesc: 'For advanced users needing custom JSON',
    nameLabel: 'Name',
    descLabel: 'Description',
    jsonLabel: 'JSON Schema',
    registerCustom: 'Register Custom',
    adapterMappingTitle: 'Adapter Mapping',
    adapterMappingDesc: 'Define rules to transform incoming data (e.g. from legacy systems) to match your schema.',
    saveMapping: 'Save Mapping for',
    validatorConsole: 'Validator Console',
    activeSchema: 'Active Schema',
    none: 'None',
    selectTargetSchema: 'Select Target Schema',
    chooseSchema: '-- Choose a Schema --',
    clickToUpload: 'Click to upload',
    dragDrop: 'or drag and drop',
    fileType: 'CSV or JSON files supported',
    applyMapping: 'Apply Adapter Mapping',
    applyMappingDesc: 'Attempt to fix known schema mismatches automatically',
    validating: 'Validating...',
    validatePayload: 'Validate Payload',
    validationSuccess: 'Validation Successful',
    validationFailed: 'Validation Failed',
    validationSuccessMsg: 'The uploaded file perfectly matches the schema specification.',
    foundErrors: 'Found error(s):',
    tutorialStep1Title: '1. Quick Start',
    tutorialStep1Content: 'Choose a pre-defined schema to get started instantly. Click "Register" to load the Procurement Standard schema.',
    tutorialStep2Title: '2. Validate Data',
    tutorialStep2Content: 'Upload your CSV or JSON file here. The system will check it against the selected schema.',
    tutorialStep3Title: '3. Fix Issues',
    tutorialStep3Content: 'If your data has different column names (e.g., Portuguese headers), define a mapping here to automatically fix it.',
    alertSchemaRegistered: 'registered successfully!',
    alertErrorRegister: 'Error registering schema. Check console for details.',
    alertInvalidJson: 'Invalid JSON Schema format',
    alertValidationFailed: 'Validation process failed or API is unreachable.',
    alertMappingSaved: 'Mapping rules saved for',
    alertInvalidMapping: 'Invalid JSON for mapping',
    procurementTitle: 'Procurement Standard',
    procurementDesc: 'Validates government purchasing data (Clean Sample).',
    retailTitle: 'Retail Transactions',
    retailDesc: 'Standard schema for point-of-sale transaction records.'
  },
  pt: {
    startTour: 'Iniciar Tour',
    quickStartTitle: 'Início Rápido: Escolha um Schema',
    quickStartDesc: 'Clique em "Registrar" para carregar um modelo instantaneamente.',
    registerLoad: 'Registrar / Carregar Schema',
    customSchemaTitle: 'Registro de Schema Personalizado',
    customSchemaDesc: 'Para usuários avançados que precisam de JSON personalizado',
    nameLabel: 'Nome',
    descLabel: 'Descrição',
    jsonLabel: 'JSON Schema',
    registerCustom: 'Registrar Personalizado',
    adapterMappingTitle: 'Mapeamento de Adaptador',
    adapterMappingDesc: 'Defina regras para transformar dados de entrada (ex: sistemas legados) para corresponder ao seu schema.',
    saveMapping: 'Salvar Mapeamento para',
    validatorConsole: 'Console de Validação',
    activeSchema: 'Schema Ativo',
    none: 'Nenhum',
    selectTargetSchema: 'Selecione o Schema Alvo',
    chooseSchema: '-- Escolha um Schema --',
    clickToUpload: 'Clique para enviar',
    dragDrop: 'ou arraste e solte',
    fileType: 'Arquivos CSV ou JSON suportados',
    applyMapping: 'Aplicar Mapeamento de Adaptador',
    applyMappingDesc: 'Tentar corrigir incompatibilidades de schema automaticamente',
    validating: 'Validando...',
    validatePayload: 'Validar Carga',
    validationSuccess: 'Validação Bem-sucedida',
    validationFailed: 'Falha na Validação',
    validationSuccessMsg: 'O arquivo enviado corresponde perfeitamente à especificação do schema.',
    foundErrors: 'Erros encontrados:',
    tutorialStep1Title: '1. Início Rápido',
    tutorialStep1Content: 'Escolha um schema pré-definido para começar instantaneamente. Clique em "Registrar" para carregar o padrão de Compras.',
    tutorialStep2Title: '2. Validar Dados',
    tutorialStep2Content: 'Envie seu arquivo CSV ou JSON aqui. O sistema irá verificá-lo contra o schema selecionado.',
    tutorialStep3Title: '3. Corrigir Problemas',
    tutorialStep3Content: 'Se seus dados tiverem nomes de colunas diferentes (ex: cabeçalhos antigos), defina um mapeamento aqui para corrigir automaticamente.',
    alertSchemaRegistered: 'registrado com sucesso!',
    alertErrorRegister: 'Erro ao registrar schema. Verifique o console para detalhes.',
    alertInvalidJson: 'Formato JSON Schema inválido',
    alertValidationFailed: 'Processo de validação falhou ou API inalcançável.',
    alertMappingSaved: 'Regras de mapeamento salvas para',
    alertInvalidMapping: 'JSON inválido para mapeamento',
    procurementTitle: 'Padrão de Compras',
    procurementDesc: 'Valida dados de compras governamentais (Amostra Limpa).',
    retailTitle: 'Transações de Varejo',
    retailDesc: 'Schema padrão para registros de transações de ponto de venda.'
  }
};

interface Schema {
  name: string;
  description: string;
  version: number;
  json_schema: any;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const PRESET_SCHEMAS = [
  {
    name: 'procurement_v1',
    titleKey: 'procurementTitle',
    descKey: 'procurementDesc',
    color: 'blue',
    json: {
      "type": "object",
      "properties": {
        "purchase_id": { "type": "string", "description": "Unique identifier for the purchase" },
        "purchase_date": { "type": "string", "format": "date" },
        "supplier_name": { "type": "string" },
        "amount": { "type": "number" },
        "municipality_code": { "type": "integer" },
        "contract_status": { "type": "string", "enum": ["active", "completed", "cancelled"] }
      },
      "required": ["purchase_id", "supplier_name", "amount"]
    }
  },
  {
    name: 'retail_sales_v1',
    titleKey: 'retailTitle',
    descKey: 'retailDesc',
    color: 'emerald',
    json: {
      "type": "object",
      "properties": {
        "transaction_id": { "type": "string" },
        "sku": { "type": "string" },
        "quantity": { "type": "integer", "minimum": 1 },
        "unit_price": { "type": "number", "minimum": 0 },
        "store_location": { "type": "string" }
      },
      "required": ["transaction_id", "sku", "unit_price"]
    }
  }
];

function App() {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  
  // Language State
  const [lang, setLang] = useState<Language>('pt'); // Default to PT as requested by user context implies PT interest

  // Helper for translations
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[lang][key];

  // Register Schema Form (Advanced)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [schemaName, setSchemaName] = useState('');
  const [schemaDesc, setSchemaDesc] = useState('');
  const [schemaJson, setSchemaJson] = useState(JSON.stringify(PRESET_SCHEMAS[0].json, null, 2));
  
  // Validation
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [useMapping, setUseMapping] = useState(false);

  // Mapping
  const [mappingRules, setMappingRules] = useState(JSON.stringify({
    "nome_fornecedor": "supplier_name",
    "valor_total": "amount",
    "id_compra": "purchase_id"
  }, null, 2));

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    {
      targetId: 'quick-start-section',
      title: t('tutorialStep1Title'),
      content: t('tutorialStep1Content'),
      position: 'bottom'
    },
    {
      targetId: 'validate-file-section',
      title: t('tutorialStep2Title'),
      content: t('tutorialStep2Content'),
      position: 'left'
    },
    {
      targetId: 'mapping-section',
      title: t('tutorialStep3Title'),
      content: t('tutorialStep3Content'),
      position: 'top'
    },
  ];

  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    try {
      const res = await axios.get(`${API_URL}/schemas`);
      setSchemas(res.data);
      if (res.data.length > 0 && !selectedSchema) {
        setSelectedSchema(res.data[0].name);
      }
    } catch (err) {
      console.error("Error fetching schemas", err);
    }
  };

  const handleRegister = async (name: string, desc: string, json: any) => {
    try {
      await axios.post(`${API_URL}/schemas`, {
        name: name,
        description: desc,
        json_schema: json
      });
      alert(`Schema "${name}" ${t('alertSchemaRegistered')}`);
      await fetchSchemas();
      setSelectedSchema(name);
    } catch (err) {
      alert(t('alertErrorRegister'));
      console.error(err);
    }
  };

  const manualRegister = () => {
    try {
      const parsed = JSON.parse(schemaJson);
      handleRegister(schemaName, schemaDesc, parsed);
      setSchemaName('');
      setSchemaDesc('');
    } catch (e) {
      alert(t('alertInvalidJson'));
    }
  };

  const validateFile = async () => {
    if (!file || !selectedSchema) return;
    setValidating(true);
    setValidationResult(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await axios.post(`${API_URL}/validate-file?schema_name=${selectedSchema}&apply_mapping=${useMapping}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setValidationResult(res.data);
    } catch (err) {
      console.error(err);
      alert(t('alertValidationFailed'));
    } finally {
      setValidating(false);
    }
  };

  const saveMapping = async () => {
    try {
      const parsed = JSON.parse(mappingRules);
      await axios.post(`${API_URL}/schemas/mapping`, {
        schema_name: selectedSchema,
        mapping_rules: parsed
      });
      alert(`${t('alertMappingSaved')} ${selectedSchema}!`);
    } catch (err) {
      alert(t('alertInvalidMapping'));
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'pt' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">SG</div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Schema Guard</span>
          </div>
          <div className="flex gap-4 items-center">
            {/* Language Toggle */}
            <button 
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition-colors border border-slate-200 flex items-center gap-2"
            >
              <span>{lang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            <button
              onClick={() => setShowTutorial(true)}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 text-sm flex items-center gap-2"
            >
               <span>📝</span> {t('startTour')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Section 1: Quick Start (The "2 Schemas") */}
        <section id="quick-start-section" className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold text-slate-800">{t('quickStartTitle')}</h2>
             <span className="text-sm text-slate-500 hidden sm:block">{t('quickStartDesc')}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRESET_SCHEMAS.map((preset) => (
              <div 
                key={preset.name}
                className={`relative overflow-hidden group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all hover:border-${preset.color}-300 p-6 flex flex-col justify-between`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full bg-${preset.color}-500`} />
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {t(preset.titleKey as any)}
                    </h3>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{preset.name}</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">{t(preset.descKey as any)}</p>
                </div>
                <button
                  onClick={() => handleRegister(preset.name, t(preset.descKey as any), preset.json)}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm bg-slate-50 hover:bg-${preset.color}-50 text-slate-700 hover:text-${preset.color}-700 border border-slate-200 hover:border-${preset.color}-200 transition-colors flex items-center justify-center gap-2`}
                >
                  {t('registerLoad')}
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Manual Register + Settings) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Manual Registration Accordion */}
            <div id="register-schema-section" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex justify-between items-center p-6 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                   <div className="bg-slate-200 p-2 rounded-full text-slate-500">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                   </div>
                   <div>
                     <h3 className="font-semibold text-slate-800">{t('customSchemaTitle')}</h3>
                     <p className="text-xs text-slate-500">{t('customSchemaDesc')}</p>
                   </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {showAdvanced && (
                <div className="p-6 border-t border-slate-200 space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('nameLabel')}</label>
                    <input type="text" value={schemaName} onChange={e => setSchemaName(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" placeholder="e.g. custom_v1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('descLabel')}</label>
                    <input type="text" value={schemaDesc} onChange={e => setSchemaDesc(e.target.value)} className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('jsonLabel')}</label>
                    <textarea value={schemaJson} onChange={e => setSchemaJson(e.target.value)} className="w-full h-32 font-mono text-xs rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" />
                  </div>
                  <button onClick={manualRegister} className="w-full bg-slate-800 text-white py-2 rounded-md hover:bg-slate-900 transition-colors">{t('registerCustom')}</button>
                </div>
              )}
            </div>

            {/* Mapping Section */}
            <div id="mapping-section" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800">{t('adapterMappingTitle')}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                {t('adapterMappingDesc')}
              </p>
              
              <div className="space-y-3">
                 <div className="relative">
                   <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">JSON</div>
                   <textarea 
                    value={mappingRules} 
                    onChange={e => setMappingRules(e.target.value)}
                    className="w-full h-32 font-mono text-xs bg-slate-50 rounded-lg border-slate-200 focus:border-purple-500 focus:ring-purple-500 p-3 leading-relaxed"
                   />
                 </div>
                 <button 
                  onClick={saveMapping}
                  disabled={!selectedSchema}
                  className="w-full py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium text-sm disabled:opacity-50"
                 >
                   {t('saveMapping')} {selectedSchema || '...'}
                 </button>
              </div>
            </div>

          </div>

          {/* Right Column (Validation) */}
          <div className="lg:col-span-7 space-y-8">
             <div id="validate-file-section" className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-8 bg-green-500 rounded-full inline-block"></span>
                    {t('validatorConsole')}
                  </h2>
                  <div className="text-sm text-slate-500">
                    {t('activeSchema')}: <span className="font-mono font-bold text-slate-800">{selectedSchema || t('none')}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                   {/* Schema Selector */}
                   <div>
                     <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{t('selectTargetSchema')}</label>
                     <select 
                        value={selectedSchema} 
                        onChange={e => setSelectedSchema(e.target.value)}
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm transition-shadow"
                      >
                        <option value="">{t('chooseSchema')}</option>
                        {schemas.map(s => (
                          <option key={s.name} value={s.name}>{s.name} (v{s.version})</option>
                        ))}
                      </select>
                   </div>

                   {/* Upload Area */}
                   <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors group">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <input 
                        type="file" 
                        id="file-upload"
                        onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                        className="hidden" 
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-600 font-semibold hover:underline">{t('clickToUpload')}</span>
                        <span className="text-slate-500"> {t('dragDrop')}</span>
                        <p className="text-xs text-slate-400 mt-2">{t('fileType')}</p>
                      </label>
                      {file && (
                        <div className="mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                           {file.name}
                        </div>
                      )}
                   </div>

                   <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg">
                      <input
                        id="useMapping"
                        type="checkbox"
                        checked={useMapping}
                        onChange={e => setUseMapping(e.target.checked)}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="useMapping" className="flex flex-col cursor-pointer">
                        <span className="text-sm font-medium text-slate-800">{t('applyMapping')}</span>
                        <span className="text-xs text-slate-500">{t('applyMappingDesc')}</span>
                      </label>
                   </div>

                   <button 
                      onClick={validateFile}
                      disabled={!file || !selectedSchema || validating}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-3"
                    >
                      {validating ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          {t('validating')}
                        </>
                      ) : (
                        <>{t('validatePayload')}</>
                      )}
                    </button>
                </div>
             </div>

             {/* Results Area */}
             {validationResult && (
                <div className={clsx(
                  "rounded-xl border p-6 shadow-sm animate-fade-in", 
                  validationResult.valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={clsx("p-3 rounded-full shrink-0", validationResult.valid ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                      {validationResult.valid ? (
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                         <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={clsx("text-lg font-bold mb-2", validationResult.valid ? "text-green-800" : "text-red-800")}>
                        {validationResult.valid ? t('validationSuccess') : t('validationFailed')}
                      </h3>
                      {validationResult.valid ? (
                        <p className="text-green-700">{t('validationSuccessMsg').replace('schema', selectedSchema)}</p>
                      ) : (
                        <div className="text-red-700">
                          <p className="mb-2 font-medium">{t('foundErrors')}</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm max-h-60 overflow-y-auto custom-scrollbar">
                            {validationResult.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </main>

      {showTutorial && (
        <Tutorial 
          steps={tutorialSteps} 
          onClose={() => setShowTutorial(false)}
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}

export default App;
