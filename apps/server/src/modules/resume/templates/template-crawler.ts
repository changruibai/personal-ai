import axios from 'axios';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 爬取的模板数据结构
 */
export interface CrawledTemplate {
  id: string;
  name: string;
  description: string;
  source: string; // 来源网站
  sourceUrl: string; // 原始链接
  previewImage: string; // 预览图
  html: string; // 完整 HTML 模板
  css: string; // CSS 样式
  category: 'professional' | 'creative' | 'minimal' | 'modern' | 'academic';
  placeholders: string[]; // 模板中的占位符列表
  crawledAt: Date;
}

/**
 * 简历模板爬虫服务
 */
export class TemplateCrawler {
  private browser: puppeteer.Browser | null = null;
  private templatesDir: string;

  constructor() {
    // 模板存储目录
    this.templatesDir = path.join(__dirname, '../../../../data/templates');
    this.ensureDir(this.templatesDir);
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 初始化浏览器
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 从 HTML5 UP 爬取免费模板
   * HTML5 UP 提供免费的响应式 HTML 模板
   */
  async crawlFromHTML5UP(): Promise<CrawledTemplate[]> {
    const templates: CrawledTemplate[] = [];
    
    try {
      // HTML5 UP 模板列表页
      const response = await axios.get('https://html5up.net/', {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      
      // 选择适合做简历的模板
      const templateLinks = [
        { name: 'Read Only', url: 'https://html5up.net/read-only', category: 'professional' as const },
        { name: 'Strata', url: 'https://html5up.net/strata', category: 'minimal' as const },
        { name: 'Identity', url: 'https://html5up.net/identity', category: 'creative' as const },
        { name: 'Dimension', url: 'https://html5up.net/dimension', category: 'modern' as const },
        { name: 'Prologue', url: 'https://html5up.net/prologue', category: 'professional' as const },
      ];

      for (const link of templateLinks) {
        try {
          const template = await this.crawlSingleHTML5UPTemplate(link.name, link.url, link.category);
          if (template) {
            templates.push(template);
          }
        } catch (err) {
          console.error(`Failed to crawl ${link.name}:`, err);
        }
      }
    } catch (err) {
      console.error('Failed to crawl HTML5 UP:', err);
    }

    return templates;
  }

  /**
   * 爬取单个 HTML5 UP 模板
   */
  private async crawlSingleHTML5UPTemplate(
    name: string,
    url: string,
    category: CrawledTemplate['category'],
  ): Promise<CrawledTemplate | null> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // 访问模板演示页
      const demoUrl = `${url}/demo`;
      await page.goto(demoUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // 截图作为预览
      const screenshotPath = path.join(this.templatesDir, `${this.slugify(name)}-preview.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      
      // 获取页面 HTML
      const html = await page.content();
      
      // 获取所有样式
      const css = await page.evaluate(() => {
        const styles: string[] = [];
        // 获取所有 style 标签
        document.querySelectorAll('style').forEach((style) => {
          styles.push(style.textContent || '');
        });
        // 获取内联样式表
        for (const sheet of document.styleSheets) {
          try {
            if (sheet.cssRules) {
              for (const rule of sheet.cssRules) {
                styles.push(rule.cssText);
              }
            }
          } catch (e) {
            // 跨域样式表无法访问
          }
        }
        return styles.join('\n');
      });

      await page.close();

      // 转换为简历模板格式
      const resumeTemplate = this.convertToResumeTemplate(html, css, name);

      return {
        id: this.slugify(name),
        name: `${name} 简历模板`,
        description: `基于 HTML5 UP ${name} 模板改编的简历模板`,
        source: 'HTML5 UP',
        sourceUrl: url,
        previewImage: screenshotPath,
        html: resumeTemplate.html,
        css: resumeTemplate.css,
        category,
        placeholders: resumeTemplate.placeholders,
        crawledAt: new Date(),
      };
    } catch (err) {
      console.error(`Error crawling ${name}:`, err);
      return null;
    }
  }

  /**
   * 从 GitHub 上的开源简历模板仓库爬取
   */
  async crawlFromGitHub(): Promise<CrawledTemplate[]> {
    const templates: CrawledTemplate[] = [];
    
    // 一些优质的开源简历模板仓库
    const repos = [
      {
        owner: 'salomonelli',
        repo: 'best-resume-ever',
        category: 'modern' as const,
      },
      // 可以添加更多仓库
    ];

    for (const repo of repos) {
      try {
        const repoTemplates = await this.crawlGitHubRepo(repo.owner, repo.repo, repo.category);
        templates.push(...repoTemplates);
      } catch (err) {
        console.error(`Failed to crawl ${repo.owner}/${repo.repo}:`, err);
      }
    }

    return templates;
  }

  /**
   * 爬取 GitHub 仓库中的模板
   */
  private async crawlGitHubRepo(
    owner: string,
    repo: string,
    category: CrawledTemplate['category'],
  ): Promise<CrawledTemplate[]> {
    const templates: CrawledTemplate[] = [];
    
    try {
      // 获取仓库内容
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Resume-Template-Crawler',
        },
      });

      // 这里简化处理，实际需要根据具体仓库结构解析
      console.log(`Found ${response.data.length} items in ${owner}/${repo}`);
      
    } catch (err) {
      console.error(`Error crawling GitHub repo ${owner}/${repo}:`, err);
    }

    return templates;
  }

  /**
   * 将爬取的模板转换为简历模板格式
   */
  private convertToResumeTemplate(
    html: string,
    css: string,
    name: string,
  ): { html: string; css: string; placeholders: string[] } {
    // 定义简历占位符
    const placeholders = [
      '{{name}}',
      '{{title}}',
      '{{email}}',
      '{{phone}}',
      '{{location}}',
      '{{website}}',
      '{{linkedin}}',
      '{{github}}',
      '{{summary}}',
      '{{experience}}',
      '{{education}}',
      '{{skills}}',
      '{{projects}}',
      '{{certifications}}',
      '{{languages}}',
    ];

    // 创建简历模板 HTML
    const resumeHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <style>
    ${this.getBaseResumeCSS()}
    /* 从 ${name} 模板提取的样式 */
    ${this.sanitizeCSS(css)}
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- 头部信息 -->
    <header class="resume-header">
      <h1 class="name">{{name}}</h1>
      <p class="title">{{title}}</p>
      <div class="contact-info">
        <span class="email">📧 {{email}}</span>
        <span class="phone">📱 {{phone}}</span>
        <span class="location">📍 {{location}}</span>
        {{#if website}}<span class="website">🌐 {{website}}</span>{{/if}}
        {{#if linkedin}}<span class="linkedin">💼 {{linkedin}}</span>{{/if}}
        {{#if github}}<span class="github">💻 {{github}}</span>{{/if}}
      </div>
    </header>

    <!-- 个人简介 -->
    {{#if summary}}
    <section class="resume-section summary">
      <h2>个人简介</h2>
      <p>{{summary}}</p>
    </section>
    {{/if}}

    <!-- 工作经历 -->
    {{#if experience}}
    <section class="resume-section experience">
      <h2>工作经历</h2>
      {{#each experience}}
      <div class="experience-item">
        <div class="experience-header">
          <h3>{{this.company}}</h3>
          <span class="duration">{{this.duration}}</span>
        </div>
        <p class="position">{{this.position}}</p>
        <p class="description">{{this.description}}</p>
      </div>
      {{/each}}
    </section>
    {{/if}}

    <!-- 教育背景 -->
    {{#if education}}
    <section class="resume-section education">
      <h2>教育背景</h2>
      {{#each education}}
      <div class="education-item">
        <div class="education-header">
          <h3>{{this.school}}</h3>
          <span class="duration">{{this.duration}}</span>
        </div>
        <p class="degree">{{this.degree}} - {{this.major}}</p>
      </div>
      {{/each}}
    </section>
    {{/if}}

    <!-- 专业技能 -->
    {{#if skills}}
    <section class="resume-section skills">
      <h2>专业技能</h2>
      <div class="skill-tags">
        {{#each skills}}
        <span class="skill-tag">{{this}}</span>
        {{/each}}
      </div>
    </section>
    {{/if}}

    <!-- 项目经历 -->
    {{#if projects}}
    <section class="resume-section projects">
      <h2>项目经历</h2>
      {{#each projects}}
      <div class="project-item">
        <h3>{{this.name}}</h3>
        <p>{{this.description}}</p>
      </div>
      {{/each}}
    </section>
    {{/if}}
  </div>
</body>
</html>`;

    return {
      html: resumeHtml,
      css: this.sanitizeCSS(css),
      placeholders,
    };
  }

  /**
   * 基础简历 CSS 样式
   */
  private getBaseResumeCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: "Noto Sans SC", "Helvetica Neue", Arial, sans-serif;
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
        padding: 40px;
      }
      
      .resume-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #2563eb;
      }
      
      .resume-header .name {
        font-size: 32px;
        font-weight: 700;
        color: #1e3a5f;
        margin-bottom: 5px;
      }
      
      .resume-header .title {
        font-size: 18px;
        color: #666;
        margin-bottom: 15px;
      }
      
      .contact-info {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 15px;
        font-size: 14px;
        color: #555;
      }
      
      .resume-section {
        margin-bottom: 25px;
      }
      
      .resume-section h2 {
        font-size: 18px;
        color: #2563eb;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
        margin-bottom: 15px;
      }
      
      .experience-item, .education-item, .project-item {
        margin-bottom: 15px;
      }
      
      .experience-header, .education-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      
      .experience-header h3, .education-header h3 {
        font-size: 16px;
        color: #333;
      }
      
      .duration {
        font-size: 13px;
        color: #888;
      }
      
      .position, .degree {
        font-size: 14px;
        color: #2563eb;
        margin: 5px 0;
      }
      
      .description {
        font-size: 14px;
        color: #555;
      }
      
      .skill-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .skill-tag {
        background: #eff6ff;
        color: #2563eb;
        padding: 4px 12px;
        border-radius: 15px;
        font-size: 13px;
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
    `;
  }

  /**
   * 清理 CSS，移除可能有问题的规则
   */
  private sanitizeCSS(css: string): string {
    // 移除 @import 规则
    css = css.replace(/@import[^;]+;/g, '');
    // 移除 @font-face 规则（可能指向外部资源）
    css = css.replace(/@font-face\s*\{[^}]+\}/g, '');
    // 限制样式影响范围
    return css;
  }

  /**
   * 生成 URL 友好的 slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * 保存模板到文件
   */
  async saveTemplate(template: CrawledTemplate): Promise<void> {
    const filePath = path.join(this.templatesDir, `${template.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
  }

  /**
   * 加载已保存的模板
   */
  loadTemplates(): CrawledTemplate[] {
    const templates: CrawledTemplate[] = [];
    
    if (!fs.existsSync(this.templatesDir)) {
      return templates;
    }

    const files = fs.readdirSync(this.templatesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(this.templatesDir, file), 'utf-8');
          templates.push(JSON.parse(content));
        } catch (err) {
          console.error(`Error loading template ${file}:`, err);
        }
      }
    }

    return templates;
  }

  /**
   * 运行完整的爬取任务
   */
  async crawlAll(): Promise<CrawledTemplate[]> {
    const allTemplates: CrawledTemplate[] = [];

    try {
      // 爬取 HTML5 UP 模板
      console.log('Crawling HTML5 UP templates...');
      const html5upTemplates = await this.crawlFromHTML5UP();
      allTemplates.push(...html5upTemplates);

      // 保存所有模板
      for (const template of allTemplates) {
        await this.saveTemplate(template);
      }

      console.log(`Successfully crawled ${allTemplates.length} templates`);
    } catch (err) {
      console.error('Error during crawling:', err);
    } finally {
      await this.closeBrowser();
    }

    return allTemplates;
  }
}

export const templateCrawler = new TemplateCrawler();
