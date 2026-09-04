import os

def process_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add import if not exists
    if 'SpecularButton' not in content:
        if 'import ' in content:
            # Add after first import
            content = content.replace('import ', "import SpecularButton from '../ui/SpecularButton';\nimport ", 1)
        
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. CartWidget.jsx
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\ui\CartWidget.jsx', [
    ('''<button 
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-signal-red hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal-red transition-colors"
                >
                  Checkout
                </button>''',
    '''<SpecularButton 
                  onClick={() => navigate('/checkout')}
                  size="lg"
                  radius={6}
                  tint="var(--theme-signal-red)"
                  tintOpacity={1}
                  textColor="#ffffff"
                  lineColor="#ffffff"
                  baseColor="#800000"
                  intensity={1}
                  className="w-full flex items-center justify-center border border-transparent shadow-sm text-lg font-bold transition-colors"
                >
                  Checkout
                </SpecularButton>''')
])

# 2. MenuView.jsx
# Wait, MenuView.jsx doesn't have an Add To Cart button directly on the items usually (it's in MenuCard), but I'll replace what's there just in case.
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\views\MenuView.jsx', [
    ('''<button
                  onClick={() => addToCart(item)}
                  className="px-6 py-2 bg-signal-red text-white font-bold rounded-md hover:bg-ink hover:text-paper transition-colors"
                >
                  {t('menu.addToCart')}
                </button>''',
     '''<SpecularButton
                  onClick={() => addToCart(item)}
                  size="md"
                  radius={6}
                  tint="var(--theme-signal-red)"
                  tintOpacity={1}
                  textColor="#ffffff"
                  lineColor="#ffffff"
                  baseColor="#800000"
                  intensity={1}
                  className="px-6 py-2 font-bold transition-colors"
                >
                  {t('menu.addToCart')}
                </SpecularButton>''')
])

# 3. ServicesView.jsx
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\views\ServicesView.jsx', [
    ('''<button 
                onClick={() => navigate('/contact')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-paper text-ink font-bold border border-slate transition-colors hover:bg-mist"
              >
                Learn More
              </button>''',
     '''<SpecularButton 
                onClick={() => navigate('/contact')}
                size="md"
                radius={6}
                tint="var(--theme-paper)"
                tintOpacity={1}
                textColor="var(--theme-ink)"
                lineColor="var(--theme-ink)"
                baseColor="var(--theme-slate)"
                intensity={1}
                className="inline-flex items-center justify-center px-6 py-3 font-bold border border-slate"
              >
                Learn More
              </SpecularButton>''')
])

print('Done applying SpecularButton batch 2')
