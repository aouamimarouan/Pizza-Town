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

# 1. LoginView.jsx
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\views\LoginView.jsx', [
    ('''<button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-paper bg-ink hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </button>''',
    '''<SpecularButton
                type="submit"
                disabled={isLoading}
                size="lg"
                radius={6}
                tint="var(--theme-ink)"
                tintOpacity={1}
                textColor="var(--theme-paper)"
                lineColor="var(--theme-paper)"
                baseColor="#333333"
                intensity={1}
                className="w-full flex justify-center border border-transparent shadow-sm text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
              </SpecularButton>'''),
    ('''<button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-signal-red hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
              </button>''',
     '''<SpecularButton
                type="submit"
                disabled={isLoading}
                size="lg"
                radius={6}
                tint="var(--theme-signal-red)"
                tintOpacity={1}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#800000"
                intensity={1}
                className="w-full flex justify-center border border-transparent shadow-sm text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
              </SpecularButton>''')
])

# 2. ForgotPasswordView.jsx
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\views\ForgotPasswordView.jsx', [
    ('''<button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-signal-red hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
                </button>''',
     '''<SpecularButton
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  radius={6}
                  tint="var(--theme-signal-red)"
                  tintOpacity={1}
                  textColor="#ffffff"
                  lineColor="#ffffff"
                  baseColor="#800000"
                  intensity={1}
                  className="w-full flex justify-center border border-transparent shadow-sm text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le lien'}
                </SpecularButton>''')
])

# 3. ResetPasswordView.jsx
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\views\ResetPasswordView.jsx', [
    ('''<button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-signal-red hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer'}
                  </button>''',
     '''<SpecularButton
                    type="submit"
                    disabled={isLoading}
                    size="lg"
                    radius={6}
                    tint="var(--theme-signal-red)"
                    tintOpacity={1}
                    textColor="#ffffff"
                    lineColor="#ffffff"
                    baseColor="#800000"
                    intensity={1}
                    className="w-full flex justify-center border border-transparent shadow-sm text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer'}
                  </SpecularButton>''')
])

# 4. ReservationView.jsx
process_file(r'c:\Users\aouam\Downloads\Pizza_Town\frontend\src\components\views\ReservationView.jsx', [
    ('''<button
              onClick={() => {
                setReservationSuccess(false);
                setFormData({
                  date: '',
                  time: '',
                  guests: 2,
                  special_requests: ''
                });
              }}
              className="px-6 py-3 bg-paper text-ink border border-slate rounded-md font-bold hover:bg-mist transition-colors"
            >
              Book another table
            </button>''',
     '''<SpecularButton
              onClick={() => {
                setReservationSuccess(false);
                setFormData({
                  date: '',
                  time: '',
                  guests: 2,
                  special_requests: ''
                });
              }}
              size="lg"
              radius={6}
              tint="var(--theme-paper)"
              tintOpacity={1}
              textColor="var(--theme-ink)"
              lineColor="var(--theme-ink)"
              baseColor="var(--theme-slate)"
              intensity={1}
              className="px-6 py-3 font-bold border border-slate"
            >
              Book another table
            </SpecularButton>'''),
    ('''<button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-bold text-white bg-signal-red hover:bg-ink hover:text-paper focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-signal-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('reservation.submit')}
              </button>''',
     '''<SpecularButton
                type="submit"
                disabled={isLoading}
                size="lg"
                radius={6}
                tint="var(--theme-signal-red)"
                tintOpacity={1}
                textColor="#ffffff"
                lineColor="#ffffff"
                baseColor="#800000"
                intensity={1}
                className="w-full flex justify-center border border-transparent shadow-sm text-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : t('reservation.submit')}
              </SpecularButton>''')
])

print('Done applying SpecularButton')
