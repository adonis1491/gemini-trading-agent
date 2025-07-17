import { Type } from '@google/genai';

export interface GroundingSource {
  uri: string;
  title: string;
}

// --- Schemas for Structured JSON output from Gemini ---

export const FundamentalAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    companyHealth: { type: Type.STRING, description: '基於公司基本面數據，對其財務健康的總體摘要。' },
    keyMetrics: {
      type: Type.ARRAY,
      description: '列出3-5個關鍵財務指標（例如，本益比、每股盈餘、營收增長、負債權益比）。',
      items: { type: Type.STRING },
    },
    redFlags: {
      type: Type.ARRAY,
      description: '列出潛在的財務警訊或疑慮。',
      items: { type: Type.STRING },
    },
  },
  required: ['companyHealth', 'keyMetrics', 'redFlags']
};

export const SentimentAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallSentiment: { type: Type.STRING, description: '整體市場情緒（例如，非常看漲、看漲、中性、看跌、非常看跌）。' },
        keyThemes: {
            type: Type.ARRAY,
            description: '列出2-4個在社群媒體和新聞評論中推動市場情緒的關鍵主題。',
            items: { type: Type.STRING }
        },
        psyAnalysis: {
            type: Type.OBJECT,
            description: "對PSY心理線指標的分析。如果找不到確切PSY數值，請基於過去12天上漲天數進行原理分析。",
            properties: {
                value: { type: Type.STRING, description: "目前的PSY指標數值，或基於上漲天數的估算，若無法取得請註明。" },
                interpretation: { type: Type.STRING, description: "PSY數值的市場意涵（例如：處於超買區、超賣區、或中性區）。" },
                summary: { type: Type.STRING, description: "總結PSY指標所反映的投資人心理狀態。" }
            },
            required: ['value', 'interpretation', 'summary']
        }
    },
    required: ['overallSentiment', 'keyThemes', 'psyAnalysis']
};


export const NewsAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        recentHeadlines: {
            type: Type.ARRAY,
            description: '總結2-3則近期最有影響力的新聞頭條。',
            items: { type: Type.STRING },
        },
        macroImpact: {
            type: Type.STRING,
            description: '分析宏觀經濟因素（如利率、通膨）對該股票的影響。'
        }
    },
    required: ['recentHeadlines', 'macroImpact']
};

export const TechnicalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        recommendation: { type: Type.STRING, description: '基於以下分析，提供明確的買進、賣出或觀望建議。' },
        keySignal: { type: Type.STRING, description: '從分析中提取的最關鍵的單一技術訊號（例如：突破5日均線、KD黃金交叉、RSI超買）。' },
        closingPriceAnalysis: {
            type: Type.OBJECT,
            description: '分析前一個交易日的收盤價與成交量，特別是成交量與5日均量的對比。',
            properties: {
                priceSummary: { type: Type.STRING, description: '描述收盤價的變動情況（例如：上漲/下跌點數、百分比）。' },
                volumeSummary: { type: Type.STRING, description: '描述成交量的變動，並與5日均量比較（例如：顯著放大，為5日均量的150%）。' },
                volumeSignal: { type: Type.STRING, description: '基於成交量變動（對比5日均量超過130%或低於70%）提取的明確訊號，若無則為"無明顯訊號"。' },
            },
            required: ['priceSummary', 'volumeSummary', 'volumeSignal']
        },
        movingAverageAnalysis: { type: Type.STRING, description: '分析目前股價相對於5日均線的位置，以及其他重要均線（如20日、60日）的關係。' },
        indicatorAnalysis: {
            type: Type.OBJECT,
            properties: {
                rsi: { type: Type.STRING, description: 'RSI指標的數值與解讀（例如：75 - 處於超買區）。' },
                kd: { type: Type.STRING, description: 'KD指標的狀態與解讀（例如：K值85, D值80, 高檔鈍化）。' }
            },
            required: ['rsi', 'kd']
        }
    },
    required: ['recommendation', 'keySignal', 'closingPriceAnalysis', 'movingAverageAnalysis', 'indicatorAnalysis']
};

export const ChipAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        trend: { type: Type.STRING, description: '總結籌碼分佈的整體趨勢（例如：籌碼趨於集中、籌碼趨於分散、無明顯變化）。' },
        majorShareholderAction: { type: Type.STRING, description: '描述千張以上大股東的持股比例變化趨勢。' },
        retailInvestorAction: { type: Type.STRING, description: '描述散戶（例如十張以下）的持股比例變化趨勢。' },
        priceImpactPrediction: { type: Type.STRING, description: '基於籌碼變化，預測對未來股價的潛在影響。' }
    },
    required: ['trend', 'majorShareholderAction', 'retailInvestorAction', 'priceImpactPrediction']
};

export const ManagerReportSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "最終的質化投資總結與建議。" },
      finalScore: { type: Type.INTEGER, description: "一個0到99之間的綜合評分，0代表強力賣出，99代表強力買進。" },
    },
    required: ['summary', 'finalScore']
  };

// --- Interfaces for holding the analysis data in the app ---

export interface FundamentalAnalysis {
  companyHealth: string;
  keyMetrics: string[];
  redFlags: string[];
}

export interface PSYAnalysis {
    value: string;
    interpretation: string;
    summary: string;
}

export interface SentimentAnalysis {
  overallSentiment: string;
  keyThemes: string[];
  psyAnalysis: PSYAnalysis;
}

export interface NewsAnalysis {
  recentHeadlines: string[];
  macroImpact: string;
}

export interface TechnicalAnalysis {
    recommendation: string;
    keySignal: string;
    closingPriceAnalysis: {
        priceSummary: string;
        volumeSummary: string;
        volumeSignal: string;
    };
    movingAverageAnalysis: string;
    indicatorAnalysis: {
        rsi: string;
        kd: string;
    };
}

export interface ChipAnalysis {
    trend: string;
    majorShareholderAction: string;
    retailInvestorAction: string;
    priceImpactPrediction: string;
}

export interface ManagerReport {
    summary: string;
    finalScore: number;
}

export interface StockAnalysisResult {
  fundamental: FundamentalAnalysis | null;
  sentiment: SentimentAnalysis | null;
  news: NewsAnalysis | null;
  technical: TechnicalAnalysis | null;
  chip: ChipAnalysis | null;
  managerReport: ManagerReport | null;
  sources: GroundingSource[];
}

export enum AgentStatus {
    PENDING = 'PENDING',
    WORKING = 'WORKING',
    DONE = 'DONE',
    ERROR = 'ERROR'
}

export type AnalysisStatus = {
    fundamental: AgentStatus;
    sentiment: AgentStatus;
    news: AgentStatus;
    technical: AgentStatus;
    chip: AgentStatus;
    manager: AgentStatus;
};