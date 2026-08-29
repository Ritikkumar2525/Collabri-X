import re
import os

replacements = [
    # Backgrounds
    (r'bg-slate-50', 'bg-dark'),
    (r'bg-white', 'bg-dark-lighter'),
    (r'bg-slate-900', 'bg-black'),
    (r'bg-slate-800', 'bg-dark-lightest'),
    (r'bg-slate-700', 'bg-dark-lighter'),
    (r'bg-indigo-600', 'bg-red-accent'),
    (r'bg-indigo-700', 'bg-red-800'),
    (r'bg-indigo-500', 'bg-red-600'),
    (r'bg-indigo-400', 'bg-red-500'),
    (r'bg-indigo-100', 'bg-red-accent/20'),
    (r'bg-indigo-50', 'bg-red-accent/10'),
    
    # Text colors
    (r'text-slate-900', 'text-white'),
    (r'text-slate-800', 'text-gray-200'),
    (r'text-slate-700', 'text-gray-300'),
    (r'text-slate-600', 'text-gray-400'),
    (r'text-slate-500', 'text-gray-500'),
    (r'text-slate-400', 'text-gray-500'),
    (r'text-slate-300', 'text-gray-400'),
    (r'text-slate-200', 'text-gray-300'),
    (r'text-slate-100', 'text-white'),
    (r'text-indigo-600', 'text-red-accent'),
    (r'text-indigo-500', 'text-red-500'),
    (r'text-indigo-400', 'text-red-400'),
    (r'text-indigo-300', 'text-red-300'),
    (r'text-indigo-200', 'text-red-200'),
    (r'text-indigo-100', 'text-red-100'),
    (r'text-indigo-900', 'text-red-900'),
    
    # Borders
    (r'border-slate-200', 'border-white/10'),
    (r'border-slate-100', 'border-white/5'),
    (r'border-slate-300', 'border-white/20'),
    (r'border-slate-600', 'border-white/20'),
    (r'border-slate-700', 'border-white/10'),
    (r'border-slate-800', 'border-white/5'),
    (r'border-indigo-400', 'border-red-400'),
    (r'border-indigo-500', 'border-red-500'),
    (r'border-indigo-200', 'border-red-200'),
    (r'border-indigo-100', 'border-red-100'),
    
    # Shadows
    (r'shadow-indigo-500', 'shadow-red-500'),
    (r'shadow-indigo-600', 'shadow-red-600'),
    (r'shadow-indigo-900', 'shadow-red-900'),
    (r'shadow-slate-200', 'shadow-black/50'),
    (r'shadow-slate-900', 'shadow-black'),
    
    # Gradients
    (r'from-indigo-500', 'from-red-500'),
    (r'via-purple-500', 'via-red-700'),
    (r'to-pink-500', 'to-black'),
    (r'from-indigo-900', 'from-black'),
    (r'via-purple-900', 'via-dark-lightest'),
    (r'to-slate-900', 'to-dark'),
    (r'from-slate-50', 'from-dark'),
    
    # Other specific classes
    (r'font-extrabold', 'font-light'),
    (r'font-bold', 'font-medium'),
    (r'font-black', 'font-bold'),
]

directories = ['client/src/pages', 'client/src/components']

for d in directories:
    for filename in os.listdir(d):
        if filename.endswith('.jsx'):
            filepath = os.path.join(d, filename)
            with open(filepath, 'r') as f:
                content = f.read()
            
            for old, new in replacements:
                content = re.sub(old, new, content)
                
            with open(filepath, 'w') as f:
                f.write(content)

