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
  private svgObserver: MutationObserver | null = null;
  private lastContent: string | null = null; // 缓存上一次的内容

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
    this.svgEl.classList.add('markmap-svg-obsidian');
    this.containerDiv.appendChild(this.svgEl);

    // 初始化 markmap
    this.markmap = Markmap.create(this.svgEl, {
      colorFreezeLevel: 2,
      duration: 500,
      maxWidth: 300,
      spacingVertical: 10,
      spacingHorizontal: 80,
      autoFit: true,
      fitRatio: 0.95,
    });

    // 添加工具栏
    const toolbar = Toolbar.create(this.markmap);
    toolbar.attach(this.containerDiv);

    // 设置SVG变化监听
    this.setupSvgObserver();

    // 渲染初始内容
    await this.updateMarkmap();
  }

  async onClose() {
    // 清理
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    if (this.svgObserver) {
      this.svgObserver.disconnect();
      this.svgObserver = null;
    }
    if (this.markmap) {
      this.markmap.destroy();
      this.markmap = null;
    }
    this.svgEl = null;
    this.containerDiv = null;
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
        // 如果没有获取到内容，尝试使用缓存的内容
        if (this.lastContent) {
          // 使用缓存内容继续显示，不显示占位符
          return;
        }
        this.showPlaceholder();
        return;
      }

      // 缓存当前内容
      this.lastContent = content;

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

      // 应用主题颜色到文本元素
      this.applyThemeColors();

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
    if (!this.containerDiv) return;

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

  private setupSvgObserver() {
    if (!this.svgEl) return;

    // 创建观察器监听SVG内容变化
    this.svgObserver = new MutationObserver(() => {
      this.applyThemeColors();
    });

    // 开始观察SVG的子元素变化
    this.svgObserver.observe(this.svgEl, {
      childList: true,
      subtree: true,
      attributes: false,
    });
  }

  private applyThemeColors() {
    if (!this.svgEl) return;

    // 获取当前主题的文字颜色
    const textColor = getComputedStyle(document.body).getPropertyValue(
      '--text-normal',
    );

    // 强制设置所有文本元素的颜色
    const textElements = this.svgEl.querySelectorAll('text, tspan');
    textElements.forEach((el) => {
      (el as SVGElement).style.fill = textColor;
    });

    // 设置 foreignObject 中的颜色
    const foreignObjects = this.svgEl.querySelectorAll('foreignObject');
    foreignObjects.forEach((el) => {
      (el as SVGForeignObjectElement).style.color = textColor;
    });
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
