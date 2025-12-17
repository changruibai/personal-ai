import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx';
import { OptimizeResumeDto } from './dto/optimize-resume.dto';
import { CrawledTemplate, templateCrawler } from './templates/template-crawler';
import { getBuiltinTemplates, getBuiltinTemplateById } from './templates/builtin-templates';
import { renderResumeWithTemplate, templateRenderer } from './templates/template-renderer';

@Injectable()
export class ResumeService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_API_BASE'),
    });
  }

  /**
   * 解析上传的文件，提取文本内容
   */
  async parseFile(file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    try {
      switch (ext) {
        case '.txt':
        case '.md':
          return file.buffer.toString('utf-8');
        
        case '.docx':
          const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
          if (!docxResult.value.trim()) {
            throw new BadRequestException('无法从 Word 文档中提取文本');
          }
          return docxResult.value;
        
        case '.pdf':
          // 动态导入 pdf-parse 避免启动时加载问题
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const pdfParse = require('pdf-parse');
          const pdfResult = await pdfParse(file.buffer);
          if (!pdfResult.text.trim()) {
            throw new BadRequestException('无法从 PDF 中提取文本，可能是扫描版 PDF');
          }
          return pdfResult.text;
        
        default:
          // 尝试作为文本处理
          return file.buffer.toString('utf-8');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`文件解析失败: ${error.message}`);
    }
  }

  /**
   * 解析简历文本，提取结构化信息
   */
  async parseResume(content: string): Promise<{
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    experience?: Array<{
      company: string;
      position: string;
      duration: string;
      description: string;
    }>;
    education?: Array<{
      school: string;
      degree: string;
      major: string;
      duration: string;
    }>;
    skills?: string[];
    rawContent: string;
  }> {
    const systemPrompt = `你是一个专业的简历解析助手。请分析用户提供的简历文本，提取以下结构化信息：
- 姓名 (name)
- 邮箱 (email)
- 电话 (phone)
- 个人简介/目标 (summary)
- 工作经历 (experience): 包含公司名、职位、时间段、工作描述
- 教育背景 (education): 包含学校、学位、专业、时间段
- 技能 (skills): 技能列表

请以 JSON 格式返回，保持原有信息的完整性。如果某些字段无法提取，返回 null。`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    try {
      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return {
        ...parsed,
        rawContent: content,
      };
    } catch {
      return { rawContent: content };
    }
  }

  /**
   * 优化简历内容（流式输出）
   */
  async *optimizeResumeStream(dto: OptimizeResumeDto): AsyncGenerator<string> {
    const { content, instruction, targetPosition, style } = dto;

    let systemPrompt = `你是一位专业的简历优化专家，拥有丰富的人力资源和招聘经验。你的任务是帮助用户优化他们的简历，使其更加专业、有吸引力，并能突出个人优势。

优化原则：
1. 保持信息真实性，不捏造任何内容
2. 使用有力的动词开头描述工作经历
3. 量化成就，使用具体数据
4. 突出与目标职位相关的技能和经验
5. 语言精炼，避免冗余
6. 格式清晰，便于阅读

请直接输出优化后的简历内容，使用 Markdown 格式，包含以下部分：
# 基本信息
# 个人简介
# 工作经历
# 教育背景
# 专业技能
# 项目经历（如有）
# 证书/荣誉（如有）`;

    if (targetPosition) {
      systemPrompt += `\n\n目标职位: ${targetPosition}。请根据该职位要求，重点突出相关经验和技能。`;
    }

    if (style) {
      const styleMap = {
        professional: '专业正式风格，适合传统行业和大型企业',
        creative: '创意活泼风格，适合互联网、设计、媒体等行业',
        academic: '学术严谨风格，适合研究机构、高校等',
        minimal: '简约精炼风格，突出重点，适合高级管理岗位',
      };
      systemPrompt += `\n\n风格要求: ${styleMap[style]}`;
    }

    let userMessage = `请优化以下简历内容：\n\n${content}`;
    if (instruction) {
      userMessage += `\n\n用户特别要求：${instruction}`;
    }

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  /**
   * 生成简历优化建议
   */
  async getSuggestions(content: string): Promise<{
    overall: string;
    improvements: Array<{
      section: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    keywords: string[];
  }> {
    const systemPrompt = `你是一位专业的简历顾问。请分析用户的简历，提供以下反馈：
1. overall: 整体评价（2-3句话）
2. improvements: 改进建议数组，每项包含：
   - section: 涉及的部分（如"工作经历"、"技能"等）
   - suggestion: 具体建议
   - priority: 优先级 (high/medium/low)
3. keywords: 建议添加的关键词列表

请以 JSON 格式返回。`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请分析以下简历并提供建议：\n\n${content}` },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    try {
      return JSON.parse(response.choices[0].message.content || '{}');
    } catch {
      return {
        overall: '无法生成评价',
        improvements: [],
        keywords: [],
      };
    }
  }

  /**
   * 生成简历的 HTML 版本（用于导出 PDF）
   */
  generateResumeHTML(
    content: string,
    style: 'professional' | 'creative' | 'academic' | 'minimal' = 'professional',
  ): string {
    const styles = {
      professional: {
        primaryColor: '#2563eb',
        fontFamily: '"Noto Sans SC", "Helvetica Neue", Arial, sans-serif',
        headerBg: '#1e3a5f',
      },
      creative: {
        primaryColor: '#7c3aed',
        fontFamily: '"Noto Sans SC", "Segoe UI", sans-serif',
        headerBg: '#4c1d95',
      },
      academic: {
        primaryColor: '#059669',
        fontFamily: '"Noto Serif SC", "Times New Roman", serif',
        headerBg: '#064e3b',
      },
      minimal: {
        primaryColor: '#374151',
        fontFamily: '"Noto Sans SC", "Inter", sans-serif',
        headerBg: '#111827',
      },
    };

    const currentStyle = styles[style];

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${currentStyle.fontFamily};
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .resume-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .resume-header {
      background: ${currentStyle.headerBg};
      color: white;
      padding: 30px;
    }
    .resume-header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .resume-header .contact-info {
      font-size: 14px;
      opacity: 0.9;
    }
    .resume-content {
      padding: 30px;
    }
    h1, h2, h3 {
      color: ${currentStyle.primaryColor};
    }
    h2 {
      font-size: 18px;
      border-bottom: 2px solid ${currentStyle.primaryColor};
      padding-bottom: 8px;
      margin: 25px 0 15px;
    }
    h3 {
      font-size: 16px;
      margin: 15px 0 8px;
    }
    p {
      margin-bottom: 10px;
    }
    ul {
      padding-left: 20px;
      margin-bottom: 15px;
    }
    li {
      margin-bottom: 5px;
    }
    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-tag {
      background: ${currentStyle.primaryColor}15;
      color: ${currentStyle.primaryColor};
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
    }
    .experience-item, .education-item {
      margin-bottom: 20px;
    }
    .experience-header, .education-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .company-name, .school-name {
      font-weight: 600;
      color: #333;
    }
    .duration {
      color: #666;
      font-size: 14px;
    }
    .position, .degree {
      color: ${currentStyle.primaryColor};
      font-weight: 500;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .resume-container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <div class="resume-content markdown-body">
      ${this.markdownToHTML(content)}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * 简单的 Markdown 转 HTML
   */
  private markdownToHTML(markdown: string): string {
    let html = markdown
      // 转义 HTML 特殊字符（保留必要的 markdown 语法字符）
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 标题
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 列表
      .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      // 换行
      .replace(/\n/g, '<br>');

    // 包装列表项
    html = html.replace(/(<li>.*<\/li>)+/gs, '<ul>$&</ul>');

    return `<p>${html}</p>`;
  }

  /**
   * 生成简历的 Word 文档 (DOCX)
   */
  async generateResumeDocx(
    content: string,
    style: 'professional' | 'creative' | 'academic' | 'minimal' = 'professional',
  ): Promise<Buffer> {
    const styleColors = {
      professional: '2563EB',
      creative: '7C3AED',
      academic: '059669',
      minimal: '374151',
    };

    const primaryColor = styleColors[style];
    const children: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // 跳过空行
      if (!trimmed) {
        children.push(new Paragraph({ text: '' }));
        continue;
      }

      // 一级标题 - 姓名
      if (trimmed.startsWith('# ')) {
        const text = trimmed.slice(2).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 48,
                color: primaryColor,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        );
        continue;
      }

      // 求职意向（加粗文本）
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const text = trimmed.slice(2, -2);
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 24,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
        );
        continue;
      }

      // 二级标题 - 章节
      if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 28,
                color: primaryColor,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
            border: {
              bottom: {
                color: primaryColor,
                size: 12,
                style: BorderStyle.SINGLE,
                space: 4,
              },
            },
          }),
        );
        continue;
      }

      // 三级标题 - 子章节
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 24,
                color: '333333',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
        );
        continue;
      }

      // 列表项
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.slice(2).trim();
        // 处理加粗文本
        const parts = this.parseInlineStyles(text);
        children.push(
          new Paragraph({
            children: parts,
            bullet: { level: 0 },
            spacing: { after: 80 },
            indent: { left: convertInchesToTwip(0.25) },
          }),
        );
        continue;
      }

      // 普通段落
      const parts = this.parseInlineStyles(trimmed);
      children.push(
        new Paragraph({
          children: parts,
          spacing: { after: 100 },
        }),
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
              },
            },
          },
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * 解析行内样式（加粗、斜体）
   */
  private parseInlineStyles(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        runs.push(
          new TextRun({
            text: text.slice(lastIndex, match.index),
            size: 22,
          }),
        );
      }

      // 加粗文本
      if (match[1]) {
        runs.push(
          new TextRun({
            text: match[1],
            bold: true,
            size: 22,
          }),
        );
      }
      // 斜体文本
      else if (match[2]) {
        runs.push(
          new TextRun({
            text: match[2],
            italics: true,
            size: 22,
          }),
        );
      }

      lastIndex = regex.lastIndex;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex),
          size: 22,
        }),
      );
    }

    // 如果没有匹配到任何样式，返回整个文本
    if (runs.length === 0) {
      runs.push(
        new TextRun({
          text,
          size: 22,
        }),
      );
    }

    return runs;
  }

  // ============= 模板相关方法 =============

  /**
   * 获取所有简历模板（内置 + 爬取的）
   */
  async getTemplates(params?: {
    category?: CrawledTemplate['category'];
    source?: 'builtin' | 'crawled' | 'all';
  }): Promise<CrawledTemplate[]> {
    let templates: CrawledTemplate[] = [];

    // 获取内置模板
    if (!params?.source || params.source === 'builtin' || params.source === 'all') {
      templates = [...getBuiltinTemplates()];
    }

    // 获取爬取的模板
    if (params?.source === 'crawled' || params?.source === 'all') {
      const crawledTemplates = templateCrawler.loadTemplates();
      templates = [...templates, ...crawledTemplates];
    }

    // 按分类过滤
    if (params?.category) {
      templates = templates.filter((t) => t.category === params.category);
    }

    return templates;
  }

  /**
   * 获取单个模板详情
   */
  getTemplate(id: string): CrawledTemplate | null {
    // 先从内置模板查找
    const builtinTemplate = getBuiltinTemplateById(id);
    if (builtinTemplate) {
      return builtinTemplate;
    }

    // 再从爬取的模板查找
    const crawledTemplates = templateCrawler.loadTemplates();
    return crawledTemplates.find((t) => t.id === id) || null;
  }

  /**
   * 爬取新模板
   */
  async crawlTemplates(): Promise<CrawledTemplate[]> {
    return await templateCrawler.crawlAll();
  }

  /**
   * 使用模板生成简历 HTML
   */
  generateResumeHTMLWithTemplate(content: string, templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new BadRequestException(`模板不存在: ${templateId}`);
    }
    return renderResumeWithTemplate(templateId, content, template);
  }

  /**
   * 使用模板生成简历 Word 文档
   */
  async generateResumeDocxWithTemplate(
    content: string,
    templateId: string,
  ): Promise<Buffer> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new BadRequestException(`模板不存在: ${templateId}`);
    }

    // 解析简历数据
    const resumeData = templateRenderer.parseMarkdownToData(content);

    // 从模板提取主色调（用于 Word 样式）
    const primaryColorMatch = template.html.match(/--primary:\s*#([a-fA-F0-9]{6})/);
    const primaryColor = primaryColorMatch ? primaryColorMatch[1] : '2563EB';

    const children: Paragraph[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // 跳过空行
      if (!trimmed) {
        children.push(new Paragraph({ text: '' }));
        continue;
      }

      // 一级标题 - 姓名
      if (trimmed.startsWith('# ')) {
        const text = trimmed.slice(2).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 48,
                color: primaryColor,
              }),
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
        );
        continue;
      }

      // 求职意向（加粗文本）
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        const text = trimmed.slice(2, -2);
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 24,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
        );
        continue;
      }

      // 二级标题 - 章节
      if (trimmed.startsWith('## ')) {
        const text = trimmed.slice(3).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 28,
                color: primaryColor,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 150 },
            border: {
              bottom: {
                color: primaryColor,
                size: 12,
                style: BorderStyle.SINGLE,
                space: 4,
              },
            },
          }),
        );
        continue;
      }

      // 三级标题 - 子章节
      if (trimmed.startsWith('### ')) {
        const text = trimmed.slice(4).trim();
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold: true,
                size: 24,
                color: '333333',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
        );
        continue;
      }

      // 列表项
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const text = trimmed.slice(2).trim();
        const parts = this.parseInlineStyles(text);
        children.push(
          new Paragraph({
            children: parts,
            bullet: { level: 0 },
            spacing: { after: 80 },
            indent: { left: convertInchesToTwip(0.25) },
          }),
        );
        continue;
      }

      // 普通段落
      const parts = this.parseInlineStyles(trimmed);
      children.push(
        new Paragraph({
          children: parts,
          spacing: { after: 100 },
        }),
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
              },
            },
          },
          children,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }
}
