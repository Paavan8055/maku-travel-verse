# Environment Management System

This document describes the dual preview environment management system for Maku.Travel, allowing seamless switching between "Lovable" and "Emergent" states.

## Overview

The system supports two environments:
- **Lovable**: Original state with current features and implementations
- **Emergent**: Enhanced state with CTO recommendations and improvements

## Quick Start

### Web Interface
Visit `/environment-manager` in your browser to use the graphical interface for switching environments.

### Command Line Interface

#### Check Current Status
```bash
# Show current environment status
node scripts/switch-environment.js

# Detailed status with service information
./scripts/preview-status.sh
```

#### Switch Environments
```bash
# Switch to lovable environment
node scripts/switch-environment.js lovable

# Switch to emergent environment  
node scripts/switch-environment.js emergent
```

#### Deploy Environment
```bash
# Deploy and prepare lovable environment
./scripts/deploy-environment.sh lovable

# Deploy and prepare emergent environment
./scripts/deploy-environment.sh emergent
```

## Files and Configuration

### Configuration Files
- `preview-config.json` - Main environment configuration
- `.emergent/emergent.yml` - Platform-specific configuration
- `frontend/.env` - Frontend environment variables
- `backend/.env` - Backend environment variables

### Scripts
- `scripts/switch-environment.js` - Main switching logic
- `scripts/preview-status.sh` - Status checking
- `scripts/deploy-environment.sh` - Deployment preparation

### Components
- `frontend/src/components/EnvironmentSwitcher.tsx` - React component
- `frontend/src/pages/EnvironmentManager.tsx` - Management page

## API Endpoints

### Backend Endpoints
- `GET /api/environment/config` - Get current configuration
- `POST /api/environment/switch` - Switch environment
- `GET /api/environment/status` - Get detailed status

## How It Works

1. **Configuration Management**: The system maintains environment configurations in `preview-config.json`
2. **URL Switching**: Automatically updates `REACT_APP_BACKEND_URL` based on selected environment
3. **Source Tracking**: Updates `.emergent/emergent.yml` to track current state
4. **Service Coordination**: Provides tools to restart services when needed

## Environment URLs

### Lovable Environment
- Backend URL: `https://maku-wallet.preview.emergentagent.com`
- Source: `lovable`

### Emergent Environment  
- Backend URL: `https://maku-wallet.preview.emergentagent.com`
- Source: `emergent`

## Best Practices

1. **Before Switching**: Commit any important changes to version control
2. **After Switching**: Restart services if making significant changes:
   ```bash
   sudo supervisorctl restart all
   ```
3. **Testing**: Use the web interface for easy switching during development
4. **Deployment**: Use deployment scripts for production-ready preparation

## Troubleshooting

### Environment Not Switching
- Check if the target environment exists in `preview-config.json`
- Verify script permissions: `chmod +x scripts/*.sh`
- Check service status: `sudo supervisorctl status`

### API Endpoints Not Working
- Ensure backend server is running
- Check CORS configuration in `backend/.env`
- Verify API routes are prefixed with `/api`

### Configuration Issues
- Validate JSON syntax in `preview-config.json`
- Check file permissions for configuration files
- Ensure environment variables are properly set

## Advanced Usage

### Adding New Environments
1. Update `preview-config.json` with new environment configuration
2. Add corresponding URL endpoints
3. Update scripts to handle new environment names

### Custom Deployment Scripts
The deployment scripts can be customized for specific requirements:
- Add dependency checks
- Include build processes
- Configure monitoring
- Set up health checks

## Integration with Development Workflow

This system integrates with:
- Git workflow for version control
- Supervisor for service management  
- React development server
- FastAPI backend server
- MongoDB database connections

## Security Considerations

- Environment switching requires appropriate permissions
- Sensitive configuration is stored in `.env` files
- API endpoints are protected by CORS policies
- Script execution requires proper file permissions