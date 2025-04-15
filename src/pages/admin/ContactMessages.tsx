import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, 
  Trash2, 
  CheckCircle, 
  Archive, 
  Eye, 
  RefreshCw, 
  Search, 
  Filter,
  Check,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Reply,
  AlertCircle,
  X
} from 'lucide-react';
import { API_URL } from '../../config';
import { useTranslation } from 'react-i18next';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
  readAt: string | null;
  repliedAt: string | null;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-green-100 text-green-800',
  replied: 'bg-purple-100 text-purple-800',
  archived: 'bg-gray-100 text-gray-800'
};

const ContactMessages: React.FC = () => {
  const { t } = useTranslation();
  
  // Helper function to handle the correct translation namespace
  const tMsg = (key: string, options?: any): string => {
    // Special case for modal-specific translations
    if (key === 'deleteConfirmTitle') {
      const count = options?.count || 0;
      return `Delete ${count} Message(s)`;
    }
    if (key === 'deleteConfirmSingular') {
      return 'Are you sure you want to delete this message?';
    }
    if (key === 'deleteConfirmPlural') {
      const count = options?.count || 0;
      return `Are you sure you want to delete these ${count} messages?`;
    }
    if (key === 'deleteWarning') {
      return 'This action cannot be undone and all message data will be permanently removed from our servers.';
    }
    if (key === 'confirm') {
      return 'Confirm';
    }
    if (key === 'cancel') {
      return 'Cancel';
    }
    
    // For other keys, try with admin.contactMessages namespace first
    const adminKey = `admin.contactMessages.${key}`;
    
    // Get translated text with fallbacks
    const translated = t(adminKey);
    
    // If the translation key is returned (meaning it wasn't found),
    // try the direct contactMessages namespace instead
    if (translated === adminKey) {
      const directKey = `contactMessages.${key}`;
      const result = t(directKey, options);
      // Ensure we always return a string
      return typeof result === 'string' ? result : String(result);
    }
    
    // Ensure we always return a string
    return typeof translated === 'string' ? translated : String(translated);
  };
  
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  
  // Confirm delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messagesToDelete, setMessagesToDelete] = useState<string[]>([]);
  
  const navigate = useNavigate();

  // Format date in a readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `${API_URL}/api/contact/messages?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(tMsg('errors.fetchFailed'));
      }
      
      const data = await response.json();
      
      setMessages(data.data);
      setTotalPages(data.totalPages);
      setTotalMessages(data.total);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : tMsg('errors.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, [page, limit, statusFilter]);
  
  // Handle message selection
  const toggleMessageSelection = (id: string) => {
    if (selectedMessages.includes(id)) {
      setSelectedMessages(selectedMessages.filter(msgId => msgId !== id));
    } else {
      setSelectedMessages([...selectedMessages, id]);
    }
  };
  
  // Handle select all checkbox
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(msg => msg._id));
    }
    setSelectAll(!selectAll);
  };
  
  // View message details
  const handleViewMessage = async (message: ContactMessage) => {
    setViewMessage(message);
    
    // If message is new, mark as read
    if (message.status === 'new') {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await fetch(`${API_URL}/api/contact/messages/${message._id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'read' })
        });
        
        if (response.ok) {
          // Update message in the list
          setMessages(messages.map(msg => 
            msg._id === message._id 
              ? { ...msg, status: 'read', readAt: new Date().toISOString() } 
              : msg
          ));
        }
      } catch (err) {
        console.error('Error marking message as read:', err);
      }
    }
  };
  
  // Update message status
  const updateStatus = async (ids: string[], status: 'read' | 'replied' | 'archived') => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/contact/messages/bulk/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids, status })
      });
      
      if (!response.ok) {
        throw new Error(tMsg('errors.updateStatusFailed'));
      }
      
      // Update messages in the state
      setMessages(messages.map(msg => 
        ids.includes(msg._id) 
          ? { 
              ...msg, 
              status, 
              readAt: status === 'read' ? new Date().toISOString() : msg.readAt,
              repliedAt: status === 'replied' ? new Date().toISOString() : msg.repliedAt
            } 
          : msg
      ));
      
      // Clear selection
      setSelectedMessages([]);
      setSelectAll(false);
      
      // If we're viewing a message and updating it, update the view
      if (viewMessage && ids.includes(viewMessage._id)) {
        setViewMessage({
          ...viewMessage,
          status,
          readAt: status === 'read' ? new Date().toISOString() : viewMessage.readAt,
          repliedAt: status === 'replied' ? new Date().toISOString() : viewMessage.repliedAt
        });
      }
    } catch (err) {
      console.error('Error updating message status:', err);
      setError(err instanceof Error ? err.message : tMsg('errors.unexpectedError'));
    }
  };
  
  // Delete messages
  const initiateDelete = (ids: string[]) => {
    setMessagesToDelete(ids);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      console.log('Attempting to delete messages with IDs:', messagesToDelete);
      
      const response = await fetch(`${API_URL}/api/contact/messages/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ids: messagesToDelete })
      });
      
      console.log('Delete response status:', response.status);
      console.log('Delete response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        // Try to extract more detailed error information
        let errorMessage = tMsg('errors.deleteFailed');
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          console.error('Raw response text:', await response.text().catch(() => 'Could not get response text'));
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Delete success response:', result);
      
      // Remove deleted messages from the state
      setMessages(messages.filter(msg => !messagesToDelete.includes(msg._id)));
      
      // Clear selection
      setSelectedMessages([]);
      setSelectAll(false);
      
      // If we're viewing a message and deleting it, close the view
      if (viewMessage && messagesToDelete.includes(viewMessage._id)) {
        setViewMessage(null);
      }
    } catch (err) {
      console.error('Error deleting messages:', err);
      setError(err instanceof Error ? err.message : tMsg('errors.unexpectedError'));
    } finally {
      setShowDeleteModal(false);
      setMessagesToDelete([]);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMessagesToDelete([]);
  };
  
  // Send a reply to a message
  const handleSendReply = async () => {
    if (!viewMessage || !replyContent.trim()) return;
    
    try {
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // First, send the actual email reply
      const emailResponse = await fetch(`${API_URL}/api/contact/messages/${viewMessage._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyContent })
      });
      
      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.message || tMsg('errors.sendReplyFailed'));
      }
      
      // Update messages in the state
      setMessages(messages.map(msg => 
        msg._id === viewMessage._id 
          ? { ...msg, status: 'replied', repliedAt: new Date().toISOString() } 
          : msg
      ));
      
      // Update the viewed message
      setViewMessage({
        ...viewMessage,
        status: 'replied',
        repliedAt: new Date().toISOString()
      });
      
      // Reset the reply form
      setShowReplyForm(false);
      setReplyContent('');
      
      // Show success notification
      alert(tMsg('replySuccess', { email: viewMessage.email }));
    } catch (err) {
      console.error('Error sending reply:', err);
      setError(err instanceof Error ? err.message : tMsg('errors.replyUnexpectedError'));
    }
  };
  
  // Filter messages based on search term
  const filteredMessages = messages.filter(msg => 
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{tMsg('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{tMsg('subtitle')}</p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-4 mb-4 mx-6 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">{tMsg('error')}</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row">
        {/* Message List */}
        <div className={`w-full ${viewMessage ? 'md:w-2/5' : 'md:w-full'} border-r border-gray-200`}>
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={tMsg('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{tMsg('filters.allStatus')}</option>
                <option value="new">{tMsg('filters.new')}</option>
                <option value="read">{tMsg('filters.read')}</option>
                <option value="replied">{tMsg('filters.replied')}</option>
                <option value="archived">{tMsg('filters.archived')}</option>
              </select>
              
              <button 
                onClick={() => fetchMessages()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                title={tMsg('refresh')}
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
          
          {/* Actions for selected messages */}
          {selectedMessages.length > 0 && (
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {tMsg('selectedCount', { count: selectedMessages.length })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(selectedMessages, 'read')}
                  className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded-md flex items-center"
                >
                  <CheckCircle size={16} className="mr-1" />
                  {tMsg('actions.markRead')}
                </button>
                <button
                  onClick={() => updateStatus(selectedMessages, 'archived')}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                >
                  <Archive size={16} className="mr-1" />
                  {tMsg('actions.archive')}
                </button>
                <button
                  onClick={() => initiateDelete(selectedMessages)}
                  className="px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded-md flex items-center"
                >
                  <Trash2 size={16} className="mr-1" />
                  {tMsg('actions.delete')}
                </button>
              </div>
            </div>
          )}
          
          {/* Message list */}
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Mail className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">{tMsg('noMessages')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter 
                  ? tMsg('tryChangingSearch') 
                  : tMsg('emptyMessage')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tMsg('table.from')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tMsg('table.subject')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tMsg('table.date')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tMsg('table.status')}
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tMsg('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <tr 
                      key={message._id} 
                      className={`hover:bg-gray-50 ${message.status === 'new' ? 'font-medium' : ''} cursor-pointer`}
                      onClick={() => handleViewMessage(message)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={selectedMessages.includes(message._id)}
                            onChange={() => toggleMessageSelection(message._id)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{message.name}</div>
                        </div>
                        <div className="text-sm text-gray-500">{message.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{message.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {message.message}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(message.createdAt)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[message.status]}`}>
                          {tMsg(`status.${message.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewMessage(message);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateDelete([message._id]);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{messages.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
                  <span className="font-medium">{Math.min(page * limit, totalMessages)}</span> of{' '}
                  <span className="font-medium">{totalMessages}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {/* Page numbers - simplified for brevity */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      page === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        {/* Message Details */}
        {viewMessage && (
          <div className="w-full md:w-3/5 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{tMsg('messageDetails')}</h2>
              <button 
                onClick={() => setViewMessage(null)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{viewMessage.subject}</h3>
                  <div className="mt-1 text-sm text-gray-500">{tMsg('fromLabel')} {viewMessage.name} &lt;{viewMessage.email}&gt;</div>
                </div>
                <div className="mt-2 sm:mt-0 text-sm text-gray-500">
                  {formatDate(viewMessage.createdAt)}
                </div>
              </div>
              
              <div className="flex mb-4">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[viewMessage.status]}`}>
                  {tMsg(`status.${viewMessage.status}`)}
                </span>
                
                {viewMessage.readAt && (
                  <span className="ml-2 text-xs text-gray-500">
                    {tMsg('readAt')}: {formatDate(viewMessage.readAt)}
                  </span>
                )}
                
                {viewMessage.repliedAt && (
                  <span className="ml-2 text-xs text-gray-500">
                    {tMsg('repliedAt')}: {formatDate(viewMessage.repliedAt)}
                  </span>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-900 whitespace-pre-line">
                  {viewMessage.message}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Reply className="w-4 h-4 inline-block mr-1" />
                {viewMessage.status === 'replied' 
                  ? tMsg('sendAnotherReply') 
                  : tMsg('reply')}
              </button>
              
              {viewMessage.status !== 'archived' && (
                <button
                  onClick={() => updateStatus([viewMessage._id], 'archived')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <Archive className="w-4 h-4 inline-block mr-1" />
                  {tMsg('actions.archive')}
                </button>
              )}
              
              <button
                onClick={() => initiateDelete([viewMessage._id])}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 className="w-4 h-4 inline-block mr-1" />
                {tMsg('actions.delete')}
              </button>
            </div>
            
            {showReplyForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {tMsg('replyTo', { name: viewMessage.name })}
                </h3>
                <div className="mb-4">
                  <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                    {tMsg('yourMessage')}
                  </label>
                  <textarea
                    id="reply"
                    rows={6}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={tMsg('replyPlaceholder', { name: viewMessage.name })}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    {tMsg('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={!replyContent.trim()}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      !replyContent.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    {tMsg('sendReply')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              {/* Modal header with icon */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="flex-shrink-0 flex items-center justify-center mx-auto h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-12 sm:w-12 mt-3 sm:mt-0">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {tMsg('deleteConfirmTitle', { 
                        count: messagesToDelete.length 
                      })}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {messagesToDelete.length === 1
                          ? tMsg('deleteConfirmSingular')
                          : tMsg('deleteConfirmPlural', { 
                              count: messagesToDelete.length 
                            })}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {tMsg('deleteWarning')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal footer with buttons */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  {tMsg('confirm')}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={cancelDelete}
                >
                  {tMsg('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactMessages; 