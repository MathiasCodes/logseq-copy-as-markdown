import "@logseq/libs";

import { ExportService } from "./export-service";
import { ExportOptions } from "./types";
import { initI18n, t } from "./i18n";

import { logseq as PL } from "../package.json";

const pluginId = PL.id;

async function exportBlockToClipboard(uuid: string, format: 'markdown' | 'asciidoc' | 'html') {
  try {
    const options: ExportOptions = {
      format,
      includeChildren: true,
      includeProperties: false,
      maxDepth: 10
    };

    const result = await ExportService.exportBlock(uuid, options);

    if (result) {
      await ExportService.copyToClipboard(result);
      logseq.UI.showMsg(
        t('exportSuccess', {
          count: result.blockCount.toString(),
          format: format.toUpperCase()
        }),
        'success'
      );
    } else {
      logseq.UI.showMsg(t('noBlockFound'), 'error');
    }
  } catch (error) {
    console.error(`#${pluginId}: Export failed:`, error);
    logseq.UI.showMsg(
      t('exportFailed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      'error'
    );
  }
}

async function main() {
  // Initialize i18n first
  await initI18n();

  // Register block context menu items with translated labels
  logseq.Editor.registerBlockContextMenuItem(t('copyAsMarkdown'), async (e) => {
    const { uuid } = e;
    await exportBlockToClipboard(uuid, 'markdown');
  });

  logseq.Editor.registerBlockContextMenuItem(t('copyAsAsciiDoc'), async (e) => {
    const { uuid } = e;
    await exportBlockToClipboard(uuid, 'asciidoc');
  });

  logseq.Editor.registerBlockContextMenuItem(t('copyAsHtml'), async (e) => {
    const { uuid } = e;
    await exportBlockToClipboard(uuid, 'html');
  });
}

logseq.ready(main).catch(console.error);
