import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAIService, ChatMessage } from '../chat/openai.service';

/**
 * 用户画像结构
 */
export interface UserProfile {
  // 职业/身份
  profession?: string;
  // 兴趣爱好
  interests?: string[];
  // 专业领域/技能
  expertise?: string[];
  // 性格特点
  personality?: string[];
  // 目标/需求
  goals?: string[];
  // 背景信息
  context?: string;
  // 沟通风格偏好
  communicationStyle?: string;
  // 知识水平 (beginner | intermediate | expert)
  knowledgeLevel?: string;
  // 最近关注的话题
  recentTopics?: string[];
  // 置信度 (0-1)
  confidence?: number;
  // 分析次数
  analysisCount?: number;
  // 最后更新时间
  lastUpdated?: string;
}

/**
 * 检测是否为身份询问问题的关键词
 */
const IDENTITY_QUESTION_PATTERNS = [
  /我是谁/,
  /你认为我是谁/,
  /你觉得我是什么人/,
  /你对我的了解/,
  /你知道我是谁/,
  /我的身份/,
  /我的画像/,
  /我的特点/,
  /分析一下我/,
  /你了解我吗/,
  /说说我是谁/,
  /我是什么样的人/,
  /介绍一下我/,
  /我的个人信息/,
  /你眼中的我/,
];

@Injectable()
export class UserProfileService {
  private readonly logger = new Logger(UserProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
  ) {}

  /**
   * 获取用户画像
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    });

    if (!user?.profile) {
      return null;
    }

    try {
      return JSON.parse(user.profile) as UserProfile;
    } catch {
      return null;
    }
  }

  /**
   * 检测是否为身份询问问题
   */
  isIdentityQuestion(content: string): boolean {
    const normalizedContent = content.trim().toLowerCase();
    return IDENTITY_QUESTION_PATTERNS.some(pattern => pattern.test(normalizedContent));
  }

  /**
   * 生成用户画像回复
   */
  async generateProfileResponse(userId: string): Promise<string> {
    const profile = await this.getUserProfile(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!profile || !profile.profession) {
      return `您好${user?.name ? ` ${user.name}` : ''}！我们的对话还不够多，我还没有足够的信息来分析您的用户画像。随着我们交流的增加，我会逐渐了解您的：

- 🎯 职业身份
- 💡 兴趣爱好
- 🔧 专业领域
- 🎭 性格特点
- 🎯 目标需求

请继续和我聊天，让我更好地了解您！`;
    }

    const profileParts: string[] = [];

    profileParts.push(`根据我们的对话，以下是我对您的了解：\n`);

    if (profile.profession) {
      profileParts.push(`🎯 **职业身份**：${profile.profession}`);
    }

    if (profile.expertise && profile.expertise.length > 0) {
      profileParts.push(`🔧 **专业领域**：${profile.expertise.join('、')}`);
    }

    if (profile.interests && profile.interests.length > 0) {
      profileParts.push(`💡 **兴趣爱好**：${profile.interests.join('、')}`);
    }

    if (profile.personality && profile.personality.length > 0) {
      profileParts.push(`🎭 **性格特点**：${profile.personality.join('、')}`);
    }

    if (profile.goals && profile.goals.length > 0) {
      profileParts.push(`🎯 **目标需求**：${profile.goals.join('、')}`);
    }

    if (profile.knowledgeLevel) {
      const levelMap: Record<string, string> = {
        beginner: '初学者',
        intermediate: '中级',
        expert: '专家',
      };
      profileParts.push(`📊 **知识水平**：${levelMap[profile.knowledgeLevel] || profile.knowledgeLevel}`);
    }

    if (profile.communicationStyle) {
      profileParts.push(`💬 **沟通风格**：${profile.communicationStyle}`);
    }

    if (profile.recentTopics && profile.recentTopics.length > 0) {
      profileParts.push(`📌 **近期关注**：${profile.recentTopics.join('、')}`);
    }

    if (profile.context) {
      profileParts.push(`\n📝 **背景信息**：${profile.context}`);
    }

    if (profile.confidence) {
      const confidencePercent = Math.round(profile.confidence * 100);
      profileParts.push(`\n*画像置信度：${confidencePercent}%，基于 ${profile.analysisCount || 1} 次对话分析*`);
    }

    return profileParts.join('\n\n');
  }

