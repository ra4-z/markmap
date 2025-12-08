import { Plugin, WorkspaceLeaf, MarkdownView, TFile } from 'obsidian';
import { MarkmapView, VIEW_TYPE_MARKMAP } from './view';

export default class MarkmapPlugin extends Plugin {
  async onload() {
    console.log('Loading Markmap plugin');

    // 注册 Markmap 视图
    this.registerView(
      VIEW_TYPE_MARKMAP,
      (leaf) => new MarkmapView(leaf, this)
    );

    // 添加功能区图标
    this.addRibbonIcon('brain', 'Open Markmap', () => {
      this.activateView();
    });

    // 添加命令：在侧边栏打开 Markmap
    this.addCommand({
      id: 'open-markmap',
      name: 'Open Markmap view',
      callback: () => {
        this.activateView();
      }
    });

    // 添加命令：预览当前文件的 Markmap
    this.addCommand({
      id: 'preview-markmap',
      name: 'Preview current file as Markmap',
      checkCallback: (checking: boolean) => {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
          if (!checking) {
            this.activateView();
          }
          return true;
        }
        return false;
      }
    });

    // 监听文件切换事件
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MARKMAP);
        leaves.forEach((leaf) => {
          if (leaf.view instanceof MarkmapView) {
            leaf.view.updateMarkmap();
          }
        });
      })
    );

    // 监听编辑器变化
    this.registerEvent(
      this.app.workspace.on('editor-change', () => {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_MARKMAP);
        leaves.forEach((leaf) => {
          if (leaf.view instanceof MarkmapView) {
            leaf.view.updateMarkmap();
          }
        });
      })
    );
  }

  onunload() {
    console.log('Unloading Markmap plugin');

    // 清理所有 Markmap 视图
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_MARKMAP);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_MARKMAP);

    if (leaves.length > 0) {
      // 如果视图已经存在，激活它
      leaf = leaves[0];
    } else {
      // 否则在右侧边栏创建新视图
      leaf = workspace.getRightLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE_MARKMAP, active: true });
    }

    // 激活视图
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async getActiveFileContent(): Promise<string | null> {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const file = activeView.file;
      if (file) {
        return await this.app.vault.read(file);
      }
    }
    return null;
  }
}
