export function getStatusBadgeClass(statusName) {
  switch (statusName) {
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Under Review':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Ongoing':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Approved':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function getProgressBarClass(statusName) {
  switch (statusName) {
    case 'Completed':
      return 'bg-green-500';
    case 'Under Review':
      return 'bg-blue-500';
    case 'Ongoing':
      return 'bg-orange-500';
    case 'Approved':
      return 'bg-blue-500';
    case 'Rejected':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}







