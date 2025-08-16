#!/usr/bin/env python3
"""
Test script to verify port configuration is working correctly.
Run this to check if WHISPER_PORT environment variable is being read.
"""

import os

def test_port_config():
    """Test if the port configuration is working"""
    port = os.getenv("WHISPER_PORT", "40002")
    print(f"🔍 Testing Whisper Port Configuration")
    print(f"📡 WHISPER_PORT environment variable: {port}")
    print(f"🌐 Service will run on: http://localhost:{port}")
    print(f"📚 API docs will be at: http://localhost:{port}/docs")
    
    # Test if we can parse the port as an integer
    try:
        port_int = int(port)
        print(f"✅ Port {port_int} is valid")
        return port_int
    except ValueError:
        print(f"❌ Port {port} is not a valid integer")
        return None

if __name__ == "__main__":
    test_port_config()
