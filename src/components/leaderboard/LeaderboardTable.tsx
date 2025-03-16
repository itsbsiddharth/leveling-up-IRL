import React, { useEffect } from 'react';
import { LeaderboardEntry } from '@/firebase/schema';
import { User, Trophy, Award, Flame, LogIn, Database, AlertTriangle } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading: boolean;
  error?: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ 
  entries, 
  currentUserId,
  isLoading,
  error
}) => {
  // Add debugging to help identify issues
  useEffect(() => {
    if (entries.length > 0 && currentUserId) {
      console.log('LeaderboardTable - Current User ID:', currentUserId);
      const currentUserEntry = entries.find(entry => entry.uid === currentUserId);
      console.log('Current user entry found in leaderboard:', currentUserEntry ? 'Yes' : 'No');
      
      if (!currentUserEntry) {
        console.log('Available user IDs in entries:', entries.map(entry => entry.uid));
      }
    }
  }, [entries, currentUserId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="cyber-panel p-6 rounded-lg">
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="cyber-panel p-6 rounded-lg text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-cyber-red" />
        <p className="text-gray-400 mb-2">{error}</p>
        <p className="text-sm text-gray-500">Please try again later or contact support.</p>
      </div>
    );
  }

  // Empty state - no entries
  if (!entries || entries.length === 0) {
    // If no currentUserId, likely not logged in
    if (!currentUserId) {
      return (
        <div className="cyber-panel p-6 rounded-lg text-center">
          <LogIn className="w-8 h-8 mx-auto mb-3 text-cyber-blue" />
          <p className="text-gray-400 mb-2">Please log in to view the leaderboard.</p>
          <p className="text-sm text-gray-500">Sign in to see how you rank among other hunters.</p>
        </div>
      );
    }
    
    // User is logged in but no data yet
    return (
      <div className="cyber-panel p-6 rounded-lg text-center">
        <Database className="w-8 h-8 mx-auto mb-3 text-cyber-blue" />
        <p className="text-gray-400 mb-2">No leaderboard data available yet.</p>
        <p className="text-sm text-gray-500">This may be because:</p>
        <ul className="text-sm text-gray-500 list-disc list-inside mt-2">
          <li>You're the first player in this category</li>
          <li>The database is still being set up</li>
          <li>Your actions haven't been recorded yet</li>
        </ul>
        <p className="text-sm text-gray-500 mt-2">Complete activities to earn XP and appear on the leaderboard.</p>
      </div>
    );
  }

  // Normal state - display leaderboard
  return (
    <div className="cyber-panel p-4 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="py-2 px-3 text-left text-xs text-gray-400">Rank</th>
              <th className="py-2 px-3 text-left text-xs text-gray-400">Hunter</th>
              <th className="py-2 px-3 text-right text-xs text-gray-400">XP</th>
              <th className="py-2 px-3 text-right text-xs text-gray-400">Level</th>
              <th className="py-2 px-3 text-right text-xs text-gray-400">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const isCurrentUser = entry.uid === currentUserId;
              
              // Add debug console log if this is the current user
              if (isCurrentUser) {
                console.log('Rendering current user row:', entry);
              }
              
              return (
                <tr 
                  key={entry.uid} 
                  className={`border-b border-gray-800 ${isCurrentUser ? 'bg-cyber-blue/10' : ''}`}
                >
                  <td className="py-3 px-3 text-sm">
                    <div className="flex items-center">
                      {index === 0 && <Trophy className="h-4 w-4 mr-1 text-yellow-400" />}
                      {index === 1 && <Trophy className="h-4 w-4 mr-1 text-gray-400" />}
                      {index === 2 && <Trophy className="h-4 w-4 mr-1 text-amber-700" />}
                      {index > 2 && <span className="w-5 text-center">{index + 1}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-800 mr-2 flex items-center justify-center">
                        {entry.photoURL ? (
                          <img 
                            src={entry.photoURL} 
                            alt={entry.displayName || 'User'} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // If image fails to load, show fallback
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                '<div class="h-full w-full flex items-center justify-center"><span class="text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span></div>';
                            }}
                          />
                        ) : (
                          <User className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className={`font-medium ${isCurrentUser ? 'text-cyber-blue' : 'text-white'}`}>
                        {entry.displayName || 'Anonymous Hunter'}
                        {isCurrentUser && <span className="ml-2 text-xs text-cyber-blue">(You)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {entry.xp.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        entry.rank === 's-rank' ? 'bg-cyber-red/20 text-cyber-red' :
                        entry.rank === 'a-rank' || entry.rank === 'b-rank' ? 'bg-cyber-purple/20 text-cyber-purple' :
                        'bg-cyber-blue/20 text-cyber-blue'
                      }`}>
                        {entry.rank.toUpperCase().replace('-RANK', '')} · {entry.level}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end">
                      <Flame className="h-3 w-3 mr-1 text-yellow-400" />
                      <span>{entry.streak}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable; 