import { ResumeTemplate, getTemplateById } from './resume-templates';

/**
 * 根据模板生成简历 HTML
 */
export function generateResumeWithTemplate(
  content: string,
  templateId: string,
): string {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const htmlContent = markdownToHTML(content);
  return generateHTML(htmlContent, template);
}

/**
 * 简单的 Markdown 转 HTML
 */
function markdownToHTML(markdown: string): string {
  let html = markdown
    // 转义 HTML 特殊字符
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
 * 生成完整的 HTML 页面
 */
function generateHTML(content: string, template: ResumeTemplate): string {
  const { colors, fonts, layout } = template;

  // 根据布局类型生成不同的 CSS
  const layoutCSS = getLayoutCSS(layout);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>个人简历 - ${template.name}模板</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&family=Nunito:wght@300;400;600;700&family=Merriweather:wght@400;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Comfortaa:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: ${colors.primary};
      --secondary: ${colors.secondary};
      --accent: ${colors.accent};
      --background: ${colors.background};
      --text: ${colors.text};
      --header-bg: ${colors.headerBg};
      --header-text: ${colors.headerText};
      --font-heading: ${fonts.heading};
      --font-body: ${fonts.body};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--font-body);
      line-height: 1.6;
      color: var(--text);
      background: #f0f0f0;
      padding: 20px;
    }

    .resume-container {
      max-width: 900px;
      margin: 0 auto;
      background: var(--background);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    .resume-header {
      background: var(--header-bg);
      color: var(--header-text);
      padding: 40px;
      text-align: center;
    }

    .resume-header h1 {
      font-family: var(--font-heading);
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }

    .resume-header .subtitle {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 300;
    }

    .resume-header .contact-info {
      margin-top: 16px;
      font-size: 14px;
      opacity: 0.85;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .resume-content {
      padding: 40px;
    }

    ${layoutCSS}

    h1, h2, h3 {
      font-family: var(--font-heading);
      color: var(--primary);
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 8px;
      margin: 28px 0 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 16px 0 8px;
      color: var(--secondary);
    }

    p {
      margin-bottom: 12px;
      text-align: justify;
    }

    ul {
      padding-left: 20px;
      margin-bottom: 16px;
    }

    li {
      margin-bottom: 6px;
      position: relative;
    }

    li::marker {
      color: var(--accent);
    }

    strong {
      color: var(--primary);
      font-weight: 600;
    }

    em {
      color: var(--secondary);
      font-style: normal;
    }

    .section {
      margin-bottom: 24px;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .skill-tag {
      background: ${colors.primary}15;
      color: var(--primary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
    }

    .experience-item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid ${colors.primary}20;
    }

    .experience-item:last-child {
      border-bottom: none;
    }

    .experience-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .company-name {
      font-weight: 600;
      color: var(--primary);
      font-size: 15px;
    }

    .duration {
      color: var(--secondary);
      font-size: 13px;
      font-weight: 500;
    }

    .position {
      color: var(--accent);
      font-weight: 500;
      font-size: 14px;
    }

    /* 打印优化 */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .resume-container {
        box-shadow: none;
        border-radius: 0;
        max-width: none;
      }

      .resume-header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }

    /* 响应式 */
    @media (max-width: 768px) {
      .resume-header {
        padding: 24px;
      }

      .resume-header h1 {
        font-size: 24px;
      }

      .resume-content {
        padding: 24px;
      }

      .experience-header {
        flex-direction: column;
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <div class="resume-content markdown-body">
      ${content}
    </div>
  </div>
</body>
</html>`;
}

/**
 * 根据布局类型生成 CSS
 */
function getLayoutCSS(layout: ResumeTemplate['layout']): string {
  switch (layout) {
    case 'two-column':
      return `
        .resume-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        
        @media (max-width: 768px) {
          .resume-content {
            grid-template-columns: 1fr;
          }
        }
      `;
    case 'sidebar-left':
      return `
        .resume-container {
          display: grid;
          grid-template-columns: 280px 1fr;
        }
        
        .resume-sidebar {
          background: var(--primary);
          color: var(--header-text);
          padding: 40px 24px;
        }
        
        @media (max-width: 768px) {
          .resume-container {
            grid-template-columns: 1fr;
          }
        }
      `;
    case 'sidebar-right':
      return `
        .resume-container {
          display: grid;
          grid-template-columns: 1fr 280px;
        }
        
        .resume-sidebar {
          background: var(--primary);
          color: var(--header-text);
          padding: 40px 24px;
        }
        
        @media (max-width: 768px) {
          .resume-container {
            grid-template-columns: 1fr;
          }
        }
      `;
    case 'single-column':
    default:
      return `
        .resume-content {
          max-width: 700px;
          margin: 0 auto;
        }
      `;
  }
}

/**
 * 生成 Word 文档样式配置
 */
export function getTemplateDocxStyles(templateId: string) {
  const template = getTemplateById(templateId);
  if (!template) {
    return null;
  }

  // 移除 # 号并转换为 RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? hex.replace('#', '').toUpperCase() : '000000';
  };

  return {
    primaryColor: hexToRgb(template.colors.primary),
    secondaryColor: hexToRgb(template.colors.secondary),
    accentColor: hexToRgb(template.colors.accent),
    textColor: hexToRgb(template.colors.text),
  };
}
