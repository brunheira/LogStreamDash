import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function getLogLevelColor(level: string): string {
  switch (level) {
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400';
    case 'info':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400';
    case 'debug':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400';
  }
}

export function getLogLevelClass(level: string): string {
  switch (level) {
    case 'error':
      return 'log-error';
    case 'warning':
      return 'log-warning';
    case 'info':
      return 'log-info';
    case 'debug':
      return 'log-debug';
    default:
      return '';
  }
}

export function getConnectionStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400';
    case 'connecting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400';
    case 'error':
      return 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950/20 dark:text-gray-400';
  }
}

export function getConnectionStatusIcon(status: string): string {
  switch (status) {
    case 'connected':
      return 'check-circle';
    case 'connecting':
      return 'loader-2';
    case 'error':
      return 'x-circle';
    default:
      return 'circle';
  }
}
