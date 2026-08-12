import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileUp, Send, CheckCircle2, AlertCircle, ArrowLeft, Paperclip, X, Clock, BookOpen, MessageSquare, Info } from 'lucide-react';
import { OrderFile } from '../types';

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, tokens, isAuthenticated } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [price, setPrice] = useState('');
  const [contact, setContact] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<OrderFile[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSuccess, setCreatedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (location.state?.presetTopic) {
      setTitle(location.state.presetTopic);
    }
  }, [location.state]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);

      const previews: OrderFile[] = filesArray.map((f: File) => ({
        id: `file-temp-${Math.random()}`,
        name: f.name,
        size: f.size,
        type: f.type,
        url: URL.createObjectURL(f),
        uploaded_at: new Date().toISOString()
      }));

      setFilePreviews(prev => [...prev, ...previews]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (user?.account_status === 'banned') {
      setError('Ваш аккаунт заблокирован администратором. Подача новых заказов запрещена.');
      return;
    }

    if (!title || !description || !contact) {
      setError('Заполните обязательные поля: Предмет, Описание, Контакт');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        description,
        deadline,
        price: 'На обсуждении',
        contact,
        files: filePreviews
      };

      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      setLoading(false);

      if (!resp.ok) {
        setError(data.error || 'Ошибка при создании заказа');
      } else {
        setCreatedSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch {
      setLoading(false);
      setError('Ошибка сети при отправке заказа');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-[#454d55] text-white font-bold text-xs uppercase hover:bg-[#5a636c] transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад</span>
      </button>

      <div className="bg-[#1a252f] border-t-4 border-[#c5a059] p-8 shadow-2xl relative">
        
        <div className="mb-6 border-b border-[#2b3d4f] pb-4">
          <h1 className="text-2xl font-black uppercase text-white tracking-wider flex items-center gap-2">
            <FileUp className="w-6 h-6 text-[#c5a059]" />
            Создание нового заказа
          </h1>
          <p className="text-xs text-[#bdc3c7] mt-1">
            Заполните форму описания задачи. После отправки мы передадим ваш заказ квалифицированному автору для оценки и выполнения.
          </p>
        </div>

        {/* BANNED USER ALERT */}
        {user?.account_status === 'banned' && (
          <div className="mb-6 p-4 bg-[#e74c3c]/20 border-2 border-[#e74c3c] text-[#e74c3c] text-xs font-bold uppercase flex items-center gap-3">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-sm">⚠️ Аккаунт заблокирован администратором</p>
              <p className="text-[11px] font-normal normal-case text-[#bdc3c7] mt-0.5">
                Возможность создания и отправки новых заказов ограничена. Для выяснения причин свяжитесь с поддержкой BauSquad.
              </p>
            </div>
          </div>
        )}

        {/* ORDER INSTRUCTION BOX */}
        <div className="mb-6 p-4 bg-[#0f1418] border-l-4 border-[#3498db] text-xs text-[#bdc3c7] space-y-2">
          <div className="flex items-center gap-2 text-[#3498db] font-bold uppercase text-[11px]">
            <Info className="w-4 h-4 shrink-0" />
            <span>Инструкция по оформлению заказа</span>
          </div>
          <p className="leading-relaxed">
            1. Укажите предмет, подробно опишите суть задания и прикрепите материалы методички (при наличии).<br />
            2. Укажите желаемый срок сдачи и контактные данные для обратной связи.<br />
            3. <strong className="text-white">После оформления заявки по предоставленным контактным данным с вами свяжется администратор BauSquad для детального обсуждения условий работы и стоимости.</strong>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#e74c3c]/10 border border-[#e74c3c] text-[#e74c3c] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {createdSuccess ? (
          <div className="p-8 bg-[#0f1418] border border-[#2ecc71] text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#2ecc71] mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-white uppercase">Заказ успешно опубликован!</h3>
            <p className="text-xs text-[#bdc3c7]">
              Заказ передан в обработку авторам. Состояние цены: <strong className="text-[#f1c40f]">На обсуждении</strong>. Перенаправляем в личный кабинет...
            </p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Title / Subject */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">
                Предмет / Дисциплина *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Экономика предприятия, Литература, Юриспруденция, Физика"
                  required
                  className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none"
                />
                <BookOpen className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">
                Подробное описание задачи *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Опишите ваши требования: вариант, тип работы, желаемый объем, задержки, требования преподавателя..."
                required
                className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 focus:border-[#c5a059] focus:outline-none text-xs"
              />
            </div>

            {/* Grid row: Deadline & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">
                  Срок / Дедлайн
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="Например: 15.08.2026"
                    className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none text-xs"
                  />
                  <Clock className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">
                  Контакт для связи *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="@username или номер телефона"
                    required
                    className="w-full bg-[#0f1418] border border-[#3d4e5f] text-white p-3 pl-10 focus:border-[#c5a059] focus:outline-none text-xs"
                  />
                  <MessageSquare className="w-4 h-4 text-[#bdc3c7] absolute left-3 top-3.5" />
                </div>
              </div>

            </div>

            {/* FILE UPLOAD DROPZONE */}
            <div>
              <label className="block text-xs font-bold uppercase text-[#c5a059] mb-1">
                Прикрепить файлы методических указаний / материалов / задания
              </label>

              <div className="border-2 border-dashed border-[#3d4e5f] bg-[#0f1418] p-6 text-center hover:border-[#c5a059] transition-all relative cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Paperclip className="w-8 h-8 text-[#c5a059] mx-auto mb-2" />
                <p className="text-xs text-[#bdc3c7]">
                  Перетащите файлы сюда или <strong className="text-[#c5a059]">выберите на компьютере</strong>
                </p>
                <p className="text-[10px] text-[#7f8c8d] mt-1">
                  Поддерживаются: PDF, DOCX, ZIP, JPG, PNG, TXT
                </p>
              </div>

              {/* Selected Files list */}
              {filePreviews.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] font-bold text-white uppercase block">
                    Выбранные файлы ({filePreviews.length}):
                  </span>
                  {filePreviews.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#0f1418] border border-white/10 text-xs text-[#bdc3c7]">
                      <span className="truncate max-w-xs text-white">{f.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#7f8c8d]">{(f.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="text-[#e74c3c] hover:text-white p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ORDER PREVIEW CARD */}
            <div className="p-4 bg-[#0f1418] border-l-4 border-[#c5a059] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#c5a059] font-bold uppercase text-[11px]">
                <FileUp className="w-4 h-4" />
                <span>Превью создаваемого заказа:</span>
              </div>
              <div className="font-mono text-[#bdc3c7] bg-[#1a252f] p-3 border border-white/5 space-y-1">
                <p>📋 <strong>Информация о заказе #ord-NEW</strong></p>
                <p><strong>Предмет:</strong> {title || '...'}</p>
                <p><strong>Дедлайн:</strong> {deadline || 'Не указан'}</p>
                <p><strong>Контакт:</strong> {contact || '...'}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || user?.account_status === 'banned'}
              className={`btn-submit-final flex items-center justify-center gap-2 ${user?.account_status === 'banned' ? 'opacity-50 cursor-not-allowed bg-gray-700' : ''}`}
            >
              <Send className="w-5 h-5" />
              <span>{user?.account_status === 'banned' ? 'Отправка заблокирована' : loading ? 'Публикация заказа...' : 'Отправить заказ'}</span>
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
