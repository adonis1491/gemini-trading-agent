/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { 
  StockAnalysisResult, 
  GroundingSource,
  FundamentalAnalysis,
  SentimentAnalysis,
  NewsAnalysis,
  TechnicalAnalysis,
  ChipAnalysis,
  ManagerReport,
  FundamentalAnalysisSchema,
  SentimentAnalysisSchema,
  NewsAnalysisSchema,
  TechnicalAnalysisSchema,
  ChipAnalysisSchema,
  ManagerReportSchema,
  AnalysisStatus,
  AgentStatus
} from '../types';

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

// --- Helper for agents that USE Google Search ---
const runSearchAgent = async <T>(
  systemInstruction: string,
  prompt: string,
  responseSchema: object
): Promise<{ result: T; sources: GroundingSource[] }> => {
  try {
    // Inject the schema request into the prompt itself
    const fullPrompt = `${prompt}
    
請以 JSON 格式回覆，並嚴格遵守以下 schema。請不要在 JSON 內容以外添加任何其他文字或 markdown 標記。
\`\`\`json
${JSON.stringify(responseSchema, null, 2)}
\`\`\``;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }], // Use search tool
        // DO NOT use responseMimeType or responseSchema when tools are used
      },
    });

    let jsonString = response.text ?? "";
    
    // The model sometimes wraps the JSON in markdown. Extract it.
    const match = jsonString.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
        jsonString = match[1];
    }
    
    const result = JSON.parse(jsonString.trim()) as T;

    const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: GroundingSource[] = rawSources
      .map((chunk: any) => ({
        uri: chunk.web?.uri,
        title: chunk.web?.title,
      }))
      .filter((source: GroundingSource) => source.uri && source.title);

    return { result, sources };
  } catch (error) {
    console.error(`在指令為 "${systemInstruction}" 的搜尋代理人中發生錯誤`, error);
    throw error;
  }
};

// --- Helper for agents that DON'T use search (e.g., synthesis) ---
const runSynthesisAgent = async <T>(
    systemInstruction: string,
    prompt: string,
    responseSchema: object
): Promise<{ result: T }> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json', // This is allowed because no tools are used
              responseSchema,
            },
          });
      
          if (!response.text) {
            throw new Error("No response text received from Gemini API.");
          }
          const result = JSON.parse(response.text) as T;
          return { result };
    } catch (error) {
        console.error(`在指令為 "${systemInstruction}" 的綜合代理人中發生錯誤`, error);
        throw error;
    }
};

// --- Individual Analyst Agents (use runSearchAgent) ---

const getFundamentalAnalysis = (ticker: string) => runSearchAgent<FundamentalAnalysis>(
  '你是一位基本面分析師。你的任務是根據公司的基本面數據來評估其財務健康狀況。請提供簡潔、數據驅動的分析。使用Google搜尋尋找最新的財務數據。',
  `分析股票代碼為 ${ticker} 的基本面。`,
  FundamentalAnalysisSchema
);

const getSentimentAnalysis = (ticker: string) => runSearchAgent<SentimentAnalysis>(
    '你是一位市場情緒分析師。你的工作是透過分析社群媒體（如 PTT、Dcard、Facebook）、財經論壇和新聞評論，來衡量市場對某支股票的情緒。同時，你必須分析其「PSY心理線」指標。如果無法直接找到PSY數值，請基於其「計算過去12天內上漲天數」的原理進行分析並提供估算。請特別關注台灣市場的討論。使用Google搜尋尋找相關的討論內容以及最新的PSY指標數據。',
    `分析股票代碼為 ${ticker} 的市場情緒，並包含PSY心理線分析。`,
    SentimentAnalysisSchema
);

const getNewsAnalysis = (ticker: string) => runSearchAgent<NewsAnalysis>(
  '你是一位新聞分析師。你負責監控全球及台灣的財經新聞和宏觀經濟指標，以解讀它們對特定股票的影響。請優先搜尋台灣的主流財經媒體（例如：鉅亨網、經濟日報）。使用Google搜尋獲取最新的新聞和經濟數據。',
  `分析股票代碼為 ${ticker} 的最新新聞及宏觀經濟影響。`,
  NewsAnalysisSchema
);

