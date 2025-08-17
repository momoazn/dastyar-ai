#!/bin/bash
set -e

# Complete build script for AI App
# This script orchestrates the entire build process

echo "🏗️  AI App Complete Build Pipeline"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check for required tools
    command -v go >/dev/null 2>&1 || missing_tools+=("go")
    command -v bun >/dev/null 2>&1 || missing_tools+=("bun")
    command -v uv >/dev/null 2>&1 || missing_tools+=("uv")
    command -v python3 >/dev/null 2>&1 || missing_tools+=("python3")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Function to build components
build_components() {
    print_status "Building all components..."
    
    # Build using Go orchestrator
    go run cmd/builder/main.go --verbose
    
    if [ $? -eq 0 ]; then
        print_success "Component build completed"
    else
        print_error "Component build failed"
        exit 1
    fi
}

# Function to create bundle
create_bundle() {
    print_status "Creating single binary bundle..."
    
    # Parse target platform from arguments
    local target_platform="${1:-$(go env GOOS)/$(go env GOARCH)}"
    
    # Create bundle using Go bundler
    go run cmd/bundler/main.go "$target_platform"
    
    if [ $? -eq 0 ]; then
        print_success "Bundle creation completed"
    else
        print_error "Bundle creation failed"
        exit 1
    fi
}

# Function to test the bundle
test_bundle() {
    print_status "Testing the generated bundle..."
    
    local platform=$(go env GOOS)
    local executable="ai-app"
    if [ "$platform" = "windows" ]; then
        executable="ai-app.exe"
    fi
    
    local bundle_path="bundle/$executable"
    
    if [ ! -f "$bundle_path" ]; then
        print_error "Bundle executable not found: $bundle_path"
        return 1
    fi
    
    # Make executable if needed
    chmod +x "$bundle_path" 2>/dev/null || true
    
    print_success "Bundle test completed"
    
    # Show bundle info
    local size=$(du -h "$bundle_path" | cut -f1)
    echo "📦 Bundle location: $bundle_path"
    echo "📊 Bundle size: $size"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [TARGET_PLATFORM] [OPTIONS]"
    echo ""
    echo "TARGET_PLATFORM:"
    echo "  linux/amd64     Build for Linux x86_64"
    echo "  windows/amd64   Build for Windows x86_64"
    echo "  darwin/amd64    Build for macOS x86_64"
    echo "  darwin/arm64    Build for macOS Apple Silicon"
    echo ""
    echo "OPTIONS:"
    echo "  --help          Show this help message"
    echo "  --test          Test the bundle after creation"
    echo "  --clean         Clean previous builds"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build for current platform"
    echo "  $0 linux/amd64       # Build for Linux"
    echo "  $0 windows/amd64     # Build for Windows"
    echo "  $0 --test            # Build and test"
}

# Function to clean previous builds
clean_builds() {
    print_status "Cleaning previous builds..."
    
    # Remove build artifacts
    rm -rf dist/ bundle/ 2>/dev/null || true
    
    # Clean individual app build artifacts
    rm -rf apps/web/dist/ 2>/dev/null || true
    rm -rf apps/server/dist/ 2>/dev/null || true
    rm -rf apps/whisper/dist/ 2>/dev/null || true
    
    print_success "Clean completed"
}

# Main execution
main() {
    local target_platform=""
    local run_test=false
    local clean_first=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_usage
                exit 0
                ;;
            --test)
                run_test=true
                shift
                ;;
            --clean)
                clean_first=true
                shift
                ;;
            --*)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                target_platform="$1"
                shift
                ;;
        esac
    done
    
    # Clean if requested
    if [ "$clean_first" = true ]; then
        clean_builds
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Build components
    build_components
    
    # Create bundle
    create_bundle "$target_platform"
    
    # Test if requested
    if [ "$run_test" = true ]; then
        test_bundle
    fi
    
    print_success "🎉 Complete build pipeline finished!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test the bundle: ./bundle/ai-app"
    echo "   2. Copy to target system"
    echo "   3. Run: ./ai-app"
    echo ""
    echo "📦 Bundle contents:"
    echo "   • React frontend (built and embedded)"
    echo "   • Bun server (compiled with migrations)"
    echo "   • Python Whisper service (single executable)"
    echo "   • All assets and configurations"
    echo ""
    echo "🚀 Ready for deployment!"
}

# Run main function
main "$@"