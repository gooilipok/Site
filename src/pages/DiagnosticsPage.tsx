import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Database, 
  Send, 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileCode, 
  Activity, 
  Terminal, 
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { apiFetch } from '../utils/api';

interface DiagnosticReport {
  timestamp: string;
  server_software?: string;
  php_version?: string;
  php_sapi?: string;
  document_root?: string;
  script_filename?: string;
  loaded_env_path?: string;
  overall_status?: 'ok' | 'warning' | 'error';
  checks?: {
    scripts?: {
      status: string;
      total_checked: number;
      files: Record<string, {
        name: string;
        description: string;
        status: string;
        exists: boolean;
        readable: boolean;
        size_bytes: number;
        size_formatted: string;
        last_modified: string | null;
      }>;
    };
    php_extensions?: {
      status: string;
      loaded: Record<string, boolean>;
      missing: string[];
      allow_url_fopen: boolean;
      memory_limit: string;
      upload_max_filesize: string;
      post_max_size: string;
    };
    database?: {
      status: string;
      host?: string;
      database?: string;
      user?: string;
      ping_ms?: number;
      tables_count?: number;
      tables?: Record<string, number>;
      error?: string;
    };
    telegram?: {
      status: string;
      ping_ms?: number;
      bot_token_set?: boolean;
      chat_id_set?: boolean;
      chat_id?: string;
      proxy?: string;
      response?: any;
    };
    filesystem?: {
      uploads_dir?: string;
      uploads_exists?: boolean;
      uploads_writable?: boolean;
      can_create_files?: boolean;
      status?: string;
    };
  };
  action_result?: any;
}

interface EndpointCheck {
  url: string;
  label: string;
  status: 'pending' | 'ok' | 'error';
  statusCode?: number;
  timeMs?: number;
  error?: string;
}

