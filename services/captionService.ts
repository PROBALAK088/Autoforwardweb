
import { CaptionRules, ReplacementRule } from '../types';

/**
 * Advanced Caption Processing Service
 * mimic logic from the Python script
 */

export const processCaption = (
  originalCaption: string = "",
  filename: string = "",
  filesize: number = 0,
  rules: CaptionRules
): string => {
  let caption = originalCaption || "";

  // 1. Initial Cleaning
  if (rules.removeLinks) {
    caption = caption.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    caption = caption.replace(/t\.me\/[\n\S]+/g, '');
  }

  if (rules.removeUsernames) {
    caption = caption.replace(/@\w+/g, '');
  }

  if (rules.removeEmojis) {
    // Simple unicode emoji removal regex
    caption = caption.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
  }

  // 2. Word Removal
  if (rules.removeWords && rules.removeWords.length > 0) {
    const pattern = new RegExp(rules.removeWords.map(w => escapeRegExp(w)).join('|'), 'gi');
    caption = caption.replace(pattern, '');
  }

  // 3. Replacements
  if (rules.replacements && rules.replacements.length > 0) {
    rules.replacements.forEach(r => {
      try {
        const regex = new RegExp(r.from, 'gi');
        caption = caption.replace(regex, r.to);
      } catch (e) {
        // Fallback for invalid regex strings
        caption = caption.split(r.from).join(r.to);
      }
    });
  }

  // 4. Symbol Cleaning (except protected words)
  if (rules.symbolsToRemove) {
    // Complex logic omitted for brevity, basic char removal:
    const chars = rules.symbolsToRemove.split('').map(c => escapeRegExp(c)).join('');
    if (chars) {
        const regex = new RegExp(`[${chars}]`, 'g');
        caption = caption.replace(regex, '');
    }
  }

  if (rules.symbolsToReplace) {
     const chars = rules.symbolsToReplace.split('').map(c => escapeRegExp(c)).join('');
     if (chars) {
        const regex = new RegExp(`[${chars}]`, 'g');
        caption = caption.replace(regex, ' ');
     }
  }

  // 5. Apply Template if defined and not empty
  // Note: If template is just placeholder, we use it. 
  // If user wants to KEEP original caption, they must include {default_caption} in template.
  if (rules.template && rules.template.trim().length > 0) {
    let tmpl = rules.template;
    tmpl = tmpl.replace('{default_caption}', caption);
    tmpl = tmpl.replace('{file_name}', filename);
    tmpl = tmpl.replace('{file_size}', formatFileSize(filesize));
    tmpl = tmpl.replace('{language}', detectFromList(caption, rules.customLanguages));
    tmpl = tmpl.replace('{quality}', detectFromList(caption, rules.customQualities));
    // Add more placeholders as needed
    caption = tmpl;
  }

  // 6. Prefix / Suffix
  if (rules.prefix) caption = rules.prefix + "\n" + caption;
  if (rules.suffix) caption = caption + "\n" + rules.suffix;

  // 7. Formatting Cleanup
  if (rules.singleLineSpace) {
    caption = caption.replace(/\n{3,}/g, '\n\n');
    caption = caption.trim();
  }

  return caption;
};

// Helpers
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function detectFromList(text: string, list: string[]): string {
    const found = list.filter(item => new RegExp(escapeRegExp(item), 'i').test(text));
    return found.length > 0 ? found.join(', ') : 'Unknown';
}
