import React, { useState, useCallback } from 'react';
import { runTradingAgentAnalysis } from './services/geminiService';
import { StockAnalysisResult, AnalysisStatus, AgentStatus } from './types';
import AnalysisCard from './components/AnalysisCard';
import { ChartBarIcon, ScaleIcon, ChatBubbleOvalLeftEllipsisIcon, NewspaperIcon, UserCircleIcon, UsersIcon } from './components/icons';

const initialStatuses: AnalysisStatus = {
  fundamental: AgentStatus.PENDING,
  sentiment: AgentStatus.PENDING,
  news: AgentStatus.PENDING,
  technical: AgentStatus.PENDING,
  chip: AgentStatus.PENDING,
  manager: AgentStatus.PENDING,
};

const agentConfig = {
    fundamental: { name: '基本面', Icon: ScaleIcon },
    sentiment: { name: '市場情緒', Icon: ChatBubbleOvalLeftEllipsisIcon },
    news: { name: '新聞', Icon: NewspaperIcon },
    technical: { name: '技術面', Icon: ChartBarIcon },
    chip: { name: '籌碼', Icon: UsersIcon },
    manager: { name: '經理', Icon: UserCircleIcon },
}

const StatusDisplay: React.FC<{statuses: AnalysisStatus}> = ({ statuses }) => {
    return (
        <div className="bg-gray-800 rounded-lg p-4 flex flex-wrap justify-center gap-4 mb-8 border border-gray-700">
            {Object.keys(statuses).map(key => {
                const agentKey = key as keyof AnalysisStatus;
                if (!agentConfig[agentKey]) return null;
                const status = statuses[agentKey];
                const { name, Icon } = agentConfig[agentKey];

                let statusColor = 'text-gray-500';
                let statusIcon: React.ReactNode = '...';
                
                switch(status) {
                    case AgentStatus.WORKING:
                        statusColor = 'text-yellow-400';
                        statusIcon = <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
                        break;
                    case AgentStatus.DONE:
                        statusColor = 'text-green-400';
                        statusIcon = '✓';
                        break;
                    case AgentStatus.ERROR:
                        statusColor = 'text-red-400';
                        statusIcon = '✗';
                        break;
                    case AgentStatus.PENDING:
                    default:
                        statusColor = 'text-gray-500';
                        statusIcon = '·';
                        break;
                }

                return (
                    <div key={name} className={`flex items-center gap-2 text-sm font-medium ${statusColor}`}>
                        <Icon className="w-5 h-5"/>
                        <span>{name}</span>
                        <span className="font-mono">{statusIcon}</span>
                    </div>
                );
            })}
        </div>
    );
}


const App: React.FC = () => {
  const [ticker, setTicker] = useState('2330.TW');
  const [analysis, setAnalysis] = useState<StockAnalysisResult | null>(null);
  const [statuses, setStatuses] = useState<AnalysisStatus>(initialStatuses);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async (stockTicker: string) => {
    if (!stockTicker) {
      setError('請輸入股票代碼。');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setStatuses(initialStatuses);

    try {
      const result = await runTradingAgentAnalysis(stockTicker, (update) => {
         setStatuses(prev => ({ ...prev, ...update }));
      });
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || '分析過程中發生未預期的錯誤。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleAnalysis(ticker);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8 font-['Inter',_sans-serif]">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
            Gemini 交易代理
          </h1>
          <p className="text-lg text-gray-400">
            一個由 AI 驅動、用於股市分析的多代理人框架。
          </p>
        </header>

        <main>
          <form onSubmit={handleSubmit} className="mb-8">
            <label htmlFor="ticker-input" className="sr-only">股票代碼</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <ChartBarIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="ticker-input"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                disabled={isLoading}
                placeholder="例如：2330.TW, 2454.TW, 6727.TW"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-md py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 uppercase"
                required
                aria-label="股票代碼"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? '分析中...' : '分析股票'}
            </button>
          </form>

          <div className="results-container">
            {isLoading && <StatusDisplay statuses={statuses} />}
            {error && (
              <div role="alert" className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-md">
                <p className="font-bold">錯誤</p>
                <p>{error}</p>
              </div>
            )}
            {analysis && !isLoading && (
              <AnalysisCard result={analysis} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;