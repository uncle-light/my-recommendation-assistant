import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { recommendationAgent } from '../agents/recommendation-agent';

// 会话工作流输入schema
const SessionWorkflowInputSchema = z.object({
  userId: z.string().describe('用户ID'),
  sessionId: z.string().describe('会话ID'),
  message: z.string().describe('用户消息'),
  context: z.object({
    deviceType: z.string().optional().describe('设备类型'),
    source: z.string().optional().describe('流量来源'),
    previousMessages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
      timestamp: z.string(),
    })).optional().describe('历史消息'),
  }).optional().describe('会话上下文'),
});

// 会话工作流输出schema
const SessionWorkflowOutputSchema = z.object({
  response: z.string().describe('助手回复'),
  sessionId: z.string().describe('会话ID'),
  recommendations: z.array(z.object({
    itemId: z.string(),
    title: z.string(),
    reason: z.string(),
    score: z.number(),
  })).optional().describe('推荐结果'),
  nextActions: z.array(z.string()).optional().describe('建议的下一步操作'),
  sessionState: z.object({
    phase: z.enum(['greeting', 'inquiry', 'recommendation', 'comparison', 'decision']).describe('会话阶段'),
    userIntent: z.string().optional().describe('用户意图'),
    extractedPreferences: z.record(z.string(), z.any()).optional().describe('提取的偏好'),
  }).describe('会话状态'),
});

// 步骤1: 使用Shopping Assistant Agent分析用户意图
const analyzeIntentStep = createStep({
  id: 'analyzeIntent',
  inputSchema: SessionWorkflowInputSchema,
  outputSchema: z.object({
    userId: z.string(),
    sessionId: z.string(),
    message: z.string(),
    intent: z.string(),
    entities: z.record(z.string(), z.any()),
    confidence: z.number(),
    context: z.object({
      deviceType: z.string().optional(),
      source: z.string().optional(),
      previousMessages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
      })).optional(),
    }).optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    // 使用Recommendation Agent进行意图分析
    const agent = mastra.getAgent('recommendationAgent');
    
    // 构建上下文信息
    const contextInfo = inputData.context?.previousMessages 
      ? `历史对话: ${inputData.context.previousMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`
      : '';
    
    const prompt = `
请分析用户消息的意图和实体信息：
用户消息: "${inputData.message}"
设备类型: ${inputData.context?.deviceType || '未知'}
流量来源: ${inputData.context?.source || '未知'}
${contextInfo}

请以JSON格式返回分析结果，包含以下字段：
- intent: 用户意图类型
- entities: 提取的实体信息
- confidence: 置信度(0-1)
- preferences: 用户偏好信息
`;

    try {
      const response = await agent.generate(prompt, {
        memory: {
          thread: inputData.sessionId,
          resource: inputData.userId
        }
      });

      // 解析Agent响应
      let analysisResult;
      try {
        analysisResult = JSON.parse(response.text);
      } catch (parseError) {
        // 如果解析失败，使用简单的规则匹配作为后备
        const message = inputData.message.toLowerCase();
        analysisResult = {
          intent: message.includes('推荐') ? 'recommendation' : 
                  message.includes('搜索') ? 'search' : 
                  message.includes('比较') ? 'comparison' : 
                  message.includes('购买') ? 'purchase' : 'general',
          entities: {},
          confidence: 0.6,
          preferences: {}
        };
      }

      return { 
        userId: inputData.userId,
        sessionId: inputData.sessionId,
        message: inputData.message,
        intent: analysisResult.intent || 'general', 
        entities: analysisResult.entities || {}, 
        confidence: analysisResult.confidence || 0.6,
        context: inputData.context,
      };
    } catch (error) {
      console.error('Agent analysis failed:', error);
      
      // 后备方案：简单规则匹配
      const message = inputData.message.toLowerCase();
      let intent = 'general';
      let confidence = 0.5;
      const entities: Record<string, any> = {};

      if (message.includes('推荐') || message.includes('建议')) {
        intent = 'recommendation';
        confidence = 0.8;
      } else if (message.includes('搜索') || message.includes('找')) {
        intent = 'search';
        confidence = 0.8;
      } else if (message.includes('比较')) {
        intent = 'comparison';
        confidence = 0.8;
      } else if (message.includes('购买') || message.includes('下单')) {
        intent = 'purchase';
        confidence = 0.9;
      }

      return { 
        userId: inputData.userId,
        sessionId: inputData.sessionId,
        message: inputData.message,
        intent, 
        entities, 
        confidence,
        context: inputData.context,
      };
    }
  },
});