const getTechnicalAnalysis = (ticker: string) => runSearchAgent<TechnicalAnalysis>(
  '你是一位頂尖的台股技術分析師。你的任務是分析指定股票最新的技術面，並提供明確的操作建議。請嚴格根據以下步驟進行：\n1. **尋找最新收盤資訊**: 搜尋並分析該股票「最新可得的收盤價」與「成交量」。若分析時間在交易日16:00之後，應盡力使用當日資料。\n2. **價量關係分析**: 分析收盤價與成交量的變化。特別注意，若最新成交量大於五日均量的130%或小於70%，請在`volumeSignal`中標記為特別訊號。\n3. **均線分析**: 分析目前股價與「5日移動平均線」的關係，並提及其他關鍵均線（如月線、季線）的支撐或壓力。\n4. **指標分析**: 分析「RSI」與「KD」隨機指標的數值與狀態，判斷市場是否過熱或過冷，以及是否有交叉訊號。\n5. **綜合判斷**: 總結以上資訊，識別出最關鍵的技術訊號，並提出一個明確、直接的「買進」、「賣出」或「觀望」建議。',
  `為股票代碼為 ${ticker} 提供技術分析。`,
  TechnicalAnalysisSchema
);

const getChipAnalysis = (ticker: string) => runSearchAgent<ChipAnalysis>(
    '你是一位籌碼分析師。你的任務是分析台股的股權分散表，評估大股東（千張以上）與散戶（十張以下）的持股比例變化，並預測此變化對股價的潛在影響。請模仿 goodinfo.tw 網站的分析風格。使用Google搜尋尋找最新的籌碼分佈數據。',
    `分析股票代碼為 ${ticker} 的籌碼分佈與趨勢。`,
    ChipAnalysisSchema
);

// --- Manager Agent (uses runSynthesisAgent) ---

const getManagerReport = async (ticker: string, reports: Partial<StockAnalysisResult>): Promise<{ result: ManagerReport }> => {
    const prompt = `
    作為一位頂尖的量化投資組合經理，你的任務是綜合分析師團隊的報告，並產出一個包含質化總結和量化評分的最終決策。

    請嚴格遵循以下步驟：
    1.  **評分**: 仔細閱讀每一份分析師報告，並為每一份報告打一個分數（0-99分），0分代表極度看跌/負面，99分代表極度看漲/正面。
    2.  **加權計算**: 使用以下權重計算最終的加權平均分數。如果某份報告為「無資料」，請在計算加權平均時忽略該項，並將其權重按比例分配給其他可用的報告。
        *   技術分析: 60%
        *   基本面分析: 10%
        *   籌碼分析: 10%
        *   市場情緒分析: 10%
        *   新聞分析: 10%
        *   將最終結果四捨五入為整數。
    3.  **撰寫總結**: 根據所有報告和你的量化評分，撰寫一份專業的投資總結。總結需要包含對多空觀點的權衡，並給出明確的投資建議（例如，強力買進、觀望、賣出等）。
    4.  **輸出**: 將你的「總結」和計算出的「最終分數」以指定的 JSON 格式回覆。

    **分析報告如下：**

    **基本面分析：**
    ${reports.fundamental ? JSON.stringify(reports.fundamental, null, 2) : "無資料。"}

    **市場情緒分析：**
    ${reports.sentiment ? JSON.stringify(reports.sentiment, null, 2) : "無資料。"}
    
    **新聞分析：**
    ${reports.news ? JSON.stringify(reports.news, null, 2) : "無資料。"}

    **技術分析：**
    ${reports.technical ? JSON.stringify(reports.technical, null, 2) : "無資料。"}

    **籌碼分析：**
    ${reports.chip ? JSON.stringify(reports.chip, null, 2) : "無資料。"}

    請為股票 ${ticker} 提供你的最終決策。
    `;
    
    return runSynthesisAgent<ManagerReport>(
        '你是一位專業的量化投資組合經理。你的職責是綜合分析師團隊的報告，以做出最終、理由充分的投資決策，包含質化總結與量化評分。請僅使用提供的資訊。',
        prompt,
        ManagerReportSchema
    );
};

// --- Main Orchestrator ---

