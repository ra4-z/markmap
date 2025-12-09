import { ItemView, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import type MarkmapPlugin from './main';

export const VIEW_TYPE_MARKMAP = 'markmap-view';

export class MarkmapView extends ItemView {
  private plugin: MarkmapPlugin;
  private transformer: Transformer;
  private markmap: Markmap | null = null;
  private svgEl: SVGSVGElement | null = null;
  private containerDiv: HTMLDivElement | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;
  private themeObserver: MutationObserver | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: MarkmapPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.transformer = new Transformer();
  }

  getViewType(): string {
    return VIEW_TYPE_MARKMAP;
  }

  getDisplayText(): string {
    return 'Markmap';
  }

  getIcon(): string {
    return 'brain';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    // 创建容器
    this.containerDiv = container.createDiv({
      cls: 'markmap-container',
    });
    this.containerDiv.style.width = '100%';
    this.containerDiv.style.height = '100%';
    this.containerDiv.style.position = 'relative';

    // 创建 SVG 元素
    this.svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgEl.style.width = '100%';
    this.svgEl.style.height = '100%';
    this.svgEl.style.position = 'relative';
    this.svgEl.style.zIndex = '1';
    this.svgEl.setAttribute('class', 'markmap-svg');
    this.containerDiv.appendChild(this.svgEl);

    // 初始化 markmap
    this.createMarkmap();

    // 添加工具栏
    const toolbar = Toolbar.create(this.markmap!);
    toolbar.attach(this.containerDiv);

    // 监听主题变化
    this.themeObserver = new MutationObserver(() => {
      // 主题切换时重新创建 markmap
      if (this.svgEl && this.containerDiv && this.markmap) {
        const oldMarkmap = this.markmap;
        this.createMarkmap();

        // 重新添加工具栏
        const toolbar = Toolbar.create(this.markmap!);
        toolbar.attach(this.containerDiv);

        // 销毁旧的 markmap
        oldMarkmap.destroy();

        // 重新渲染当前内容
        this.updateMarkmap();
      }
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // 渲染初始内容
    await this.updateMarkmap();
  }

  async onClose() {
    // 清理
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
    if (this.markmap) {
      this.markmap.destroy();
      this.markmap = null;
    }
    this.svgEl = null;
    this.containerDiv = null;
  }

  private createMarkmap() {
    if (!this.svgEl) return;

    const isDark = document.body.classList.contains('theme-dark');
    this.markmap = Markmap.create(this.svgEl, {
      color: isDark
        ? [
            '#8b5cf6',
            '#06b6d4',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#ec4899',
            '#6366f1',
          ]
        : [
            '#7c3aed',
            '#0891b2',
            '#059669',
            '#d97706',
            '#dc2626',
            '#db2777',
            '#4f46e5',
          ],
      colorFreezeLevel: 2,
      duration: 500,
      maxWidth: 300,
      spacingVertical: 10,
      spacingHorizontal: 80,
      autoFit: true,
      fitRatio: 0.95,
    });
  }

  async updateMarkmap() {
    // 防抖：避免频繁更新
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      await this.renderMarkmap();
    }, 300);
  }

  private async renderMarkmap() {
    if (!this.markmap || !this.svgEl) {
      return;
    }

    try {
      // 获取当前活动文件的内容
      const content = await this.getActiveMarkdownContent();

      if (!content) {
        this.showPlaceholder();
        return;
      }

      // 转换 Markdown 到 Markmap 数据
      const { root, features } = this.transformer.transform(content);

      // 加载必要的资源（CSS 和 JS）
      const { styles } = this.transformer.getUsedAssets(features);

      if (styles) {
        this.loadStyles(styles);
      }

      // 渲染 markmap
      this.markmap.setData(root);
      this.markmap.fit();

      // 隐藏占位符
      this.hidePlaceholder();
    } catch (error) {
      console.error('Error rendering markmap:', error);
      this.showError(error);
    }
  }

  private async getActiveMarkdownContent(): Promise<string | null> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const file = activeView.file;
      if (file) {
        return await this.app.vault.read(file);
      }
    }
    return null;
  }

  private loadStyles(styles: string[]) {
    // 在 Obsidian 中加载外部样式
    const styleId = 'markmap-dynamic-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // 这里简化处理，实际可能需要异步加载
    styleEl.textContent = styles
      .map((url) => `@import url("${url}");`)
      .join('\n');
  }

  private showPlaceholder() {
    if (!this.containerDiv || !this.svgEl) return;

    // 清空 SVG 内容但不隐藏
    while (this.svgEl.firstChild) {
      this.svgEl.removeChild(this.svgEl.firstChild);
    }

    let placeholder = this.containerDiv.querySelector(
      '.markmap-placeholder',
    ) as HTMLDivElement;
    if (!placeholder) {
      placeholder = this.containerDiv.createDiv({
        cls: 'markmap-placeholder',
      });
      placeholder.style.position = 'absolute';
      placeholder.style.top = '50%';
      placeholder.style.left = '50%';
      placeholder.style.transform = 'translate(-50%, -50%)';
      placeholder.style.textAlign = 'center';
      placeholder.style.color = 'var(--text-muted)';
      placeholder.style.zIndex = '10';
      placeholder.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🧠</div>
        <div style="font-size: 16px;">Open a Markdown file to view as Markmap</div>
      `;
    }
    placeholder.style.display = 'block';
  }

  private hidePlaceholder() {
    if (!this.containerDiv) return;

    const placeholder = this.containerDiv.querySelector(
      '.markmap-placeholder',
    ) as HTMLDivElement;
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  private showError(error: any) {
    if (!this.containerDiv) return;

    let errorDiv = this.containerDiv.querySelector(
      '.markmap-error',
    ) as HTMLDivElement;
    if (!errorDiv) {
      errorDiv = this.containerDiv.createDiv({
        cls: 'markmap-error',
      });
      errorDiv.style.position = 'absolute';
      errorDiv.style.top = '50%';
      errorDiv.style.left = '50%';
      errorDiv.style.transform = 'translate(-50%, -50%)';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.color = 'var(--text-error)';
      errorDiv.style.maxWidth = '80%';
    }
    errorDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 16px; margin-bottom: 8px;">Error rendering Markmap</div>
      <div style="font-size: 12px; color: var(--text-muted);">${error.message || error}</div>
    `;
    errorDiv.style.display = 'block';
  }
}
