import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Keyboard, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Upload,
  Search,
  Command,
  HelpCircle,
  Save
} from 'lucide-react';

interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string[];
  action: string;
  category: string;
  enabled: boolean;
  custom: boolean;
}

export const KeyboardShortcutsManager: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([
    {
      id: '1',
      name: 'Quick Search',
      description: 'Open global search dialog',
      keys: ['Ctrl', 'K'],
      action: 'openSearch',
      category: 'Navigation',
      enabled: true,
      custom: false
    },
    {
      id: '2',
      name: 'New Booking',
      description: 'Create a new booking',
      keys: ['Ctrl', 'N'],
      action: 'newBooking',
      category: 'Actions',
      enabled: true,
      custom: false
    },
    {
      id: '3',
      name: 'Dashboard',
      description: 'Navigate to dashboard',
      keys: ['Ctrl', 'D'],
      action: 'goDashboard',
      category: 'Navigation',
      enabled: true,
      custom: false
    },
    {
      id: '4',
      name: 'Admin Panel',
      description: 'Open admin panel',
      keys: ['Ctrl', 'Shift', 'A'],
      action: 'openAdmin',
      category: 'Navigation',
      enabled: true,
      custom: false
    },
    {
      id: '5',
      name: 'Save Changes',
      description: 'Save current form or changes',
      keys: ['Ctrl', 'S'],
      action: 'saveChanges',
      category: 'Actions',
      enabled: true,
      custom: false
    },
    {
      id: '6',
      name: 'Refresh Data',
      description: 'Refresh current page data',
      keys: ['F5'],
      action: 'refreshData',
      category: 'Actions',
      enabled: true,
      custom: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const categories = ['all', 'Navigation', 'Actions', 'Forms', 'Data'];

  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for shortcut matches
      shortcuts.forEach(shortcut => {
        if (!shortcut.enabled) return;
        
        const keys = shortcut.keys.map(k => k.toLowerCase());
        const pressedKeys = [];
        
        if (event.ctrlKey) pressedKeys.push('ctrl');
        if (event.shiftKey) pressedKeys.push('shift');
        if (event.altKey) pressedKeys.push('alt');
        if (event.metaKey) pressedKeys.push('cmd');
        
        const key = event.key.toLowerCase();
        if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
          pressedKeys.push(key);
        }

        if (JSON.stringify(keys.sort()) === JSON.stringify(pressedKeys.sort())) {
          event.preventDefault();
          executeShortcutAction(shortcut.action);
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const executeShortcutAction = (action: string) => {
    switch (action) {
      case 'openSearch':
        console.log('Opening search...');
        break;
      case 'newBooking':
        console.log('Creating new booking...');
        break;
      case 'goDashboard':
        console.log('Navigating to dashboard...');
        break;
      case 'openAdmin':
        console.log('Opening admin panel...');
        break;
      case 'saveChanges':
        console.log('Saving changes...');
        break;
      case 'refreshData':
        console.log('Refreshing data...');
        window.location.reload();
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  const toggleShortcut = (id: string, enabled: boolean) => {
    setShortcuts(prev => prev.map(shortcut => 
      shortcut.id === id ? { ...shortcut, enabled } : shortcut
    ));
  };

  const deleteShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(shortcut => shortcut.id !== id));
  };

  const editShortcut = (shortcut: KeyboardShortcut) => {
    setEditingShortcut(shortcut);
    setIsEditing(true);
  };

  const addNewShortcut = () => {
    const newShortcut: KeyboardShortcut = {
      id: Date.now().toString(),
      name: 'New Shortcut',
      description: 'Enter description',
      keys: ['Ctrl', 'Enter'],
      action: 'customAction',
      category: 'Actions',
      enabled: true,
      custom: true
    };
    setEditingShortcut(newShortcut);
    setIsEditing(true);
  };

  const saveShortcut = (shortcut: KeyboardShortcut) => {
    if (shortcuts.find(s => s.id === shortcut.id)) {
      setShortcuts(prev => prev.map(s => s.id === shortcut.id ? shortcut : s));
    } else {
      setShortcuts(prev => [...prev, shortcut]);
    }
    setIsEditing(false);
    setEditingShortcut(null);
  };

  const exportShortcuts = () => {
    const data = JSON.stringify(shortcuts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyboard-shortcuts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatKeys = (keys: string[]) => {
    const keyMap: { [key: string]: string } = {
      'ctrl': '⌃',
      'cmd': '⌘',
      'shift': '⇧',
      'alt': '⌥',
      'enter': '↵',
      'escape': '⎋',
      'space': '␣',
      'backspace': '⌫',
      'delete': '⌦',
      'tab': '⇥',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→'
    };

    return keys.map(key => keyMap[key.toLowerCase()] || key.toUpperCase()).join(' + ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Keyboard className="h-6 w-6 mr-2 text-primary" />
            Keyboard Shortcuts
          </h2>
          <p className="text-muted-foreground">Manage and customize keyboard shortcuts for faster navigation</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
          <Button variant="outline" onClick={exportShortcuts}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={addNewShortcut}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shortcut
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex space-x-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Shortcuts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShortcuts.map((shortcut) => (
          <Card key={shortcut.id} className={!shortcut.enabled ? 'opacity-50' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{shortcut.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{shortcut.category}</Badge>
                  {shortcut.custom && <Badge variant="secondary">Custom</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{shortcut.description}</p>
              
              <div className="flex items-center justify-center p-2 bg-muted rounded">
                <kbd className="px-2 py-1 text-sm font-semibold bg-background border rounded">
                  {formatKeys(shortcut.keys)}
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={shortcut.enabled}
                    onCheckedChange={(checked) => toggleShortcut(shortcut.id, checked)}
                  />
                  <Label className="text-sm">Enabled</Label>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="outline" onClick={() => editShortcut(shortcut)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  {shortcut.custom && (
                    <Button size="sm" variant="outline" onClick={() => deleteShortcut(shortcut.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingShortcut?.id ? 'Edit Shortcut' : 'Add New Shortcut'}
            </DialogTitle>
          </DialogHeader>
          
          {editingShortcut && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={editingShortcut.name}
                  onChange={(e) => setEditingShortcut({...editingShortcut, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={editingShortcut.description}
                  onChange={(e) => setEditingShortcut({...editingShortcut, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Keys (comma separated)</Label>
                <Input 
                  value={editingShortcut.keys.join(', ')}
                  onChange={(e) => setEditingShortcut({
                    ...editingShortcut, 
                    keys: e.target.value.split(',').map(k => k.trim())
                  })}
                  placeholder="Ctrl, K"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  value={editingShortcut.category}
                  onChange={(e) => setEditingShortcut({...editingShortcut, category: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={() => saveShortcut(editingShortcut)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts Help</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Command className="h-4 w-4" />
              <AlertDescription>
                Keyboard shortcuts help you navigate and perform actions quickly without using the mouse.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-semibold">Available Modifiers:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><kbd className="px-1 py-0.5 text-xs bg-muted rounded">Ctrl</kbd> - Control key</li>
                <li><kbd className="px-1 py-0.5 text-xs bg-muted rounded">Shift</kbd> - Shift key</li>
                <li><kbd className="px-1 py-0.5 text-xs bg-muted rounded">Alt</kbd> - Alt key</li>
                <li><kbd className="px-1 py-0.5 text-xs bg-muted rounded">Cmd</kbd> - Command key (Mac)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Tips:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Use common patterns (Ctrl+S for save, Ctrl+N for new)</li>
                <li>• Avoid conflicts with browser shortcuts</li>
                <li>• Keep shortcuts simple and memorable</li>
                <li>• Test shortcuts after creating them</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};