import React from 'react';
import { Bell, Package, MessageSquare, Tag, ShoppingCart, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const { t } = useTranslation();

  // Mock notifications data - Replace with actual data from your state/API
  const notifications = [
    {
      id: 1,
      type: 'order',
      title: 'Order Shipped',
      message: 'Your order #12345 has been shipped',
      time: '2 hours ago',
      icon: Package,
      unread: true,
    },
    {
      id: 2,
      type: 'message',
      title: 'New Message',
      message: 'John Doe sent you a message about your listing',
      time: '5 hours ago',
      icon: MessageSquare,
      unread: true,
    },
    {
      id: 3,
      type: 'price',
      title: 'Price Drop Alert',
      message: 'An item in your wishlist is now 15% off',
      time: '1 day ago',
      icon: Tag,
      unread: false,
    },
    {
      id: 4,
      type: 'order',
      title: 'Order Delivered',
      message: 'Your order #12344 has been delivered',
      time: '2 days ago',
      icon: ShoppingCart,
      unread: false,
    },
  ];

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-200';
      case 'message':
        return 'bg-green-50 border-green-200';
      case 'price':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconStyle = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-600';
      case 'message':
        return 'text-green-600';
      case 'price':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="w-6 h-6 text-gray-500 mr-2" />
                <h1 className="text-xl font-semibold text-gray-900">
                  {t('common.notifications')}
                </h1>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-500">
                Mark all as read
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 ${notification.unread ? getNotificationStyle(notification.type) : ''} relative`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 ${getIconStyle(notification.type)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500">{notification.time}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {notification.unread && (
                        <div className="absolute top-4 right-4 h-2 w-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No notifications
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You're all caught up! Check back later for new notifications.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;