"""
Rollout Manager for ChatGPT Pro Features
Manages phased rollout to different user groups
"""

import os
from typing import Dict, List, Optional
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RolloutManager:
    """Manage phased rollout of ChatGPT Pro features"""
    
    def __init__(self):
        # Default rollout configuration
        self.config = {
            "current_phase": os.getenv('CHATGPT_PRO_PHASE', 'admin_only'),
            "phases": {
                "disabled": {
                    "enabled": False,
                    "description": "ChatGPT Pro features disabled for all users",
                    "user_roles": [],
                    "nft_tiers": [],
                    "model_config": {}
                },
                "admin_only": {
                    "enabled": True,
                    "description": "Only admin users have access",
                    "user_roles": ["admin", "superadmin"],
                    "nft_tiers": [],
                    "model_config": {
                        "admin": "gpt-4o",
                        "default": "gpt-4o"
                    }
                },
                "nft_holders": {
                    "enabled": False,
                    "description": "Gold and Platinum NFT holders",
                    "user_roles": ["admin", "superadmin"],
                    "nft_tiers": ["Gold", "Platinum"],
                    "model_config": {
                        "Platinum": "o1",
                        "Gold": "gpt-4o",
                        "admin": "gpt-4o",
                        "default": "gpt-4o-mini"
                    }
                },
                "all_users": {
                    "enabled": False,
                    "description": "All users have access with tier-based models",
                    "user_roles": ["admin", "superadmin", "user"],
                    "nft_tiers": ["Bronze", "Silver", "Gold", "Platinum"],
                    "model_config": {
                        "Platinum": "o1",
                        "Gold": "gpt-4o",
                        "Silver": "gpt-4o-mini",
                        "Bronze": "gpt-4o-mini",
                        "admin": "gpt-4o",
                        "default": "gpt-4o-mini"
                    }
                }
            }
        }
        
        self.phase_history = []  # Track phase changes
        
        logger.info(f"Rollout Manager initialized. Current phase: {self.config['current_phase']}")
    
    def check_user_access(self, user_id: str, user_role: str, nft_tier: str) -> Dict[str, any]:
        """
        Check if user has access to ChatGPT Pro features
        
        Args:
            user_id: User ID
            user_role: User role (admin, user, etc.)
            nft_tier: NFT tier (Bronze, Silver, Gold, Platinum)
        
        Returns:
            Dict with access info
        """
        current_phase = self.config['current_phase']
        phase_config = self.config['phases'][current_phase]
        
        if not phase_config['enabled']:
            return {
                "has_access": False,
                "reason": "ChatGPT Pro features are currently disabled",
                "phase": current_phase
            }
        
        # Check user role
        if user_role in phase_config['user_roles']:
            return {
                "has_access": True,
                "reason": f"User role '{user_role}' has access in phase '{current_phase}'",
                "phase": current_phase
            }
        
        # Check NFT tier
        if nft_tier in phase_config['nft_tiers']:
            return {
                "has_access": True,
                "reason": f"NFT tier '{nft_tier}' has access in phase '{current_phase}'",
                "phase": current_phase
            }
        
        return {
            "has_access": False,
            "reason": f"User not eligible in current phase '{current_phase}'",
            "phase": current_phase
        }
    
    def get_model_for_user(self, user_role: str, nft_tier: str) -> str:
        """
        Get recommended model for user based on role and tier
        
        Args:
            user_role: User role
            nft_tier: NFT tier
        
        Returns:
            Model name (e.g., 'gpt-4o', 'o1')
        """
        current_phase = self.config['current_phase']
        phase_config = self.config['phases'][current_phase]
        model_config = phase_config['model_config']
        
        # Priority: admin > tier > default
        if user_role in ['admin', 'superadmin']:
            return model_config.get('admin', model_config.get('default', 'gpt-4o'))
        
        if nft_tier in model_config:
            return model_config[nft_tier]
        
        return model_config.get('default', 'gpt-4o-mini')
    
    def update_phase(self, phase: str, enabled: bool = True, model_config: Optional[Dict] = None) -> Dict:
        """
        Update rollout phase
        
        Args:
            phase: Phase name
            enabled: Enable or disable phase
            model_config: Optional model configuration override
        
        Returns:
            Updated phase info
        """
        if phase not in self.config['phases']:
            raise ValueError(f"Invalid phase: {phase}. Must be one of: {list(self.config['phases'].keys())}")
        
        # Update phase
        old_phase = self.config['current_phase']
        self.config['current_phase'] = phase
        self.config['phases'][phase]['enabled'] = enabled
        
        if model_config:
            self.config['phases'][phase]['model_config'].update(model_config)
        
        # Log phase change
        phase_change = {
            "timestamp": datetime.utcnow().isoformat(),
            "old_phase": old_phase,
            "new_phase": phase,
            "enabled": enabled
        }
        self.phase_history.append(phase_change)
        
        logger.info(f"Phase updated: {old_phase} → {phase} (enabled: {enabled})")
        
        return {
            "old_phase": old_phase,
            "new_phase": phase,
            "enabled": enabled,
            "model_config": self.config['phases'][phase]['model_config']
        }
    
    def get_status(self) -> Dict:
        """
        Get current rollout status
        
        Returns:
            Status info
        """
        current_phase = self.config['current_phase']
        phase_config = self.config['phases'][current_phase]
        
        # Estimate users with access
        enabled_tiers = phase_config['nft_tiers']
        enabled_roles = phase_config['user_roles']
        
        estimated_users = "N/A"
        if current_phase == "admin_only":
            estimated_users = "~5-10 (admins only)"
        elif current_phase == "nft_holders":
            estimated_users = "~50-200 (Gold+Platinum holders)"
        elif current_phase == "all_users":
            estimated_users = "All users (unlimited)"
        
        return {
            "current_phase": current_phase,
            "description": phase_config['description'],
            "enabled": phase_config['enabled'],
            "enabled_for": {
                "roles": enabled_roles,
                "nft_tiers": enabled_tiers
            },
            "model_config": phase_config['model_config'],
            "estimated_users": estimated_users,
            "phase_history": self.phase_history[-5:] if self.phase_history else []  # Last 5 changes
        }
    
    def list_phases(self) -> List[Dict]:
        """
        List all available phases
        
        Returns:
            List of phase info
        """
        phases = []
        for phase_name, phase_config in self.config['phases'].items():
            phases.append({
                "name": phase_name,
                "description": phase_config['description'],
                "enabled": phase_config['enabled'],
                "user_roles": phase_config['user_roles'],
                "nft_tiers": phase_config['nft_tiers'],
                "is_current": phase_name == self.config['current_phase']
            })
        
        return phases
    
    def export_config(self, filepath: str = "/app/config/rollout_config.json"):
        """
        Export rollout configuration to file
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Rollout config exported to {filepath}")
        except Exception as e:
            logger.error(f"Failed to export config: {e}")

# Singleton instance
rollout_manager = RolloutManager()
