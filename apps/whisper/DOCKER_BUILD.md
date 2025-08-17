# Docker Build Guide for Whisper API

This guide explains how to build the Whisper API executable using Docker for consistent, reproducible builds across different platforms.

## Overview

The Docker build system provides:
- **Cross-platform builds** - Build Linux executables on any platform
- **Consistent environment** - Same build environment every time
- **No local dependencies** - Only Docker required
- **Multi-stage builds** - Optimized for size and security
- **Build verification** - Automated testing of built executables

## Prerequisites

### Required Software
- **Docker Desktop** (20.10+) or **Docker Engine**
- **Docker Compose** (v2.0+) - Usually included with Docker Desktop
- **curl** - For testing (optional)

### System Requirements
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB free space for build process
- **Platform**: Any platform supported by Docker

## Quick Start

### Method 1: Using Build Script (Recommended)

```bash
# Make script executable (Linux/macOS)
chmod +x docker-build.sh

# Build executable
./docker-build.sh

# Build and test
./docker-build.sh --test

# Clean build
./docker-build.sh --clean
```

### Method 2: Using Docker Compose

```bash
# Build executable
docker-compose --profile build up --build build

# Extract executable
docker-compose --profile export up export

# Run in container
docker-compose --profile runtime up --build runtime
```

### Method 3: Direct Docker Commands

```bash
# Build
docker build --target builder -t whisper-builder .

# Extract executable
docker run --rm -v $(pwd)/dist:/output whisper-builder \
  sh -c "cp /build/dist/whisper-api /output/"

# Test
docker build --target runtime -t whisper-runtime .
docker run -p 40002:40002 whisper-runtime
```

## Docker Build Stages

The Dockerfile uses multi-stage builds with these stages:

### 1. Builder Stage (`builder`)
- **Base**: Python 3.13 slim
- **Purpose**: Build the executable
- **Includes**: Build tools, uv, PyInstaller, dependencies
- **Output**: Complete executable in `/build/dist/`

### 2. Exporter Stage (`exporter`)
- **Base**: Scratch (empty)
- **Purpose**: Extract executable only
- **Output**: Minimal image with just the executable

### 3. Runtime Stage (`runtime`)
- **Base**: Python 3.13 slim
- **Purpose**: Run the executable
- **Includes**: Minimal runtime dependencies, health checks
- **Security**: Non-root user, minimal attack surface

### 4. Development Stage (`development`)
- **Base**: Python 3.13 slim
- **Purpose**: Development and debugging
- **Includes**: Development tools, full source code access

## Build Options

### Standard Build
```bash
# Build executable only
./docker-build.sh --build-only

# Output: dist/whisper-api (206MB)
```

### Build with Testing
```bash
# Build and test the executable
./docker-build.sh --test

# Includes health check verification
```

### Development Mode
```bash
# Start development environment
./docker-build.sh --dev

# Access at: http://localhost:40002
# Source code mounted for live editing
```

### Runtime Mode
```bash
# Run pre-built executable in container
./docker-build.sh --runtime

# Production-ready container
```

## Output

### Successful Build Output
```
🏗️  Building Whisper API Executable with Docker
=================================================
🐳 Building Whisper API executable with Docker...
🐳 Extracting executable...
✅ Executable created successfully!
📁 Location: /path/to/whisper/dist/whisper-api
📊 Size: 206M
✅ Executable is valid ELF binary
✅ Build process completed!
```

### File Structure After Build
```
whisper/
├── dist/
│   └── whisper-api          # 206MB Linux executable
├── Dockerfile              # Multi-stage build definition
├── docker-compose.yml      # Service orchestration
├── docker-build.sh         # Build automation script
└── build artifacts...
```

## Deployment

### Extract Executable
```bash
# Executable is ready for deployment
cp dist/whisper-api /target/location/

# On target Linux system
chmod +x whisper-api
./whisper-api
```

### Container Deployment
```bash
# Deploy as container
docker-compose --profile runtime up -d runtime

# Access at http://localhost:40002
```

### Copy to Target System
```bash
# Copy to remote Linux server
scp dist/whisper-api user@server:/opt/whisper/

# Run on server
ssh user@server
cd /opt/whisper
chmod +x whisper-api
./whisper-api
```

## Advanced Usage

### Custom Build Arguments
```bash
# Build with custom platform
docker build --build-arg TARGET_PLATFORM=linux/amd64 .

# Build with specific Python version
docker build --build-arg PYTHON_VERSION=3.13 .
```

