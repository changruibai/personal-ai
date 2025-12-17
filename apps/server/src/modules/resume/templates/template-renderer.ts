import { CrawledTemplate } from './template-crawler';
import { getBuiltinTemplateById } from './builtin-templates';

/**
 * 简历数据结构
 */
export interface ResumeData {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
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
  projects?: Array<{
    name: string;
    description: string;
  }>;
}

/**
 * 模板渲染器
 * 将用户数据填充到模板中
 */
export class TemplateRenderer {
  /**
   * 使用模板渲染简历
   */
  render(template: CrawledTemplate, data: ResumeData): string {
    let html = template.html;

    // 处理简单变量替换
    html = this.replaceSimpleVariables(html, data);

    // 处理条件块 {{#if variable}}...{{/if}}
    html = this.processConditionals(html, data);

    // 处理循环块 {{#each array}}...{{/each}}
    html = this.processLoops(html, data);

    // 处理特殊变量
    html = this.processSpecialVariables(html, data);

    return html;
  }

  /**
   * 替换简单变量 {{variable}}
   */
  private replaceSimpleVariables(html: string, data: ResumeData): string {
    const simpleVars: Record<string, string | undefined> = {
      name: data.name,
      title: data.title,
      email: data.email,
      phone: data.phone,
      location: data.location,
      website: data.website,
      linkedin: data.linkedin,
      github: data.github,
      summary: data.summary,
    };

    for (const [key, value] of Object.entries(simpleVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      html = html.replace(regex, value || '');
    }

    return html;
  }

  /**
   * 处理条件块
   */
  private processConditionals(html: string, data: ResumeData): string {
    // 匹配 {{#if variable}}...{{/if}}
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return html.replace(conditionalRegex, (match, variable, content) => {
      const value = this.getVariableValue(variable, data);
      
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        return content;
      }
      return '';
    });
  }

  /**
   * 处理循环块
   */
  private processLoops(html: string, data: ResumeData): string {
    // 匹配 {{#each array}}...{{/each}}
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

    return html.replace(loopRegex, (match, arrayName, template) => {
      const array = this.getVariableValue(arrayName, data);
      
      if (!Array.isArray(array) || array.length === 0) {
        return '';
      }

      return array.map((item, index) => {
        let itemHtml = template;
        
        if (typeof item === 'string') {
          // 简单数组（如 skills）
          itemHtml = itemHtml.replace(/\{\{this\}\}/g, item);
        } else if (typeof item === 'object') {
          // 对象数组（如 experience, education）
          for (const [key, value] of Object.entries(item)) {
            const regex = new RegExp(`\\{\\{this\\.${key}\\}\\}`, 'g');
            itemHtml = itemHtml.replace(regex, String(value || ''));
          }
        }
        
        // 替换索引
        itemHtml = itemHtml.replace(/\{\{@index\}\}/g, String(index));
        
        return itemHtml;
      }).join('');
    });
  }

  /**
   * 处理特殊变量
   */
  private processSpecialVariables(html: string, data: ResumeData): string {
    // 处理姓名首字母
    if (data.name) {
      const initial = data.name.charAt(0).toUpperCase();
      html = html.replace(/\{\{nameInitial\}\}/g, initial);
    }

    return html;
  }

  /**
   * 获取变量值
   */
  private getVariableValue(key: string, data: ResumeData): unknown {
    return (data as unknown as Record<string, unknown>)[key];
  }

