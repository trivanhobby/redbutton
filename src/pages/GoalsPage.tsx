import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';

const GoalsPage: React.FC = () => {
  const { data, addGoal, toggleGoal, removeGoal } = useData();
  const [newGoalText, setNewGoalText] = useState('');

  // Handle adding a new goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      addGoal(newGoalText);
      setNewGoalText('');
    }
  };

  // Get active (incomplete) and completed goals
  const activeGoals = data.goals.filter(goal => !goal.completed);
  const completedGoals = data.goals.filter(goal => goal.completed);

  return (
    <div className="max-w-4xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Goals</h1>
      
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Add New Goal</h2>
        <form onSubmit={handleAddGoal} className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter a new goal or intention..."
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
          />
          <button
            type="submit"
            className="py-3 px-6 bg-primary text-white rounded-md hover:bg-opacity-90"
            disabled={!newGoalText.trim()}
          >
            Add
          </button>
        </form>
        <p className="mt-3 text-sm text-gray-400">
          Goals help provide context for the AI suggestions when you're feeling stuck. They should represent actions aligned with your values.
        </p>
      </div>
      
      {/* Active Goals */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Active Goals</h2>
        {activeGoals.length > 0 ? (
          <ul className="space-y-3">
            {activeGoals.map(goal => (
              <motion.li
                key={goal.id}
                className="flex items-start gap-3 p-3 border border-gray-700 bg-gray-700/50 rounded-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => toggleGoal(goal.id)}
                  className="mt-1 h-5 w-5 text-primary rounded bg-gray-600 border-gray-500 focus:ring-primary focus:ring-offset-gray-700"
                />
                <div className="flex-1">
                  <p className="text-gray-200">{goal.text}</p>
                  <p className="text-xs text-gray-400">
                    Created: {format(parseISO(goal.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Delete goal"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No active goals yet. Add one above!</p>
        )}
      </div>
      
      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Completed Goals</h2>
          <ul className="space-y-3">
            {completedGoals.map(goal => (
              <motion.li
                key={goal.id}
                className="flex items-start gap-3 p-3 border border-gray-700 rounded-md bg-gray-700/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  type="checkbox"
                  checked={goal.completed}
                  onChange={() => toggleGoal(goal.id)}
                  className="mt-1 h-5 w-5 text-primary rounded bg-gray-600 border-gray-500 focus:ring-primary focus:ring-offset-gray-700"
                />
                <div className="flex-1">
                  <p className="line-through text-gray-400">{goal.text}</p>
                  <p className="text-xs text-gray-500">
                    Completed: {goal.completedAt ? format(parseISO(goal.completedAt), 'MMM dd, yyyy') : 'Unknown'}
                  </p>
                </div>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Delete goal"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GoalsPage; 