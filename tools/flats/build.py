"""Write every garment flat and register it in assets/garments/manifest.json.
Usage: python3 tools/flats/build.py [category ...]"""
import sys, importlib
from lib import write, register

CATS = {'shoes': ('shoes', 'SHOES', ['front']), 'hats': ('hats', 'HATS', ['front', 'back']),
        'tops': ('tops', 'TOPS', ['front', 'back']), 'bottoms': ('bottoms', 'BOTTOMS', ['front', 'back'])}

def main(cats):
    for cat in cats:
        mod_name, table, views = CATS[cat]
        mod = importlib.import_module(mod_name)
        entries = {}
        for key, fn in getattr(mod, table).items():
            e = {}
            for v in views:
                d = fn() if views == ['front'] else fn(v)
                e[v] = write(cat, key, v, d)
            entries[f'{cat}/{key}'] = e
        register(entries)
        print(cat, len(entries), 'garments')

if __name__ == '__main__':
    main(sys.argv[1:] or list(CATS))