### Volume Mounts for Models
```bash
# Mount local models directory
docker run -p 40002:40002 \
  -v $(pwd)/models:/app/models:ro \
  whisper-runtime
```

### Environment Variables
```bash
# Custom port and settings
docker run -p 8080:8080 \
  -e WHISPER_PORT=8080 \
  -e TQDM_DISABLE=1 \
  whisper-runtime
```

## Troubleshooting

### Build Issues

#### Docker Not Running
```bash
# Error: Cannot connect to Docker daemon
# Solution: Start Docker Desktop or Docker service
systemctl start docker  # Linux
open -a Docker          # macOS
```

#### Out of Disk Space
```bash
# Error: No space left on device
# Solution: Clean Docker
docker system prune -a
docker volume prune
```

#### Build Timeout
```bash
# Error: Build takes too long
# Solution: Increase Docker build timeout
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
```

### Runtime Issues

#### Port Already in Use
```bash
# Error: Port 40002 already in use
# Solution: Use different port
docker run -p 8080:40002 whisper-runtime
```

#### Permission Denied
```bash
# Error: Permission denied on executable
# Solution: Fix permissions
chmod +x dist/whisper-api
```

#### Executable Not Found
```bash
# Error: No such file or directory
# Solution: Verify build completed
ls -la dist/
./docker-build.sh --build-only
```

### Testing Issues

#### Health Check Fails
```bash
# Debug health check
docker run --rm whisper-runtime \
  curl -f http://localhost:40002/api/health
```

#### Container Exits Immediately
```bash
# Check container logs
docker logs <container-id>

# Run with interactive shell
docker run -it whisper-runtime /bin/bash
```

## Performance Optimization

### Build Performance
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Use multi-core builds
docker build --build-arg MAKEFLAGS=-j$(nproc) .
```

### Runtime Performance
```bash
# Allocate more memory
docker run --memory=4g whisper-runtime

# Use multiple CPU cores
docker run --cpus=4 whisper-runtime
```

### Image Size Optimization
```bash
# Already optimized with multi-stage builds
# Further optimization: CPU-only PyTorch
docker build --build-arg TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu .
```

## Security Considerations

### Container Security
- ✅ **Non-root user** - Runtime uses `app` user
- ✅ **Minimal base image** - Python slim image
- ✅ **No unnecessary packages** - Only required dependencies
- ✅ **Health checks** - Automated service monitoring

### Network Security
```bash
# Restrict network access
docker run --network none whisper-runtime  # No network
docker run --network custom whisper-runtime # Custom network
```

### Resource Limits
```bash
# Limit resource usage
docker run \
  --memory=2g \
  --cpus=2 \
  --read-only \
  whisper-runtime
```

## Integration Examples

### CI/CD Pipeline
```yaml
# GitHub Actions example
- name: Build Whisper Executable
  run: |
    chmod +x docker-build.sh
    ./docker-build.sh --build-only
    
- name: Upload Artifact
  uses: actions/upload-artifact@v3
  with:
    name: whisper-api-linux
    path: dist/whisper-api
```

### Development Workflow
```bash
# 1. Development
./docker-build.sh --dev

# 2. Build
./docker-build.sh --test

# 3. Deploy
scp dist/whisper-api server:/opt/
```

## Comparison with Native Builds

| Aspect | Docker Build | Native Build |
|--------|-------------|--------------|
| **Consistency** | ✅ Same every time | ❌ Platform dependent |
| **Dependencies** | ✅ Self-contained | ❌ Manual setup |
| **Cross-platform** | ✅ Build anywhere | ❌ Platform specific |
| **Speed** | ❌ Slower (first time) | ✅ Faster |
| **Isolation** | ✅ Clean environment | ❌ Host contamination |
| **Debugging** | ❌ More complex | ✅ Direct access |

## Best Practices

1. **Use BuildKit** for faster builds
2. **Clean regularly** to save disk space
3. **Test builds** before deployment
4. **Version images** for reproducibility
5. **Monitor resources** during builds
6. **Use .dockerignore** to exclude unnecessary files

## Support

For Docker-specific issues:
1. Check Docker logs: `docker logs <container>`
2. Verify Docker version: `docker version`
3. Test basic Docker: `docker run hello-world`
4. Review build output for errors
5. Try clean build: `./docker-build.sh --clean`