import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import PageTransition from '@/components/layout/PageTransition';
import { CirclePlus, BookOpen, Dumbbell, Coffee, Clock, Check, ChevronDown, ChevronUp, Save, Trash2, X, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export type QuestCategory = 'intellectual' | 'physical' | 'recovery' | 'other';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  xpValue: number;
  completed: boolean;
  dueDate: string; // ISO string
  completedAt?: string; // ISO string
}

const STORAGE_KEY_PREFIX = 'grindirl-quests-';
const LAST_CHECK_KEY_PREFIX = 'grindirl-quest-last-check-';

const Quests = () => {
  const { currentUser } = useAuth();
  const { stats, completeQuest } = useGame();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  
  // Reference to keep track of userId between renders
  const userIdRef = useRef<string | null>(null);
  
  // Debugging state to track loading/saving status
  const [debugStatus, setDebugStatus] = useState('');
  
  // Set up userId reference and load quests
  useEffect(() => {
    console.log("Auth state changed, currentUser:", currentUser?.id);
    
    if (currentUser?.id) {
      userIdRef.current = currentUser.id;
      setDebugStatus('User authenticated, loading quests');
      loadQuests();
    } else {
      setDebugStatus('No user available');
    }
  }, [currentUser]);
  
  // Load quests from localStorage
  const loadQuests = () => {
    try {
      if (!userIdRef.current) {
        console.error("Cannot load quests - no user ID available");
        setDebugStatus('Failed to load - no user ID');
        return;
      }
      
      const userId = userIdRef.current;
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      const savedQuestsStr = localStorage.getItem(storageKey);
      
      console.log('Loading quests for user:', userId);
      console.log('Found saved quests data:', !!savedQuestsStr);
      
      if (savedQuestsStr) {
        const savedQuests = JSON.parse(savedQuestsStr);
        const today = new Date().toISOString().split('T')[0];
        
        // Filter quests - only keep incomplete ones or today's quests
        const filteredQuests = savedQuests.filter((quest: Quest) => {
          if (!quest.dueDate) return true; // Handle old data without dueDate
          const questDate = quest.dueDate.split('T')[0];
          return !quest.completed || questDate === today;
        });
        
        console.log(`Loaded ${filteredQuests.length} quests`);
        setQuests(filteredQuests);
        
        setDebugStatus(`Loaded ${filteredQuests.length} quests successfully`);
      } else {
        console.log('No saved quests found, starting with empty array');
        setDebugStatus('No saved quests found');
      }
    } catch (error) {
      console.error('Error loading quests:', error);
      setDebugStatus(`Error loading: ${error}`);
      toast.error('Failed to load quests');
    }
  };
  
  // Save quests to localStorage
  const saveQuests = (questsToSave: Quest[]) => {
    try {
      if (!userIdRef.current) {
        console.error("Cannot save quests - no user ID available");
        setDebugStatus('Failed to save - no user ID');
        return;
      }
      
      const userId = userIdRef.current;
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      
      // Save quests to localStorage
      localStorage.setItem(storageKey, JSON.stringify(questsToSave));
      console.log(`Saved ${questsToSave.length} quests to localStorage`);
      setDebugStatus(`Saved ${questsToSave.length} quests`);
    } catch (error) {
      console.error('Error saving quests:', error);
      setDebugStatus(`Error saving: ${error}`);
      toast.error('Failed to save quests');
    }
  };
  
  // Save quests whenever they change
  useEffect(() => {
    console.log("Quests state changed, total quests:", quests.length);
    if (quests.length > 0 || userIdRef.current) {
      saveQuests(quests);
    }
  }, [quests]);
  
  // Daily reset check
  useEffect(() => {
    if (!userIdRef.current) return;
    
    const checkNewDay = () => {
      try {
        const userId = userIdRef.current;
        if (!userId) return;
        
        const lastCheckedKey = `${LAST_CHECK_KEY_PREFIX}${userId}`;
        const lastCheckedDay = localStorage.getItem(lastCheckedKey);
        const today = new Date().toISOString().split('T')[0];
        
        console.log('Daily check - Last checked:', lastCheckedDay, 'Today:', today);
        
        if (lastCheckedDay !== today) {
          console.log('New day detected, clearing completed quests');
          
          // Only keep incomplete quests
          setQuests(prev => {
            const filteredQuests = prev.filter(quest => !quest.completed);
            // Save immediately after filtering
            saveQuests(filteredQuests);
            return filteredQuests;
          });
          
          // Update last check
          localStorage.setItem(lastCheckedKey, today);
        }
      } catch (error) {
        console.error('Error in daily reset check:', error);
      }
    };
    
    checkNewDay();
    
    // Set up check for midnight
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - new Date().getTime();
    
    const timer = setTimeout(checkNewDay, timeUntilMidnight);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);
  
  // Get default category based on time of day
  const getDefaultCategory = (): QuestCategory => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'intellectual'; // Morning - intellectual
    if (hour >= 12 && hour < 18) return 'physical'; // Afternoon - physical
    return 'recovery'; // Evening - recovery
  };
  
  // Add a new quest
  const addQuest = () => {
    // Make sure there's actual text in the quest title
    if (!newQuestTitle.trim()) {
      console.log("Empty quest title, not adding");
      return;
    }
    
    try {
      console.log("Adding new quest:", newQuestTitle);
      
      // Generate a unique ID
      const id = uuidv4();
      
      // Create new quest object with default values
      const newQuest = {
        id,
        title: newQuestTitle.trim(),
        category: getDefaultCategory(),
        xpValue: 20,
        completed: false,
        dueDate: new Date().toISOString()
      };
      
      // Add to quests state and save
      setQuests(prevQuests => {
        const updatedQuests = [...prevQuests, newQuest];
        // We'll save in the useEffect
        return updatedQuests;
      });
      
      // Reset input
      setNewQuestTitle('');
      
      // Show success message
      toast.success('Quest added!');
    } catch (error) {
      console.error("Error adding quest:", error);
      toast.error("Failed to add quest");
    }
  };
  
  // Complete a quest
  const completeQuestHandler = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest) return;
    
    try {
      // Mark as completed
      setQuests(prev => {
        const updatedQuests = prev.map(q => 
          q.id === id 
            ? { ...q, completed: true, completedAt: new Date().toISOString() } 
            : q
        );
        // We'll save in the useEffect
        return updatedQuests;
      });
      
      // Add XP via GameContext
      completeQuest(quest.xpValue);
      
      toast.success(`Quest completed! +${quest.xpValue} XP`, {
        description: "XP added to your total!",
        icon: "🌟"
      });
    } catch (error) {
      console.error("Error completing quest:", error);
      toast.error("Failed to complete quest");
    }
  };
  
  // Delete a quest
  const deleteQuest = (id: string) => {
    try {
      setQuests(prev => {
        const updatedQuests = prev.filter(quest => quest.id !== id);
        // We'll save in the useEffect
        return updatedQuests;
      });
      
      toast.info('Quest deleted');
    } catch (error) {
      console.error("Error deleting quest:", error);
      toast.error("Failed to delete quest");
    }
  };
  
  // Toggle expanded view for a quest
  const toggleQuestExpand = (id: string) => {
    try {
      setExpandedQuestId(expandedQuestId === id ? null : id);
    } catch (error) {
      console.error("Error toggling quest expand:", error);
    }
  };
  
  // Save quest edits
  const saveQuestEdits = (quest: Quest) => {
    try {
      // Update quest with new data
      setQuests(prev => {
        const updatedQuests = prev.map(q => 
          q.id === quest.id 
            ? quest 
            : q
        );
        // We'll save in the useEffect
        return updatedQuests;
      });
      
      // Close expanded view
      setExpandedQuestId(null);
      toast.success('Quest updated!');
    } catch (error) {
      console.error("Error saving quest edits:", error);
      toast.error("Failed to save quest edits");
    }
  };
  
  // Update category
  const updateCategory = (quest: Quest, category: QuestCategory) => {
    try {
      setQuests(prev => {
        const updatedQuests = prev.map(q => 
          q.id === quest.id 
            ? { ...q, category } 
            : q
        );
        // We'll save in the useEffect
        return updatedQuests;
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };
  
  // Update XP value
  const updateXpValue = (quest: Quest, change: number) => {
    try {
      // Allow a wider range of XP values (5 to 100)
      const newValue = Math.max(5, Math.min(100, quest.xpValue + change));
      setQuests(prev => {
        const updatedQuests = prev.map(q => 
          q.id === quest.id 
            ? { ...q, xpValue: newValue } 
            : q
        );
        // We'll save in the useEffect
        return updatedQuests;
      });
    } catch (error) {
      console.error("Error updating XP value:", error);
      toast.error("Failed to update XP value");
    }
  };
  
  // Get icon for category
  const getCategoryIcon = (category: QuestCategory) => {
    switch(category) {
      case 'intellectual': return <BookOpen className="h-4 w-4 text-blue-400" />;
      case 'physical': return <Dumbbell className="h-4 w-4 text-green-400" />;
      case 'recovery': return <Coffee className="h-4 w-4 text-amber-400" />;
      case 'other': return <MoreHorizontal className="h-4 w-4 text-purple-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Render a quest item
  const QuestItem = ({ quest }: { quest: Quest }) => {
    const isExpanded = expandedQuestId === quest.id;
    
    return (
      <m.div 
        className={`mb-2 rounded-md ${quest.completed ? 'opacity-60' : 'cyber-box cyber-box-glow'}`}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {!quest.completed ? (
                <button 
                  onClick={() => completeQuestHandler(quest.id)} 
                  className="mr-3 h-5 w-5 rounded-md border border-gray-500 flex items-center justify-center hover:bg-gray-800 transition-colors"
                  aria-label="Complete quest"
                >
                  <span className="sr-only">Complete</span>
                </button>
              ) : (
                <div className="mr-3 h-5 w-5 rounded-md bg-green-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-black" />
                </div>
              )}
              
              <div className="flex items-center">
                <span className="mr-2">{getCategoryIcon(quest.category)}</span>
                <span className={quest.completed ? 'line-through text-gray-400' : 'text-white'}>{quest.title}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {!quest.completed && (
                <div className="mr-3 text-cyan-400 flex items-center">
                  <span className="text-sm">⭐ {quest.xpValue}</span>
                </div>
              )}
              
              {quest.completed && (
                <div className="mr-3 text-green-400 text-sm">
                  +{quest.xpValue} XP
                </div>
              )}
              
              <button 
                onClick={() => toggleQuestExpand(quest.id)} 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={isExpanded ? "Collapse details" : "Expand details"}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 pt-3 border-t border-gray-700"
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">Category</label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant={quest.category === 'intellectual' ? 'default' : 'outline'}
                        onClick={() => updateCategory(quest, 'intellectual')}
                        className="flex items-center"
                      >
                        <BookOpen className="h-4 w-4 mr-1" /> Intellectual
                      </Button>
                      <Button 
                        size="sm" 
                        variant={quest.category === 'physical' ? 'default' : 'outline'}
                        onClick={() => updateCategory(quest, 'physical')}
                        className="flex items-center"
                      >
                        <Dumbbell className="h-4 w-4 mr-1" /> Physical
                      </Button>
                      <Button 
                        size="sm" 
                        variant={quest.category === 'recovery' ? 'default' : 'outline'}
                        onClick={() => updateCategory(quest, 'recovery')}
                        className="flex items-center"
                      >
                        <Coffee className="h-4 w-4 mr-1" /> Recovery
                      </Button>
                      <Button 
                        size="sm" 
                        variant={quest.category === 'other' ? 'default' : 'outline'}
                        onClick={() => updateCategory(quest, 'other')}
                        className="flex items-center"
                      >
                        <MoreHorizontal className="h-4 w-4 mr-1" /> Other
                      </Button>
                    </div>
                  </div>
                  
                  {/* Use the enhanced XP controls */}
                  <ExpandedQuestControls quest={quest} />
                  
                  <div className="flex space-x-3 justify-end pt-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteQuest(quest.id)}
                      className="flex items-center mr-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setExpandedQuestId(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => saveQuestEdits(quest)}
                      className="flex items-center"
                    >
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>
    );
  };
  
  // Filter active and completed quests
  const activeQuests = quests.filter(quest => !quest.completed);
  const completedQuests = quests.filter(quest => quest.completed);
  
  // Render an expanded quest item with more controls for customization
  const ExpandedQuestControls = ({ quest }: { quest: Quest }) => {
    return (
      <div className="mt-3 p-3 bg-black/30 rounded-md">
        <h4 className="text-xs uppercase text-gray-400 mb-2">Quest Difficulty</h4>
        
        <div className="flex flex-col space-y-3">
          {/* XP Value control with better visual feedback */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">XP Value:</span>
              <span className="text-xs text-cyber-blue">{quest.xpValue} XP</span>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => updateXpValue(quest, -5)}
                className="w-8 h-8 flex items-center justify-center rounded-l-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                disabled={quest.xpValue <= 5}
              >
                <span>-5</span>
              </button>
              <div className="flex-1 h-8 bg-gray-900 flex items-center px-2">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${Math.min(100, quest.xpValue)}%` }}
                  ></div>
                </div>
              </div>
              <button 
                onClick={() => updateXpValue(quest, 5)}
                className="w-8 h-8 flex items-center justify-center rounded-r-md bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                disabled={quest.xpValue >= 100}
              >
                <span>+5</span>
              </button>
            </div>
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>Easy (5 XP)</span>
              <span>Custom</span>
              <span>Hard (100 XP)</span>
            </div>
          </div>
          
          {/* Quick difficulty presets */}
          <div className="flex justify-between space-x-2">
            <button 
              onClick={() => setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, xpValue: 10 } : q))}
              className={`text-xs py-1 px-2 rounded ${quest.xpValue === 10 ? 'bg-blue-900 text-blue-200' : 'bg-gray-800 text-gray-300'}`}
            >
              Easy (10)
            </button>
            <button 
              onClick={() => setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, xpValue: 20 } : q))}
              className={`text-xs py-1 px-2 rounded ${quest.xpValue === 20 ? 'bg-blue-900 text-blue-200' : 'bg-gray-800 text-gray-300'}`}
            >
              Normal (20)
            </button>
            <button 
              onClick={() => setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, xpValue: 40 } : q))}
              className={`text-xs py-1 px-2 rounded ${quest.xpValue === 40 ? 'bg-blue-900 text-blue-200' : 'bg-gray-800 text-gray-300'}`}
            >
              Hard (40)
            </button>
            <button 
              onClick={() => setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, xpValue: 70 } : q))}
              className={`text-xs py-1 px-2 rounded ${quest.xpValue === 70 ? 'bg-blue-900 text-blue-200' : 'bg-gray-800 text-gray-300'}`}
            >
              Epic (70)
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <PageTransition>
      <div className="container max-w-xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center cyber-text-glow">DAILY QUESTS</h1>
        
        {/* Quest input */}
        <div className="mb-6">
          <div className="flex items-center">
            <Input
              type="text"
              value={newQuestTitle}
              onChange={(e) => setNewQuestTitle(e.target.value)}
              placeholder="Add a quest..."
              className="cyber-input mr-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addQuest();
                }
              }}
            />
            <Button 
              onClick={() => addQuest()} 
              className="cyber-button-primary min-w-[40px]"
              disabled={!newQuestTitle.trim()}
              aria-label="Add quest"
            >
              <CirclePlus className="h-5 w-5" />
            </Button>
          </div>
          {/* Debug status - comment out for production */}
          {/* <div className="mt-2 text-xs text-gray-500">{debugStatus}</div> */}
        </div>
        
        {/* Active quests */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-300">Active Quests</h2>
          {activeQuests.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No active quests. Add one to get started!</p>
          ) : (
            <AnimatePresence>
              {activeQuests.map(quest => (
                <QuestItem key={quest.id} quest={quest} />
              ))}
            </AnimatePresence>
          )}
        </div>
        
        {/* Completed quests */}
        {completedQuests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-300">Completed</h2>
            <AnimatePresence>
              {completedQuests.map(quest => (
                <QuestItem key={quest.id} quest={quest} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Quests; 