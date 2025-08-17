# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Whisper API
Creates a single executable with all dependencies bundled
"""

import os
import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.getcwd(), 'src'))

# Collect data files for various packages
datas = []

# FastAPI static files and templates
datas += collect_data_files('fastapi')

# Whisper model files - only include tiny model to reduce size
if os.path.exists('models'):
    # Only include tiny model files
    tiny_model_patterns = ['tiny.pt', 'tiny']
    
    for root, dirs, files in os.walk('models'):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, 'models')
            
            # Check if this file is related to tiny model
            include_file = False
            for pattern in tiny_model_patterns:
                if pattern in file.lower() or pattern in rel_path.lower():
                    include_file = True
                    break
            
            if include_file:
                dest_path = os.path.join('models', rel_path)
                datas.append((file_path, os.path.dirname(dest_path)))
                print(f"Including model file: {rel_path}")
            else:
                print(f"Excluding model file: {rel_path}")

# Collect hidden imports for various packages
hiddenimports = []

# FastAPI and dependencies
hiddenimports += collect_submodules('fastapi')
hiddenimports += collect_submodules('uvicorn')
hiddenimports += collect_submodules('starlette')
hiddenimports += collect_submodules('pydantic')
hiddenimports += ['uvicorn.lifespan.on', 'uvicorn.loops.auto', 'uvicorn.protocols.websockets.auto']

# Whisper dependencies
hiddenimports += collect_submodules('whisper')
hiddenimports += ['whisper.normalizers.english', 'whisper.normalizers.basic']

# PyTorch and related
hiddenimports += ['torch', 'torch.nn', 'torch.nn.functional']
hiddenimports += collect_submodules('transformers')
hiddenimports += collect_submodules('tokenizers')

# Additional PyTorch imports
hiddenimports += [
    'torch.jit',
    'torch.serialization',
    'torch._C',
    'torch.backends.cudnn',
    'torch.utils.data',
]

# Audio processing
hiddenimports += ['librosa', 'soundfile', 'audioread']

# Other dependencies
hiddenimports += ['multipart', 'python_multipart']

# Fix for pkg_resources and jaraco dependencies
hiddenimports += [
    'jaraco.text',
    'jaraco.functools',
    'jaraco.context',
    'jaraco.collections', 
    'jaraco.itertools',
    'jaraco.classes',
    'pkg_resources.py2_warn',
    'pkg_resources._vendor.packaging',
    'pkg_resources._vendor.packaging.version',
    'pkg_resources._vendor.packaging.specifiers',
    'pkg_resources._vendor.packaging.requirements',
]

# Windows-specific imports
if sys.platform.startswith('win'):
    hiddenimports += [
        'win32api',
        'win32con',
        'win32file',
        'win32pipe',
        'win32process',
        'win32security',
        'pywintypes',
        'winsound',
    ]

# Binary exclusions - exclude unnecessary binaries to reduce size
binaries = []

a = Analysis(
    ['src/main.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=['hooks'],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude unnecessary packages to reduce size
        'matplotlib',
        'PIL',
        'tk',
        'tcl',
        '_tkinter',
        'tkinter',
        'Tkinter',
        'jupyter',
        'notebook',
        'ipython',
        'pytest',
        'sphinx',
        # Note: setuptools is needed for pkg_resources, don't exclude
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='whisper-api.exe' if sys.platform.startswith('win') else 'whisper-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,  # Enable UPX compression to reduce size
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # Windows-specific options
    version=None,
    uac_admin=False,
    uac_uiaccess=False,
    icon=None,
)