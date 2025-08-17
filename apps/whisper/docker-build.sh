#!/bin/bash
set -e

# Docker build script for Whisper API
# Builds the executable using Docker for consistent cross-platform builds

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🐳 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to clean up previous builds
cleanup() {
    print_status "Cleaning up previous builds..."
    rm -rf dist build __pycache__ 2>/dev/null || true
    docker system prune -f >/dev/null 2>&1 || true
}

# Function to build executable
build_executable() {
    print_status "Building Whisper API executable with Docker..."
    
    # Create output directory
    mkdir -p dist
    
    # Build the executable using multi-stage build
    docker build \
        --target builder \
        --tag whisper-builder:latest \
        --progress=plain \
        .
    
    # Extract the executable
    print_status "Extracting executable..."
    docker run --rm \
        -v "$(pwd)/dist:/output" \
        whisper-builder:latest \
        sh -c "cp /build/dist/whisper-api /output/ && echo 'Executable copied to ./dist/'"
}

# Function to verify build
verify_build() {
    if [ -f "dist/whisper-api" ]; then
        size=$(du -h dist/whisper-api | cut -f1)
        print_success "Executable created successfully!"
        echo "📁 Location: $(pwd)/dist/whisper-api"
        echo "📊 Size: $size"
        
        # Check if executable is valid
        if file dist/whisper-api | grep -q "ELF.*executable"; then
            print_success "Executable is valid ELF binary"
        else
            print_warning "Executable format could not be verified"
        fi
    else
        print_error "Executable not found in dist/"
        exit 1
    fi
}

# Function to test executable in Docker
test_executable() {
    print_status "Testing executable in Docker runtime..."
    
    # Build runtime image
    docker build \
        --target runtime \
        --tag whisper-runtime:latest \
        .
    
    # Test the executable
    print_status "Starting test container..."
    container_id=$(docker run -d -p 40002:40002 whisper-runtime:latest)
    
    # Wait for startup
    sleep 10
    
    # Test health endpoint
    if curl -f http://localhost:40002/api/health >/dev/null 2>&1; then
        print_success "Executable test passed! API is responding."
    else
        print_error "Executable test failed! API is not responding."
        docker logs "$container_id"
    fi
    
    # Cleanup test container
    docker stop "$container_id" >/dev/null 2>&1
    docker rm "$container_id" >/dev/null 2>&1
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --build-only    Build executable only (skip testing)"
    echo "  --test          Test the executable after building"
    echo "  --clean         Clean up previous builds"
    echo "  --dev           Start development environment"
    echo "  --runtime       Start runtime environment"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Build and verify executable"
    echo "  $0 --test            # Build, verify, and test executable"
    echo "  $0 --clean --build   # Clean and build"
    echo "  $0 --dev             # Start development environment"
}

# Main execution
main() {
    local build_only=false
    local run_test=false
    local clean_build=false
    local dev_mode=false
    local runtime_mode=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-only)
                build_only=true
                shift
                ;;
            --test)
                run_test=true
                shift
                ;;
            --clean)
                clean_build=true
                shift
                ;;
            --dev)
                dev_mode=true
                shift
                ;;
            --runtime)
                runtime_mode=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check Docker
    check_docker
    
    # Handle special modes
    if [ "$dev_mode" = true ]; then
        print_status "Starting development environment..."
        docker-compose --profile dev up --build development
        exit 0
    fi
    
    if [ "$runtime_mode" = true ]; then
        print_status "Starting runtime environment..."
        docker-compose --profile runtime up --build runtime
        exit 0
    fi
    
    # Standard build process
    echo "🏗️  Building Whisper API Executable with Docker"
    echo "================================================="
    
    if [ "$clean_build" = true ]; then
        cleanup
    fi
    
    # Build executable
    build_executable
    
    # Verify build
    verify_build
    
    # Test if requested
    if [ "$run_test" = true ]; then
        test_executable
    fi
    
    print_success "Build process completed!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Test the executable: ./dist/whisper-api"
    echo "   2. Copy to target system: scp dist/whisper-api user@server:/opt/"
    echo "   3. Run on target: ./whisper-api"
    echo ""
    echo "🐳 Docker commands:"
    echo "   Test in container: $0 --test"
    echo "   Development mode: $0 --dev"
    echo "   Runtime mode: $0 --runtime"
}

# Run main function
main "$@"