// 步骤2: 生成响应
const generateResponseStep = createStep({
  id: 'generateResponse',
  inputSchema: z.object({
    userId: z.string(),
    sessionId: z.string(),
    message: z.string(),
    intent: z.string(),
    entities: z.record(z.string(), z.any()),
    confidence: z.number(),
    context: z.object({
      deviceType: z.string().optional(),
      source: z.string().optional(),
      previousMessages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string(),
      })).optional(),
    }).optional(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    sessionId: z.string(),
    intent: z.string(),
    entities: z.record(z.string(), z.any()),
    response: z.string(),
    recommendations: z.array(z.object({
      itemId: z.string(),
      title: z.string(),
      reason: z.string(),
      score: z.number(),
    })).optional(),
  }),
  execute: async ({ inputData, mastra }) => {
    // 使用Shopping Assistant Agent生成响应
    const agent = mastra.getAgent('shoppingAssistant');
    
    // 构建上下文信息
    const contextInfo = inputData.context?.previousMessages 
      ? `历史对话: ${inputData.context.previousMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`
      : '';
    
    const prompt = `
作为智能购物助手，请根据以下信息生成合适的回复：

用户消息: "${inputData.message}"
识别意图: ${inputData.intent}
提取实体: ${JSON.stringify(inputData.entities)}
置信度: ${inputData.confidence}
设备类型: ${inputData.context?.deviceType || '未知'}
${contextInfo}

请以JSON格式返回响应，包含以下字段：
- response: 自然的对话回复
- recommendations: 推荐商品列表(如果适用)，每个商品包含itemId、title、reason、score
- nextActions: 建议的下一步操作

请确保回复自然、有帮助，并根据用户意图提供相应的服务。
`;

    try {
      const response = await agent.generate(prompt, {
        memory: {
          thread: inputData.sessionId,
          resource: inputData.userId
        }
      });

      // 解析Agent响应
      let agentResult;
      try {
        agentResult = JSON.parse(response.text);
      } catch (parseError) {
        // 如果解析失败，使用简单的响应作为后备
        agentResult = {
          response: response.text || '抱歉，我现在无法处理您的请求，请稍后再试。',
          recommendations: undefined,
          nextActions: []
        };
      }

      return {
        userId: inputData.userId,
        sessionId: inputData.sessionId,
        intent: inputData.intent,
        entities: inputData.entities,
        response: agentResult.response || '抱歉，我现在无法处理您的请求。',
        recommendations: agentResult.recommendations,
      };
    } catch (error) {
      console.error('Agent response generation failed:', error);
      
      // 后备方案：简单的规则响应
      let response = '';
      let recommendations: Array<{itemId: string, title: string, reason: string, score: number}> | undefined;

      switch (inputData.intent) {
        case 'recommendation':
          response = '根据您的需求，我为您推荐以下商品：';
          recommendations = [
            {
              itemId: 'item_001',
              title: 'iPhone 15 Pro',
              reason: '性能强劲，拍照效果出色',
              score: 0.95,
            },
            {
              itemId: 'item_002',
              title: 'MacBook Air M3',
              reason: '轻薄便携，续航优秀',
              score: 0.90,
            },
          ];
          break;
        case 'search':
          response = '我正在为您搜索相关商品，请稍等...';
          break;
        case 'comparison':
          response = '我来为您对比这些商品的特点和优势：';
          break;
        case 'purchase':
          response = '好的，我来帮您完成购买流程。';
          break;
        default:
          response = '您好！我是您的购物助手，有什么可以帮助您的吗？';
      }

      // 如果有实体信息，添加到响应中
      if (Object.keys(inputData.entities).length > 0) {
        response += `\n我注意到您提到了：${JSON.stringify(inputData.entities)}`;
      }

      return {
        userId: inputData.userId,
        sessionId: inputData.sessionId,
        intent: inputData.intent,
        entities: inputData.entities,
        response,
        recommendations,
      };
    }
  },
});

// 步骤3: 更新会话状态
const updateSessionStateStep = createStep({
  id: 'updateSessionState',
  inputSchema: z.object({
    userId: z.string(),
    sessionId: z.string(),
    intent: z.string(),
    entities: z.record(z.string(), z.any()),
    response: z.string(),
    recommendations: z.array(z.object({
      itemId: z.string(),
      title: z.string(),
      reason: z.string(),
      score: z.number(),
    })).optional(),
  }),
  outputSchema: SessionWorkflowOutputSchema,
  execute: async ({ inputData }) => {
    // 根据意图确定会话阶段
    let phase: 'greeting' | 'inquiry' | 'recommendation' | 'comparison' | 'decision' = 'inquiry';
    
    switch (inputData.intent) {
      case 'recommendation':
        phase = 'recommendation';
        break;
      case 'comparison':
        phase = 'comparison';
        break;
      case 'purchase':
        phase = 'decision';
        break;
      default:
        phase = 'inquiry';
    }

    // 生成下一步建议
    const nextActions: string[] = [];
    switch (phase) {
      case 'inquiry':
        nextActions.push('询问更具体的需求');
        nextActions.push('了解预算范围');
        nextActions.push('确认使用场景');
        break;
      case 'recommendation':
        nextActions.push('展示推荐商品');
        nextActions.push('解释推荐理由');
        nextActions.push('询问是否需要更多选择');
        break;
      case 'comparison':
        nextActions.push('对比商品特性');
        nextActions.push('分析优缺点');
        nextActions.push('提供购买建议');
        break;
      case 'decision':
        nextActions.push('确认购买意向');
        nextActions.push('提供购买链接');
        nextActions.push('介绍售后服务');
        break;
      default:
        nextActions.push('继续对话');
    }

    return {
      response: inputData.response,
      sessionId: inputData.sessionId,
      recommendations: inputData.recommendations,
      nextActions,
      sessionState: {
        phase,
        userIntent: inputData.intent,
        extractedPreferences: inputData.entities,
      },
    };
  },
});

// 创建会话工作流
export const sessionWorkflow = createWorkflow({
  id: 'sessionWorkflow',
  inputSchema: SessionWorkflowInputSchema,
  outputSchema: SessionWorkflowOutputSchema,
})
  .then(analyzeIntentStep)
  .then(generateResponseStep)
  .then(updateSessionStateStep);

sessionWorkflow.commit();

export type SessionWorkflowInput = z.infer<typeof SessionWorkflowInputSchema>;
export type SessionWorkflowOutput = z.infer<typeof SessionWorkflowOutputSchema>;