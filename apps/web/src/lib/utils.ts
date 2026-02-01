export function generatePublicId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generateDeleteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return '#22c55e'; // green-500
    case 'B':
      return '#84cc16'; // lime-500
    case 'C':
      return '#eab308'; // yellow-500
    case 'D':
      return '#f97316'; // orange-500
    case 'F':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

export function getGradeLabel(grade: string): string {
  switch (grade) {
    case 'A':
      return 'Excellent';
    case 'B':
      return 'Good';
    case 'C':
      return 'Needs Attention';
    case 'D':
      return 'Poor';
    case 'F':
      return 'Critical Risk';
    default:
      return 'Unknown';
  }
}