  /**
   * 基于对话分析并更新用户画像
   */
  async analyzeAndUpdateProfile(
    userId: string,
    messages: ChatMessage[],
  ): Promise<void> {
    try {
      // 获取现有画像
      const existingProfile = await this.getUserProfile(userId);

      // 只提取用户消息进行分析
      const userMessages = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n---\n');

      if (!userMessages.trim()) {
        return;
      }

      // 构建分析提示
      const analysisPrompt = this.buildAnalysisPrompt(existingProfile, userMessages);

      // 调用 AI 分析
      const response = await this.openaiService.chat([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: userMessages },
      ], {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 1000,
      });

      // 解析 AI 返回的画像
      const newProfile = this.parseProfileResponse(response.content, existingProfile);

      if (newProfile) {
        // 保存更新后的画像
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            profile: JSON.stringify(newProfile),
            profileUpdatedAt: new Date(),
          },
        });

        this.logger.log(`Updated user profile for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to analyze user profile: ${error}`);
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(existingProfile: UserProfile | null, _userMessages: string): string {
    const existingInfo = existingProfile
      ? `\n当前已知的用户画像信息：\n${JSON.stringify(existingProfile, null, 2)}\n\n请在此基础上更新和补充信息。`
      : '';

    return `你是一个用户画像分析专家。根据用户的对话内容，分析并提取用户的特征信息。
${existingInfo}
请分析以下用户消息，并以 JSON 格式返回用户画像信息。只返回 JSON，不要其他内容。

JSON 结构：
{
  "profession": "用户的职业或身份（如：软件工程师、学生、产品经理等）",
  "interests": ["兴趣爱好列表"],
  "expertise": ["专业领域或技能列表"],
  "personality": ["性格特点列表"],
  "goals": ["用户的目标或需求列表"],
  "context": "补充的背景信息描述",
  "communicationStyle": "用户的沟通风格（如：简洁直接、详细深入、友好随和等）",
  "knowledgeLevel": "知识水平：beginner/intermediate/expert",
  "recentTopics": ["最近关注的话题"],
  "confidence": 0.5
}

注意事项：
1. 只填写能从对话中明确推断的信息，不确定的字段留空或不填
2. confidence 表示画像的置信度（0-1），根据信息的充分程度评估
3. 如果某些信息无法从对话中判断，请保留原有值或设为 null
4. 保持客观，不要过度推断
5. 只返回 JSON，不要有其他解释文字`;
  }

  /**
   * 解析 AI 返回的画像响应
   */
  private parseProfileResponse(
    response: string,
    existingProfile: UserProfile | null,
  ): UserProfile | null {
    try {
      // 尝试提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<UserProfile>;

      // 合并现有画像和新分析结果
      const mergedProfile: UserProfile = {
        ...existingProfile,
        ...Object.fromEntries(
          Object.entries(parsed).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        ),
        analysisCount: (existingProfile?.analysisCount || 0) + 1,
        lastUpdated: new Date().toISOString(),
      };

      // 合并数组类型的字段（去重）
      const arrayFields = ['interests', 'expertise', 'personality', 'goals', 'recentTopics'] as const;
      for (const field of arrayFields) {
        if (existingProfile?.[field] || parsed[field]) {
          const existingValues = existingProfile?.[field] || [];
          const newValues = parsed[field] || [];
          mergedProfile[field] = [...new Set([...existingValues, ...newValues])].slice(0, 10);
        }
      }

      return mergedProfile;
    } catch (error) {
      this.logger.error(`Failed to parse profile response: ${error}`);
      return null;
    }
  }
}

