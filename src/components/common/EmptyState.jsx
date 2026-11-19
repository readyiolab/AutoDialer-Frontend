import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  message = 'There are no records matching your current filter criteria.',
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="p-3 bg-gray-100 rounded-full text-gray-400 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-500 max-w-sm mt-1">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

