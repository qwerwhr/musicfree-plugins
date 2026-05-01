import json
import os

base_dir = r"C:\Users\DELL\.qclaw\workspace\musicfree-subscription\repo"

plugins = []
for fname in sorted(os.listdir(base_dir)):
    if fname.endswith('.js') and not fname.startswith('docs') and not fname.startswith('pages') and not fname.startswith('plugins'):
        url = f'https://cdn.jsdelivr.net/gh/qwerwhr/musicfree-plugins@main/{fname}'
        name = fname[:-3]
        plugins.append({
            'name': name,
            'url': url,
            'version': '1.0.0'
        })

subscription = {
    'desc': 'MusicFree 插件订阅 - 76个插件',
    'plugins': plugins
}

with open(base_dir + '\\plugins.json', 'w', encoding='utf-8') as f:
    json.dump(subscription, f, ensure_ascii=False, indent=2)

with open(base_dir + '\\docs\\plugins.json', 'w', encoding='utf-8') as f:
    json.dump(subscription, f, ensure_ascii=False, indent=2)

print(len(plugins))