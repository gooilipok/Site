import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Lock, 
  ShieldAlert, 
  FileQuestion, 
  ServerCrash, 
  Home, 
  LogIn, 
  UserPlus, 
  Send, 
  RotateCcw, 
  FileText, 
  PlusCircle, 
  Cog,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export type ErrorType = 401 | 403 | 404 | 500;

interface ErrorPageProps {
  code?: ErrorType;
  title?: string;
  description?: string;
  errorDetails?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 404,
  title,
  description,
  errorDetails
}) => {
  const navigate = useNavigate();

  const getErrorData = () => {
    switch (code) {
      case 401:
        return {
          code: '401',
          badge: 'UNAUTHORIZED_ACCESS',
          badgeColor: 'text-[#f1c40f] border-[#f1c40f]/40 bg-[#f1c40f]/10',
          accentColor: '#f1c40f',
          icon: <Lock className="w-10 h-10 text-[#f1c40f]" />,
          title: title || 'Требуется авторизация',
          subtitle: 'Доступ к запрошенному модулю закрыт для неавторизованных пользователей',
          description: description || 'Для перехода в данный раздел необходимо войти в свою учётную запись BauSquad или пройти быструю процедуру регистрации.',
          actions: (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c5a059] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#f1c40f] transition-all shadow-lg border border-black/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти в аккаунт</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b3d4f] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#34495e] transition-all border border-[#c5a059]/40"
              >
                <UserPlus className="w-4 h-4 text-[#c5a059]" />
                <span>Регистрация</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f1418] text-[#bdc3c7] font-bold text-xs uppercase tracking-wider hover:text-white hover:bg-[#1a252f] transition-all border border-white/10"
              >
                <Home className="w-4 h-4" />
                <span>На главную</span>
              </Link>
            </div>
          )
        };

      case 403:
        return {
          code: '403',
          badge: 'FORBIDDEN_ZONE',
          badgeColor: 'text-[#e74c3c] border-[#e74c3c]/40 bg-[#e74c3c]/10',
          accentColor: '#e74c3c',
          icon: <ShieldAlert className="w-10 h-10 text-[#e74c3c]" />,
          title: title || 'Доступ ограничен',
          subtitle: 'Недостаточно привилегий для доступа к узлу управления',
          description: description || 'У вас нет необходимых прав администратора для просмотра этого ресурса, либо ваш аккаунт находится в ограниченном режиме доступа.',
          actions: (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c5a059] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#f1c40f] transition-all shadow-lg border border-black/20"
              >
                <Home className="w-4 h-4" />
                <span>Личный кабинет</span>
              </Link>
              <a
                href="https://t.me/BauSquadBot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b3d4f] text-[#3498db] font-bold text-xs uppercase tracking-wider hover:bg-[#3498db] hover:text-white transition-all border border-[#3498db]/40"
              >
                <Send className="w-4 h-4" />
                <span>Поддержка @BauSquadBot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f1418] text-[#bdc3c7] font-bold text-xs uppercase tracking-wider hover:text-white hover:bg-[#1a252f] transition-all border border-white/10"
              >
                <span>На главную</span>
              </Link>
            </div>
          )
        };

      case 500:
        return {
          code: '500',
          badge: 'INTERNAL_SERVER_FAULT',
          badgeColor: 'text-[#e67e22] border-[#e67e22]/40 bg-[#e67e22]/10',
          accentColor: '#e67e22',
          icon: <ServerCrash className="w-10 h-10 text-[#e67e22]" />,
          title: title || 'Внутренний сбой сервера',
          subtitle: 'Произошла непредвиденная ошибка при обработке запроса',
          description: description || 'Сервер временно не может завершить операцию. Мы уже фиксируем инцидент в журналах телеметрии. Попробуйте обновить страницу.',
          actions: (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c5a059] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#f1c40f] transition-all shadow-lg border border-black/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Обновить страницу</span>
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b3d4f] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#34495e] transition-all border border-[#c5a059]/40"
              >
                <Home className="w-4 h-4 text-[#c5a059]" />
                <span>На главную</span>
              </Link>
              <a
                href="https://t.me/BauSquadBot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f1418] text-[#3498db] font-bold text-xs uppercase tracking-wider hover:bg-[#2b3d4f] transition-all border border-[#3498db]/40"
              >
                <Send className="w-4 h-4" />
                <span>Сообщить в @BauSquadBot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )
        };

      case 404:
      default:
        return {
          code: '404',
          badge: 'ENDPOINT_NOT_FOUND',
          badgeColor: 'text-[#3498db] border-[#3498db]/40 bg-[#3498db]/10',
          accentColor: '#3498db',
          icon: <FileQuestion className="w-10 h-10 text-[#3498db]" />,
          title: title || 'Страница не найдена',
          subtitle: 'Запрошенный узел инфраструктуры не существует или был перемещён',
          description: description || 'Возможно, указан неверный адрес страницы или ресурс был перемещён в другой раздел платформы BauSquad.',
          actions: (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c5a059] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#f1c40f] transition-all shadow-lg border border-black/20"
              >
                <Home className="w-4 h-4" />
                <span>На главную страницу</span>
              </Link>
              <Link
                to="/order/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b3d4f] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#34495e] transition-all border border-[#c5a059]/40"
              >
                <PlusCircle className="w-4 h-4 text-[#c5a059]" />
                <span>Создать заказ</span>
              </Link>
              <Link
                to="/terms"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f1418] text-[#bdc3c7] font-bold text-xs uppercase tracking-wider hover:text-white hover:bg-[#1a252f] transition-all border border-white/10"
              >
                <FileText className="w-4 h-4" />
                <span>Соглашение</span>
              </Link>
            </div>
          )
        };
    }
  };

  const data = getErrorData();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background Animated Mechanical Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden flex items-center justify-center">
        <Cog className="w-96 h-96 text-[#c5a059] animate-[spin_45s_linear_infinite]" />
      </div>

      <div className="max-w-2xl w-full bg-[#1a252f]/95 border-2 border-[#2b3d4f] p-6 sm:p-10 shadow-2xl relative z-10 backdrop-blur-md">
        
        {/* Top Machine Trim Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#c5a059] via-[#3498db] to-[#c5a059]" />

        {/* Industrial Header Block */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-[#e74c3c] rounded-full animate-ping" />
            <span className="text-xs font-mono text-[#7f8c8d] uppercase tracking-widest">
              SYSTEM DIAGNOSTICS MODULE &bull; BAUSQUAD
            </span>
          </div>
          <div className={`px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider border ${data.badgeColor}`}>
            {data.badge}
          </div>
        </div>

        {/* Main Error Presentation */}
        <div className="text-center space-y-4">
          
          {/* Big CNC Numeric Badge */}
          <div className="inline-flex items-center justify-center p-4 bg-[#0f1418] border-2 border-white/10 shadow-inner relative group">
            <div className="flex items-center gap-4 px-4 py-2 bg-[#1a252f]/80 border border-[#c5a059]/30">
              {data.icon}
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white">
                {data.code}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
            {data.title}
          </h1>

          <p className="text-sm font-semibold text-[#c5a059] font-mono">
            {data.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-[#bdc3c7] max-w-lg mx-auto leading-relaxed">
            {data.description}
          </p>

          {/* Technical Trace Box if details provided */}
          {errorDetails && (
            <div className="text-left bg-[#0f1418] border border-red-500/30 p-3 rounded text-[11px] font-mono text-[#e74c3c] overflow-x-auto my-4 max-h-32">
              <span className="text-[#7f8c8d] block mb-1"># ERROR TRACE DETAILS:</span>
              <code>{errorDetails}</code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4">
            {data.actions}
          </div>

          {/* Bottom Telegram Link Note */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7f8c8d]">
            <div className="flex items-center gap-2">
              <span className="text-[#c5a059]">⚙️</span>
              <span>Нужна оперативная помощь?</span>
            </div>
            <a
              href="https://t.me/BauSquadBot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3498db] hover:underline font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Официальный бот: @BauSquadBot</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export const UnauthorizedPage: React.FC = () => <ErrorPage code={401} />;
export const ForbiddenPage: React.FC = () => <ErrorPage code={403} />;
export const NotFoundPage: React.FC = () => <ErrorPage code={404} />;
export const ServerErrorPage: React.FC = () => <ErrorPage code={500} />;
