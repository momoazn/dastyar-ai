#!/usr/bin/env python3
"""
Build script for creating Whisper API executable
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Command: {cmd}")
        print(f"Return code: {e.returncode}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        sys.exit(1)


def clean_build():
    """Clean previous build artifacts"""
    print("🧹 Cleaning previous build artifacts...")
    
    dirs_to_clean = ['build', 'dist', '__pycache__']
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print(f"   Removed {dir_name}/")
    
    # Clean .pyc files
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.pyc'):
                os.remove(os.path.join(root, file))


def install_dependencies():
    """Install build dependencies"""
    run_command("uv sync --group build", "Installing build dependencies")


def create_executable():
    """Create the executable using PyInstaller"""
    run_command("uv run pyinstaller whisper-api.spec --clean", "Creating executable")


def verify_executable():
    """Verify the executable was created successfully"""
    exe_path = Path("dist/whisper-api")
    if not exe_path.exists():
        print("❌ Executable not found in dist/")
        sys.exit(1)
    
    file_size = exe_path.stat().st_size / (1024 * 1024)  # Size in MB
    print(f"✅ Executable created successfully!")
    print(f"📁 Location: {exe_path.absolute()}")
    print(f"📊 Size: {file_size:.1f} MB")


def main():
    """Main build process"""
    print("🏗️  Building Whisper API Executable")
    print("=" * 50)
    
    # Change to whisper directory
    os.chdir(Path(__file__).parent)
    
    try:
        clean_build()
        install_dependencies()
        create_executable()
        verify_executable()
        
        print("\n🎉 Build completed successfully!")
        print("\n📋 Next steps:")
        print("   1. Test the executable: ./dist/whisper-api")
        print("   2. Copy models/ directory alongside the executable if needed")
        print("   3. Deploy the executable to your target environment")
        
    except KeyboardInterrupt:
        print("\n⚠️  Build interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Build failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()