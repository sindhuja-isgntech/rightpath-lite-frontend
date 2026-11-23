import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import { api } from '../services/api';
import type { Application, ApplicationStatus } from '../types/application';
import type { Role } from '../types/user';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface StoredNotifications {
  initialized: boolean;
  knownStatuses: Record<string, ApplicationStatus>;
  items: AppNotification[];
}

const EMPTY_NOTIFICATIONS: StoredNotifications = {
  initialized: false,
  knownStatuses: {},
  items: [],
};

const statusNames: Record<ApplicationStatus, string> = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
};

const isStoredNotifications = (value: unknown): value is StoredNotifications => {
  if (!value || typeof value !== 'object') return false;
  const stored = value as Partial<StoredNotifications>;
  return (
    typeof stored.initialized === 'boolean' &&
    !!stored.knownStatuses &&
    typeof stored.knownStatuses === 'object' &&
    Array.isArray(stored.items) &&
    stored.items.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.message === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.read === 'boolean',
    )
  );
};

const readStoredNotifications = (key: string): StoredNotifications => {
  const stored = localStorage.getItem(key);
  if (!stored) return EMPTY_NOTIFICATIONS;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (isStoredNotifications(parsed)) return parsed;
    console.error('Stored notifications have an invalid format.');
  } catch (error) {
    console.error('Could not read stored notifications.', error);
  }
  return EMPTY_NOTIFICATIONS;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

interface NotificationCenterProps {
  userId: number;
  role: Role;
}

export function NotificationCenter({ userId, role }: NotificationCenterProps) {
  const storageKey = `rightpath.notifications.${userId}`;
  const [stored, setStored] = useState(() => readStoredNotifications(storageKey));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(!stored.initialized);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const storedRef = useRef(stored);

  const save = useCallback((next: StoredNotifications) => {
    storedRef.current = next;
    setStored(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      try {
        const response = await api.get<Application[]>(
          role === 'ADMIN' ? '/admin/applications' : '/jobs/me/applications',
        );
        if (!active) return;

        const applications = response.data;
        const previous = storedRef.current;
        const statuses = Object.fromEntries(
          applications.map((application) => [application.id, application.status]),
        ) as Record<string, ApplicationStatus>;

        if (!previous.initialized) {
          save({ initialized: true, knownStatuses: statuses, items: previous.items });
        } else {
          const created: AppNotification[] = [];
          for (const application of applications) {
            const previousStatus = previous.knownStatuses[String(application.id)];
            if (previousStatus === undefined) {
              created.push({
                id: `application-${application.id}-${application.updatedAt}`,
                title: role === 'ADMIN' ? 'New application received' : 'Application submitted',
                message:
                  role === 'ADMIN'
                    ? `${application.candidateName} applied for ${application.jobTitle}.`
                    : `Your application for ${application.jobTitle} has been received.`,
                createdAt: application.appliedAt,
                read: false,
              });
            } else if (role === 'CANDIDATE' && previousStatus !== application.status) {
              created.push({
                id: `status-${application.id}-${application.status}-${application.updatedAt}`,
                title: 'Application status updated',
                message: `${application.jobTitle}: ${statusNames[application.status]}.`,
                createdAt: application.updatedAt,
                read: false,
              });
            }
          }
          save({
            initialized: true,
            knownStatuses: statuses,
            items: [...created, ...previous.items].slice(0, 50),
          });
        }
        setError('');
      } catch {
        if (active) setError('Could not refresh notifications. Try again shortly.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refresh);
    };
  }, [role, save, storageKey]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const unreadCount = stored.items.filter((item) => !item.read).length;
  const destination = role === 'ADMIN' ? '/admin/applications' : '/applied-jobs';

  const markAllAsRead = () => {
    save({
      ...storedRef.current,
      items: storedRef.current.items.map((item) => ({ ...item, read: true })),
    });
  };

  const markAsRead = (notificationId: string) => {
    save({
      ...storedRef.current,
      items: storedRef.current.items.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    });
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-controls="notifications-panel"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-lg p-2.5 text-[#2c4538] hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 h-2.5 min-w-2.5 rounded-full bg-red-600 ring-2 ring-[#eef4ef]"
          />
        )}
      </button>

      {open && (
        <section
          id="notifications-panel"
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-30 mt-2 flex max-h-[min(32rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-5rem))] flex-col overflow-hidden rounded-2xl border border-[#e1e9e2] bg-white text-left shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#e1e9e2] px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-[#1b3428]">Notifications</h2>
              <p className="text-xs text-[#53665b]">
                {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#168346] hover:bg-[#f1f7f2]"
                >
                  <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-[#53665b] hover:bg-[#f1f7f2]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              {error}
            </p>
          )}

          <div className="overflow-y-auto">
            {loading && stored.items.length === 0 ? (
              <p role="status" className="px-4 py-8 text-center text-sm text-[#53665b]">
                Loading notifications…
              </p>
            ) : stored.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#53665b]">
                New applications and status updates will appear here.
              </p>
            ) : (
              <ul>
                {stored.items.map((notification) => (
                  <li key={notification.id}>
                    <Link
                      to={destination}
                      onClick={() => markAsRead(notification.id)}
                      className={`block border-b border-[#edf1ed] px-4 py-3 transition-colors hover:bg-[#f6f7f5] ${
                        notification.read ? '' : 'bg-[#f1f7f2]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.read && (
                          <span
                            aria-label="Unread"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#119b48]"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1b3428]">{notification.title}</p>
                          <p className="mt-1 break-words text-sm text-[#53665b]">{notification.message}</p>
                          <p className="mt-1.5 text-xs text-[#71877b]">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
