import os

for split in ['Training', 'Testing']:
    for cls in ['glioma', 'meningioma', 'notumor', 'pituitary']:
        path = f'dataset/{split}/{cls}'
        n = len(os.listdir(path)) if os.path.exists(path) else 'MISSING'
        print(f'{path}: {n} files')