import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ResumeService } from './resume.service';
import { OptimizeResumeDto, ParseResumeDto } from './dto/optimize-resume.dto';
import { CrawledTemplate } from './templates/template-crawler';

@Controller('resume')
@UseGuards(AuthGuard('jwt'))
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  /**
   * 上传并解析简历文件 (支持 txt, md, docx, pdf)
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'text/plain',
          'text/markdown',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const allowedExts = ['.txt', '.md', '.pdf', '.docx'];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
        
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
          callback(null, true);
        } else {
          callback(new BadRequestException('不支持的文件格式，请上传 txt, md, docx 或 pdf 文件'), false);
        }
      },
    }),
  )
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const content = await this.resumeService.parseFile(file);
    const result = await this.resumeService.parseResume(content);
    return result;
  }

  /**
   * 解析简历文本
   */
  @Post('parse')
  async parseResume(@Body() dto: ParseResumeDto) {
    const result = await this.resumeService.parseResume(dto.content);
    return result;
  }

  /**
   * 优化简历（流式输出）
   */
  @Post('optimize')
  async optimizeResume(
    @Body() dto: OptimizeResumeDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(HttpStatus.OK);

    try {
      for await (const chunk of this.resumeService.optimizeResumeStream(dto)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  /**
   * 获取简历优化建议
   */
  @Post('suggestions')
  async getSuggestions(@Body() dto: ParseResumeDto) {
    const suggestions = await this.resumeService.getSuggestions(dto.content);
    return suggestions;
  }

  /**
   * 生成简历 HTML（用于下载）
   */
  @Post('export')
  async exportResume(
    @Body()
    dto: {
      content: string;
      style?: 'professional' | 'creative' | 'academic' | 'minimal';
    },
  ) {
    const html = this.resumeService.generateResumeHTML(
      dto.content,
      dto.style || 'professional',
    );
    return { html };
  }

  /**
   * 导出简历为 Word 文档 (DOCX)
   */
  @Post('export/docx')
  async exportResumeDocx(
    @Body()
    dto: {
      content: string;
      style?: 'professional' | 'creative' | 'academic' | 'minimal';
    },
    @Res() res: Response,
  ) {
    const buffer = await this.resumeService.generateResumeDocx(
      dto.content,
      dto.style || 'professional',
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resume-${new Date().toISOString().split('T')[0]}.docx"`,
    );
    res.send(buffer);
  }

  // ============= 模板相关 API =============

  /**
   * 获取所有简历模板（内置 + 爬取的）
   */
  @Get('templates')
  async getTemplates(
    @Query('category') category?: CrawledTemplate['category'],
    @Query('source') source?: 'builtin' | 'crawled' | 'all',
  ) {
    return this.resumeService.getTemplates({
      category,
      source: source || 'all',
    });
  }

  /**
   * 获取单个模板详情
   */
  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    const template = this.resumeService.getTemplate(id);
    if (!template) {
      throw new BadRequestException(`模板不存在: ${id}`);
    }
    return template;
  }

  /**
   * 爬取新模板（管理员功能）
   */
  @Post('templates/crawl')
  async crawlTemplates() {
    const templates = await this.resumeService.crawlTemplates();
    return {
      message: `成功爬取 ${templates.length} 个模板`,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        source: t.source,
      })),
    };
  }

  /**
   * 使用模板导出简历 HTML
   */
  @Post('export/template')
  async exportWithTemplate(
    @Body()
    dto: {
      content: string;
      templateId: string;
    },
  ) {
    const html = this.resumeService.generateResumeHTMLWithTemplate(
      dto.content,
      dto.templateId,
    );
    return { html };
  }

  /**
   * 使用模板导出简历 Word 文档
   */
  @Post('export/template/docx')
  async exportWithTemplateDocx(
    @Body()
    dto: {
      content: string;
      templateId: string;
    },
    @Res() res: Response,
  ) {
    const buffer = await this.resumeService.generateResumeDocxWithTemplate(
      dto.content,
      dto.templateId,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resume-${new Date().toISOString().split('T')[0]}.docx"`,
    );
    res.send(buffer);
  }

  /**
   * 预览模板效果
   */
  @Post('templates/:id/preview')
  async previewTemplate(
    @Param('id') templateId: string,
    @Body() dto: { content: string },
  ) {
    const html = this.resumeService.generateResumeHTMLWithTemplate(
      dto.content,
      templateId,
    );
    return { html };
  }
}