export function DiagnosticsPage() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [endpointTests, setEndpointTests] = useState<EndpointCheck[]>([
    { url: '/test.php', label: 'Тестовый скрипт (PHP Echo)', status: 'pending' },
    { url: '/api/health', label: 'API Проверка здоровья (/health)', status: 'pending' },
    { url: '/api/agreements', label: 'Публичные соглашения (/agreements)', status: 'pending' },
    { url: '/api/orders', label: 'Список заказов (/orders)', status: 'pending' },
    { url: '/api/auth/me', label: 'Текущая сессия пользователя (/auth/me)', status: 'pending' },
  ]);

  const runAllDiagnostics = async () => {
    setLoading(true);
    setErrorMsg(null);
    setActionMsg(null);

    // 1. Fetch server diag.php
    try {
      let res = await fetch('/diag.php?format=json');
      if (!res.ok) {
        // Fallback to /api/diag
        res = await apiFetch('/api/diag');
      }
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setErrorMsg(`Сервер вернул статус HTTP ${res.status}. Возможно, diag.php недоступен напрямую.`);
      }
    } catch (e: any) {
      setErrorMsg(`Сетевая ошибка при запросе к /diag.php: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }

    // 2. Test live frontend-to-backend endpoints
    testAllEndpoints();
  };

  const testAllEndpoints = async () => {
    const updated = [...endpointTests];
    for (let i = 0; i < updated.length; i++) {
      const ep = updated[i];
      const start = performance.now();
      try {
        const res = await apiFetch(ep.url);
        const duration = Math.round(performance.now() - start);
        ep.statusCode = res.status;
        ep.timeMs = duration;
        if (res.ok || (res.status === 401 && ep.url.includes('/auth/me'))) {
          // 401 is expected if not logged in
          ep.status = 'ok';
        } else {
          ep.status = 'error';
          ep.error = `HTTP ${res.status}`;
        }
      } catch (err: any) {
        ep.status = 'error';
        ep.timeMs = Math.round(performance.now() - start);
        ep.error = err?.message || 'Network Fail';
      }
      setEndpointTests([...updated]);
    }
  };

  const handleAction = async (action: 'init_db' | 'test_telegram') => {
    setActionLoading(action);
    setActionMsg(null);
    try {
      const res = await fetch(`/diag.php?action=${action}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.action_result?.success) {
          setActionMsg({ type: 'success', text: data.action_result.message || 'Действие выполнено успешно!' });
        } else {
          setActionMsg({ type: 'error', text: data.action_result?.error || 'Ошибка при выполнении действия' });
        }
      } else {
        setActionMsg({ type: 'error', text: `Ошибка HTTP ${res.status}` });
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e?.message || 'Сетевая ошибка' });
    } finally {
      setActionLoading(null);
    }
  };

  const copyDiagnosticJson = () => {
    const dataToCopy = {
      report,
      endpoints: endpointTests,
      url: window.location.href,
      userAgent: navigator.userAgent,
      time: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  useEffect(() => {
    runAllDiagnostics();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-[#182026] p-6 rounded-2xl border border-white/10 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center border border-[#c5a059]/40">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Диагностика и проверка доступности системы</h1>
              <p className="text-sm text-gray-400">Полный аудит PHP скриптов, БД MySQL, API шлюза и окружения хостинга</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="btn-copy-diag"
            onClick={copyDiagnosticJson}
            disabled={!report}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#222c35] hover:bg-[#2c3844] text-gray-200 text-sm font-medium border border-white/10 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Скопировано в буфер' : 'Скопировать отчет'}
          </button>

          <button
            id="btn-refresh-diag"
            onClick={runAllDiagnostics}
            disabled={loading}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a059] hover:bg-[#b08d48] text-black font-semibold text-sm transition-colors shadow-lg shadow-[#c5a059]/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Проверка...' : 'Перепроверить'}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          actionMsg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <div className="text-sm font-medium">{actionMsg.text}</div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-rose-300">Ошибка получения прямого отчета:</div>
              <div className="text-sm text-rose-200/80 mt-1">{errorMsg}</div>
              <div className="text-xs text-rose-300/60 mt-2">
                Вы можете открыть отчет напрямую по ссылке:{' '}
                <a href="/diag.php" target="_blank" rel="noreferrer" className="underline font-mono text-white hover:text-[#c5a059]">
                  /diag.php
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* 1. Environment & Server Card */}
        <div className="bg-[#182026] p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-white font-semibold">
                <Server className="w-5 h-5 text-[#c5a059]" />
                <h3>Окружение веб-сервера</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PHP {report?.php_version || '...'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Веб-сервер:</span>
                <span className="font-mono text-white truncate max-w-[180px]">{report?.server_software || 'Apache / Nginx'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">SAPI интерфейс:</span>
                <span className="font-mono text-white">{report?.php_sapi || 'cgi-fcgi / apache2handler'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Лимит памяти:</span>
                <span className="font-mono text-white">{report?.checks?.php_extensions?.memory_limit || '128M'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Макс. размер файла:</span>
                <span className="font-mono text-white">{report?.checks?.php_extensions?.upload_max_filesize || '32M'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <a 
              href="/test.php" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#c5a059] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Открыть прямой тест /test.php
            </a>
          </div>
        </div>

        {/* 2. Database Card */}
        <div className="bg-[#182026] p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-white font-semibold">
                <Database className="w-5 h-5 text-[#c5a059]" />
                <h3>База данных MySQL</h3>
              </div>
              {report?.checks?.database?.status === 'OK' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Подключено
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Сбой связи
                </span>
              )}
            </div>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Хост MySQL:</span>
                <span className="font-mono text-white">{report?.checks?.database?.host || 'localhost'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Имя базы:</span>
                <span className="font-mono text-white">{report?.checks?.database?.database || 'bau7824897_db'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Время отклика:</span>
                <span className="font-mono text-emerald-400">{report?.checks?.database?.ping_ms ? `${report.checks.database.ping_ms} мс` : '—'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Таблиц создано:</span>
                <span className="font-mono text-white font-bold">{report?.checks?.database?.tables_count ?? 0}</span>
              </div>
            </div>

            {report?.checks?.database?.error && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-xs text-rose-300">
                {report.checks.database.error}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
            <button
              onClick={() => handleAction('init_db')}
              disabled={actionLoading === 'init_db'}
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#222c35] hover:bg-[#2c3844] text-xs font-medium text-gray-200 border border-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-[#c5a059]" />
              {actionLoading === 'init_db' ? 'Инициализация...' : 'Создать/Обновить таблицы'}
            </button>
          </div>
        </div>

        {/* 3. Telegram & Filesystem Card */}
        <div className="bg-[#182026] p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-white font-semibold">
                <Send className="w-5 h-5 text-[#c5a059]" />
                <h3>Telegram & Хранилище</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Активно
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Telegram Бот:</span>
                <span className={`font-medium ${report?.checks?.telegram?.bot_token_set ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {report?.checks?.telegram?.bot_token_set ? 'Токен настроен' : 'Не задан'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Telegram Chat ID:</span>
                <span className="font-mono text-white">{report?.checks?.telegram?.chat_id || '-1003444458319'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Каталог /uploads:</span>
                <span className={`font-medium ${report?.checks?.filesystem?.uploads_writable ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {report?.checks?.filesystem?.uploads_writable ? 'Доступен на запись' : 'Только чтение'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-gray-400">Создание файлов:</span>
                <span className="font-mono text-white">{report?.checks?.filesystem?.can_create_files ? 'OK' : 'Проверьте права 0755'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => handleAction('test_telegram')}
              disabled={actionLoading === 'test_telegram'}
              className="w-full px-3 py-1.5 rounded-lg bg-[#222c35] hover:bg-[#2c3844] text-xs font-medium text-gray-200 border border-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[#c5a059]" />
              {actionLoading === 'test_telegram' ? 'Отправка...' : 'Отправить тестовое уведомление'}
            </button>
          </div>
        </div>
      </div>

      {/* Script Availability Table */}
      <div className="bg-[#182026] rounded-2xl border border-white/10 overflow-hidden mb-8 shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-[#c5a059]" />
            <div>
              <h2 className="text-lg font-bold text-white">Доступность и целостность PHP-скриптов на хостинге</h2>
              <p className="text-xs text-gray-400">Проверка физического наличия файлов в корневой папке сервера</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Статус:</span>
            {report?.checks?.scripts?.status === 'OK' ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Все файлы на месте ({report?.checks?.scripts?.total_checked})
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Требуется загрузка файлов
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#131a20] text-gray-400 text-xs uppercase tracking-wider border-b border-white/5">
              <tr>
                <th className="py-3.5 px-6">Имя файла</th>
                <th className="py-3.5 px-6">Назначение</th>
                <th className="py-3.5 px-6">Статус</th>
                <th className="py-3.5 px-6">Размер</th>
                <th className="py-3.5 px-6">Изменен</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {report?.checks?.scripts?.files && Object.values(report.checks.scripts.files).map((f) => (
                <tr key={f.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-6 font-mono font-semibold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-gray-500" />
                    {f.name}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-gray-300">{f.description}</td>
                  <td className="py-3.5 px-6">
                    {f.exists && f.readable ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Доступен (Чтение OK)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Файл отсутствует или заблокирован
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-xs text-gray-400">{f.size_formatted}</td>
                  <td className="py-3.5 px-6 text-xs text-gray-400">{f.last_modified || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REST API Endpoints Status */}
      <div className="bg-[#182026] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-[#c5a059]" />
            <div>
              <h2 className="text-lg font-bold text-white">Проверка сквозных API маршрутов</h2>
              <p className="text-xs text-gray-400">Тестирование ответа браузера через умный отказоустойчивый роутер</p>
            </div>
          </div>

          <button
            onClick={testAllEndpoints}
            className="px-3.5 py-1.5 rounded-lg bg-[#222c35] hover:bg-[#2c3844] text-xs font-medium text-gray-200 border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Перетестировать API
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {endpointTests.map((ep) => (
            <div key={ep.url} className="p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  ep.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400' :
                  ep.status === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-gray-400'
                }`}>
                  {ep.status === 'ok' ? <CheckCircle2 className="w-4 h-4" /> :
                   ep.status === 'error' ? <XCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
                </div>
                <div>
                  <div className="font-mono text-sm font-semibold text-white">{ep.url}</div>
                  <div className="text-xs text-gray-400">{ep.label}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                {ep.timeMs !== undefined && (
                  <span className="text-gray-400">{ep.timeMs} мс</span>
                )}
                {ep.statusCode !== undefined && (
                  <span className={`px-2.5 py-1 rounded font-bold ${
                    ep.statusCode < 400 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    HTTP {ep.statusCode}
                  </span>
                )}
                {ep.error && (
                  <span className="text-rose-400 text-xs font-sans">{ep.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
