// Ionicons used by the app, registered with their SVG data. Without this, <ion-icon> tries to load icon
// files from a path the app does not serve, and every icon shows as an empty box.
import { addIcons } from 'ionicons';
import * as ionicons from 'ionicons/icons';

const APP_ICON_NAMES = [
  'add-circle-outline',
  'add-outline',
  'arrow-back-outline',
  'arrow-forward-outline',
  'book-outline',
  'card-outline',
  'cash-outline',
  'checkmark-done-outline',
  'checkmark-outline',
  'chevron-down-outline',
  'chevron-forward-outline',
  'create-outline',
  'diamond-outline',
  'flash-outline',
  'information-circle-outline',
  'language-outline',
  'lock-closed-outline',
  'log-out-outline',
  'mail-outline',
  'notifications-outline',
  'options-outline',
  'pencil-outline',
  'people-outline',
  'person-add-outline',
  'person-outline',
  'phone-portrait-outline',
  'ribbon-outline',
  'share-social-outline',
  'shield-checkmark-outline',
  'trash-outline',
  'trophy-outline',
] as const;

/** "shield-checkmark-outline" -> "shieldCheckmarkOutline", the export name in ionicons/icons. */
const exportName = (name: string) => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

export function registerIcons(): string[] {
  const registry = ionicons as unknown as Record<string, string>;
  const svgs: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of APP_ICON_NAMES) {
    const svg = registry[exportName(name)];
    if (svg) svgs[name] = svg;
    else missing.push(name);
  }
  addIcons(svgs);
  return missing;
}
