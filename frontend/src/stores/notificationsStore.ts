import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  ticketId: number | null;
  isRead: boolean;
  createdAt: string;
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const latestToast = ref<Notification | null>(null);

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length;
  });

  async function fetchNotifications() {
    try {
      const response = await api.get('/notifications');
      notifications.value = response.data;
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  }

  function addNotification(notification: Notification) {
    notifications.value.unshift(notification);
    latestToast.value = notification;
    
    // Clear toast after 5 seconds
    setTimeout(() => {
      if (latestToast.value?.id === notification.id) {
        latestToast.value = null;
      }
    }, 5000);
  }

  function clearToast() {
    latestToast.value = null;
  }

  async function markAsRead(id: number) {
    const notification = notifications.value.find(n => n.id === id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      
      try {
        await api.patch(`/notifications/${id}/read`, {});
      } catch (e) {
        console.error('Failed to mark notification as read', e);
      }
    }
  }

  async function markAllAsRead() {
    notifications.value.forEach(n => {
      n.isRead = true;
    });

    try {
      await api.patch('/notifications/read-all', {});
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  }

  return {
    notifications,
    latestToast,
    unreadCount,
    fetchNotifications,
    addNotification,
    clearToast,
    markAsRead,
    markAllAsRead
  };
});
