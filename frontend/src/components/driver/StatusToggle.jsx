function StatusToggle({ currentStatus, onStatusChange }) {
  const statuses = [
    { value: 'available', label: 'Available', color: 'bg-green-500' },
    { value: 'busy', label: 'Busy', color: 'bg-red-500' },
    { value: 'offline', label: 'Offline', color: 'bg-gray-500' }
  ];

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold mb-4">Your Status</h3>
      <div className="flex gap-4">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => onStatusChange(status.value)}
            className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
              currentStatus === status.value
                ? status.color + ' ring-4 ring-offset-2 ring-' + status.color.replace('bg-', '')
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StatusToggle;
