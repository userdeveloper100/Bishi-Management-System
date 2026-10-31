import { config } from '@vue/test-utils';

import { i18n } from '@/i18n';

// Every mounted component can use $t and useI18n. Tests that need another language set it explicitly.
config.global.plugins = [i18n];
