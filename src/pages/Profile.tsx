
import React, { useState } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { 
  User, 
  LogOut, 
  Mail, 
  Save, 
  UserPlus, 
  Settings, 
  Activity,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileSettings from '@/components/profile/ProfileSettings';
import AuthForm from '@/components/profile/AuthForm';
import { toast } from 'sonner';

const Profile = () => {
  const { currentUser, logout, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("stats");
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      console.error('Logout error in Profile component:', err);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Hunter Profile
            </h1>
            <p className="text-gray-400">Your personal stats and settings</p>
          </div>
          
          {currentUser ? (
            <div className="space-y-6">
              {/* User Header */}
              <div className="cyber-panel p-6 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="cyber-panel p-3 rounded-full">
                    <User className="w-8 h-8 text-cyber-blue" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white">{currentUser.username}</h2>
                    <p className="text-sm text-gray-400">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="cyber-panel py-2 px-4 rounded-md text-gray-300 border-gray-700 flex items-center space-x-2 hover:border-gray-500 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
              
              {/* Tabs Navigation */}
              <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-black/30 border border-gray-800 rounded-md overflow-hidden">
                  <TabsTrigger 
                    value="stats" 
                    className="data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue text-gray-400 py-3"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Stats
                  </TabsTrigger>
                  <TabsTrigger 
                    value="activity" 
                    className="data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue text-gray-400 py-3"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue text-gray-400 py-3"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="stats" className="mt-4">
                  <ProfileStats />
                </TabsContent>
                
                <TabsContent value="activity" className="mt-4">
                  <ActivityHeatmap />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-4">
                  <ProfileSettings />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <AuthForm />
          )}
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Profile;