  /**
   * 从 Markdown 内容解析简历数据
   */
  parseMarkdownToData(markdown: string): ResumeData {
    const data: ResumeData = {
      name: '',
      experience: [],
      education: [],
      skills: [],
    };

    const lines = markdown.split('\n');
    let currentSection = '';
    let currentItem: Record<string, string> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // 一级标题 - 姓名
      if (trimmed.startsWith('# ')) {
        data.name = trimmed.slice(2).trim();
        continue;
      }

      // 求职意向
      if (trimmed.startsWith('**求职意向')) {
        const match = trimmed.match(/\*\*求职意向[：:]\s*(.+?)\*\*/);
        if (match) {
          data.title = match[1];
        }
        continue;
      }

      // 二级标题 - 章节
      if (trimmed.startsWith('## ')) {
        const section = trimmed.slice(3).trim().toLowerCase();
        
        // 保存上一个项目
        if (currentItem && currentSection) {
          this.saveCurrentItem(data, currentSection, currentItem);
        }
        currentItem = null;
        
        if (section.includes('简介') || section.includes('summary') || section.includes('目标')) {
          currentSection = 'summary';
        } else if (section.includes('经历') || section.includes('experience') || section.includes('工作')) {
          currentSection = 'experience';
        } else if (section.includes('教育') || section.includes('education') || section.includes('学历')) {
          currentSection = 'education';
        } else if (section.includes('技能') || section.includes('skill')) {
          currentSection = 'skills';
        } else if (section.includes('联系') || section.includes('contact')) {
          currentSection = 'contact';
        } else if (section.includes('项目') || section.includes('project')) {
          currentSection = 'projects';
        } else {
          currentSection = section;
        }
        continue;
      }

      // 三级标题 - 子项目
      if (trimmed.startsWith('### ')) {
        // 保存上一个项目
        if (currentItem && currentSection) {
          this.saveCurrentItem(data, currentSection, currentItem);
        }
        
        const title = trimmed.slice(4).trim();
        currentItem = { title };
        continue;
      }

      // 列表项
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.slice(2).trim();
        
        if (currentSection === 'skills') {
          // 技能列表
          if (content.includes('：') || content.includes(':')) {
            const [, skills] = content.split(/[：:]/);
            if (skills) {
              data.skills!.push(...skills.split(/[、,，]/).map(s => s.trim()));
            }
          } else {
            data.skills!.push(content);
          }
        } else if (currentSection === 'contact') {
          // 联系信息
          this.parseContactItem(data, content);
        } else if (currentItem) {
          // 其他列表内容作为描述
          if (!currentItem.description) {
            currentItem.description = content;
          } else {
            currentItem.description += '\n' + content;
          }
        }
        continue;
      }

      // 普通文本
      if (trimmed) {
        if (currentSection === 'summary') {
          if (!data.summary) {
            data.summary = trimmed;
          } else {
            data.summary += ' ' + trimmed;
          }
        } else if (currentItem) {
          // 解析工作经历格式: 公司 | 职位 | 时间
          if (trimmed.includes('|')) {
            const parts = trimmed.split('|').map(p => p.trim());
            if (currentSection === 'experience') {
              currentItem.company = parts[0] || currentItem.title || '';
              currentItem.position = parts[1] || '';
              currentItem.duration = parts[2] || '';
            } else if (currentSection === 'education') {
              currentItem.school = parts[0] || currentItem.title || '';
              currentItem.degree = parts[1] || '';
              currentItem.major = parts[2] || '';
              currentItem.duration = parts[3] || parts[2] || '';
            }
          } else if (!currentItem.description) {
            currentItem.description = trimmed;
          }
        }
      }
    }

    // 保存最后一个项目
    if (currentItem && currentSection) {
      this.saveCurrentItem(data, currentSection, currentItem);
    }

    return data;
  }

  /**
   * 保存当前解析的项目
   */
  private saveCurrentItem(data: ResumeData, section: string, item: Record<string, string>) {
    if (section === 'experience' && item.company) {
      data.experience!.push({
        company: item.company || item.title || '',
        position: item.position || '',
        duration: item.duration || '',
        description: item.description || '',
      });
    } else if (section === 'education' && (item.school || item.title)) {
      data.education!.push({
        school: item.school || item.title || '',
        degree: item.degree || '',
        major: item.major || '',
        duration: item.duration || '',
      });
    }
  }

  /**
   * 解析联系信息
   */
  private parseContactItem(data: ResumeData, content: string) {
    const lowerContent = content.toLowerCase();
    const value = content.replace(/^[^:：]+[：:]/, '').trim();
    
    if (lowerContent.includes('email') || lowerContent.includes('邮箱') || content.includes('@')) {
      data.email = value || content;
    } else if (lowerContent.includes('phone') || lowerContent.includes('电话') || lowerContent.includes('手机')) {
      data.phone = value || content;
    } else if (lowerContent.includes('location') || lowerContent.includes('地址') || lowerContent.includes('所在地')) {
      data.location = value || content;
    } else if (lowerContent.includes('github')) {
      data.github = value || content;
    } else if (lowerContent.includes('linkedin')) {
      data.linkedin = value || content;
    } else if (lowerContent.includes('website') || lowerContent.includes('网站')) {
      data.website = value || content;
    }
  }
}

/**
 * 使用模板渲染简历
 */
export function renderResumeWithTemplate(
  templateId: string,
  markdownContent: string,
  customTemplate?: CrawledTemplate,
): string {
  const renderer = new TemplateRenderer();
  
  // 获取模板
  const template = customTemplate || getBuiltinTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 解析 Markdown 为数据
  const data = renderer.parseMarkdownToData(markdownContent);

  // 渲染模板
  return renderer.render(template, data);
}

export const templateRenderer = new TemplateRenderer();
