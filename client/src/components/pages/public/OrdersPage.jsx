import React, { useState, useEffect } from 'react';
import { Package, Truck, Store, Clock, CheckCircle, AlertCircle, Search, ChevronRight, Star, ShieldCheck } from 'lucide-react';
import { apiGet, apiPatch, apiPost } from '../../../api/client.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';

const OrdersPage = () => {
  const { user, isSeller } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' or 'seller'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewModalOrder, setReviewModalOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchOrders = async (viewType = activeTab) => {
    try {
      setLoading(true);
      const endpoint = viewType === 'seller' ? '/orders?viewAs=seller' : '/orders';
      const res = await apiGet(endpoint);
      if (res && res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await apiPatch(`/orders/${orderId}/status`, { status: newStatus });
      if (res && res.success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        fetchOrders(activeTab);
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(res.order);
        }
      }
    } catch (err) {
      showToast(err.message || 'Could not update status', 'error');
    }
  };

  const handleConfirmOfflinePayment = async (orderId) => {
    try {
      const res = await apiPost(`/orders/${orderId}/confirm-offline-payment`, {});
      if (res && res.success) {
        showToast('Offline payment marked as confirmed', 'success');
        fetchOrders(activeTab);
      }
    } catch (err) {
      showToast(err.message || 'Error recording offline payment', 'error');
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    if (!reviewModalOrder) return;
    try {
      setIsSubmittingReview(true);
      const res = await apiPost('/reviews', {
        productId: reviewModalOrder.items[0]?.productId,
        sellerId: reviewModalOrder.sellerId?._id || reviewModalOrder.sellerId,
        orderId: reviewModalOrder._id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (res && res.success) {
        showToast('Review posted successfully! Thank you.', 'success');
        setReviewModalOrder(null);
        setReviewComment('');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-100 text-amber-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      READY: 'bg-indigo-100 text-indigo-800',
      OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
      DELIVERED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-rose-100 text-rose-800'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${map[status] || 'bg-slate-100 text-slate-800'}`}>
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <Package className="w-8 h-8 text-brand-600" />
            Order Management & Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status tracking, shipment updates, and verified local merchant fulfilment.
          </p>
        </div>

        {/* Tab switch for sellers */}
        {isSeller && (
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'buyer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Purchases
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === 'seller' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Store Orders (Incoming)
            </button>
          </div>
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300 animate-bounce" />
          <p className="font-semibold text-sm">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Package className="w-14 h-14 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800">No Orders Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {activeTab === 'seller'
              ? 'You have not received any customer orders yet. Promote your digital storefront QR to get started!'
              : 'You have not placed any orders yet. Discover authentic local crafts and products nearby!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of orders */}
          <div className="lg:col-span-2 space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-3xl p-5 border cursor-pointer transition shadow-xs hover:shadow-md ${
                  selectedOrder?._id === order._id ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{order.orderNumber}</span>
                    <span className="text-slate-400 block text-[11px]">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.orderStatus)}
                    <span className="text-sm font-extrabold text-brand-600">₹{order.total}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={order.items[0]?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=200'}
                      alt={order.items[0]?.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {order.items[0]?.title}
                        {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {activeTab === 'seller' ? `Customer: ${order.buyerId?.name}` : `Seller: ${order.sellerId?.businessName}`}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                {/* Quick actions on card */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50">
                  <span className="capitalize">{order.fulfilmentType?.replace('_', ' ')} • {order.paymentMethod?.replace(/_/g, ' ')}</span>
                  {activeTab === 'buyer' && order.orderStatus === 'DELIVERED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewModalOrder(order);
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 fill-brand-600 text-brand-600" />
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Details & Tracking Sidebar */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm sticky top-24 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Order Tracking</h3>
                    <p className="text-[11px] text-slate-400">{selectedOrder.orderNumber}</p>
                  </div>
                  {getStatusBadge(selectedOrder.orderStatus)}
                </div>

                {/* Progress Stepper */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                      ['CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED'].includes(selectedOrder.orderStatus) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Order Confirmed</p>
                      <p className="text-[10px] text-slate-400">Order received by merchant</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                      ['READY', 'DELIVERED'].includes(selectedOrder.orderStatus) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Ready / Dispatched</p>
                      <p className="text-[10px] text-slate-400">Prepared for pickup or transit</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                      selectedOrder.orderStatus === 'DELIVERED' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      ✓
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Delivered / Completed</p>
                      <p className="text-[10px] text-slate-400">Received by customer</p>
                    </div>
                  </div>
                </div>

                {/* Fulfilment Details */}
                <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fulfilment:</span>
                    <span className="font-bold text-slate-700 capitalize">{selectedOrder.fulfilmentType?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-bold text-slate-700">{selectedOrder.paymentStatus}</span>
                  </div>
                  {selectedOrder.shippingAddress?.fullName && (
                    <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800">Delivery Address:</p>
                      <p>{selectedOrder.shippingAddress.fullName} ({selectedOrder.shippingAddress.phone})</p>
                      <p>{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.pincode}</p>
                    </div>
                  )}
                </div>

                {/* Seller Actions on selected order */}
                {activeTab === 'seller' && (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold text-slate-700 block">Merchant Actions:</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedOrder.orderStatus !== 'READY' && selectedOrder.orderStatus !== 'DELIVERED' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder._id, 'READY')}
                          className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition"
                        >
                          Mark Ready
                        </button>
                      )}
                      {selectedOrder.orderStatus !== 'DELIVERED' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedOrder._id, 'DELIVERED')}
                          className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                    {selectedOrder.paymentStatus === 'OFFLINE_PENDING' && (
                      <button
                        onClick={() => handleConfirmOfflinePayment(selectedOrder._id)}
                        className="w-full py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl transition"
                      >
                        Confirm Cash Payment (₹{selectedOrder.total})
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-8 text-center text-slate-400 border border-dashed border-slate-200">
                <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">Select an order from the list to view tracking history & details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Write a Verified Buyer Review</h3>
            <p className="text-xs text-slate-500">
              For: {reviewModalOrder.items[0]?.title} by {reviewModalOrder.sellerId?.businessName}
            </p>

            <form onSubmit={handlePostReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Review</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details about craft quality, packaging, and experience..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOrder(null)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-2.5 px-4 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {isSubmittingReview ? 'Posting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
