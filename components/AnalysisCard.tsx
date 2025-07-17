import React, { useState } from 'react';
import { StockAnalysisResult, GroundingSource, FundamentalAnalysis, SentimentAnalysis, NewsAnalysis, TechnicalAnalysis, ChipAnalysis, ManagerReport } from '../types';
import { DocumentTextIcon, UserCircleIcon, ScaleIcon, ChatBubbleOvalLeftEllipsisIcon, NewspaperIcon, ChartBarIcon, UsersIcon } from './icons';
import { ScoreGauge } from './ScoreGauge';


const Section: React.FC<{title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean}> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
        <div className="border border-gray-700 rounded-lg">
            <button
                className="w-full flex justify-between items-center p-4 bg-gray-800 hover:bg-gray-700 rounded-t-lg"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="font-semibold text-lg text-white">{title}</h3>
                </div>
                <svg
                    className={`w-6 h-6 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-900 rounded-b-lg">
                    {children}
                </div>
            )}
        </div>
    );
};

const FundamentalReport: React.FC<{data: FundamentalAnalysis}> = ({ data }) => (
    <div className="space-y-3 text-gray-300">
        <p>{data.companyHealth}</p>
        <div>
            <h4 className="font-semibold text-gray-100">關鍵指標：</h4>
            <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                {data.keyMetrics.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
        {data.redFlags.length > 0 && <div>
            <h4 className="font-semibold text-red-400">潛在風險：</h4>
            <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                {data.redFlags.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>}
    </div>
);

const SentimentReport: React.FC<{data: SentimentAnalysis}> = ({ data }) => (
    <div className="space-y-3 text-gray-300">
        <p><strong className="text-gray-100">整體情緒：</strong> {data.overallSentiment}</p>
        <div>
            <h4 className="font-semibold text-gray-100">關鍵主題：</h4>
            <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                {data.keyThemes.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
        {data.psyAnalysis && (
            <div className="pt-3 mt-3 border-t border-gray-700">
                <h4 className="font-semibold text-gray-100">PSY 心理線分析：</h4>
                 {data.psyAnalysis.value && !data.psyAnalysis.value.includes("N/A") && !data.psyAnalysis.value.includes("無法取得") && (
                    <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                       <li><strong className="text-gray-200">指標數值：</strong> {data.psyAnalysis.value}</li>
                       <li><strong className="text-gray-200">市場意涵：</strong> {data.psyAnalysis.interpretation}</li>
                    </ul>
                 )}
                <p className="mt-2">{data.psyAnalysis.summary}</p>
            </div>
        )}
    </div>
);

const NewsReport: React.FC<{data: NewsAnalysis}> = ({ data }) => (
    <div className="space-y-3 text-gray-300">
         <div>
            <h4 className="font-semibold text-gray-100">近期頭條：</h4>
            <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                {data.recentHeadlines.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
        <p><strong className="text-gray-100">宏觀經濟影響：</strong> {data.macroImpact}</p>
    </div>
);

const TechnicalReport: React.FC<{data: TechnicalAnalysis}> = ({ data }) => {
    const getRecommendationClass = (rec: string) => {
        if (rec.includes('買進')) return 'text-green-400';
        if (rec.includes('賣出')) return 'text-red-400';
        return 'text-yellow-400';
    };

    const getSignalClass = (signal: string) => {
        if (signal === '無明顯訊號') return 'text-gray-400';
        return 'text-yellow-300 animate-pulse';
    }

    return (
        <div className="space-y-4 text-gray-300">
            <div>
                <h4 className="font-semibold text-gray-100">操作建議</h4>
                <p className={`text-lg font-bold ${getRecommendationClass(data.recommendation)}`}>{data.recommendation}</p>
            </div>
            <div>
                <h4 className="font-semibold text-gray-100">關鍵技術訊號</h4>
                <p>{data.keySignal}</p>
            </div>
             <div className="pt-3 mt-3 border-t border-gray-700">
                <h4 className="font-semibold text-gray-100">價量分析</h4>
                 <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                    <li><strong className="text-gray-200">價格：</strong> {data.closingPriceAnalysis.priceSummary}</li>
                    <li><strong className="text-gray-200">成交量：</strong> {data.closingPriceAnalysis.volumeSummary}</li>
                    {data.closingPriceAnalysis.volumeSignal !== '無明顯訊號' && 
                        <li><strong className="text-gray-200">特別訊號：</strong> <span className={getSignalClass(data.closingPriceAnalysis.volumeSignal)}>{data.closingPriceAnalysis.volumeSignal}</span></li>
                    }
                </ul>
            </div>
             <div className="pt-3 mt-3 border-t border-gray-700">
                <h4 className="font-semibold text-gray-100">均線分析</h4>
                <p>{data.movingAverageAnalysis}</p>
            </div>
            <div className="pt-3 mt-3 border-t border-gray-700">
                <h4 className="font-semibold text-gray-100">指標分析</h4>
                <ul className="list-disc list-inside pl-2 space-y-1 mt-1">
                    <li><strong className="text-gray-200">RSI：</strong> {data.indicatorAnalysis.rsi}</li>
                    <li><strong className="text-gray-200">KD：</strong> {data.indicatorAnalysis.kd}</li>
                </ul>
            </div>
        </div>
    );
};

const ChipReport: React.FC<{data: ChipAnalysis}> = ({ data }) => (
    <div className="space-y-3 text-gray-300">
        <p><strong className="text-gray-100">整體趨勢：</strong> {data.trend}</p>
        <p><strong className="text-gray-100">大股東動向：</strong> {data.majorShareholderAction}</p>
        <p><strong className="text-gray-100">散戶動向：</strong> {data.retailInvestorAction}</p>
        <p><strong className="text-gray-100">對股價影響預測：</strong> {data.priceImpactPrediction}</p>
    </div>
);


const AnalysisCard: React.FC<{ result: StockAnalysisResult }> = ({ result }) => {
  const { managerReport, sources, fundamental, sentiment, news, technical, chip } = result;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto my-8 animate-fade-in space-y-6">
      
      {/* Manager's Summary */}
      {managerReport && (
        <div className="border border-indigo-500/50 rounded-lg p-5 bg-gray-900">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <UserCircleIcon className="w-7 h-7 text-indigo-400"/>
                經理總結與建議
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <div className="order-2 md:order-1 text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {managerReport.summary}
                </div>
                <div className="order-1 md:order-2">
                    <ScoreGauge score={managerReport.finalScore} />
                </div>
            </div>
        </div>
      )}
      
      {/* Detailed Analyst Reports */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white text-center">詳細分析師報告</h2>
        {fundamental && <Section title="基本面分析" icon={<ScaleIcon className="w-6 h-6 text-blue-400"/>}><FundamentalReport data={fundamental}/></Section>}
        {sentiment && <Section title="市場情緒分析" icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-yellow-400"/>}><SentimentReport data={sentiment}/></Section>}
        {news && <Section title="新聞分析" icon={<NewspaperIcon className="w-6 h-6 text-green-400"/>}><NewsReport data={news}/></Section>}
        {technical && <Section title="技術分析" icon={<ChartBarIcon className="w-6 h-6 text-red-400"/>}><TechnicalReport data={technical}/></Section>}
        {chip && <Section title="籌碼分析" icon={<UsersIcon className="w-6 h-6 text-purple-400"/>}><ChipReport data={chip}/></Section>}
      </div>

       {/* Sources */}
       {sources.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2 text-indigo-400" />
                資訊來源
            </h3>
            <ul className="space-y-2">
                {sources.map((source, index) => (
                    <li key={index} className="text-sm">
                        <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 truncate block"
                            title={source.uri}
                        >
                            {index + 1}. {source.title || source.uri}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
       )}
    </div>
  );
};

export default AnalysisCard;