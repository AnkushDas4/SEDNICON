/**
 * Sednicon Client Utilities & Format Converters
 */

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')) {
    return window.location.origin;
  }
  return 'https://sednicon.sednium.com';
}

export function getRenderUrl({ q = 'circle', color = 'black', size = 24, anim = null, set = null }) {
  const base = getApiBaseUrl();
  const cleanQ = encodeURIComponent(String(q || 'circle').trim());
  const cleanColor = encodeURIComponent(String(color || 'black').replace(/^#/, ''));
  const cleanSize = Math.min(2048, Math.max(1, parseInt(size, 10) || 24));

  let url = `${base}/api/render?q=${cleanQ}&color=${cleanColor}&size=${cleanSize}`;
  if (anim && anim !== 'none') {
    url += `&anim=${encodeURIComponent(anim)}`;
  }
  if (set) {
    url += `&set=${encodeURIComponent(set)}`;
  }
  return url;
}

export function svgToDataUri(svgString) {
  if (!svgString) return '';
  const cleaned = svgString.replace(/\s+/g, ' ').trim();
  const encoded = encodeURIComponent(cleaned).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

export function recolorSvg(svgString, color, size) {
  if (!svgString || typeof window === 'undefined') return svgString;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgString;

    if (size) {
      svgEl.setAttribute('width', String(size));
      svgEl.setAttribute('height', String(size));
    }

    if (!svgEl.getAttribute('viewBox')) {
      svgEl.setAttribute('viewBox', '0 0 24 24');
    }
    if (!svgEl.getAttribute('xmlns')) {
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const hexColor = color?.startsWith('#') ? color : `#${color || '000000'}`;

    // Update fill and stroke attributes on child elements
    const elements = svgEl.querySelectorAll('*');
    elements.forEach((el) => {
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');

      if (fill && fill !== 'none') {
        el.setAttribute('fill', hexColor);
      }
      if (stroke && stroke !== 'none') {
        el.setAttribute('stroke', hexColor);
      }
    });

    const rootFill = svgEl.getAttribute('fill');
    if (rootFill && rootFill !== 'none') {
      svgEl.setAttribute('fill', hexColor);
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return svgString;
  }
}

// Convert SVG kebab-case attributes to camelCase for valid React JSX
const SVG_ATTRIBUTE_MAP = {
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'xmlns:xlink': 'xmlnsXlink',
  'xlink:href': 'xlinkHref',
  'class': 'className',
};

export function svgToReact(svgString, componentName = 'Icon') {
  if (!svgString) return '';
  let jsx = svgString;

  // Replace kebab-case SVG attributes with React camelCase
  Object.entries(SVG_ATTRIBUTE_MAP).forEach(([kebab, camel]) => {
    const regex = new RegExp(`\\s${kebab}=`, 'g');
    jsx = jsx.replace(regex, ` ${camel}=`);
  });

  // Inject props into opening svg tag
  jsx = jsx.replace(/<svg\b([^>]*)>/, '<svg$1 {...props}>');

  return `import React from 'react';\n\nexport const ${componentName} = (props) => (\n  ${jsx}\n);\n\nexport default ${componentName};`;
}

export function svgToFlutter(svgString, size = 24) {
  if (!svgString) return '';
  return `import 'package:flutter/material.dart';\nimport 'package:flutter_svg/flutter_svg.dart';\n\nWidget buildIcon() {\n  return SvgPicture.string(\n    '''${svgString}''',\n    width: ${size},\n    height: ${size},\n  );\n}`;
}

export function extractPaths(svgString) {
  if (!svgString) return [];
  const matches = [...svgString.matchAll(/<path[^>]*\bd="([^"]*)"/gi)];
  return matches.map((m) => m[1]);
}

export function svgToAndroidXml(svgString, size = 24, color = '#000000') {
  const paths = extractPaths(svgString);
  const cleanColor = color?.startsWith('#') ? color : `#${color || '000000'}`;
  const pathElements = paths.length > 0
    ? paths.map((d) => `    <path\n        android:fillColor="${cleanColor}"\n        android:pathData="${d}" />`).join('\n')
    : `    <path\n        android:fillColor="${cleanColor}"\n        android:pathData="M12 2L2 22h20L12 2z" />`;

  return `<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="${size}dp"\n    android:height="${size}dp"\n    android:viewportWidth="24"\n    android:viewportHeight="24">\n${pathElements}\n</vector>`;
}

// Complete Curated Icon Library Dataset
export const CATEGORIES = [
  {
    id: 'brands',
    name: 'Brands',
    icons: [
      'google', 'github', 'apple', 'microsoft', 'amazon', 'meta', 'twitter', 'linkedin',
      'youtube', 'netflix', 'spotify', 'discord', 'slack', 'figma', 'notion', 'vercel',
      'docker', 'kubernetes', 'android', 'windows'
    ],
  },
  {
    id: 'social',
    name: 'Social',
    icons: [
      'public', 'share', 'favorite', 'thumb_up', 'chat', 'forum', 'people', 'group',
      'person', 'person_add', 'notifications', 'email', 'rss_feed', 'trending_up',
      'star', 'bookmarks', 'connect_without_contact', 'tag', 'alternate_email', 'campaign'
    ],
  },
  {
    id: 'ui',
    name: 'UI',
    icons: [
      'menu', 'close', 'search', 'home', 'settings', 'arrow_back', 'arrow_forward',
      'add', 'remove', 'edit', 'delete', 'more_vert', 'more_horiz', 'chevron_right',
      'chevron_left', 'expand_more', 'expand_less', 'filter_list', 'sort', 'tune',
      'check', 'check_circle', 'cancel', 'info', 'warning', 'error', 'help',
      'radio_button_unchecked', 'toggle_on', 'drag_indicator', 'open_in_new', 'launch'
    ],
  },
  {
    id: 'dev',
    name: 'Developer',
    icons: [
      'terminal', 'code', 'bug_report', 'build', 'memory', 'developer_mode',
      'integration_instructions', 'api', 'webhook', 'data_object', 'functions',
      'commit', 'merge', 'fork_right', 'account_tree', 'storage', 'cloud',
      'cloud_upload', 'cloud_download', 'dns', 'http', 'security', 'key', 'lock', 'vpn_key'
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icons: [
      'payments', 'credit_card', 'account_balance', 'account_balance_wallet',
      'attach_money', 'currency_bitcoin', 'currency_exchange', 'point_of_sale',
      'receipt', 'receipt_long', 'shopping_cart', 'store', 'inventory', 'local_offer',
      'price_check', 'trending_up', 'trending_down', 'bar_chart', 'pie_chart', 'analytics'
    ],
  },
  {
    id: 'media',
    name: 'Media',
    icons: [
      'play_circle', 'pause_circle', 'stop_circle', 'skip_next', 'skip_previous',
      'volume_up', 'volume_off', 'mic', 'mic_off', 'videocam', 'photo_camera',
      'image', 'collections', 'gif', 'music_note', 'headphones', 'speaker',
      'cast', 'screen_share', 'movie', 'live_tv'
    ],
  },
  {
    id: 'files',
    name: 'Files',
    icons: [
      'folder', 'folder_open', 'folder_shared', 'insert_drive_file', 'description',
      'article', 'picture_as_pdf', 'table_chart', 'text_snippet', 'download',
      'upload', 'attach_file', 'link', 'cloud_sync', 'backup', 'restore',
      'archive', 'unarchive', 'content_copy', 'content_paste', 'save'
    ],
  },
  {
    id: 'comm',
    name: 'Comm',
    icons: [
      'chat_bubble', 'comment', 'message', 'inbox', 'send', 'reply', 'forward',
      'mark_email_read', 'drafts', 'call', 'phone', 'video_call', 'contacts',
      'contact_mail', 'contact_phone', 'support_agent', 'headset_mic',
      'record_voice_over', 'translate', 'language', 'hearing'
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    icons: [
      'build', 'construction', 'handyman', 'engineering', 'science', 'biotech',
      'bolt', 'flash_on', 'auto_fix_high', 'auto_awesome', 'smart_toy', 'psychology',
      'rocket_launch', 'explore', 'navigation', 'location_on', 'map', 'directions',
      'schedule', 'timer', 'alarm', 'refresh', 'sync', 'loop'
    ],
  },
];

export const ALL_CURATED_ICONS = CATEGORIES.flatMap((c) => c.icons);

// Expanded AI Provider Models (2025/2026 Editions)
export const PROVIDER_MODELS = {
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768'],
  mistral: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-12b-2409'],
  nvidia: ['meta/llama-3.3-70b-instruct', 'mistralai/mistral-large-2-instruct', 'deepseek-ai/deepseek-r1'],
  together: ['meta-llama/Llama-3.3-70b-chat-hf', 'Qwen/Qwen2.5-72B-Instruct-Turbo', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
  openrouter: ['google/gemini-2.5-flash', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'deepseek/deepseek-r1'],
};

// AI Providers List
export const PROVIDERS_LIST = [
  { id: 'gemini', name: 'Gemini' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Claude' },
  { id: 'groq', name: 'Groq' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'nvidia', name: 'Nvidia' },
  { id: 'together', name: 'Together' },
  { id: 'openrouter', name: 'OpenRouter' },
];

// Variations generator for any icon across multiple styles and icon sets
export function getIconVariations(iconName, color = '2563eb', size = 32) {
  const cleanColor = encodeURIComponent(color.replace(/^#/, ''));
  const cleanName = iconName.toLowerCase().replace(/_/g, '-');
  const isBrand = CATEGORIES.find((c) => c.id === 'brands')?.icons.includes(iconName);

  if (isBrand) {
    return [
      {
        id: 'simple-icons',
        label: 'Simple Icons (Official)',
        url: `https://api.iconify.design/simple-icons/${iconName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
        renderUrl: getRenderUrl({ q: iconName, color, size, set: 'simple-icons' }),
      },
      {
        id: 'cib',
        label: 'CoreUI Brands',
        url: `https://api.iconify.design/cib/${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
        renderUrl: getRenderUrl({ q: `cib:${cleanName}`, color, size }),
      },
      {
        id: 'fa-brands',
        label: 'Font Awesome Brands',
        url: `https://api.iconify.design/fa6-brands/${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
        renderUrl: getRenderUrl({ q: `fa6-brands:${cleanName}`, color, size }),
      },
      {
        id: 'tabler-brand',
        label: 'Tabler Brand',
        url: `https://api.iconify.design/tabler/brand-${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
        renderUrl: getRenderUrl({ q: `tabler:brand-${cleanName}`, color, size }),
      },
    ];
  }

  return [
    {
      id: 'material-outlined',
      label: 'Material Symbols (Outlined)',
      url: `https://api.iconify.design/material-symbols/${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: cleanName, color, size }),
    },
    {
      id: 'material-rounded',
      label: 'Material Symbols (Rounded)',
      url: `https://api.iconify.design/material-symbols/${cleanName}-rounded.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: `${cleanName}-rounded`, color, size }),
    },
    {
      id: 'material-sharp',
      label: 'Material Symbols (Sharp)',
      url: `https://api.iconify.design/material-symbols/${cleanName}-sharp.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: `${cleanName}-sharp`, color, size }),
    },
    {
      id: 'lucide',
      label: 'Lucide Clean Line',
      url: `https://api.iconify.design/lucide/${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: `lucide:${cleanName}`, color, size }),
    },
    {
      id: 'tabler',
      label: 'Tabler Linear',
      url: `https://api.iconify.design/tabler/${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: `tabler:${cleanName}`, color, size }),
    },
    {
      id: 'phosphor',
      label: 'Phosphor Regular',
      url: `https://api.iconify.design/ph/${cleanName}.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: `ph:${cleanName}`, color, size }),
    },
    {
      id: 'heroicons',
      label: 'Heroicons 24 Solid',
      url: `https://api.iconify.design/heroicons/${cleanName}-20-solid.svg?color=%23${cleanColor}&width=${size}&height=${size}`,
      renderUrl: getRenderUrl({ q: `heroicons:${cleanName}-20-solid`, color, size }),
    },
  ];
}