export const runTradingAgentAnalysis = async (
  ticker: string,
  onProgress: (statusUpdate: Partial<AnalysisStatus>) => void
): Promise<StockAnalysisResult> => {
    
    onProgress({ 
        fundamental: AgentStatus.WORKING, 
        sentiment: AgentStatus.WORKING, 
        news: AgentStatus.WORKING, 
        technical: AgentStatus.WORKING,
        chip: AgentStatus.WORKING,
    });

    const [
        fundamentalResult,
        sentimentResult,
        newsResult,
        technicalResult,
        chipResult,
    ] = await Promise.allSettled([
        getFundamentalAnalysis(ticker),
        getSentimentAnalysis(ticker),
        getNewsAnalysis(ticker),
        getTechnicalAnalysis(ticker),
        getChipAnalysis(ticker),
    ]);
    
    let combinedSources: GroundingSource[] = [];
    const analysisResults: Partial<StockAnalysisResult> = {};
    
    if (fundamentalResult.status === 'fulfilled') {
        analysisResults.fundamental = fundamentalResult.value.result;
        combinedSources.push(...fundamentalResult.value.sources);
        onProgress({ fundamental: AgentStatus.DONE });
    } else {
        analysisResults.fundamental = null;
        onProgress({ fundamental: AgentStatus.ERROR });
        console.error("基本面分析失敗", fundamentalResult.reason);
    }

    if (sentimentResult.status === 'fulfilled') {
        analysisResults.sentiment = sentimentResult.value.result;
        combinedSources.push(...sentimentResult.value.sources);
        onProgress({ sentiment: AgentStatus.DONE });
    } else {
        analysisResults.sentiment = null;
        onProgress({ sentiment: AgentStatus.ERROR });
        console.error("市場情緒分析失敗", sentimentResult.reason);
    }
    
    if (newsResult.status === 'fulfilled') {
        analysisResults.news = newsResult.value.result;
        combinedSources.push(...newsResult.value.sources);
        onProgress({ news: AgentStatus.DONE });
    } else {
        analysisResults.news = null;
        onProgress({ news: AgentStatus.ERROR });
        console.error("新聞分析失敗", newsResult.reason);
    }

    if (technicalResult.status === 'fulfilled') {
        analysisResults.technical = technicalResult.value.result;
        combinedSources.push(...technicalResult.value.sources);
        onProgress({ technical: AgentStatus.DONE });
    } else {
        analysisResults.technical = null;
        onProgress({ technical: AgentStatus.ERROR });
        console.error("技術分析失敗", technicalResult.reason);
    }

    if (chipResult.status === 'fulfilled') {
        analysisResults.chip = chipResult.value.result;
        combinedSources.push(...chipResult.value.sources);
        onProgress({ chip: AgentStatus.DONE });
    } else {
        analysisResults.chip = null;
        onProgress({ chip: AgentStatus.ERROR });
        console.error("籌碼分析失敗", chipResult.reason);
    }

    onProgress({ manager: AgentStatus.WORKING });
    let managerReport: ManagerReport = { summary: "因分析師報告出錯，無法產生經理總結。", finalScore: 50 };

    try {
        const hasSuccessfulReport = analysisResults.fundamental || analysisResults.sentiment || analysisResults.news || analysisResults.technical || analysisResults.chip;
        if (hasSuccessfulReport) {
            const managerResult = await getManagerReport(ticker, analysisResults);
            managerReport = managerResult.result;
            // Manager does not produce new sources, so we don't add any.
            onProgress({ manager: AgentStatus.DONE });
        } else {
            onProgress({ manager: AgentStatus.ERROR });
        }
    } catch(err) {
        console.error("經理代理人失敗", err);
        onProgress({ manager: AgentStatus.ERROR });
    }

    const uniqueSources = Array.from(new Map(combinedSources.map(item => [item.uri, item])).values());
    
    return {
        fundamental: analysisResults.fundamental ?? null,
        sentiment: analysisResults.sentiment ?? null,
        news: analysisResults.news ?? null,
        technical: analysisResults.technical ?? null,
        chip: analysisResults.chip ?? null,
        managerReport,
        sources: uniqueSources
    };
};