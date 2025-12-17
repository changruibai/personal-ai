import { CrawledTemplate } from './template-crawler';

/**
 * 内置的高质量简历模板
 * 这些模板可以在爬虫不可用时使用
 */
export const BUILTIN_TEMPLATES: CrawledTemplate[] = [
  {
    id: 'professional-classic',
    name: '经典专业',
    description: '传统稳重的专业风格，适合金融、法律、咨询等行业',
    source: '内置模板',
    sourceUrl: '',
    previewImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=560&fit=crop',
    category: 'professional',
    placeholders: ['name', 'title', 'email', 'phone', 'summary', 'experience', 'education', 'skills'],
    crawledAt: new Date(),
    css: '',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Noto Sans SC", sans-serif;
      line-height: 1.7;
      color: #2d3748;
      background: #f7fafc;
      padding: 40px 20px;
    }
    .resume {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
      color: white;
      padding: 50px 40px;
      text-align: center;
    }
    .header h1 {
      font-family: "Noto Serif SC", serif;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }
    .header .title {
      font-size: 18px;
      opacity: 0.9;
      font-weight: 300;
      letter-spacing: 1px;
    }
    .contact {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 20px;
      font-size: 14px;
      opacity: 0.85;
    }
    .contact span { display: flex; align-items: center; gap: 6px; }
    .content { padding: 40px; }
    .section { margin-bottom: 35px; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #2c5282;
      text-transform: uppercase;
      letter-spacing: 2px;
      padding-bottom: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .summary { font-size: 15px; color: #4a5568; text-align: justify; }
    .item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #edf2f7; }
    .item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
    .company, .school { font-weight: 600; font-size: 16px; color: #1a365d; }
    .duration { font-size: 13px; color: #718096; font-weight: 500; }
    .position, .degree { color: #2c5282; font-size: 14px; margin-bottom: 8px; }
    .description { font-size: 14px; color: #4a5568; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill {
      background: linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%);
      color: #2c5282;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #bee3f8;
    }
    @media print {
      body { background: white; padding: 0; }
      .resume { box-shadow: none; border-radius: 0; }
    }
    @media (max-width: 600px) {
      .header { padding: 30px 20px; }
      .header h1 { font-size: 28px; }
      .content { padding: 20px; }
      .contact { flex-direction: column; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <h1>{{name}}</h1>
      <p class="title">{{title}}</p>
      <div class="contact">
        <span>📧 {{email}}</span>
        <span>📱 {{phone}}</span>
        <span>📍 {{location}}</span>
      </div>
    </div>
    <div class="content">
      {{#if summary}}
      <div class="section">
        <h2 class="section-title">个人简介</h2>
        <p class="summary">{{summary}}</p>
      </div>
      {{/if}}
      {{#if experience}}
      <div class="section">
        <h2 class="section-title">工作经历</h2>
        {{#each experience}}
        <div class="item">
          <div class="item-header">
            <span class="company">{{this.company}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="position">{{this.position}}</p>
          <p class="description">{{this.description}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if education}}
      <div class="section">
        <h2 class="section-title">教育背景</h2>
        {{#each education}}
        <div class="item">
          <div class="item-header">
            <span class="school">{{this.school}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="degree">{{this.degree}} · {{this.major}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if skills}}
      <div class="section">
        <h2 class="section-title">专业技能</h2>
        <div class="skills-grid">
          {{#each skills}}<span class="skill">{{this}}</span>{{/each}}
        </div>
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'modern-tech',
    name: '现代科技',
    description: '时尚现代的设计风格，适合互联网、IT、科技公司',
    source: '内置模板',
    sourceUrl: '',
    previewImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=560&fit=crop',
    category: 'modern',
    placeholders: ['name', 'title', 'email', 'phone', 'summary', 'experience', 'education', 'skills'],
    crawledAt: new Date(),
    css: '',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Inter", "Noto Sans SC", sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    .resume {
      max-width: 900px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 280px 1fr;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .sidebar {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 40px 25px;
    }
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: 700;
      color: white;
    }
    .sidebar h1 {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 5px;
    }
    .sidebar .title {
      font-size: 14px;
      text-align: center;
      opacity: 0.8;
      color: #38bdf8;
      margin-bottom: 30px;
    }
    .sidebar-section { margin-bottom: 30px; }
    .sidebar-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #38bdf8;
      margin-bottom: 15px;
    }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 13px;
      opacity: 0.9;
    }
    .skill-bar {
      margin-bottom: 12px;
    }
    .skill-name {
      font-size: 13px;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    .skill-progress {
      height: 6px;
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
      overflow: hidden;
    }
    .skill-fill {
      height: 100%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 3px;
    }
    .main { padding: 40px; }
    .section { margin-bottom: 35px; }
    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .section-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
    }
    .summary { font-size: 15px; color: #475569; line-height: 1.8; }
    .timeline-item {
      position: relative;
      padding-left: 25px;
      padding-bottom: 25px;
      border-left: 2px solid #e2e8f0;
    }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item::before {
      content: "";
      position: absolute;
      left: -6px;
      top: 5px;
      width: 10px;
      height: 10px;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      border-radius: 50%;
    }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
    .company, .school { font-weight: 600; font-size: 15px; color: #0f172a; }
    .duration {
      font-size: 12px;
      color: white;
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
      padding: 3px 10px;
      border-radius: 12px;
    }
    .position, .degree { color: #3b82f6; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
    .description { font-size: 14px; color: #64748b; }
    @media print {
      body { background: white; padding: 0; }
      .resume { box-shadow: none; border-radius: 0; }
    }
    @media (max-width: 768px) {
      .resume { grid-template-columns: 1fr; }
      .sidebar { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <div class="sidebar">
      <div class="avatar">{{nameInitial}}</div>
      <h1>{{name}}</h1>
      <p class="title">{{title}}</p>
      
      <div class="sidebar-section">
        <h3 class="sidebar-title">联系方式</h3>
        <div class="contact-item">📧 {{email}}</div>
        <div class="contact-item">📱 {{phone}}</div>
        <div class="contact-item">📍 {{location}}</div>
      </div>
      
      {{#if skills}}
      <div class="sidebar-section">
        <h3 class="sidebar-title">专业技能</h3>
        {{#each skills}}
        <div class="skill-bar">
          <div class="skill-name">
            <span>{{this}}</span>
          </div>
          <div class="skill-progress">
            <div class="skill-fill" style="width: 85%"></div>
          </div>
        </div>
        {{/each}}
      </div>
      {{/if}}
    </div>
    
    <div class="main">
      {{#if summary}}
      <div class="section">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <h2 class="section-title">个人简介</h2>
        </div>
        <p class="summary">{{summary}}</p>
      </div>
      {{/if}}
      
      {{#if experience}}
      <div class="section">
        <div class="section-header">
          <div class="section-icon">💼</div>
          <h2 class="section-title">工作经历</h2>
        </div>
        {{#each experience}}
        <div class="timeline-item">
          <div class="item-header">
            <span class="company">{{this.company}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="position">{{this.position}}</p>
          <p class="description">{{this.description}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      
      {{#if education}}
      <div class="section">
        <div class="section-header">
          <div class="section-icon">🎓</div>
          <h2 class="section-title">教育背景</h2>
        </div>
        {{#each education}}
        <div class="timeline-item">
          <div class="item-header">
            <span class="school">{{this.school}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="degree">{{this.degree}} · {{this.major}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'creative-gradient',
    name: '创意渐变',
    description: '大胆创新的设计，适合设计师、创意行业',
    source: '内置模板',
    sourceUrl: '',
    previewImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=560&fit=crop',
    category: 'creative',
    placeholders: ['name', 'title', 'email', 'phone', 'summary', 'experience', 'education', 'skills'],
    crawledAt: new Date(),
    css: '',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Poppins", "Noto Sans SC", sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #fafafa;
      padding: 40px 20px;
    }
    .resume {
      max-width: 850px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      color: white;
      padding: 60px 40px;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: "";
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    .header::after {
      content: "";
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.05);
      border-radius: 50%;
    }
    .header-content { position: relative; z-index: 1; }
    .header h1 {
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 8px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
    }
    .header .title {
      font-size: 20px;
      font-weight: 300;
      opacity: 0.95;
      margin-bottom: 25px;
    }
    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 14px;
    }
    .contact span {
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    .content { padding: 50px 40px; }
    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #764ba2;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .section-title::after {
      content: "";
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, #667eea, transparent);
    }
    .summary {
      font-size: 16px;
      color: #4a4a68;
      line-height: 1.9;
      padding: 25px;
      background: linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%);
      border-radius: 16px;
      border-left: 4px solid #764ba2;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.08);
      border: 1px solid #f0e7ff;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(124, 58, 237, 0.12);
    }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .company, .school { font-weight: 600; font-size: 17px; color: #1a1a2e; }
    .duration {
      font-size: 12px;
      color: white;
      background: linear-gradient(135deg, #667eea, #764ba2);
      padding: 5px 14px;
      border-radius: 15px;
      font-weight: 500;
    }
    .position, .degree {
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 10px;
    }
    .description { font-size: 14px; color: #6b6b8d; line-height: 1.7; }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
    .skill {
      background: linear-gradient(135deg, #f5f3ff 0%, #fdf4ff 100%);
      color: #764ba2;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      text-align: center;
      border: 1px solid #e9d5ff;
      transition: all 0.3s;
    }
    .skill:hover {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-color: transparent;
    }
    @media print {
      body { background: white; padding: 0; }
      .resume { box-shadow: none; border-radius: 0; }
      .card:hover { transform: none; }
    }
    @media (max-width: 600px) {
      .header { padding: 40px 20px; }
      .header h1 { font-size: 28px; }
      .content { padding: 30px 20px; }
      .skills-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <div class="header-content">
        <h1>{{name}}</h1>
        <p class="title">{{title}}</p>
        <div class="contact">
          <span>📧 {{email}}</span>
          <span>📱 {{phone}}</span>
          <span>📍 {{location}}</span>
        </div>
      </div>
    </div>
    <div class="content">
      {{#if summary}}
      <div class="section">
        <h2 class="section-title">关于我</h2>
        <p class="summary">{{summary}}</p>
      </div>
      {{/if}}
      {{#if experience}}
      <div class="section">
        <h2 class="section-title">工作经历</h2>
        {{#each experience}}
        <div class="card">
          <div class="card-header">
            <span class="company">{{this.company}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="position">{{this.position}}</p>
          <p class="description">{{this.description}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if education}}
      <div class="section">
        <h2 class="section-title">教育背景</h2>
        {{#each education}}
        <div class="card">
          <div class="card-header">
            <span class="school">{{this.school}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="degree">{{this.degree}} · {{this.major}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if skills}}
      <div class="section">
        <h2 class="section-title">专业技能</h2>
        <div class="skills-grid">
          {{#each skills}}<span class="skill">{{this}}</span>{{/each}}
        </div>
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'minimal-clean',
    name: '简约清爽',
    description: '极简主义设计，专注内容，减少干扰',
    source: '内置模板',
    sourceUrl: '',
    previewImage: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&h=560&fit=crop',
    category: 'minimal',
    placeholders: ['name', 'title', 'email', 'phone', 'summary', 'experience', 'education', 'skills'],
    crawledAt: new Date(),
    css: '',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Inter", "Noto Sans SC", sans-serif;
      line-height: 1.7;
      color: #374151;
      background: white;
      padding: 60px 40px;
      max-width: 750px;
      margin: 0 auto;
    }
    .header { margin-bottom: 50px; }
    .header h1 {
      font-size: 32px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    }
    .header .title {
      font-size: 16px;
      color: #6b7280;
      font-weight: 400;
      margin-bottom: 20px;
    }
    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 14px;
      color: #6b7280;
    }
    .contact span {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 40px 0;
    }
    .section { margin-bottom: 40px; }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #9ca3af;
      margin-bottom: 20px;
    }
    .summary {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.8;
    }
    .item { margin-bottom: 25px; }
    .item:last-child { margin-bottom: 0; }
    .item-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
    .company, .school { font-weight: 500; font-size: 15px; color: #111827; }
    .duration { font-size: 13px; color: #9ca3af; }
    .position, .degree { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .description { font-size: 14px; color: #6b7280; line-height: 1.7; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill {
      font-size: 13px;
      color: #374151;
      padding: 6px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #f9fafb;
    }
    @media print {
      body { padding: 40px; }
    }
    @media (max-width: 600px) {
      body { padding: 30px 20px; }
      .header h1 { font-size: 26px; }
      .contact { flex-direction: column; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{name}}</h1>
    <p class="title">{{title}}</p>
    <div class="contact">
      <span>{{email}}</span>
      <span>{{phone}}</span>
      <span>{{location}}</span>
    </div>
  </div>
  
  {{#if summary}}
  <div class="section">
    <h2 class="section-title">简介</h2>
    <p class="summary">{{summary}}</p>
  </div>
  <div class="divider"></div>
  {{/if}}
  
  {{#if experience}}
  <div class="section">
    <h2 class="section-title">工作经历</h2>
    {{#each experience}}
    <div class="item">
      <div class="item-row">
        <span class="company">{{this.company}}</span>
        <span class="duration">{{this.duration}}</span>
      </div>
      <p class="position">{{this.position}}</p>
      <p class="description">{{this.description}}</p>
    </div>
    {{/each}}
  </div>
  <div class="divider"></div>
  {{/if}}
  
  {{#if education}}
  <div class="section">
    <h2 class="section-title">教育背景</h2>
    {{#each education}}
    <div class="item">
      <div class="item-row">
        <span class="school">{{this.school}}</span>
        <span class="duration">{{this.duration}}</span>
      </div>
      <p class="degree">{{this.degree}} · {{this.major}}</p>
    </div>
    {{/each}}
  </div>
  <div class="divider"></div>
  {{/if}}
  
  {{#if skills}}
  <div class="section">
    <h2 class="section-title">技能</h2>
    <div class="skills">
      {{#each skills}}<span class="skill">{{this}}</span>{{/each}}
    </div>
  </div>
  {{/if}}
</body>
</html>`,
  },
  {
    id: 'dark-developer',
    name: '暗黑开发者',
    description: '深色主题设计，适合程序员、技术人员',
    source: '内置模板',
    sourceUrl: '',
    previewImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=560&fit=crop',
    category: 'modern',
    placeholders: ['name', 'title', 'email', 'phone', 'summary', 'experience', 'education', 'skills'],
    crawledAt: new Date(),
    css: '',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Inter", "Noto Sans SC", sans-serif;
      line-height: 1.6;
      color: #e2e8f0;
      background: #0f172a;
      padding: 40px 20px;
    }
    .resume {
      max-width: 900px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .header {
      background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
      padding: 50px 40px;
      border-bottom: 1px solid #334155;
    }
    .header h1 {
      font-family: "JetBrains Mono", monospace;
      font-size: 36px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 8px;
    }
    .header h1::before {
      content: "$ ";
      color: #22d3ee;
    }
    .header .title {
      font-size: 16px;
      color: #a855f7;
      font-family: "JetBrains Mono", monospace;
      margin-bottom: 25px;
    }
    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-size: 13px;
      font-family: "JetBrains Mono", monospace;
    }
    .contact span {
      color: #4ade80;
      background: rgba(74, 222, 128, 0.1);
      padding: 6px 14px;
      border-radius: 6px;
      border: 1px solid rgba(74, 222, 128, 0.2);
    }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    .section-title {
      font-family: "JetBrains Mono", monospace;
      font-size: 14px;
      font-weight: 500;
      color: #22d3ee;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title::before {
      content: "//";
      color: #64748b;
    }
    .summary {
      font-size: 15px;
      color: #94a3b8;
      line-height: 1.8;
      padding: 20px;
      background: #0f172a;
      border-radius: 8px;
      border-left: 3px solid #a855f7;
    }
    .card {
      background: #0f172a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 15px;
      border: 1px solid #334155;
    }
    .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .company, .school {
      font-weight: 500;
      font-size: 16px;
      color: #f8fafc;
    }
    .duration {
      font-size: 12px;
      color: #22d3ee;
      font-family: "JetBrains Mono", monospace;
      background: rgba(34, 211, 238, 0.1);
      padding: 4px 10px;
      border-radius: 4px;
    }
    .position, .degree {
      color: #a855f7;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .description { font-size: 14px; color: #94a3b8; }
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .skill {
      font-family: "JetBrains Mono", monospace;
      font-size: 13px;
      color: #4ade80;
      background: rgba(74, 222, 128, 0.1);
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid rgba(74, 222, 128, 0.2);
    }
    @media print {
      body { background: white; color: #1e293b; }
      .resume { background: white; border: none; }
      .header { background: #1e293b; }
      .card { background: #f8fafc; border-color: #e2e8f0; }
      .summary { background: #f8fafc; }
    }
    @media (max-width: 600px) {
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <h1>{{name}}</h1>
      <p class="title">// {{title}}</p>
      <div class="contact">
        <span>email: {{email}}</span>
        <span>phone: {{phone}}</span>
        <span>location: {{location}}</span>
      </div>
    </div>
    <div class="content">
      {{#if summary}}
      <div class="section">
        <h2 class="section-title">README.md</h2>
        <p class="summary">{{summary}}</p>
      </div>
      {{/if}}
      {{#if experience}}
      <div class="section">
        <h2 class="section-title">work_experience</h2>
        {{#each experience}}
        <div class="card">
          <div class="card-header">
            <span class="company">{{this.company}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="position">{{this.position}}</p>
          <p class="description">{{this.description}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if education}}
      <div class="section">
        <h2 class="section-title">education</h2>
        {{#each education}}
        <div class="card">
          <div class="card-header">
            <span class="school">{{this.school}}</span>
            <span class="duration">{{this.duration}}</span>
          </div>
          <p class="degree">{{this.degree}} · {{this.major}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if skills}}
      <div class="section">
        <h2 class="section-title">tech_stack</h2>
        <div class="skills-grid">
          {{#each skills}}<span class="skill">{{this}}</span>{{/each}}
        </div>
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
  },
  {
    id: 'academic-scholar',
    name: '学术研究',
    description: '严谨专业的学术风格，适合教育、研究机构',
    source: '内置模板',
    sourceUrl: '',
    previewImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=560&fit=crop',
    category: 'academic',
    placeholders: ['name', 'title', 'email', 'phone', 'summary', 'experience', 'education', 'skills'],
    crawledAt: new Date(),
    css: '',
    html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}} - 个人简历</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Noto Sans SC", sans-serif;
      line-height: 1.8;
      color: #1f2937;
      background: #f9fafb;
      padding: 40px 20px;
    }
    .resume {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .header {
      background: #065f46;
      color: white;
      padding: 45px 40px;
      text-align: center;
    }
    .header h1 {
      font-family: "Noto Serif SC", serif;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: 4px;
      margin-bottom: 10px;
    }
    .header .title {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 400;
    }
    .contact {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 25px;
      font-size: 14px;
      opacity: 0.9;
    }
    .content { padding: 40px; }
    .section { margin-bottom: 35px; }
    .section-title {
      font-family: "Noto Serif SC", serif;
      font-size: 16px;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #065f46;
    }
    .summary {
      font-size: 15px;
      color: #374151;
      text-align: justify;
      text-indent: 2em;
    }
    .item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .item:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
    .item-header { margin-bottom: 8px; }
    .company, .school {
      font-family: "Noto Serif SC", serif;
      font-weight: 600;
      font-size: 16px;
      color: #111827;
    }
    .meta {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }
    .position, .degree {
      color: #065f46;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .description {
      font-size: 14px;
      color: #4b5563;
      text-align: justify;
    }
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill {
      font-size: 13px;
      color: #065f46;
      background: #ecfdf5;
      padding: 6px 14px;
      border-radius: 4px;
      border: 1px solid #a7f3d0;
    }
    @media print {
      body { background: white; padding: 0; }
      .resume { box-shadow: none; }
    }
    @media (max-width: 600px) {
      .header { padding: 30px 20px; }
      .header h1 { font-size: 26px; letter-spacing: 2px; }
      .content { padding: 25px 20px; }
    }
  </style>
</head>
<body>
  <div class="resume">
    <div class="header">
      <h1>{{name}}</h1>
      <p class="title">{{title}}</p>
      <div class="contact">
        <span>📧 {{email}}</span>
        <span>📱 {{phone}}</span>
        <span>📍 {{location}}</span>
      </div>
    </div>
    <div class="content">
      {{#if summary}}
      <div class="section">
        <h2 class="section-title">个人简介</h2>
        <p class="summary">{{summary}}</p>
      </div>
      {{/if}}
      {{#if experience}}
      <div class="section">
        <h2 class="section-title">工作经历</h2>
        {{#each experience}}
        <div class="item">
          <div class="item-header">
            <div class="company">{{this.company}}</div>
            <div class="meta">{{this.duration}}</div>
          </div>
          <p class="position">{{this.position}}</p>
          <p class="description">{{this.description}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if education}}
      <div class="section">
        <h2 class="section-title">教育背景</h2>
        {{#each education}}
        <div class="item">
          <div class="item-header">
            <div class="school">{{this.school}}</div>
            <div class="meta">{{this.duration}}</div>
          </div>
          <p class="degree">{{this.degree}} · {{this.major}}</p>
        </div>
        {{/each}}
      </div>
      {{/if}}
      {{#if skills}}
      <div class="section">
        <h2 class="section-title">专业技能</h2>
        <div class="skills-list">
          {{#each skills}}<span class="skill">{{this}}</span>{{/each}}
        </div>
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`,
  },
];

/**
 * 获取所有内置模板
 */
export function getBuiltinTemplates(): CrawledTemplate[] {
  return BUILTIN_TEMPLATES;
}

/**
 * 根据 ID 获取内置模板
 */
export function getBuiltinTemplateById(id: string): CrawledTemplate | undefined {
  return BUILTIN_TEMPLATES.find(t => t.id === id);
}
